// src/components/StatsPanel.tsx
// 저장된 기록 기반 통계 패널

import React, { useEffect, useState, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { loadRecords, recordStore, type AtmoRecord } from '../store/recordStore';

interface Props {
  open: boolean;
  onClose: () => void;
}

function calcStats(records: AtmoRecord[]) {
  if (records.length === 0) return null;

  const temps = records.map(r => r.temp);
  const avgTemp = Math.round(temps.reduce((a, b) => a + b, 0) / temps.length);
  const maxTemp = Math.max(...temps);
  const minTemp = Math.min(...temps);

  // 날씨별 빈도
  const weatherCount: Record<string, { count: number; emoji: string; color: string }> = {};
  records.forEach(r => {
    const key = r.weather;
    if (!weatherCount[key]) weatherCount[key] = { count: 0, emoji: r.weatherEmoji, color: r.weatherColor };
    weatherCount[key].count++;
  });
  const topWeather = Object.entries(weatherCount)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 3);

  // 요일별 기록 수
  const dayCount = [0, 0, 0, 0, 0, 0, 0];
  const dayLabels = ['일', '월', '화', '수', '목', '금', '토'];
  records.forEach(r => {
    // recordedAt 파싱 (예: "2025. 4. 12. 오전 2:28:52")
    try {
      const d = new Date(r.recordedAt);
      if (!isNaN(d.getTime())) dayCount[d.getDay()]++;
    } catch {}
  });
  const maxDay = Math.max(...dayCount);

  // 최근 기록
  const latest = [...records].reverse().slice(0, 3);

  return { avgTemp, maxTemp, minTemp, topWeather, dayCount, dayLabels, maxDay, latest };
}

// 날씨 요정 계산
function getWeatherPersonality(records: AtmoRecord[]) {
  if (records.length === 0) return null;
  const count: Record<string, { count: number; emoji: string }> = {};
  records.forEach(r => {
    const code = r.weatherEmoji;
    if (!count[code]) count[code] = { count: 0, emoji: r.weatherEmoji };
    count[code].count++;
  });
  const top = Object.entries(count).sort((a, b) => b[1].count - a[1].count)[0];
  const emoji = top[1].emoji;
  const pct = Math.round((top[1].count / records.length) * 100);

  const map: Record<string, { title: string; desc: string; color: string; bg: string }> = {
    '🌧️': { title: '비의 요정 ☔', desc: '빗소리와 함께한 여행이 많았군요\n촉촉한 감성의 소유자예요', color: '#60a5fa', bg: 'rgba(96,165,250,0.1)' },
    '☀️': { title: '햇살 수호자 ☀️', desc: '맑은 날씨와 함께한 여행자예요\n긍정 에너지가 넘쳐흘러요', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
    '⛅': { title: '구름 탐험가 ⛅', desc: '구름 사이로 여행을 즐기는 타입\n변화무쌍한 날씨도 두렵지 않아요', color: '#00CFFF', bg: 'rgba(0,207,255,0.1)' },
    '☁️': { title: '구름 방랑자 ☁️', desc: '흐린 날의 고요함을 즐기는 여행자\n차분한 감성을 가졌어요', color: '#8899AA', bg: 'rgba(136,153,170,0.1)' },
    '⛈️': { title: '번개 사냥꾼 ⚡', desc: '폭풍 속에서도 기록을 남기는 용감한 여행자예요', color: '#CC00FF', bg: 'rgba(204,0,255,0.1)' },
    '❄️': { title: '눈꽃 요정 ❄️', desc: '눈 내리는 날의 낭만을 아는 여행자\n특별한 순간을 잘 포착해요', color: '#AAEEFF', bg: 'rgba(170,238,255,0.1)' },
    '🌫️': { title: '안개 신비주의자 🌫️', desc: '안개 속 신비로운 풍경을 좋아하는\n감성적인 여행자예요', color: '#99AAAA', bg: 'rgba(153,170,170,0.1)' },
  };

  const personality = map[emoji] ?? { title: '날씨 수집가 🌡️', desc: '다양한 날씨 속에서 여행을 즐기는\n진정한 여행자예요', color: '#a855f7', bg: 'rgba(168,85,247,0.1)' };
  return { ...personality, pct };
}

export default function StatsPanel({ open, onClose }: Props) {
  const [records, setRecords] = useState<AtmoRecord[]>(() => loadRecords());
  const [showTutorial, setShowTutorial] = useState(() => !localStorage.getItem('stats_tutorial_seen'));
  const [panelHeight, setPanelHeight] = useState(70);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY = useRef<number | null>(null);
  const dragStartHeight = useRef<number>(70);

  useEffect(() => {
    const unsub = recordStore.subscribe(setRecords);
    return unsub;
  }, []);

  const stats = calcStats(records);

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
    setPanelHeight(Math.max(20, Math.min(90, dragStartHeight.current + deltaVh)));
  };
  const handleResizeEnd = () => {
    if (dragStartY.current === null) return;
    dragStartY.current = null;
    setIsDragging(false);
    if (panelHeight < 22) onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9996, backdropFilter: 'blur(4px)' }}
          />

          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 200 }}
            style={{
              position: 'fixed', bottom: 0, left: 0, right: 0,
              height: `${panelHeight}vh`,
              background: 'rgba(6,13,31,0.98)', backdropFilter: 'blur(24px)',
              borderRadius: '24px 24px 0 0',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 -20px 80px rgba(0,0,0,0.7)',
              zIndex: 9997, overflow: 'hidden', display: 'flex', flexDirection: 'column',
              paddingBottom: 'env(safe-area-inset-bottom, 0px)',
              transition: 'none',
            }}
          >
            {/* 드래그 핸들 */}
            <div
              onPointerDown={handleResizeStart}
              onPointerMove={handleResizeMove}
              onPointerUp={handleResizeEnd}
              onPointerCancel={handleResizeEnd}
              style={{ padding: '14px 0 10px', cursor: 'ns-resize', touchAction: 'none', userSelect: 'none', flexShrink: 0 }}
            >
              <div style={{ width: '40px', height: '4px', background: isDragging ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.2)', borderRadius: '2px', margin: '0 auto', transition: 'background 0.15s' }} />
            </div>

            {/* 상단 컬러 라인 */}
            <div style={{ height: '2px', background: 'linear-gradient(90deg, #3b82f6, #a855f7, #e11d48)', flexShrink: 0 }} />

            {/* 헤더 */}
            <div style={{ padding: '14px 24px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ color: 'white', fontWeight: 800, fontSize: '18px', margin: 0 }}>내 기록 통계</h2>
                  <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', margin: '4px 0 0' }}>
                    총 {records.length}개의 대기 기록
                  </p>
                </div>
                <button onClick={onClose} style={{
                  width: '32px', height: '32px', borderRadius: '50%',
                  background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '14px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>✕</button>
              </div>
            </div>

            {/* 바디 */}
            <div style={{ overflowY: 'auto', flex: 1, padding: '20px 24px 32px', scrollbarWidth: 'none' }}>
              {/* 튜토리얼 오버레이 */}
              {showTutorial && stats && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  style={{
                    position: 'absolute', inset: 0, zIndex: 10,
                    background: 'rgba(6,13,31,0.92)', backdropFilter: 'blur(8px)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    padding: '32px 28px', borderRadius: '24px 24px 0 0',
                  }}
                >
                  <div style={{ fontSize: '48px', marginBottom: '20px' }}>📊</div>
                  <h3 style={{ color: 'white', fontWeight: 800, fontSize: '20px', margin: '0 0 16px', textAlign: 'center' }}>
                    내 여행 통계예요!
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', maxWidth: '300px', marginBottom: '28px' }}>
                    {[
                      { icon: '🌡️', text: '방문지의 평균·최고·최저 기온' },
                      { icon: '🌦️', text: '여행 중 자주 만난 날씨 TOP 3' },
                      { icon: '📅', text: '요일별 기록 빈도' },
                      { icon: '✨', text: '날씨로 알아보는 나의 여행 유형' },
                    ].map((item, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '12px 14px' }}>
                        <span style={{ fontSize: '20px' }}>{item.icon}</span>
                        <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px' }}>{item.text}</span>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => { setShowTutorial(false); localStorage.setItem('stats_tutorial_seen', '1'); }}
                    style={{
                      width: '100%', maxWidth: '300px', padding: '14px', borderRadius: '14px',
                      background: 'linear-gradient(135deg, #3b82f6, #a855f7)',
                      border: 'none', color: 'white', fontSize: '15px', fontWeight: 700, cursor: 'pointer',
                    }}
                  >확인했어요!</button>
                </motion.div>
              )}

              {!stats ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255,255,255,0.2)' }}>
                  <p style={{ fontSize: '32px', marginBottom: '10px' }}>📊</p>
                  <p style={{ fontSize: '14px' }}>기록이 3개 이상 있어야 통계를 볼 수 있어요</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                  {/* 날씨 요정 */}
                  {(() => {
                    const p = getWeatherPersonality(records);
                    if (!p) return null;
                    return (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        style={{ background: p.bg, border: `1px solid ${p.color}33`, borderRadius: '16px', padding: '18px 20px' }}
                      >
                        <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.12em', textTransform: 'uppercase', margin: '0 0 10px' }}>나의 여행 유형</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                          <div style={{ textAlign: 'center' }}>
                            <p style={{ fontSize: '32px', margin: 0, lineHeight: 1 }}>✨</p>
                          </div>
                          <div>
                            <p style={{ color: p.color, fontWeight: 800, fontSize: '18px', margin: '0 0 4px' }}>{p.title}</p>
                            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', margin: '0 0 6px', lineHeight: 1.6, whiteSpace: 'pre-line' }}>{p.desc}</p>
                            <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '11px', margin: 0 }}>전체 기록의 {p.pct}%가 이 날씨예요</p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })()}

                  {/* 기온 요약 */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                    {[
                      { label: '평균 기온', value: `${stats.avgTemp}°C`, color: '#f59e0b', icon: '🌡️' },
                      { label: '최고 기온', value: `${stats.maxTemp}°C`, color: '#ef4444', icon: '🔥' },
                      { label: '최저 기온', value: `${stats.minTemp}°C`, color: '#60a5fa', icon: '❄️' },
                    ].map(item => (
                      <div key={item.label} style={{
                        background: `${item.color}0f`, borderRadius: '16px', padding: '16px 12px',
                        border: `1px solid ${item.color}22`, textAlign: 'center',
                      }}>
                        <p style={{ fontSize: '20px', margin: '0 0 6px' }}>{item.icon}</p>
                        <p style={{ fontSize: '22px', fontWeight: 800, color: item.color, margin: '0 0 4px', lineHeight: 1 }}>
                          {item.value}
                        </p>
                        <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', margin: 0, letterSpacing: '0.05em' }}>
                          {item.label}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* 자주 기록한 날씨 */}
                  <div style={{
                    background: 'rgba(255,255,255,0.03)', borderRadius: '16px', padding: '16px',
                    border: '1px solid rgba(255,255,255,0.07)',
                  }}>
                    <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.12em', textTransform: 'uppercase', margin: '0 0 14px' }}>
                      자주 만난 날씨
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {stats.topWeather.map(([weather, info], i) => (
                        <div key={weather} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ fontSize: '18px', width: '24px', textAlign: 'center' }}>{info.emoji}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                              <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>{weather}</span>
                              <span style={{ fontSize: '12px', color: info.color, fontWeight: 700 }}>{info.count}회</span>
                            </div>
                            <div style={{ height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', overflow: 'hidden' }}>
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${(info.count / records.length) * 100}%` }}
                                transition={{ duration: 0.8, delay: i * 0.1, ease: 'easeOut' }}
                                style={{ height: '100%', background: info.color, borderRadius: '2px' }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 요일별 활동 히트맵 */}
                  <div style={{
                    background: 'rgba(255,255,255,0.03)', borderRadius: '16px', padding: '16px',
                    border: '1px solid rgba(255,255,255,0.07)',
                  }}>
                    <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.12em', textTransform: 'uppercase', margin: '0 0 14px' }}>
                      요일별 기록
                    </p>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-end', height: '60px' }}>
                      {stats.dayCount.map((count, i) => (
                        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: stats.maxDay > 0 ? `${(count / stats.maxDay) * 44 + 4}px` : '4px' }}
                            transition={{ duration: 0.6, delay: i * 0.05, ease: 'easeOut' }}
                            style={{
                              width: '100%', borderRadius: '4px',
                              background: count > 0 ? '#a855f7' : 'rgba(255,255,255,0.06)',
                              opacity: count > 0 ? 0.4 + (count / (stats.maxDay || 1)) * 0.6 : 1,
                            }}
                          />
                          <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)' }}>{stats.dayLabels[i]}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 최근 기록 */}
                  <div style={{
                    background: 'rgba(255,255,255,0.03)', borderRadius: '16px', padding: '16px',
                    border: '1px solid rgba(255,255,255,0.07)',
                  }}>
                    <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.12em', textTransform: 'uppercase', margin: '0 0 14px' }}>
                      최근 기록
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {stats.latest.map(r => (
                        <div key={r.id} style={{
                          display: 'flex', alignItems: 'center', gap: '12px',
                          padding: '10px 12px', borderRadius: '12px',
                          background: 'rgba(255,255,255,0.03)',
                          border: `1px solid ${r.weatherColor}22`,
                        }}>
                          <span style={{ fontSize: '20px' }}>{r.weatherEmoji}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ color: 'white', fontWeight: 600, fontSize: '13px', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {r.label}
                            </p>
                            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', margin: '2px 0 0' }}>{r.recordedAt}</p>
                          </div>
                          <span style={{ fontSize: '14px', fontWeight: 700, color: r.weatherColor }}>{r.temp}°C</span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}