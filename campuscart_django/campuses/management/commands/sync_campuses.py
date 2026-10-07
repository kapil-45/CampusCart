import json
import os
from django.core.management.base import BaseCommand, CommandError
from campuses.models import Campus
from campuses.services.data_gov import DataGovService, DataGovAPIError


class Command(BaseCommand):
    help = "Synchronize Indian college data from data.gov.in (or a JSON fixture) into MongoDB."

    def add_arguments(self, parser):
        parser.add_argument(
            '--fixture',
            type=str,
            default=None,
            help='Path to a local sample JSON fixture file for offline sync/testing.'
        )
        parser.add_argument(
            '--limit',
            type=int,
            default=50,
            help='Number of records to fetch per API page request (default: 50).'
        )
        parser.add_argument(
            '--max-records',
            type=int,
            default=500,
            help='Maximum total records to process in this sync run (default: 500).'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Perform sync logic without committing changes to MongoDB.'
        )

    def handle(self, *args, **options):
        fixture_path = options.get('fixture')
        batch_limit = max(1, min(options.get('limit', 50), 100))
        max_records = options.get('max_records')
        dry_run = options.get('dry_run', False)

        processed = 0
        created = 0
        updated = 0
        skipped = 0
        failed = 0

        self.stdout.write(self.style.MIGRATE_HEADING("Starting CampusCart data.gov.in college synchronization..."))
        if dry_run:
            self.stdout.write(self.style.WARNING("DRY RUN ENABLED - Database changes will not be saved."))

        # Build index of existing campuses for fast in-memory duplicate matching
        existing_campuses = list(Campus.objects.all())
        # Lookup table by aicte_id (case-insensitive)
        id_map = {c.aicte_id.strip().lower(): c for c in existing_campuses if getattr(c, 'aicte_id', None)}
        # Lookup table by (name.strip().lower(), city.strip().lower(), state.strip().lower())
        tuple_map = {
            (
                (c.name or '').strip().lower(),
                (c.city or '').strip().lower(),
                (c.state or '').strip().lower()
            ): c for c in existing_campuses
        }

        if fixture_path:
            # Sync from fixture
            if not os.path.exists(fixture_path):
                raise CommandError(f"Fixture file not found: {fixture_path}")
            
            self.stdout.write(self.style.SUCCESS(f"Reading fixture from {fixture_path}..."))
            try:
                with open(fixture_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
            except Exception as e:
                raise CommandError(f"Failed to parse fixture JSON: {e}")

            records = data.get('records', []) if isinstance(data, dict) else (data if isinstance(data, list) else [])
            self.stdout.write(f"Loaded {len(records)} records from fixture.")

            for raw_record in records:
                if max_records and processed >= max_records:
                    break
                
                res = self._process_record(raw_record, tuple_map, id_map, dry_run)
                processed += 1
                if res == 'created':
                    created += 1
                elif res == 'updated':
                    updated += 1
                elif res == 'skipped':
                    skipped += 1
                else:
                    failed += 1

        else:
            # Sync from live data.gov.in API
            service = DataGovService()
            offset = 0
            total_available = None

            self.stdout.write("Connecting to live data.gov.in API...")

            while True:
                if max_records and processed >= max_records:
                    self.stdout.write(f"Reached max_records limit ({max_records}). Stopping sync.")
                    break

                current_limit = batch_limit
                if max_records:
                    current_limit = min(batch_limit, max_records - processed)

                try:
                    result = service.fetch_records(offset=offset, limit=current_limit)
                except DataGovAPIError as e:
                    self.stdout.write(self.style.ERROR(f"\nGovernment API Sync Error: {e}"))
                    self.stdout.write(
                        self.style.WARNING(
                            "If data.gov.in is unreachable, test offline using:\n"
                            "  python manage.py sync_campuses --fixture campuses/fixtures/data_gov_sample.json"
                        )
                    )
                    break

                records = result['records']
                total_available = result['total']

                if not records:
                    break

                self.stdout.write(f"Fetched page offset={offset}, count={len(records)} (total available: {total_available})")

                for raw_record in records:
                    res = self._process_record(raw_record, tuple_map, id_map, dry_run)
                    processed += 1
                    if res == 'created':
                        created += 1
                    elif res == 'updated':
                        updated += 1
                    elif res == 'skipped':
                        skipped += 1
                    else:
                        failed += 1

                offset += len(records)
                if offset >= total_available:
                    break

        self.stdout.write("\n" + "=" * 55)
        self.stdout.write(self.style.SUCCESS("Campus Synchronization Summary"))
        self.stdout.write("=" * 55)
        self.stdout.write(f"Processed: {processed}")
        self.stdout.write(self.style.SUCCESS(f"Created:   {created}"))
        self.stdout.write(self.style.WARNING(f"Updated:   {updated}"))
        self.stdout.write(f"Skipped:   {skipped}")
        if failed > 0:
            self.stdout.write(self.style.ERROR(f"Failed:    {failed}"))
        else:
            self.stdout.write(f"Failed:    {failed}")
        self.stdout.write("=" * 55 + "\n")

    def _process_record(self, raw_record, tuple_map, id_map, dry_run):
        try:
            norm = DataGovService.normalize_record(raw_record)
            if not norm or not norm['name']:
                return 'failed'

            name = norm['name']
            city = norm['city']
            state = norm['state']
            aicte_id = norm['aicte_id']
            country = norm.get('country', 'India')

            key_tuple = (name.strip().lower(), city.strip().lower(), state.strip().lower())
            key_id = aicte_id.strip().lower() if aicte_id else None

            # Check matching existing campus
            existing = None
            if key_id and key_id in id_map:
                existing = id_map[key_id]
            elif key_tuple in tuple_map:
                existing = tuple_map[key_tuple]

            if existing:
                # Check for changes
                needs_update = False
                if existing.name != name:
                    existing.name = name
                    needs_update = True
                if existing.city != city and city:
                    existing.city = city
                    needs_update = True
                if existing.state != state and state:
                    existing.state = state
                    needs_update = True
                if aicte_id and getattr(existing, 'aicte_id', None) != aicte_id:
                    existing.aicte_id = aicte_id
                    needs_update = True
                if not getattr(existing, 'is_active', True):
                    existing.is_active = True
                    needs_update = True

                if needs_update:
                    if not dry_run:
                        existing.save()
                    return 'updated'
                else:
                    return 'skipped'
            else:
                # Create new Campus record
                new_campus = Campus(
                    name=name,
                    city=city,
                    state=state,
                    country=country,
                    aicte_id=aicte_id,
                    is_active=True
                )
                if not dry_run:
                    new_campus.save()

                # Add to lookup maps
                tuple_map[key_tuple] = new_campus
                if key_id:
                    id_map[key_id] = new_campus

                return 'created'

        except Exception as e:
            return 'failed'
