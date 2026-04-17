// src/App.tsx
import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ThemeProvider, useTheme, THEME } from './context/ThemeContext';
import { MapModeProvider } from './context/MapModeContext';
import MapContainer from './components/MapContainer';
import ModeIndicator from './components/ModeIndicator';
import DetailPanel from './components/DetailPanel';
import SplashScreen from './components/SplashScreen';
import OnboardingScreen from './components/OnboardingScreen';
import FeatureTutorial, { isTutSeen } from './components/FeatureTutorial';
import SearchBar from './components/SearchBar';

type Screen = 'splash' | 'onboarding' | 'map';

function AppInner() {
  const { isDark, toggleTheme } = useTheme();
  const t = isDark ? THEME.dark : THEME.light;
  const [screen, setScreen] = useState<Screen>('splash');
  const [showThemeTut, setShowThemeTut] = useState(false);
  const [interactable, setInteractable] = useState(false);
  const mapFlyToRef = React.useRef<((lng: number, lat: number) => void) | null>(null);

  useEffect(() => {
    if (screen === 'map') {
      const timer = setTimeout(() => setInteractable(true), 700);
      return () => clearTimeout(timer);
    }
  }, [screen]);

  const handleThemeClick = () => {
    if (!interactable) return;
    if (!isTutSeen('theme')) {
      setShowThemeTut(true);
      return;
    }
    toggleTheme();
  };

  return (
    <>
      <AnimatePresence mode="wait">
        {screen === 'splash' && (
          <SplashScreen key="splash" onEnter={() => setScreen('onboarding')} />
        )}
        {screen === 'onboarding' && (
          <OnboardingScreen key="onboarding" onDone={() => setScreen('map')} />
        )}
      </AnimatePresence>

      <MapModeProvider>
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0,
          bottom: 'calc(-1 * env(safe-area-inset-bottom, 34px))',
          background: t.bg,
          touchAction: 'pan-x pan-y',
        }}>

          {/* ── 테마 토글 버튼 ── */}
          <button
            onClick={handleThemeClick}
            style={{
              position: 'fixed',
              top: 'calc(env(safe-area-inset-top) + 20px)',
              left: '16px',
              width: '40px', height: '40px', borderRadius: '50%',
              background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
              border: isDark ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(0,0,0,0.1)',
              fontSize: '18px', cursor: 'pointer',
              zIndex: 8500, backdropFilter: 'blur(12px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s',
            }}
          >{isDark ? '☀️' : '🌙'}</button>

          {/* ── 검색창 (Mapbox와 완전 분리) ── */}
          <SearchBar onSelect={(lng, lat) => {
            if (mapFlyToRef.current) mapFlyToRef.current(lng, lat);
          }} />

          <MapContainer mapFlyToRef={mapFlyToRef} />
          <ModeIndicator />
          <DetailPanel />
        </div>
      </MapModeProvider>

      {/* 테마 버튼 첫 클릭 튜토리얼 */}
      <AnimatePresence>
        {showThemeTut && (
          <FeatureTutorial
            tutKey="theme"
            onClose={() => {
              setShowThemeTut(false);
              // 튜토리얼 후 실제 테마 전환
              setTimeout(() => toggleTheme(), 300);
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppInner />
    </ThemeProvider>
  );
}