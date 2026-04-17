// src/components/SplashScreen.tsx
import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface Props { onEnter: () => void; }

export default function SplashScreen({ onEnter }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);

    const stars = Array.from({ length: 160 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.6 + 0.2,
      speed: Math.random() * 0.005 + 0.002,
      offset: Math.random() * Math.PI * 2,
    }));

    // 유성 파티클
    const meteors: { x: number; y: number; vx: number; vy: number; life: number; maxLife: number }[] = [];
    const spawnMeteor = () => {
      meteors.push({
        x: Math.random() * canvas.width * 0.7,
        y: Math.random() * canvas.height * 0.4,
        vx: 3 + Math.random() * 3,
        vy: 1.5 + Math.random() * 2,
        life: 0,
        maxLife: 40 + Math.random() * 30,
      });
    };

    let frame: number;
    let t = 0;
    let meteorTimer = 0;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      t++;
      meteorTimer++;

      // 별
      stars.forEach(s => {
        const alpha = 0.25 + 0.75 * Math.abs(Math.sin(t * s.speed + s.offset));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(180,210,255,${alpha})`;
        ctx.fill();
      });

      // 유성 스폰
      if (meteorTimer > 120) { spawnMeteor(); meteorTimer = 0; }

      // 유성 그리기
      for (let i = meteors.length - 1; i >= 0; i--) {
        const m = meteors[i];
        m.life++;
        m.x += m.vx; m.y += m.vy;
        const progress = m.life / m.maxLife;
        const alpha = progress < 0.3 ? progress / 0.3 : 1 - (progress - 0.3) / 0.7;
        const grad = ctx.createLinearGradient(m.x - m.vx * 8, m.y - m.vy * 8, m.x, m.y);
        grad.addColorStop(0, `rgba(167,139,250,0)`);
        grad.addColorStop(1, `rgba(167,139,250,${alpha * 0.8})`);
        ctx.beginPath();
        ctx.moveTo(m.x - m.vx * 8, m.y - m.vy * 8);
        ctx.lineTo(m.x, m.y);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        if (m.life >= m.maxLife) meteors.splice(i, 1);
      }

      frame = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(frame); window.removeEventListener('resize', resize); };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.06 }}
      transition={{ duration: 0.75, ease: 'easeInOut' }}
      onClick={onEnter}
      style={{
        position: 'fixed', inset: 0, zIndex: 99999,
        background: 'radial-gradient(ellipse at 50% 55%, #0e1a40 0%, #07102a 50%, #030810 100%)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', userSelect: 'none',
        overflow: 'hidden',
      }}
    >
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />

      {/* 배경 오로라 글로우 */}
      <div style={{
        position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)',
        width: 500, height: 500, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(120,80,255,0.10) 0%, rgba(60,120,255,0.06) 40%, transparent 70%)',
        pointerEvents: 'none',
        filter: 'blur(20px)',
      }} />
      <div style={{
        position: 'absolute', top: '30%', left: '40%',
        width: 300, height: 300, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(80,200,255,0.07) 0%, transparent 70%)',
        pointerEvents: 'none', filter: 'blur(15px)',
      }} />

      {/* 메인 콘텐츠 */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.9, ease: 'easeOut' }}
        style={{ position: 'relative', textAlign: 'center', zIndex: 1, padding: '0 32px' }}
      >
        {/* 행성 아이콘 with 궤도 링 */}
        <div style={{ position: 'relative', display: 'inline-block', marginBottom: 32 }}>
          {/* 궤도 링 1 */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
            style={{
              position: 'absolute', inset: -28,
              border: '1px solid rgba(167,139,250,0.25)',
              borderRadius: '50%', borderTopColor: 'rgba(167,139,250,0.7)',
            }}
          />
          {/* 궤도 링 2 */}
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
            style={{
              position: 'absolute', inset: -16,
              border: '1px solid rgba(96,165,250,0.18)',
              borderRadius: '50%', borderBottomColor: 'rgba(96,165,250,0.6)',
            }}
          />
          {/* 글로우 배경 */}
          <div style={{
            position: 'absolute', inset: -8,
            background: 'radial-gradient(circle, rgba(139,92,246,0.3) 0%, transparent 70%)',
            borderRadius: '50%', filter: 'blur(8px)',
          }} />
          {/* 아이콘 */}
          <motion.div
            animate={{ scale: [1, 1.06, 1], rotate: [0, 4, -4, 0] }}
            transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut' }}
            style={{ fontSize: 72, lineHeight: 1, position: 'relative' }}
          >
            🌐
          </motion.div>
          {/* 궤도 위 작은 별 */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            style={{ position: 'absolute', inset: -22, borderRadius: '50%' }}
          >
            <div style={{
              position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
              width: 6, height: 6, borderRadius: '50%',
              background: '#a78bfa',
              boxShadow: '0 0 8px #a78bfa, 0 0 16px #a78bfa',
            }} />
          </motion.div>
        </div>

        {/* 앱 이름 */}
        <motion.h1
          initial={{ opacity: 0, letterSpacing: '0.3em' }}
          animate={{ opacity: 1, letterSpacing: '-0.02em' }}
          transition={{ delay: 0.5, duration: 0.8 }}
          style={{
            fontSize: 46, fontWeight: 900, margin: '0 0 10px',
            background: 'linear-gradient(135deg, #c4b5fd 0%, #818cf8 30%, #60a5fa 60%, #a78bfa 100%)',
            backgroundSize: '200%',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}
        >
          AtmoGalaxy
        </motion.h1>

        {/* 새 슬로건 */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          style={{
            fontSize: 15, fontWeight: 600,
            background: 'linear-gradient(90deg, rgba(167,139,250,0.9), rgba(96,165,250,0.9))',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            margin: '0 0 6px', letterSpacing: '0.01em',
          }}
        >
          여행을 기록하고, 인생을 설계하다
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0, duration: 0.6 }}
          style={{
            fontSize: 12, color: 'rgba(148,163,184,0.6)',
            margin: '0 0 52px', letterSpacing: '0.03em',
          }}
        >
          날씨 기반 여행 일기 × AI 버킷리스트
        </motion.p>

        {/* 시작 버튼 */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.5 }}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}
        >
          <motion.div
            animate={{ boxShadow: ['0 0 0 0 rgba(139,92,246,0.4)', '0 0 0 16px rgba(139,92,246,0)', '0 0 0 0 rgba(139,92,246,0)'] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeOut' }}
            style={{
              width: 52, height: 52, borderRadius: '50%',
              background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, cursor: 'pointer',
              boxShadow: '0 8px 24px rgba(139,92,246,0.45)',
            }}
          >
            ✦
          </motion.div>
          <motion.p
            animate={{ opacity: [0.4, 0.9, 0.4] }}
            transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
            style={{ fontSize: 12, color: 'rgba(148,163,184,0.5)', margin: 0, letterSpacing: '0.12em' }}
          >
            터치해서 시작
          </motion.p>
        </motion.div>
      </motion.div>

      {/* 하단 배지들 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 0.6 }}
        style={{
          position: 'absolute',
          bottom: 'calc(env(safe-area-inset-bottom) + 28px)',
          display: 'flex', gap: 8, alignItems: 'center',
        }}
      >
        {['🗺️ Mapbox', '☁️ OpenWeather', '✨ Gemini AI'].map(badge => (
          <div key={badge} style={{
            fontSize: 10, color: 'rgba(148,163,184,0.35)',
            padding: '4px 8px', borderRadius: 20,
            border: '1px solid rgba(255,255,255,0.06)',
            letterSpacing: '0.04em',
          }}>
            {badge}
          </div>
        ))}
      </motion.div>
    </motion.div>
  );
}