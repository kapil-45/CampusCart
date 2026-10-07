import os
import json
import logging
import requests
from django.conf import settings

logger = logging.getLogger(__name__)


class DataGovAPIError(Exception):
    """Custom exception for data.gov.in API errors that sanitizes sensitive info."""
    pass


class DataGovService:
    """
    Service class for interacting with the Government of India data.gov.in API.
    Resource: https://api.data.gov.in/resource/44bea382-c525-4740-8a07-04bd20a99b52
    """
    BASE_URL = "https://api.data.gov.in/resource/"

    def __init__(self, api_key=None, resource_id=None):
        self.api_key = api_key or getattr(settings, 'DATA_GOV_API_KEY', '')
        self.resource_id = resource_id or getattr(settings, 'DATA_GOV_RESOURCE_ID', '44bea382-c525-4740-8a07-04bd20a99b52')

    def fetch_records(self, offset=0, limit=10, timeout=15):
        """
        Fetch college records from data.gov.in API.
        Returns a dict containing:
        - 'records': list of raw record dicts
        - 'total': total available records
        - 'count': records returned in this batch
        """
        if not self.api_key:
            raise DataGovAPIError("DATA_GOV_API_KEY is not configured in Django settings or environment.")

        endpoint = f"{self.BASE_URL.rstrip('/')}/{self.resource_id}"
        params = {
            'api-key': self.api_key,
            'format': 'json',
            'offset': offset,
            'limit': limit,
        }

        try:
            response = requests.get(endpoint, params=params, timeout=timeout)
        except requests.exceptions.Timeout:
            raise DataGovAPIError("Timeout occurred while connecting to data.gov.in API.")
        except requests.exceptions.ConnectionError:
            raise DataGovAPIError("Connection failure when reaching data.gov.in API.")
        except requests.exceptions.RequestException as e:
            raise DataGovAPIError(f"HTTP request to data.gov.in failed: {type(e).__name__}")

        if response.status_code == 400:
            raise DataGovAPIError("data.gov.in API returned HTTP 400 Bad Request.")
        elif response.status_code in (401, 403):
            raise DataGovAPIError(f"data.gov.in API returned HTTP {response.status_code} Unauthorized / Forbidden. Check API key validity.")
        elif response.status_code == 429:
            raise DataGovAPIError("data.gov.in API returned HTTP 429 Rate Limit Exceeded.")
        elif response.status_code >= 500:
            raise DataGovAPIError(f"data.gov.in API server error (HTTP {response.status_code}).")
        elif response.status_code != 200:
            raise DataGovAPIError(f"data.gov.in API returned unexpected status HTTP {response.status_code}.")

        try:
            data = response.json()
        except (ValueError, json.JSONDecodeError):
            raise DataGovAPIError("data.gov.in API returned invalid JSON response.")

        if not isinstance(data, dict):
            raise DataGovAPIError("Unexpected API response format (root element is not a JSON object).")

        records = data.get('records', [])
        total = int(data.get('total', len(records)))
        count = int(data.get('count', len(records)))

        return {
            'records': records,
            'total': total,
            'count': count,
            'offset': offset,
            'limit': limit,
        }

    @staticmethod
    def normalize_record(raw_record):
        """
        Extracts and normalizes institution name, city, state, and identifier from a raw API record dictionary.
        Supports multiple candidate key names used across various data.gov.in releases.
        """
        if not isinstance(raw_record, dict):
            return None

        # Candidate keys for name
        name_keys = ['college_name', 'institution_name', 'name_of_the_college', 'college_institution', 'name', 'college_name_']
        # Candidate keys for city/district
        city_keys = ['district_name', 'city_name', 'city', 'district', 'location', 'town']
        # Candidate keys for state
        state_keys = ['state_name', 'state', 'state_name_']
        # Candidate keys for AICTE ID / identifier
        id_keys = ['aicte_id', 'aishe_code', 'permanent_id', 'college_id', 'id', 'institution_id']

        def find_value(keys):
            for k in keys:
                if k in raw_record and raw_record[k] is not None:
                    val = str(raw_record[k]).strip()
                    if val and val.lower() != 'nan' and val.lower() != 'null':
                        return val
            return ''

        name = find_value(name_keys)
        city = find_value(city_keys)
        state = find_value(state_keys)
        aicte_id = find_value(id_keys)

        if not name:
            return None

        return {
            'name': name,
            'city': city,
            'state': state,
            'country': 'India',
            'aicte_id': aicte_id or None,
        }
