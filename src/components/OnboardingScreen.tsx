// src/components/OnboardingScreen.tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props { onDone: () => void; }

const STEPS = [
  {
    emoji: '🌤️',
    tag: 'LIVE WEATHER',
    title: '실시간 날씨가\n지도 위에 살아있어요',
    desc: '한국·일본 주요 도시의 현재 날씨가\n컬러 글로우로 지도에 표현돼요\n맑음·비·뇌우·눈을 한눈에 확인하세요',
    color: '#f59e0b',
    accent: '#fbbf24',
    bg: 'rgba(245,158,11,0.07)',
    visual: ['🌞', '🌂', '⚡', '⛄'],
  },
  {
    emoji: '📍',
    tag: 'TRAVEL DIARY',
    title: '지도를 탭해서\n일기처럼 기록해요',
    desc: '여행지, 카페, 산책로 어디든\n탭 하나로 날씨·사진·메모가 저장돼요\n그날의 감성을 일기처럼 남겨보세요',
    color: '#60a5fa',
    accent: '#93c5fd',
    bg: 'rgba(96,165,250,0.07)',
    visual: ['📷', '📝', '🌟'],
  },
  {
    emoji: '🏙️',
    tag: '3D CITY VIEW',
    title: '줌인하면 도시가\n3D로 살아나요',
    desc: '지도를 확대하면 건물이 입체적으로\n솟아오르며 도시 풍경이 펼쳐져요\n내가 기록한 장소를 3D로 감상해보세요',
    color: '#38bdf8',
    accent: '#7dd3fc',
    bg: 'rgba(56,189,248,0.07)',
    visual: ['🏢', '🌆', '✨'],
  },
  {
    emoji: '✨',
    tag: 'AI BUCKET LIST',
    title: 'AI가 추천하는\n나만의 버킷리스트',
    desc: '20대라면 자격증·어학연수·인턴십\n30대라면 마라톤·내 집 마련·해외여행\n나이대에 딱 맞는 목표를 AI가 제안해요',
    color: '#a78bfa',
    accent: '#c4b5fd',
    bg: 'rgba(167,139,250,0.07)',
    visual: ['🎯', '📋', '🏆'],
  },
  {
    emoji: '🚀',
    tag: 'LIFE DESIGN',
    title: '목표를 체크하며\n인생을 설계하세요',
    desc: '완료한 목표엔 체크 표시가 생기고\n지도 위 핀이 초록색으로 빛나요\n당신의 성장을 지도 위에 새겨보세요',
    color: '#34d399',
    accent: '#6ee7b7',
    bg: 'rgba(52,211,153,0.07)',
    visual: ['💚', '🌍', '🎉'],
  },
];

export default function OnboardingScreen({ onDone }: Props) {
  const [step, setStep] = useState(0);
  const isLast = step === STEPS.length - 1;
  const cur = STEPS[step];
  const next = () => isLast ? onDone() : setStep(s => s + 1);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.04 }}
      transition={{ duration: 0.5 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 99998,
        background: 'radial-gradient(ellipse at 50% 35%, #0e1a40 0%, #060d1f 75%)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '0 24px',
        paddingTop: 'calc(env(safe-area-inset-top) + 64px)',
        paddingBottom: 'calc(env(safe-area-inset-bottom) + 32px)',
        overflow: 'hidden',
      }}
    >
      {/* 배경 글로우 */}
      <motion.div
        key={step}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)',
          width: 400, height: 400, borderRadius: '50%',
          background: `radial-gradient(circle, ${cur.color}18 0%, transparent 65%)`,
          pointerEvents: 'none', filter: 'blur(24px)',
        }}
      />

      {/* 스킵 */}
      <button onClick={onDone} style={{
        position: 'absolute', top: 'calc(env(safe-area-inset-top) + 18px)', right: 20,
        background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 20, color: 'rgba(255,255,255,0.4)',
        fontSize: 12, cursor: 'pointer', padding: '6px 14px', letterSpacing: '0.05em',
      }}>건너뛰기</button>

      {/* 스텝 인디케이터 */}
      <div style={{ position: 'absolute', top: 'calc(env(safe-area-inset-top) + 22px)', display: 'flex', gap: 6 }}>
        {STEPS.map((s, i) => (
          <motion.div key={i}
            animate={{
              width: i === step ? 28 : 6,
              background: i === step ? cur.color : i < step ? `${cur.color}55` : 'rgba(255,255,255,0.15)',
            }}
            transition={{ duration: 0.35 }}
            style={{ height: 6, borderRadius: 3 }}
          />
        ))}
      </div>

      {/* 컨텐츠 */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', maxWidth: 360 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.32, ease: 'easeOut' }}
            style={{ width: '100%', textAlign: 'center' }}
          >
            {/* 이모지 */}
            <div style={{ position: 'relative', display: 'inline-block', marginBottom: 28 }}>
              <div style={{
                position: 'absolute', inset: -24,
                background: `radial-gradient(circle, ${cur.color}28 0%, transparent 70%)`,
                borderRadius: '50%',
              }} />
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut' }}
                style={{ fontSize: 76, lineHeight: 1, position: 'relative' }}
              >
                {cur.emoji}
              </motion.div>
            </div>

            {/* 태그 */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: `${cur.color}18`, border: `1px solid ${cur.color}44`,
              borderRadius: 20, padding: '4px 12px', marginBottom: 16,
            }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: cur.color, boxShadow: `0 0 6px ${cur.color}` }} />
              <span style={{ fontSize: 10, color: cur.accent, fontWeight: 700, letterSpacing: '0.12em' }}>{cur.tag}</span>
            </div>

            {/* 카드 */}
            <div style={{
              background: cur.bg,
              border: `1px solid ${cur.color}28`,
              borderRadius: 24, padding: '28px 24px',
              marginBottom: 20, position: 'relative', overflow: 'hidden',
            }}>
              {/* 배경 데코 */}
              <div style={{
                position: 'absolute', top: -20, right: -20, fontSize: 56, opacity: 0.06, userSelect: 'none',
                letterSpacing: 4,
              }}>
                {cur.visual}
              </div>

              <h2 style={{
                fontSize: 23, fontWeight: 800, color: 'white',
                margin: '0 0 12px', lineHeight: 1.35, whiteSpace: 'pre-line',
                position: 'relative',
              }}>
                {cur.title}
              </h2>
              <p style={{
                fontSize: 13.5, color: 'rgba(255,255,255,0.5)',
                lineHeight: 1.75, margin: 0, whiteSpace: 'pre-line',
                position: 'relative',
              }}>
                {cur.desc}
              </p>
            </div>

            {/* 비주얼 이모지 */}
            <motion.div
              animate={{ opacity: [0.4, 0.8, 0.4] }}
              transition={{ repeat: Infinity, duration: 2.5 }}
              style={{ display: 'flex', justifyContent: 'center', gap: 12, fontSize: 22, marginBottom: 4 }}
            >
              {Array.from(cur.visual).map((e, i) => (
                <motion.span key={i}
                  animate={{ y: [0, -4, 0] }}
                  transition={{ repeat: Infinity, duration: 2, delay: i * 0.3 }}
                >
                  {e}
                </motion.span>
              ))}
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 다음 버튼 */}
      <div style={{ width: '100%', maxWidth: 360 }}>
        {/* 스텝 번호 */}
        <div style={{ textAlign: 'center', marginBottom: 12, fontSize: 11, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.08em' }}>
          {step + 1} / {STEPS.length}
        </div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={next}
          style={{
            width: '100%', padding: '16px',
            borderRadius: 18, border: 'none',
            background: `linear-gradient(135deg, ${cur.color}, ${STEPS[(step + 1) % STEPS.length].color})`,
            color: 'white', fontSize: 15, fontWeight: 700,
            cursor: 'pointer', letterSpacing: '0.02em',
            boxShadow: `0 8px 28px ${cur.color}44`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          {isLast ? (
            <><span>AtmoGalaxy 시작하기</span><span style={{ fontSize: 18 }}>🚀</span></>
          ) : (
            <><span>다음</span><span style={{ fontSize: 14, opacity: 0.8 }}>→</span></>
          )}
        </motion.button>
      </div>
    </motion.div>
  );
}