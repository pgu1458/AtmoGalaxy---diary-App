// src/components/SearchBar.tsx
import React, { useState, useRef, useEffect } from 'react';
import { useTheme, THEME } from '../context/ThemeContext';
import { AnimatePresence, motion } from 'framer-motion';

const MAPBOX_TOKEN = 'pk.eyJ1IjoicGd1MTQ1OCIsImEiOiJjbW50NzV5YTMwbGYzMnFxMHQ1eW9wZHZ3In0.IWo4C3aKCvn_bmrWVsOm2Q';

interface Result {
  id: string;
  place_name: string;
  center: [number, number];
  place_type: string[];
}

interface Props {
  onSelect: (lng: number, lat: number) => void;
}

export default function SearchBar({ onSelect }: Props) {
  const { isDark } = useTheme();
  const t = isDark ? THEME.dark : THEME.light;
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Result[]>([]);
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (query.trim().length < 2) { setResults([]); return; }
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json` +
          `?access_token=${MAPBOX_TOKEN}&language=ko&limit=5&types=country,region,place,locality,neighborhood,address`
        );
        const data = await res.json();
        setResults(data.features ?? []);
        setOpen(true);
      } catch { setResults([]); }
      finally { setLoading(false); }
    }, 350);
    return () => clearTimeout(timerRef.current);
  }, [query]);

  const handleSelect = (r: Result) => {
    const [lng, lat] = r.center;
    
    // 1. 목록 데이터를 먼저 비워서 즉시 닫히게 함
    setResults([]); 
    setOpen(false);

    // 2. 부모에게 좌표 전달 (부모의 flyTo 로직 실행)
    onSelect(lng, lat); 

    setQuery(r.place_name.split(',')[0]);
    inputRef.current?.blur();
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setOpen(false);
    inputRef.current?.focus();
  };

  return (
    <>
      {/* 바깥 배경 클릭 시 닫기용 투명 레이어 */}
      {open && (
        <div 
          onClick={() => {
            setOpen(false);
            setResults([]);
          }}
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            zIndex: 9000, // 검색창(9500)보다 아래에 배치
            background: 'transparent'
          }}
        />
      )}

      <div
        style={{
          position: 'absolute',
          top: 'calc(env(safe-area-inset-top) + 20px)',
          left: '56px', 
          right: '12px',
          zIndex: 9500,
        }}
        // 기존의 수동 포커스 로직 onClick 삭제 (바깥 클릭 방해 방지)
      >
        <div style={{
          display: 'flex', 
          alignItems: 'center', 
          gap: '10px',
          background: 'rgba(20, 20, 30, 0.9)', 
          borderRadius: '14px', 
          padding: '10px 14px',
          border: focused ? '1px solid rgba(59,130,246,0.5)' : `1px solid ${t.inputBorder}`,
          boxShadow: focused ? '0 0 0 3px rgba(59,130,246,0.1)' : '0 4px 24px rgba(0,0,0,0.2)',
          transition: 'all 0.2s',
        }}>
          {loading ? (
            <div style={{
              width: '16px', height: '16px', borderRadius: '50%', flexShrink: 0,
              border: '2px solid rgba(59,130,246,0.3)', borderTopColor: '#3b82f6',
              animation: 'spin 0.7s linear infinite',
            }} />
          ) : (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, opacity: 0.5 }}>
              <circle cx="6.5" cy="6.5" r="4.5" stroke="white" strokeWidth="1.5"/>
              <path d="M10 10L14 14" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          )}

          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => { setFocused(true); if (results.length > 0) setOpen(true); }}
            onBlur={() => setFocused(false)}
            placeholder="장소, 도시, 국가 검색..."
            style={{
              flex: 1,
              width: '100%',
              background: 'none',
              border: 'none',
              outline: 'none',
              color: t.text,
              fontSize: '16px',
              fontFamily: 'inherit',
              caretColor: t.text,
              padding: '0',
              margin: '0',
            }}
          />

          {query && (
            <button onClick={handleClear} style={{
              background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)',
              fontSize: '16px', cursor: 'pointer', padding: 0, flexShrink: 0,
            }}>✕</button>
          )}
        </div>

        <AnimatePresence>
          {open && results.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              style={{
                position: 'absolute', top: '100%', left: 0, right: 0,
                marginTop: '6px',
                background: t.panelBg, backdropFilter: 'blur(20px)',
                borderRadius: '14px', border: `1px solid ${t.panelBorder}`,
                boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
                overflow: 'hidden',
              }}
            >
              {results.map((r, i) => (
                <button
                  key={r.id}
                  onMouseDown={(e) => {
                    e.preventDefault(); // blur 이전에 클릭 감지
                    handleSelect(r);
                  }}
                  style={{
                    width: '100%', padding: '11px 16px', background: 'none',
                    border: 'none', cursor: 'pointer', textAlign: 'left',
                    display: 'flex', alignItems: 'center', gap: '10px',
                    borderBottom: i < results.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                  }}
                >
                  <span style={{ fontSize: '14px', flexShrink: 0, opacity: 0.7 }}>
                    {r.place_type[0] === 'country' ? '🌏' :
                     r.place_type[0] === 'region' ? '🗺️' :
                     r.place_type[0] === 'place' ? '🏙️' : '📍'}
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <p style={{
                      color: t.text, fontSize: '13px', fontWeight: 600,
                      margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {r.place_name.split(',')[0]}
                    </p>
                  </div>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}