// src/components/DetailPanel.tsx

import React, { useEffect, useState, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid
} from 'recharts';
import { pinStore, panelCloseStore } from '../store/pinStore';
import { useTheme, THEME } from '../context/ThemeContext';
import { fetchWeather, fetchForecast, type WeatherData, type ForecastPoint } from '../hooks/useWeather';
import { deleteRecord, loadRecords } from '../store/recordStore';

// ── 권역별 테마 ────────────────────────────────────────────
function getRegionTheme(id: number) {
  if (id >= 1   && id <= 10)  return { color: '#3b82f6', label: '수도권', gradient: 'linear-gradient(160deg, #0f2744 0%, #0d1117 60%)' };
  if (id >= 11  && id <= 20)  return { color: '#10b981', label: '강원',   gradient: 'linear-gradient(160deg, #042f20 0%, #0d1117 60%)' };
  if (id >= 21  && id <= 35)  return { color: '#f97316', label: '충청',   gradient: 'linear-gradient(160deg, #2d1005 0%, #0d1117 60%)' };
  if (id >= 36  && id <= 50)  return { color: '#a855f7', label: '경상',   gradient: 'linear-gradient(160deg, #1e0840 0%, #0d1117 60%)' };
  if (id >= 51  && id <= 60)  return { color: '#6366f1', label: '전라',   gradient: 'linear-gradient(160deg, #12103a 0%, #0d1117 60%)' };
  if (id >= 61  && id <= 70)  return { color: '#e11d48', label: '제주',   gradient: 'linear-gradient(160deg, #3b0618 0%, #0d1117 60%)' };
  if (id >= 101 && id <= 110) return { color: '#f43f5e', label: '홋카이도', gradient: 'linear-gradient(160deg, #3b0618 0%, #0d1117 60%)' };
  if (id >= 111 && id <= 125) return { color: '#f59e0b', label: '간토',   gradient: 'linear-gradient(160deg, #2d1a05 0%, #0d1117 60%)' };
  if (id >= 126 && id <= 140) return { color: '#84cc16', label: '주부',   gradient: 'linear-gradient(160deg, #0f2005 0%, #0d1117 60%)' };
  if (id >= 141 && id <= 155) return { color: '#38bdf8', label: '간사이', gradient: 'linear-gradient(160deg, #03182a 0%, #0d1117 60%)' };
  return                              { color: '#a8a29e', label: '규슈',   gradient: 'linear-gradient(160deg, #1a1512 0%, #0d1117 60%)' };
}

// ── 커스텀 차트 툴팁 ──────────────────────────────────────
function ChartTooltip({ active, payload, color }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as ForecastPoint;
  return (
    <div style={{
      background: 'rgba(13,17,30,0.95)', backdropFilter: 'blur(12px)',
      border: `1px solid ${color}44`, borderRadius: '10px',
      padding: '10px 14px', minWidth: '110px',
    }}>
      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', margin: '0 0 4px' }}>{d.date} {d.time}</p>
      <p style={{ color: 'white', fontSize: '20px', fontWeight: 800, margin: '0 0 2px' }}>{d.temp}°</p>
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', margin: 0 }}>{d.emoji} {d.label}</p>
      {d.pop > 0 && <p style={{ color: '#60a5fa', fontSize: '11px', margin: '3px 0 0' }}>💧 강수 {d.pop}%</p>}
    </div>
  );
}

// ── 메인 컴포넌트 ─────────────────────────────────────────
export default function DetailPanel() {
  const [point, setPoint] = useState<any>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [forecast, setForecast] = useState<ForecastPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [isUserRecord, setIsUserRecord] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const { isDark } = useTheme();
  const th = isDark ? THEME.dark : THEME.light;
  const [panelHeight, setPanelHeight] = useState(50); // vh
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY = useRef<number | null>(null);
  const dragStartHeight = useRef<number>(50);

  const handleResizeStart = (e: React.PointerEvent) => {
    dragStartY.current = e.clientY;
    dragStartHeight.current = panelHeight;
    setIsDragging(true);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleResizeMove = (e: React.PointerEvent) => {
    if (dragStartY.current === null) return;
    const delta = dragStartY.current - e.clientY;
    const deltaVh = (delta / window.innerHeight) * 100;
    const next = Math.max(20, Math.min(65, dragStartHeight.current + deltaVh));
    setPanelHeight(next);
  };

  const handleResizeEnd = () => {
    if (dragStartY.current === null) return;
    dragStartY.current = null;
    setIsDragging(false);
    if (panelHeight < 28) {
      handleClose();
    } else if (panelHeight < 52) {
      setPanelHeight(50);
    } else {
      setPanelHeight(65);
    }
  };

  useEffect(() => {
    const unsub = pinStore.subscribe(async (p) => {
      setPoint(p);
      setPanelHeight(50);
      setWeather(null);
      setForecast([]);
      setLoading(true);

      // 사용자 저장 기록인지 확인 (id가 string이면 저장 기록)
      const records = loadRecords();
      setIsUserRecord(records.some(r => r.id === p.id));

      try {
        const [w, f] = await Promise.all([
          fetchWeather(p.lat, p.lng),
          fetchForecast(p.lat, p.lng),
        ]);
        setWeather(w);
        setForecast(f);
      } catch {
        // 날씨 로드 실패 무시
      } finally {
        setLoading(false);
      }
    });
    return unsub;
  }, []);

  const isRecord = typeof point?.id === 'string';
  const theme = point
    ? isRecord
      ? { color: '#a855f7', label: 'MY RECORD', gradient: 'linear-gradient(160deg, #1e0840 0%, #0d1117 60%)' }
      : getRegionTheme(point.id)
    : null;
  if (!point || !theme) return null;

  // 차트용 데이터 — 오늘 기준 8개 포인트
  const chartData = forecast.slice(0, 8);
  const minTemp = chartData.length ? Math.min(...chartData.map(d => d.temp)) - 2 : 0;
  const maxTemp = chartData.length ? Math.max(...chartData.map(d => d.temp)) + 2 : 30;

  const handleClose = () => { setPoint(null); panelCloseStore.emit(); };

  const handleShare = async () => {
    const name = point.label ?? point.locationName ?? '장소';
    const weatherLine = weather ? `${weather.weatherEmoji} ${weather.temp}°C · ${weather.weather}` : '';
    const memoLine = point.memo ? `\n\n"${point.memo}"` : '';
    const coordLine = `\n📍 ${point.lat?.toFixed(4)}°N ${point.lng?.toFixed(4)}°E`;
    const text = `${name}\n${weatherLine}${memoLine}${coordLine}\n\n— AtmoGalaxy로 기록됨`;

    const showCopied = () => {
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    };

    // iOS/Android 네이티브 공유 시트 (카카오톡, 인스타 등 포함)
    if (navigator.share) {
      try {
        await navigator.share({ title: `AtmoGalaxy — ${name}`, text });
        return;
      } catch (e: any) {
        if (e?.name === 'AbortError') return; // 사용자가 직접 취소
        // 그 외 에러는 클립보드로 폴백
      }
    }

    // 폴백: 클립보드 복사
    try {
      await navigator.clipboard.writeText(text);
      showCopied();
    } catch {
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      showCopied();
    }
  };



  const mobileStyle: React.CSSProperties = {
    position: 'fixed', bottom: 0, left: 0, right: 0,
    height: `${panelHeight}vh`,
    maxHeight: '65vh',
    transition: isDragging ? 'none' : 'height 0.35s cubic-bezier(0.32, 0.72, 0, 1)',
    borderRadius: '20px 20px 0 0',
    background: isDark ? theme.gradient : th.panelBg,
    zIndex: 9999, color: th.text,
    boxShadow: `0 -4px 40px rgba(0,0,0,0.3), 0 -1px 0 ${theme.color}44`,
    overflowY: 'auto', overflowX: 'hidden',
    scrollbarWidth: 'none' as const,
    paddingBottom: 'env(safe-area-inset-bottom)',
  };

  return (
    <AnimatePresence>
      <motion.div
        key={point.id}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 40, stiffness: 180, mass: 1.2 }}
        style={mobileStyle}
      >
        <style>{`
          ::-webkit-scrollbar { display: none; }
          @keyframes spin { to { transform: rotate(360deg); } }
          @keyframes fadeUp { from { opacity:0; transform: translateY(12px); } to { opacity:1; transform: translateY(0); } }
        `}</style>

        {/* 드래그 핸들 — 항상 표시 */}
        <div
          onPointerDown={handleResizeStart}
          onPointerMove={handleResizeMove}
          onPointerUp={handleResizeEnd}
          onPointerCancel={handleResizeEnd}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '12px', paddingBottom: '8px', cursor: 'ns-resize', touchAction: 'none', userSelect: 'none' }}>
          <div style={{ width: '40px', height: '4px', borderRadius: '2px', background: isDragging ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.25)' }} />
        </div>

        {/* ── 복사 완료 토스트 ── */}
        {shareCopied && (
          <div style={{
            position: 'absolute', top: '70px', left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(74,222,128,0.15)', border: '1px solid rgba(74,222,128,0.4)',
            borderRadius: 20, padding: '8px 16px',
            fontSize: 12, color: '#4ade80', fontWeight: 600,
            zIndex: 20, whiteSpace: 'nowrap',
            backdropFilter: 'blur(8px)',
          }}>
            ✓ 클립보드에 복사됐어요
          </div>
        )}

        {/* ── 공유 버튼 ── */}
        <button
          onClick={handleShare}
          style={{
            position: 'absolute', top: '12px', right: '68px',
            width: '44px', height: '44px', borderRadius: '50%',
            background: shareCopied ? 'rgba(74,222,128,0.15)' : 'rgba(255,255,255,0.06)',
            border: `1px solid ${shareCopied ? 'rgba(74,222,128,0.4)' : 'rgba(255,255,255,0.12)'}`,
            color: shareCopied ? '#4ade80' : 'rgba(255,255,255,0.5)', fontSize: '16px',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s', zIndex: 10,
          }}
          onMouseEnter={e => { if (!shareCopied) { (e.currentTarget.style.background = 'rgba(255,255,255,0.12)'); (e.currentTarget.style.color = 'white'); } }}
          onMouseLeave={e => { if (!shareCopied) { (e.currentTarget.style.background = 'rgba(255,255,255,0.06)'); (e.currentTarget.style.color = 'rgba(255,255,255,0.5)'); } }}
        >{shareCopied ? '✓' : '⬆️'}</button>

        {/* ── 닫기 버튼 ── */}
        <button
          onClick={handleClose}
          style={{
            position: 'absolute', top: '12px', right: '16px',
            width: '44px', height: '44px', borderRadius: '50%',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.12)',
            color: 'rgba(255,255,255,0.5)', fontSize: '16px',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s', zIndex: 10,
          }}
          onMouseEnter={e => { (e.currentTarget.style.background = 'rgba(255,255,255,0.12)'); (e.currentTarget.style.color = 'white'); }}
          onMouseLeave={e => { (e.currentTarget.style.background = 'rgba(255,255,255,0.06)'); (e.currentTarget.style.color = 'rgba(255,255,255,0.5)'); }}
        >✕</button>

        <div style={{ padding: '8px 20px 32px' }}>

          {/* ── 헤더: 권역 태그 + 장소명 ── */}
          <div style={{ marginTop: '8px', marginBottom: '24px' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              background: `${theme.color}18`, border: `1px solid ${theme.color}44`,
              borderRadius: '20px', padding: '4px 12px', marginBottom: '12px',
            }}>
              <div style={{
                width: '6px', height: '6px', borderRadius: '50%',
                background: theme.color, boxShadow: `0 0 8px ${theme.color}`,
              }} />
              <span style={{ fontSize: '11px', color: theme.color, fontWeight: 700, letterSpacing: '0.08em' }}>
                {point.label && point.label.length > 10 ? theme.label : theme.label}
              </span>
              {isUserRecord && (
                <span style={{ fontSize: '10px', color: '#a855f7', marginLeft: '4px' }}>★ MY RECORD</span>
              )}
            </div>

            <h1 style={{
              fontSize: '32px', fontWeight: 900, color: 'white',
              letterSpacing: '-0.5px', margin: '0 0 6px', lineHeight: 1.1,
            }}>{point.label ?? point.locationName ?? ''}</h1>
            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace', margin: 0 }}>
              {point.lat?.toFixed(4)}°N · {point.lng?.toFixed(4)}°E
            </p>
          </div>

          {/* ── 로딩 ── */}
          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '20px 0', color: 'rgba(255,255,255,0.4)' }}>
              <div style={{
                width: '16px', height: '16px', borderRadius: '50%',
                border: `2px solid ${theme.color}44`, borderTopColor: theme.color,
                animation: 'spin 0.7s linear infinite', flexShrink: 0,
              }} />
              <span style={{ fontSize: '13px' }}>날씨 데이터 수신 중...</span>
            </div>
          )}

          {/* ── 현재 날씨 메인 카드 ── */}
          {weather && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              {/* 현재 기온 + 날씨 */}
              <div style={{
                background: `${theme.color}0f`,
                border: `1px solid ${theme.color}22`,
                borderRadius: '20px', padding: '20px',
                marginBottom: '12px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
                    <span style={{ fontSize: '56px', fontWeight: 900, color: 'white', lineHeight: 1 }}>{weather.temp}</span>
                    <span style={{ fontSize: '20px', color: 'rgba(255,255,255,0.4)', fontWeight: 300 }}>°C</span>
                  </div>
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', margin: '4px 0 2px' }}>{weather.weather}</p>
                  <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '12px', margin: 0 }}>체감 {weather.feelsLike}°C</p>
                </div>
                <div style={{ fontSize: '52px', lineHeight: 1 }}>{weather.weatherEmoji}</div>
              </div>

              {/* 상세 지표 그리드 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '20px' }}>
                {[
                  { icon: '💧', label: '습도', value: `${weather.humidity}%`, color: '#60a5fa' },
                  { icon: '💨', label: '풍속', value: `${weather.windSpeed} m/s`, color: '#67e8f9' },
                  { icon: '🌡️', label: '기압', value: `${weather.pressure} hPa`, color: '#c4b5fd' },
                  { icon: '👁️', label: '가시거리', value: `${weather.visibility} km`, color: '#6ee7b7' },
                ].map(item => (
                  <div key={item.label} style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: '14px', padding: '14px',
                  }}>
                    <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', margin: '0 0 6px' }}>
                      {item.icon} {item.label}
                    </p>
                    <p style={{ fontSize: '18px', fontWeight: 700, color: item.color, margin: 0 }}>{item.value}</p>
                  </div>
                ))}
              </div>

              {/* ── 24시간 예보 차트 ── */}
              {forecast.length > 0 && (
                <div style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: '20px', padding: '18px 12px 12px',
                  marginBottom: '12px',
                }}>
                  <p style={{
                    fontSize: '11px', color: 'rgba(255,255,255,0.3)',
                    textTransform: 'uppercase', letterSpacing: '0.12em',
                    margin: '0 0 16px 8px',
                  }}>48시간 예보</p>

                  <ResponsiveContainer width="100%" height={120}>
                    <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={theme.color} stopOpacity={0.35} />
                          <stop offset="100%" stopColor={theme.color} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="rgba(255,255,255,0.05)"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="time"
                        tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
                        axisLine={false} tickLine={false}
                        interval={1}
                      />
                      <YAxis
                        domain={[minTemp, maxTemp]}
                        tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
                        axisLine={false} tickLine={false}
                        tickFormatter={v => `${v}°`}
                      />
                      <Tooltip content={<ChartTooltip color={theme.color} />} />
                      <Area
                        type="monotone"
                        dataKey="temp"
                        stroke={theme.color}
                        strokeWidth={2}
                        fill="url(#tempGrad)"
                        dot={false}
                        activeDot={{ r: 4, fill: theme.color, stroke: 'white', strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>

                  {/* 예보 스크롤 타임라인 */}
                  <div style={{
                    display: 'flex', gap: '6px', marginTop: '12px',
                    overflowX: 'auto', paddingBottom: '4px',
                    scrollbarWidth: 'none',
                  }}>
                    {chartData.map((f, i) => (
                      <div key={i} style={{
                        flexShrink: 0, textAlign: 'center', minWidth: '44px',
                        background: i === 0 ? `${theme.color}22` : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${i === 0 ? theme.color + '44' : 'rgba(255,255,255,0.07)'}`,
                        borderRadius: '10px', padding: '8px 6px',
                      }}>
                        <p style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', margin: '0 0 4px' }}>{f.time}</p>
                        <p style={{ fontSize: '14px', margin: '0 0 3px' }}>{f.emoji}</p>
                        <p style={{ fontSize: '11px', fontWeight: 700, color: 'white', margin: '0 0 2px' }}>{f.temp}°</p>
                        {f.pop > 0 && (
                          <p style={{ fontSize: '9px', color: '#60a5fa', margin: 0 }}>{f.pop}%</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}


              {/* ── 사진 (있을 때만) ── */}
              {point.photoBase64 && (
                <div style={{
                  borderRadius: '14px', overflow: 'hidden',
                  marginBottom: '12px',
                  border: `1px solid ${theme.color}22`,
                }}>
                  <img
                    src={point.photoBase64}
                    alt="기록 사진"
                    style={{ width: '100%', display: 'block', maxHeight: '220px', objectFit: 'cover' }}
                  />
                </div>
              )}

              {/* ── 메모 (있을 때만) ── */}
              {point.memo && (
                <div style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: `1px solid ${theme.color}22`,
                  borderLeft: `3px solid ${theme.color}`,
                  borderRadius: '0 14px 14px 0',
                  padding: '14px 16px', marginBottom: '12px',
                }}>
                  <p style={{ fontSize: '10px', color: theme.color, fontWeight: 700, margin: '0 0 6px', letterSpacing: '0.1em' }}>
                    ✦ {point.mood || 'MEMO'}
                  </p>
                  <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, margin: 0 }}>
                    {point.memo}
                  </p>
                </div>
              )}

              {/* ── 사용자 기록 삭제 버튼 ── */}
              {isUserRecord && (
                <button
                  onClick={() => {
                    deleteRecord(point.id);
                    setPoint(null);
                    panelCloseStore.emit();
                  }}
                  style={{
                    width: '100%', padding: '10px', borderRadius: '12px',
                    background: 'rgba(239,68,68,0.08)',
                    border: '1px solid rgba(239,68,68,0.25)',
                    color: 'rgba(239,68,68,0.7)', fontSize: '13px',
                    cursor: 'pointer', marginTop: '4px',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => { (e.currentTarget.style.background = 'rgba(239,68,68,0.18)'); (e.currentTarget.style.color = '#ef4444'); }}
                  onMouseLeave={e => { (e.currentTarget.style.background = 'rgba(239,68,68,0.08)'); (e.currentTarget.style.color = 'rgba(239,68,68,0.7)'); }}
                >
                  🗑 이 기록 삭제
                </button>
              )}
            </motion.div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}