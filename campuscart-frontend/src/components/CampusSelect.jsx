import { useState, useEffect, useRef } from 'react';
import api from '../api/client';

export default function CampusSelect({ value, onChange, error }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [campuses, setCampuses] = useState([]);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef(null);

  // Group campuses by city
  const groupedCampuses = campuses.reduce((acc, campus) => {
    const city = campus.city || 'Other';
    if (!acc[city]) acc[city] = [];
    acc[city].push(campus);
    return acc;
  }, {});

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchCampuses = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/api/campuses/search/?q=${query}`);
        setCampuses(data);
      } catch (err) {
        console.error('Failed to fetch campuses', err);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(() => {
      if (isOpen) {
        fetchCampuses();
      }
    }, 300);

    return () => clearTimeout(debounce);
  }, [query, isOpen]);

  const handleSelect = (campusId, campusName) => {
    onChange(campusId, campusName);
    setQuery(campusName);
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <label className="field-label">Campus <span className="text-crimson">*</span></label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="h-5 w-5 text-mist/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          className="field-input pl-10"
          placeholder="Search your campus..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => {
            setIsOpen(true);
            if (!query && value?.name) {
              setQuery(value.name);
            }
          }}
        />
      </div>
      {error && <p className="mt-1.5 text-sm text-crimson">{error}</p>}

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full glass bg-ink/95 rounded-lg shadow-lg max-h-60 overflow-auto border border-hairline p-1">
          {loading ? (
            <div className="p-4 text-center text-sm text-mist">Searching...</div>
          ) : campuses.length > 0 ? (
            Object.entries(groupedCampuses).map(([city, cityCampuses]) => (
              <div key={city}>
                <div className="px-3 py-2 text-xs font-semibold text-mist uppercase tracking-wider flex items-center gap-1.5 sticky top-0 bg-ink/95 backdrop-blur-sm z-10">
                  <svg className="h-3.5 w-3.5 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {city}
                </div>
                {cityCampuses.map(campus => (
                  <button
                    key={campus.id}
                    type="button"
                    onClick={() => handleSelect(campus.id, campus.name)}
                    className="w-full text-left px-3 py-2 text-sm text-paper hover:bg-gold/10 hover:text-gold-bright rounded-md transition-colors"
                  >
                    {campus.name}
                  </button>
                ))}
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-sm text-mist">No campuses found</div>
          )}
          
          <div className="border-t border-hairline mt-1 pt-1">
            <p className="px-3 pt-2 text-xs text-mist text-center">Can't find your campus?</p>
            <button
              type="button"
              onClick={() => handleSelect('other', query || 'Other Campus')}
              className="w-full text-center px-3 py-2 text-sm text-gold-bright hover:bg-gold/10 rounded-md transition-colors mt-1"
            >
              Select "Other" to add it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
