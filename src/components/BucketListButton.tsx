// components/BucketListButton.tsx
// AtmoGalaxy — 지도 우하단 버킷리스트 플로팅 버튼

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { bucketListStore } from '../store/bucketListStore';
import { useTheme } from '../context/ThemeContext';

interface Props {
  onClick: () => void;
}

export const BucketListButton: React.FC<Props> = ({ onClick }) => {
  const { theme } = useTheme();
  const [count, setCount] = useState(bucketListStore.getItems().length);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    return bucketListStore.subscribe(items => {
      if (items.length !== count) {
        setPulse(true);
        setTimeout(() => setPulse(false), 600);
      }
      setCount(items.length);
    });
  }, [count]);

  const done = bucketListStore.getItems().filter(i => i.completed).length;

  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.92 }}
      whileHover={{ scale: 1.05 }}
      style={{
        position: 'fixed',
        // 범례(좌하단) 반대편, 기록 버튼 위
        right: 16,
        bottom: `calc(env(safe-area-inset-bottom) + 192px)`,
        zIndex: 900,
        background: 'linear-gradient(135deg, #4c1d95, #7c3aed, #a855f7)',
        border: 'none',
        borderRadius: 18,
        padding: '10px 16px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 7,
        boxShadow: '0 6px 24px rgba(124,58,237,0.55), 0 0 0 1px rgba(255,255,255,0.1)',
        backdropFilter: 'blur(10px)',
      }}
    >
      {/* 별 글로우 애니메이션 */}
      <motion.span
        animate={pulse
          ? { scale: [1, 1.5, 1], rotate: [0, 20, -20, 0] }
          : { scale: [1, 1.08, 1] }
        }
        transition={pulse
          ? { duration: 0.5 }
          : { duration: 2.5, repeat: Infinity, ease: 'easeInOut' }
        }
        style={{ fontSize: 17, lineHeight: 1 }}
      >
        ✨
      </motion.span>

      <span style={{
        fontSize: 12, fontWeight: 700, color: '#fff',
        letterSpacing: '0.3px', whiteSpace: 'nowrap',
      }}>
        버킷리스트
      </span>

      {/* 개수 뱃지 */}
      <AnimatePresence>
        {count > 0 && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            style={{
              background: done === count && count > 0 ? '#4ade80' : 'rgba(255,255,255,0.25)',
              borderRadius: 10,
              padding: '1px 7px',
              fontSize: 11,
              fontWeight: 800,
              color: '#fff',
              minWidth: 20,
              textAlign: 'center',
            }}
          >
            {done === count ? '✓' : `${done}/${count}`}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
};

export default BucketListButton;


// ═══════════════════════════════════════════════════════════
// App.tsx 또는 MapContainer.tsx에 추가하는 방법:
// ═══════════════════════════════════════════════════════════
//
// import { BucketListButton } from './components/BucketListButton';
// import { BucketListPanel } from './components/BucketListPanel';
//
// const [bucketOpen, setBucketOpen] = useState(false);
//
// return (
//   <>
//     <MapContainer ... />
//     <BucketListButton onClick={() => setBucketOpen(true)} />
//     <BucketListPanel isOpen={bucketOpen} onClose={() => setBucketOpen(false)} />
//   </>
// );