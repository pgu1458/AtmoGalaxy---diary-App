// src/components/RecordModal.tsx
// 지도 클릭 시 나타나는 핀 저장 팝업 — 화면 중앙 고정

import React, { useState, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { saveRecord, type AtmoRecord } from '../store/recordStore';

const API_KEY = import.meta.env.VITE_OPENWEATHER_KEY ?? 'c9e9eb367233cb959d24ff54b9f83801';

interface PendingPin {
  lat: number;
  lng: number;
  x: number;
  y: number;
}

interface Props {
  pending: PendingPin | null;
  onClose: () => void;
}

function getWeatherStyle(icon: string) {
  const c = icon.slice(0, 2);
  switch (c) {
    case '01': return { color: '#FFD700', emoji: '☀️', label: '맑음' };
    case '02': return { color: '#00CFFF', emoji: '⛅', label: '구름 조금' };
    case '03': case '04': return { color: '#8899AA', emoji: '☁️', label: '흐림' };
    case '09': case '10': return { color: '#1D6FFF', emoji: '🌧️', label: '비' };
    case '11': return { color: '#CC00FF', emoji: '⛈️', label: '뇌우' };
    case '13': return { color: '#AAEEFF', emoji: '❄️', label: '눈' };
    case '50': return { color: '#99AAAA', emoji: '🌫️', label: '안개' };
    default:   return { color: '#AAAAAA', emoji: '🌡️', label: '알 수 없음' };
  }
}

export default function RecordModal({ pending, onClose }: Props) {
  const [memo, setMemo] = useState('');
  const [label, setLabel] = useState('');
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState<'input' | 'saving' | 'done'>('input');
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX = 800;
        const ratio = Math.min(MAX / img.width, MAX / img.height, 1);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
        setPhotoBase64(canvas.toDataURL('image/jpeg', 0.75));
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!pending) return;
    setSaving(true);
    setStep('saving');

    try {
      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${pending.lat}&lon=${pending.lng}&appid=${API_KEY}&units=metric`
      );
      const data = await res.json();
      const ws = getWeatherStyle(data.weather[0].icon);

      const MAPBOX_TOKEN = 'pk.eyJ1IjoicGd1MTQ1OCIsImEiOiJjbW50NzV5YTMwbGYzMnFxMHQ1eW9wZHZ3In0.IWo4C3aKCvn_bmrWVsOm2Q';
      let placeName = label || `${pending.lat.toFixed(3)}°N`;
      try {
        const geoRes = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${pending.lng},${pending.lat}.json?access_token=${MAPBOX_TOKEN}&language=ko&types=place,locality,neighborhood`
        );
        const geoData = await geoRes.json();
        if (geoData.features?.length > 0) {
          placeName = geoData.features[0].place_name.split(',')[0];
        }
      } catch {}

      const record: AtmoRecord = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        lat: pending.lat,
        lng: pending.lng,
        label: label || placeName,
        memo,
        temp: Math.round(data.main.temp),
        weather: data.weather[0].description,
        weatherEmoji: ws.emoji,
        weatherColor: ws.color,
        humidity: data.main.humidity,
        windSpeed: Math.round(data.wind.speed * 10) / 10,
        recordedAt: new Date().toLocaleString('ko-KR'),
        photoBase64: photoBase64 ?? undefined,
      };

      saveRecord(record);
      setStep('done');

      setTimeout(() => {
        onClose();
        setMemo('');
        setLabel('');
        setPhotoBase64(null);
        setStep('input');
      }, 1200);

    } catch (err) {
      console.error('저장 실패:', err);
      setSaving(false);
      setStep('input');
    }
  };

  if (!pending) return null;

  return (
    <AnimatePresence>
      {pending && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{
            position: 'fixed', inset: 0, zIndex: 9997,
            background: 'rgba(0,0,0,0.55)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          {/* 모달 카드 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            transition={{ type: 'spring', damping: 24, stiffness: 260 }}
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '340px',
              maxHeight: '85vh',
              overflowY: 'auto',
              background: 'rgba(13,17,30,0.97)',
              backdropFilter: 'blur(20px)',
              borderRadius: '20px',
              border: '1px solid rgba(255,255,255,0.12)',
              boxShadow: '0 24px 64px rgba(0,0,0,0.7)',
            }}
          >
            {/* 상단 포인트 라인 */}
            <div style={{ height: '3px', background: 'linear-gradient(90deg, #a855f7, #3b82f6)', flexShrink: 0 }} />

            {step === 'done' ? (
              <div style={{ padding: '36px', textAlign: 'center' }}>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', damping: 14 }}
                  style={{ fontSize: '48px', marginBottom: '12px' }}
                >✅</motion.div>
                <p style={{ color: 'white', fontWeight: 700, fontSize: '16px', margin: 0 }}>기록 저장 완료!</p>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', marginTop: '6px' }}>
                  이 지점의 대기 기록이 저장되었습니다
                </p>
              </div>
            ) : step === 'saving' ? (
              <div style={{ padding: '36px', textAlign: 'center' }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%',
                  border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#a855f7',
                  animation: 'spin 0.7s linear infinite', margin: '0 auto 14px',
                }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', margin: 0 }}>날씨 측정 및 저장 중...</p>
              </div>
            ) : (
              <div style={{ padding: '20px', overflowY: 'auto' }}>
                {/* 헤더 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div>
                    <p style={{ color: 'white', fontWeight: 700, fontSize: '15px', margin: 0 }}>📍 새 기록 추가</p>
                    <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px', fontFamily: 'monospace', margin: '3px 0 0' }}>
                      {pending.lat.toFixed(4)}°N {pending.lng.toFixed(4)}°E
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    style={{
                      width: '30px', height: '30px', borderRadius: '50%',
                      background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)',
                      color: 'rgba(255,255,255,0.5)', fontSize: '13px', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >✕</button>
                </div>

                {/* 장소명 */}
                <div style={{ marginBottom: '10px' }}>
                  <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '5px', letterSpacing: '0.08em' }}>
                    장소명 (비우면 자동 입력)
                  </label>
                  <input
                    type="text"
                    value={label}
                    onChange={e => setLabel(e.target.value)}
                    placeholder="예: 집 앞 골목, 단골 카페..."
                    style={{
                      width: '100%', padding: '9px 12px', borderRadius: '10px',
                      background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                      color: 'white', fontSize: '16px', outline: 'none', boxSizing: 'border-box',
                    }}
                  />
                </div>

                {/* 사진 첨부 */}
                <div style={{ marginBottom: '10px' }}>
                  <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '5px', letterSpacing: '0.08em' }}>
                    사진 첨부 (선택)
                  </label>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: 'none' }} />
                  {photoBase64 ? (
                    <div style={{ position: 'relative', borderRadius: '10px', overflow: 'hidden' }}>
                      <img src={photoBase64} alt="첨부 사진"
                        style={{ width: '100%', height: '130px', objectFit: 'cover', display: 'block' }} />
                      <button onClick={() => setPhotoBase64(null)}
                        style={{
                          position: 'absolute', top: '6px', right: '6px',
                          width: '24px', height: '24px', borderRadius: '50%',
                          background: 'rgba(0,0,0,0.6)', border: 'none',
                          color: 'white', fontSize: '12px', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >✕</button>
                    </div>
                  ) : (
                    <button onClick={() => fileInputRef.current?.click()}
                      style={{
                        width: '100%', padding: '10px', borderRadius: '10px',
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px dashed rgba(255,255,255,0.15)',
                        color: 'rgba(255,255,255,0.45)', fontSize: '13px',
                        cursor: 'pointer', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', gap: '8px',
                      }}
                    >
                      <span style={{ fontSize: '16px' }}>📷</span>
                      <span>사진 추가</span>
                    </button>
                  )}
                </div>

                {/* 메모 */}
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '5px', letterSpacing: '0.08em' }}>
                    지금 이 순간의 감성
                  </label>
                  <textarea
                    value={memo}
                    onChange={e => setMemo(e.target.value)}
                    placeholder="지금 들리는 소리, 느껴지는 공기, 주변 분위기를 기록해보세요..."
                    rows={3}
                    style={{
                      width: '100%', padding: '9px 12px', borderRadius: '10px',
                      background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                      color: 'white', fontSize: '16px', outline: 'none', resize: 'none',
                      boxSizing: 'border-box', lineHeight: 1.6, fontFamily: 'inherit',
                    }}
                  />
                </div>

                {/* 안내 */}
                <div style={{
                  background: 'rgba(168,85,247,0.08)', borderRadius: '8px', padding: '8px 12px',
                  border: '1px solid rgba(168,85,247,0.2)', marginBottom: '14px',
                  display: 'flex', alignItems: 'center', gap: '8px',
                }}>
                  <span style={{ fontSize: '14px' }}>🌤</span>
                  <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', margin: 0, lineHeight: 1.5 }}>
                    저장 시 현재 날씨가 자동으로 기록됩니다
                  </p>
                </div>

                {/* 저장 버튼 */}
                <button
                  onClick={handleSave}
                  style={{
                    width: '100%', padding: '12px', borderRadius: '12px',
                    background: 'linear-gradient(135deg, #a855f7, #3b82f6)',
                    border: 'none', color: 'white', fontSize: '14px',
                    fontWeight: 700, cursor: 'pointer', letterSpacing: '0.02em',
                    boxShadow: '0 4px 16px rgba(168,85,247,0.4)',
                  }}
                >
                  이 순간 기록하기
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}