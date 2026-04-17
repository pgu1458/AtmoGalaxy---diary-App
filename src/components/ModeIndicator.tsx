import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useModeInfo } from '../hooks/useMapMode';
import { useTheme, THEME } from '../context/ThemeContext';

const MODE_COLORS = {
  NATIONAL: { border: '#3b82f6', glow: 'rgba(59,130,246,0.4)' },
  ARCHIVE:  { border: '#8b5cf6', glow: 'rgba(139,92,246,0.4)' },
  SPOT:     { border: '#10b981', glow: 'rgba(16,185,129,0.4)' },
};

export default function ModeIndicator() {
  const { currentMode, label, zoomLevel } = useModeInfo();
  const { isDark } = useTheme();
  const t = isDark ? THEME.dark : THEME.light;
  const colors = MODE_COLORS[currentMode];

  return (
    <div style={{
      position: 'fixed',
      top: 'calc(env(safe-area-inset-top) + 76px)',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 8500,
      pointerEvents: 'none',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '6px',
    }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={currentMode}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.2 }}
          style={{
            backgroundColor: t.modeBg,
            color: t.modeText,
            border: `1.5px solid ${colors.border}`,
            padding: '6px 18px',
            borderRadius: '40px',
            fontWeight: 700,
            fontSize: '13px',
            letterSpacing: '-0.3px',
            boxShadow: `0 0 16px ${colors.glow}`,
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <span>{label}</span>
          <span style={{
            opacity: 0.5,
            fontSize: '12px',
            borderLeft: `1px solid ${t.modeText}33`,
            paddingLeft: '10px',
            fontFamily: 'monospace',
          }}>
            {zoomLevel.toFixed(1)}
          </span>
        </motion.div>
      </AnimatePresence>

      {/* �� �� */}
      <div style={{ width: '80px', height: '2px', backgroundColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)', borderRadius: '1px', overflow: 'hidden' }}>
        <motion.div
          animate={{ width: `${(zoomLevel / 22) * 100}%` }}
          transition={{ duration: 0.3 }}
          style={{ height: '100%', backgroundColor: colors.border }}
        />
      </div>
    </div>
  );
}