// src/components/FeatureTutorial.tsx
// AtmoGalaxy — 버튼별 첫 클릭 튜토리얼 (1회 표시)

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ── 튜토리얼 키 ──────────────────────────────────────────────
export const TUT_KEYS = {
  theme:   'atmo_tut_theme',
  bucket:  'atmo_tut_bucket',
  dart:    'atmo_tut_dart',
  stats:   'atmo_tut_stats',
  records: 'atmo_tut_records',
} as const;

export type TutKey = keyof typeof TUT_KEYS;

// 메모리 변수 — 새로고침 시 자동 초기화 (sessionStorage는 새로고침해도 유지됨)
const seenTuts = new Set<TutKey>();

export function isTutSeen(key: TutKey): boolean {
  return seenTuts.has(key);
}
export function markTutSeen(key: TutKey): void {
  seenTuts.add(key);
}

// ── 각 기능별 튜토리얼 내용 ───────────────────────────────────
interface TutContent {
  icon: string;
  tag: string;
  title: string;
  desc: string;
  features: { icon: string; label: string; desc: string }[];
  color: string;
  gradient: string;
  btnLabel: string;
}

export const TUT_CONTENT: Record<TutKey, TutContent> = {
  theme: {
    icon: '☀️',
    tag: 'THEME',
    title: '다크 / 라이트 모드',
    desc: '지도 스타일과 UI를 한 번에 전환해요.\n밤에는 눈이 편한 다크 모드로!',
    features: [
      { icon: '🌙', label: '다크 모드', desc: '별이 빛나는 심우주 스타일' },
      { icon: '☀️', label: '라이트 모드', desc: '밝고 깔끔한 낮 지도 스타일' },
      { icon: '🗺️', label: '지도 자동 전환', desc: '버튼 하나로 지도 테마도 함께 변경' },
    ],
    color: '#f59e0b',
    gradient: 'linear-gradient(135deg, #78350f, #b45309, #f59e0b)',
    btnLabel: '알겠어요! 🌙',
  },
  bucket: {
    icon: '✨',
    tag: 'BUCKET LIST',
    title: '인생 버킷리스트',
    desc: '여행지부터 자격증, 도전 목표까지\nAI가 나이대에 딱 맞게 추천해요.',
    features: [
      { icon: '🤖', label: 'Gemini AI 추천', desc: '클릭할 때마다 새로운 목표 추천' },
      { icon: '📜', label: '자격증 · 학습 · 도전', desc: '여행 이상의 인생 목표도 포함' },
      { icon: '📍', label: '지도 위 핀 표시', desc: '추가한 목표가 지도에 보라 핀으로 표시' },
      { icon: '✅', label: '완료 체크', desc: '달성한 목표를 체크하며 성장 확인' },
    ],
    color: '#a855f7',
    gradient: 'linear-gradient(135deg, #2e1065, #5b21b6, #7c3aed, #a855f7)',
    btnLabel: '목표 설정하러 가기 ✨',
  },
  dart: {
    icon: '🎯',
    tag: 'RANDOM TRAVEL',
    title: '랜덤 여행 추첨기',
    desc: '어디 갈지 못 정하겠다면?\n지도에 다트를 던져 여행지를 골라보세요!',
    features: [
      { icon: '🌏', label: '전체 / 한국 / 일본 선택', desc: '원하는 범위에서 랜덤 추첨' },
      { icon: '🌤️', label: '실시간 날씨 확인', desc: '추첨된 장소의 현재 날씨까지 바로 표시' },
      { icon: '🖼️', label: '명소 사진 자동 표시', desc: 'Wikipedia에서 대표 사진 자동 로딩' },
      { icon: '🗺️', label: '지도 자동 이동', desc: '추첨 후 해당 위치로 지도가 flyTo' },
    ],
    color: '#f97316',
    gradient: 'linear-gradient(135deg, #431407, #9a3412, #ea580c, #f97316)',
    btnLabel: '다트 던지러 가기 🎯',
  },
  stats: {
    icon: '📊',
    tag: 'STATISTICS',
    title: '내 여행 통계',
    desc: '쌓인 기록으로 나만의 여행 패턴을\n한눈에 분석해봐요.',
    features: [
      { icon: '🧚', label: '날씨 요정 카드', desc: '내 여행 스타일을 캐릭터로 표현' },
      { icon: '🌡️', label: '기온 통계', desc: '평균 · 최고 · 최저 기온 분석' },
      { icon: '📅', label: '요일별 히스토그램', desc: '어떤 요일에 주로 여행하는지 확인' },
      { icon: '🏆', label: '자주 만난 날씨 TOP3', desc: '내 여행의 날씨 트렌드 분석' },
    ],
    color: '#3b82f6',
    gradient: 'linear-gradient(135deg, #1e3a8a, #1d4ed8, #3b82f6)',
    btnLabel: '내 통계 보러 가기 📊',
  },
  records: {
    icon: '★',
    tag: 'MY RECORDS',
    title: '나의 여행 기록',
    desc: '지도에서 탭한 순간들이\n여기에 모두 저장돼요.',
    features: [
      { icon: '📷', label: '사진 + 메모 저장', desc: '그날의 날씨와 함께 추억을 기록' },
      { icon: '📅', label: '캘린더 뷰', desc: '날짜별로 기록을 캘린더에서 확인' },
      { icon: '✏️', label: '기록 편집', desc: '제목 · 메모 · 사진 언제든 수정 가능' },
      { icon: '🌫️', label: '안개 히트맵', desc: '방문한 곳에 신비로운 안개가 쌓여요' },
    ],
    color: '#a855f7',
    gradient: 'linear-gradient(135deg, #2e1065, #4c1d95, #7c3aed, #a855f7)',
    btnLabel: '기록 보러 가기 ★',
  },
};

// ── 튜토리얼 오버레이 컴포넌트 ───────────────────────────────
interface Props {
  tutKey: TutKey;
  onClose: () => void;
}

export default function FeatureTutorial({ tutKey, onClose }: Props) {
  const c = TUT_CONTENT[tutKey];

  const handleClose = () => {
    markTutSeen(tutKey);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9000,
        background: 'rgba(0,0,0,0.78)',
        backdropFilter: 'blur(8px)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '16px',
        paddingTop: 'calc(env(safe-area-inset-top) + 16px)',
        paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)',
        overflowY: 'auto',
      }}
      onClick={handleClose}
    >
      {/* 배경 글로우 */}
      <div style={{
        position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)',
        width: 400, height: 400, borderRadius: '50%',
        background: `radial-gradient(circle, ${c.color}18 0%, transparent 65%)`,
        pointerEvents: 'none', filter: 'blur(30px)',
      }} />

      <motion.div
        initial={{ scale: 0.88, y: 24 }}
        animate={{ scale: 1, y: 0, x: 0 }}
        exit={{ scale: 0.92, y: 16 }}
        transition={{ type: 'spring', damping: 26, stiffness: 280 }}
        drag="x"
        dragConstraints={{ left: -30, right: 300 }}
        dragElastic={0.3}
        onDragEnd={(_, info) => {
          if (info.offset.x > 80 || info.velocity.x > 400) handleClose();
        }}
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: 360, width: '100%', position: 'relative', margin: 'auto', cursor: 'grab' }}
      >
        {/* 카드 */}
        <div style={{
          background: 'rgba(8,14,32,0.96)',
          border: `1px solid ${c.color}30`,
          borderRadius: 26,
          overflow: 'hidden',
          boxShadow: `0 24px 60px rgba(0,0,0,0.6), 0 0 0 1px ${c.color}18`,
        }}>
          {/* 헤더 그라디언트 */}
          <div style={{
            background: c.gradient, padding: '24px 22px 22px',
            position: 'relative', overflow: 'hidden',
          }}>
            {/* 배경 파티클 */}
            {Array.from({ length: 12 }).map((_, i) => (
              <motion.div key={i}
                animate={{ opacity: [0.1, 0.8, 0.1], scale: [0.5, 1.3, 0.5] }}
                transition={{ duration: 2 + i * 0.3, repeat: Infinity, delay: i * 0.2 }}
                style={{
                  position: 'absolute',
                  left: `${(i * 41 + 7) % 100}%`,
                  top: `${(i * 37 + 11) % 100}%`,
                  width: i % 3 === 0 ? 3 : 2, height: i % 3 === 0 ? 3 : 2,
                  borderRadius: '50%', background: 'rgba(255,255,255,0.7)',
                  pointerEvents: 'none',
                }}
              />
            ))}

            {/* 태그 */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              background: 'rgba(255,255,255,0.15)',
              borderRadius: 20, padding: '3px 10px', marginBottom: 12,
            }}>
              <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#fff', boxShadow: '0 0 5px #fff' }} />
              <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.9)', fontWeight: 700, letterSpacing: '0.14em' }}>
                {c.tag}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <motion.div
                animate={{ scale: [1, 1.1, 1], rotate: [0, 8, -8, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                style={{ fontSize: 44, lineHeight: 1 }}
              >
                {c.icon}
              </motion.div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#fff', letterSpacing: '-0.3px' }}>
                  {c.title}
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 4, lineHeight: 1.55, whiteSpace: 'pre-line' }}>
                  {c.desc}
                </div>
              </div>
            </div>
          </div>

          {/* 기능 리스트 */}
          <div style={{ padding: '18px 20px 20px' }}>
            <div style={{ fontSize: 10, color: `${c.color}cc`, fontWeight: 700, letterSpacing: '0.1em', marginBottom: 12 }}>
              주요 기능
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {c.features.map((f, i) => (
                <motion.div key={i}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + i * 0.08 }}
                  style={{ display: 'flex', gap: 11, alignItems: 'flex-start' }}
                >
                  <div style={{
                    width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                    background: `${c.color}15`,
                    border: `1px solid ${c.color}28`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16,
                  }}>
                    {f.icon}
                  </div>
                  <div style={{ paddingTop: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#e8f0ff' }}>{f.label}</div>
                    <div style={{ fontSize: 11, color: 'rgba(148,163,184,0.7)', marginTop: 1 }}>{f.desc}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* 버튼 */}
          <div style={{ padding: '0 20px 20px' }}>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleClose}
              style={{
                width: '100%', padding: '14px',
                borderRadius: 14, border: 'none',
                background: c.gradient,
                color: '#fff', fontSize: 14, fontWeight: 800,
                cursor: 'pointer', letterSpacing: '0.02em',
                boxShadow: `0 6px 22px ${c.color}44`,
              }}
            >
              {c.btnLabel}
            </motion.button>
            <p style={{ textAlign: 'center', fontSize: 10, color: 'rgba(255,255,255,0.18)', margin: '10px 0 0' }}>
              탭하거나 오른쪽으로 스와이프해서 닫기
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}