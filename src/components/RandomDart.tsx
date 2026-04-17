// src/components/RandomDart.tsx
// AtmoGalaxy — 🎯 랜덤 여행 추첨 (다트 던지기)

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { nationalPoints, type NationalPoint } from '../data/mockData';

// ── 한국/일본 포인트만 필터 ──────────────────────────────────
const KR_POINTS = nationalPoints.filter(p => p.id < 100);
const JP_POINTS = nationalPoints.filter(p => p.id >= 100);

const DART_TUTORIAL_KEY = 'atmo_dart_tutorial_seen';

// ── 카테고리/분위기 태그 ────────────────────────────────────
const MOOD_TAGS: Record<string, string[]> = {
  서울:     ['도심', '야경', '카페', '쇼핑', '역사'],
  부산:     ['해변', '야경', '해산물', '트레킹', '감성'],
  제주:     ['자연', '드라이브', '힐링', '올레길', '사진'],
  강릉:     ['서핑', '해변', '카페거리', '힐링'],
  경주:     ['역사', '문화', '야경', '고즈넉'],
  전주:     ['한옥', '음식', '고즈넉', '막걸리'],
  여수:     ['야경', '케이블카', '해산물', '낭만'],
  춘천:     ['닭갈비', '호수', '드라이브', '힐링'],
  도쿄:     ['도심', '문화', '팝업', '쇼핑', '야경'],
  오사카:   ['먹방', '네온', '쇼핑', '야경', '활기'],
  교토:     ['전통', '단풍', '사찰', '고즈넉', '감성'],
  삿포로:   ['설경', '게', '라면', '자연', '시원함'],
  후쿠오카: ['라멘', '포장마차', '근거리', '해산물'],
  나가사키: ['역사', '야경', '이국적', '짬뽕'],
};

function getMoodTags(label: string): string[] {
  for (const key of Object.keys(MOOD_TAGS)) {
    if (label.includes(key)) return MOOD_TAGS[key];
  }
  return ['여행', '탐험', '힐링', '새로운 경험'];
}

// ── 거리 계산 (서울 기준) ────────────────────────────────────
function getDistance(lat: number, lng: number): string {
  const SEOUL = { lat: 37.5665, lng: 126.9780 };
  const R = 6371;
  const dLat = (lat - SEOUL.lat) * Math.PI / 180;
  const dLng = (lng - SEOUL.lng) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(SEOUL.lat*Math.PI/180)*Math.cos(lat*Math.PI/180)*Math.sin(dLng/2)**2;
  const d = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  if (d < 50)  return '서울 근교 🚇';
  if (d < 200) return '당일치기 가능 🚄';
  if (d < 400) return '1박 2일 추천 🚌';
  if (d < 800) return '2박 3일 추천 ✈️';
  return '해외여행 ✈️🌏';
}

// ── 튜토리얼 오버레이 ────────────────────────────────────────
export function DartTutorial({ onClose }: { onClose: () => void }) {
  const { isDark } = useTheme();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 8000,
        background: 'rgba(0,0,0,0.82)',
        backdropFilter: 'blur(6px)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '32px 24px',
        paddingBottom: 'calc(env(safe-area-inset-bottom) + 32px)',
      }}
    >
      {/* 배경 글로우 */}
      <div style={{
        position: 'absolute', top: '25%', left: '50%', transform: 'translateX(-50%)',
        width: 360, height: 360, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(251,146,60,0.12) 0%, transparent 65%)',
        pointerEvents: 'none', filter: 'blur(20px)',
      }} />

      <motion.div
        initial={{ scale: 0.85, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', damping: 24, stiffness: 260 }}
        style={{ maxWidth: 360, width: '100%', position: 'relative' }}
      >
        {/* 다트 아이콘 */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <div style={{
              position: 'absolute', inset: -20,
              background: 'radial-gradient(circle, rgba(251,146,60,0.25) 0%, transparent 70%)',
              borderRadius: '50%', filter: 'blur(10px)',
            }} />
            <motion.div
              animate={{ rotate: [0, -12, 12, -8, 8, 0], y: [0, -6, 0] }}
              transition={{ duration: 1.5, delay: 0.3, ease: 'easeInOut' }}
              style={{ fontSize: 64, lineHeight: 1, position: 'relative' }}
            >
              🎯
            </motion.div>
          </div>
        </div>

        {/* 제목 */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(251,146,60,0.15)', border: '1px solid rgba(251,146,60,0.35)', borderRadius: 20, padding: '4px 12px', marginBottom: 12 }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#fb923c', boxShadow: '0 0 6px #fb923c' }} />
            <span style={{ fontSize: 10, color: '#fb923c', fontWeight: 700, letterSpacing: '0.12em' }}>NEW FEATURE</span>
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 900, color: '#fff', margin: '0 0 8px', lineHeight: 1.3 }}>
            랜덤 여행 추첨기
          </h2>
          <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.5)', margin: 0, lineHeight: 1.7 }}>
            어디 갈지 못 정하겠다면?<br />지도에 다트를 던져보세요!
          </p>
        </div>

        {/* 기능 카드 */}
        <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: '20px', marginBottom: 20 }}>
          {[
            { icon: '🎲', title: '한국 / 일본 / 전체 선택', desc: '범위를 골라 다트를 던져요' },
            { icon: '📍', title: '지도 위로 핀이 날아가요', desc: '랜덤 장소에 다트가 꽂혀요' },
            { icon: '🌤️', title: '실시간 날씨 자동 확인', desc: '그 날의 날씨까지 보여줘요' },
            { icon: '✈️', title: '거리 & 여행 팁 제공', desc: '당일치기? 1박 2일? 바로 알 수 있어요' },
          ].map((item, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: i < 3 ? 14 : 0 }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                background: 'rgba(251,146,60,0.15)', border: '1px solid rgba(251,146,60,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17,
              }}>
                {item.icon}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 2 }}>{item.title}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>{item.desc}</div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* 시작 버튼 */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onClose}
          style={{
            width: '100%', padding: '15px',
            borderRadius: 16, border: 'none',
            background: 'linear-gradient(135deg, #f97316, #fb923c, #fbbf24)',
            color: '#fff', fontSize: 15, fontWeight: 800,
            cursor: 'pointer', letterSpacing: '0.02em',
            boxShadow: '0 8px 28px rgba(249,115,22,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          <span>🎯 다트 던지러 가기</span>
        </motion.button>

        <p style={{ textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.2)', margin: '12px 0 0' }}>
          이 도움말은 다시 보지 않아요
        </p>
      </motion.div>
    </motion.div>
  );
}

// ── 메인 다트 컴포넌트 ───────────────────────────────────────
interface Props {
  onFlyTo: (lng: number, lat: number, label: string) => void;
  onFirstClick?: () => boolean; // true 반환 시 패널 열지 않음
}

type Region = 'ALL' | 'KR' | 'JP';

export function RandomDartButton({ onFlyTo, onFirstClick }: Props) {
  const { isDark } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [region, setRegion] = useState<Region>('ALL');
  const [throwing, setThrowing] = useState(false);
  const [result, setResult] = useState<NationalPoint | null>(null);
  const [weather, setWeather] = useState<{ emoji: string; label: string; temp: number } | null>(null);
  const [loadingWeather, setLoadingWeather] = useState(false);

  const API_KEY = import.meta.env.VITE_OPENWEATHER_KEY ?? 'c9e9eb367233cb959d24ff54b9f83801';
  const [photo, setPhoto] = useState<string | null>(null);
  const [loadingPhoto, setLoadingPhoto] = useState(false);

  const getPool = (): NationalPoint[] => {
    if (region === 'KR') return KR_POINTS;
    if (region === 'JP') return JP_POINTS;
    return nationalPoints;
  };

  // ── 명소 기준 Wikipedia 제목 매핑 (도시 페이지 대신 대표 명소 직접 지정) ──
  const WIKI_TITLE: Record<string, { title: string; lang: string }> = {
    // 🇰🇷 한국
    '서울':        { title: '경복궁',         lang: 'ko' },
    '인천':        { title: '인천국제공항',    lang: 'ko' },
    '수원':        { title: '수원화성',        lang: 'ko' },
    '고양':        { title: '일산호수공원',    lang: 'ko' },
    '성남':        { title: '판교테크노밸리',  lang: 'ko' },
    '의정부':      { title: '의정부시',        lang: 'ko' },
    '이천 센터':   { title: '이천도자기',      lang: 'ko' },
    '춘천':        { title: '남이섬',          lang: 'ko' },
    '강릉':        { title: '경포해변',        lang: 'ko' },
    '원주':        { title: '치악산',          lang: 'ko' },
    '속초':        { title: '설악산',          lang: 'ko' },
    '양양 관측소': { title: '낙산사',          lang: 'ko' },
    '삼척 지소':   { title: '환선굴',          lang: 'ko' },
    '대전':        { title: '성심당',          lang: 'ko' },
    '세종':        { title: '세종특별자치시',  lang: 'ko' },
    '청주':        { title: '청주시',          lang: 'ko' },
    '천안':        { title: '독립기념관',      lang: 'ko' },
    '부산':        { title: '광안대교',        lang: 'ko' },
    '대구':        { title: '팔공산',          lang: 'ko' },
    '울산':        { title: '울산대교',        lang: 'ko' },
    '창원':        { title: '창원시',          lang: 'ko' },
    '포항 관측소': { title: '포항운하',        lang: 'ko' },
    '경주 센터':   { title: '불국사',          lang: 'ko' },
    '안동 기록원': { title: '하회마을',        lang: 'ko' },
    '광주':        { title: '국립아시아문화전당', lang: 'ko' },
    '전주':        { title: '전주 한옥마을',   lang: 'ko' },
    '목포':        { title: '목포항',          lang: 'ko' },
    '여수':        { title: '여수 돌산대교',   lang: 'ko' },
    '제주':        { title: '한라산',          lang: 'ko' },
    // 🇯🇵 일본
    '삿포로':        { title: '札幌時計台',      lang: 'ja' },
    '하코다테':      { title: '函館山',          lang: 'ja' },
    '센다이':        { title: '仙台城',          lang: 'ja' },
    '모리오카 센터': { title: '盛岡城',          lang: 'ja' },
    '도쿄 본부':     { title: '浅草寺',          lang: 'ja' },
    '요코하마':      { title: '横浜中華街',       lang: 'ja' },
    '치바 관측소':   { title: '幕張メッセ',       lang: 'ja' },
    '마에바시 센터': { title: '赤城山',           lang: 'ja' },
    '우츠노미야 지소': { title: '日光東照宮',     lang: 'ja' },
    '나고야 센터':   { title: '名古屋城',         lang: 'ja' },
    '니이가타 관측소': { title: '新潟県',         lang: 'ja' },
    '나가노 아카이브': { title: '善光寺',         lang: 'ja' },
    '가나자와 지소': { title: '兼六園',           lang: 'ja' },
    '오사카 본부':   { title: '道頓堀',           lang: 'ja' },
    '교토 센터':     { title: '嵐山',             lang: 'ja' },
    '고베 관측소':   { title: '神戸港',           lang: 'ja' },
    '와카야마 지소': { title: '高野山',           lang: 'ja' },
    '후쿠오카 본부': { title: '太宰府天満宮',     lang: 'ja' },
    '나가사키 센터': { title: '長崎平和公園',     lang: 'ja' },
    '히로시마 관측소': { title: '原爆ドーム',     lang: 'ja' },
    '마츠야마 지소': { title: '道後温泉',         lang: 'ja' },
    '구마모토 기록원': { title: '熊本城',         lang: 'ja' },
    '가고시마 센터': { title: '桜島',             lang: 'ja' },
    '오이타 관측소': { title: '別府温泉',         lang: 'ja' },
    '다카마쓰 지소': { title: '栗林公園',         lang: 'ja' },
  };

  // 지도 이미지 판별 (URL에 map/locator/location 등 포함 시 제외)
  const isMapImage = (url: string): boolean => {
    const lower = url.toLowerCase();
    return (
      lower.includes('locator') || lower.includes('location') ||
      lower.includes('_map') || lower.includes('map_') ||
      lower.includes('relief') || lower.includes('topograph') ||
      lower.includes('flag_of') || lower.includes('coat_of') ||
      lower.includes('blankmap') || lower.includes('orthographic') ||
      lower.includes('administrative') || lower.endsWith('.svg')
    );
  };

  // ── Wikipedia REST API로 명소 사진 가져오기 ──────────────
  const fetchLocationPhoto = async (point: NationalPoint): Promise<string | null> => {
    const mapping = WIKI_TITLE[point.label];
    const lang = mapping?.lang ?? (point.id >= 100 ? 'ja' : 'ko');
    const title = mapping?.title ?? point.label;

    const tryFetch = async (t: string, l: string): Promise<string | null> => {
      try {
        const res = await fetch(
          `https://${l}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(t)}`,
          { headers: { Accept: 'application/json' } }
        );
        if (!res.ok) return null;
        const data = await res.json();
        const url = data.originalimage?.source || data.thumbnail?.source || null;
        if (url && !isMapImage(url)) return url;
        return null;
      } catch { return null; }
    };

    // 1차: 명소 직접 검색
    let photo = await tryFetch(title, lang);
    if (photo) return photo;

    // 2차: 영어 위키로 fallback
    const enLabel = point.label.replace(/ (본부|센터|지소|기록원|관측소)$/, '');
    photo = await tryFetch(enLabel, 'en');
    if (photo) return photo;

    // 3차: 도시명으로 재시도
    const cityOnly = point.label.replace(/ (본부|센터|지소|기록원|관측소)$/, '');
    photo = await tryFetch(cityOnly, lang);
    return photo;
  };

  // 날씨 이모지 변환
  const iconToEmoji = (icon: string) => {
    const c = icon.slice(0, 2);
    const map: Record<string, { emoji: string; label: string }> = {
      '01': { emoji: '☀️', label: '맑음' }, '02': { emoji: '⛅', label: '구름 조금' },
      '03': { emoji: '☁️', label: '흐림' }, '04': { emoji: '☁️', label: '흐림' },
      '09': { emoji: '🌧️', label: '비' },  '10': { emoji: '🌧️', label: '비' },
      '11': { emoji: '⛈️', label: '뇌우' }, '13': { emoji: '❄️', label: '눈' },
      '50': { emoji: '🌫️', label: '안개' },
    };
    return map[c] ?? { emoji: '🌡️', label: '알 수 없음' };
  };

  const throwDart = async () => {
    const pool = getPool();
    if (!pool.length) return;

    setThrowing(true);
    setResult(null);
    setWeather(null);
    setPhoto(null);

    await new Promise(r => setTimeout(r, 1600));

    const picked = pool[Math.floor(Math.random() * pool.length)];
    setResult(picked);
    setThrowing(false);

    // 지도 이동
    onFlyTo(picked.lng, picked.lat, picked.label);

    // 날씨 + 사진 병렬 로딩
    setLoadingWeather(true);
    setLoadingPhoto(true);

    const [weatherRes] = await Promise.allSettled([
      fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${picked.lat}&lon=${picked.lng}&appid=${API_KEY}&units=metric`),
    ]);
    if (weatherRes.status === 'fulfilled' && weatherRes.value.ok) {
      const data = await weatherRes.value.json();
      const w = iconToEmoji(data.weather[0].icon);
      setWeather({ ...w, temp: Math.round(data.main.temp) });
    }
    setLoadingWeather(false);

    // 사진 fetch
    const photoUrl = await fetchLocationPhoto(picked);
    setPhoto(photoUrl);
    setLoadingPhoto(false);
  };

  const bg = isDark ? 'rgba(6,13,31,0.97)' : 'rgba(248,250,255,0.97)';
  const card = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';
  const text = isDark ? '#e8f0ff' : '#1a2340';
  const sub = isDark ? '#7a9bc4' : '#5a7a9c';
  const border = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';

  return (
    <>
      {/* 플로팅 버튼 */}
      <motion.button
        whileTap={{ scale: 0.91 }}
        whileHover={{ scale: 1.05 }}
        onClick={() => {
          if (onFirstClick && onFirstClick()) return; // 튜토리얼 표시 중
          setIsOpen(true); setResult(null); setWeather(null); setPhoto(null);
        }}
        style={{
          position: 'fixed',
          right: 16,
          bottom: 'calc(env(safe-area-inset-bottom) + 136px)',
          zIndex: 900,
          background: 'linear-gradient(135deg, #ea580c, #f97316, #fb923c)',
          border: 'none', borderRadius: 18,
          padding: '10px 15px',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 7,
          boxShadow: '0 6px 24px rgba(249,115,22,0.5), 0 0 0 1px rgba(255,255,255,0.1)',
        }}
      >
        <motion.span
          animate={{ rotate: [0, -15, 15, -8, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1.5 }}
          style={{ fontSize: 17, lineHeight: 1 }}
        >
          🎯
        </motion.span>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', letterSpacing: '0.2px' }}>
          랜덤 추첨
        </span>
      </motion.button>

      {/* 메인 패널 */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              style={{ position: 'fixed', inset: 0, zIndex: 1100, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
            />

            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 280 }}
              style={{
                position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1200,
                background: bg, borderRadius: '28px 28px 0 0',
                padding: '0 0 calc(env(safe-area-inset-bottom) + 20px)',
                border: `1px solid ${border}`, borderBottom: 'none',
                boxShadow: '0 -20px 60px rgba(0,0,0,0.4)',
                overflow: 'hidden',
                maxHeight: '90vh',
                display: 'flex', flexDirection: 'column',
              }}
            >
              {/* 헤더 그라디언트 */}
              <div style={{
                background: 'linear-gradient(135deg, #431407 0%, #7c2d12 35%, #c2410c 70%, #f97316 100%)',
                padding: '20px 20px 18px', position: 'relative', overflow: 'hidden',
              }}>
                {/* 배경 원형 패턴 */}
                {[100, 70, 40].map((size, i) => (
                  <div key={i} style={{
                    position: 'absolute', right: -20, top: '50%', transform: 'translateY(-50%)',
                    width: size, height: size, borderRadius: '50%',
                    border: `1px solid rgba(255,255,255,${0.06 + i * 0.04})`,
                    pointerEvents: 'none',
                  }} />
                ))}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                      <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#fbbf24', boxShadow: '0 0 6px #fbbf24' }} />
                      <span style={{ fontSize: 10, color: 'rgba(251,191,36,0.9)', letterSpacing: '2px', fontWeight: 700, textTransform: 'uppercase' }}>RANDOM TRAVEL</span>
                    </div>
                    <div style={{ fontSize: 21, fontWeight: 900, color: '#fff' }}>🎯 랜덤 여행 추첨기</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 3 }}>지도에 다트를 던져 여행지를 골라보세요!</div>
                  </div>
                  <button onClick={() => setIsOpen(false)} style={{
                    background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: 10,
                    width: 34, height: 34, color: '#fff', fontSize: 14, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>✕</button>
                </div>
              </div>

              <div style={{ padding: '20px', overflowY: 'auto', WebkitOverflowScrolling: 'touch' as any, flex: 1 }}>
                {/* 지역 선택 */}
                <div style={{ marginBottom: 18 }}>
                  <div style={{ fontSize: 11, color: sub, fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 10 }}>
                    어디로 던질까요?
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {([
                      { key: 'ALL', label: '전체 🌏', sub: `${nationalPoints.length}개 도시` },
                      { key: 'KR',  label: '🇰🇷 한국', sub: `${KR_POINTS.length}개 도시` },
                      { key: 'JP',  label: '🇯🇵 일본', sub: `${JP_POINTS.length}개 도시` },
                    ] as const).map(r => (
                      <button key={r.key} onClick={() => setRegion(r.key)}
                        style={{
                          flex: 1, padding: '10px 8px', borderRadius: 14, cursor: 'pointer',
                          border: `1.5px solid ${region === r.key ? '#f97316' : border}`,
                          background: region === r.key ? 'rgba(249,115,22,0.12)' : card,
                          color: region === r.key ? '#f97316' : sub,
                          transition: 'all 0.2s',
                        }}>
                        <div style={{ fontSize: 13, fontWeight: 700 }}>{r.label}</div>
                        <div style={{ fontSize: 10, opacity: 0.7, marginTop: 2 }}>{r.sub}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 다트 던지기 버튼 */}
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={throwDart}
                  disabled={throwing}
                  style={{
                    width: '100%', padding: '16px',
                    borderRadius: 18, border: 'none',
                    background: throwing
                      ? 'rgba(255,255,255,0.08)'
                      : 'linear-gradient(135deg, #ea580c, #f97316, #fbbf24)',
                    color: throwing ? sub : '#fff',
                    fontSize: 16, fontWeight: 800, cursor: throwing ? 'default' : 'pointer',
                    boxShadow: throwing ? 'none' : '0 8px 28px rgba(249,115,22,0.45)',
                    transition: 'all 0.3s', marginBottom: 16,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  }}
                >
                  {throwing ? (
                    <>
                      <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.5, repeat: Infinity, ease: 'linear' }}
                        style={{ display: 'inline-block', fontSize: 20 }}>🎯</motion.span>
                      <span>다트 날아가는 중...</span>
                    </>
                  ) : (
                    <>
                      <span style={{ fontSize: 20 }}>🎯</span>
                      <span>{result ? '다시 던지기!' : '다트 던지기!'}</span>
                    </>
                  )}
                </motion.button>

                {/* 결과 카드 */}
                <AnimatePresence mode="wait">
                  {throwing && (
                    <motion.div key="throwing"
                      initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                      style={{ textAlign: 'center', padding: '28px 0' }}
                    >
                      {/* 다트 궤적 애니메이션 */}
                      <div style={{ position: 'relative', height: 80, marginBottom: 12 }}>
                        <motion.div
                          initial={{ x: -80, y: 20, rotate: -30, opacity: 0 }}
                          animate={{ x: 0, y: 0, rotate: 0, opacity: [0, 1, 1, 0.6] }}
                          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
                          style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', fontSize: 48 }}
                        >
                          🎯
                        </motion.div>
                        {/* 궤적 점들 */}
                        {[1,2,3,4].map(i => (
                          <motion.div key={i}
                            initial={{ opacity: 0 }} animate={{ opacity: [0, 0.6, 0] }}
                            transition={{ duration: 0.8, delay: i * 0.15 }}
                            style={{
                              position: 'absolute', top: `${45 + i * 5}%`, left: `${25 + i * 8}%`,
                              width: 4, height: 4, borderRadius: '50%', background: '#f97316',
                            }}
                          />
                        ))}
                      </div>
                      <motion.p animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1, repeat: Infinity }}
                        style={{ color: sub, fontSize: 13, margin: 0 }}>
                        지도 위로 다트가 날아가고 있어요...
                      </motion.p>
                    </motion.div>
                  )}

                  {result && !throwing && (
                    <motion.div key="result"
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ type: 'spring', damping: 22, stiffness: 280 }}
                    >
                      {/* 성공 배너 */}
                      <div style={{ textAlign: 'center', marginBottom: 14 }}>
                        <motion.div
                          animate={{ scale: [1, 1.15, 1], rotate: [0, 10, -10, 0] }}
                          transition={{ duration: 0.6 }}
                          style={{ fontSize: 42, display: 'inline-block', marginBottom: 6 }}
                        >
                          🎯
                        </motion.div>
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.15 }}
                          style={{ fontSize: 12, color: '#fb923c', fontWeight: 700, letterSpacing: '0.1em' }}
                        >
                          다트가 꽂혔어요!
                        </motion.div>
                      </div>

                      {/* 결과 카드 */}
                      <div style={{
                        background: 'linear-gradient(135deg, rgba(249,115,22,0.12), rgba(251,191,36,0.08))',
                        border: '1.5px solid rgba(249,115,22,0.35)',
                        borderRadius: 20, marginBottom: 12,
                        position: 'relative', overflow: 'hidden',
                      }}>
                        {/* ── 히어로 사진 영역 ── */}
                        <div style={{
                          width: '100%', height: 180, position: 'relative',
                          background: 'linear-gradient(135deg, #1c0a00, #3d1a00)',
                          overflow: 'hidden',
                        }}>
                          {loadingPhoto && (
                            <div style={{
                              position: 'absolute', inset: 0,
                              display: 'flex', flexDirection: 'column',
                              alignItems: 'center', justifyContent: 'center', gap: 8,
                            }}>
                              <motion.div
                                animate={{ opacity: [0.3, 1, 0.3] }}
                                transition={{ duration: 1.2, repeat: Infinity }}
                                style={{ fontSize: 32 }}
                              >🖼️</motion.div>
                              <motion.div
                                animate={{ opacity: [0.4, 1, 0.4] }}
                                transition={{ duration: 1.2, repeat: Infinity }}
                                style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}
                              >사진 불러오는 중...</motion.div>
                            </div>
                          )}
                          {photo && (
                            <motion.img
                              src={photo}
                              alt={result.label}
                              initial={{ opacity: 0, scale: 1.05 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ duration: 0.5 }}
                              style={{
                                width: '100%', height: '100%',
                                objectFit: 'cover',
                                display: 'block',
                              }}
                              onError={() => setPhoto(null)}
                            />
                          )}
                          {!loadingPhoto && !photo && (
                            <div style={{
                              position: 'absolute', inset: 0,
                              display: 'flex', flexDirection: 'column',
                              alignItems: 'center', justifyContent: 'center', gap: 6,
                            }}>
                              <div style={{ fontSize: 36 }}>{result.id < 100 ? '🇰🇷' : '🇯🇵'}</div>
                              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>사진 없음</div>
                            </div>
                          )}
                          {/* 사진 위 그라디언트 오버레이 */}
                          <div style={{
                            position: 'absolute', inset: 0,
                            background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.6) 100%)',
                            pointerEvents: 'none',
                          }} />
                          {/* 사진 위 장소명 오버레이 */}
                          <div style={{
                            position: 'absolute', bottom: 12, left: 14, right: 14,
                            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
                          }}>
                            <div>
                              <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: '-0.5px', textShadow: '0 2px 8px rgba(0,0,0,0.6)' }}>
                                {result.label}
                              </div>
                              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 1 }}>
                                {getDistance(result.lat, result.lng)}
                              </div>
                            </div>
                            <div style={{
                              background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)',
                              borderRadius: 8, padding: '3px 8px',
                              fontSize: 13, fontWeight: 700,
                            }}>
                              {result.id < 100 ? '🇰🇷' : '🇯🇵'}
                            </div>
                          </div>
                          {/* Wikipedia 출처 표시 */}
                          {photo && (
                            <div style={{
                              position: 'absolute', top: 8, right: 8,
                              background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(6px)',
                              borderRadius: 6, padding: '2px 6px',
                              fontSize: 9, color: 'rgba(255,255,255,0.5)',
                            }}>
                              Wikipedia
                            </div>
                          )}
                        </div>

                        {/* 카드 하단 내용 */}
                        <div style={{ padding: '14px' }}>
                          {/* 날씨 */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, padding: '10px', background: 'rgba(255,255,255,0.06)', borderRadius: 12 }}>
                            {loadingWeather ? (
                              <motion.div animate={{ opacity: [0.4,1,0.4] }} transition={{ duration: 1, repeat: Infinity }}
                                style={{ fontSize: 12, color: sub }}>날씨 확인 중...</motion.div>
                            ) : weather ? (
                              <>
                                <span style={{ fontSize: 24 }}>{weather.emoji}</span>
                                <div>
                                  <div style={{ fontSize: 14, fontWeight: 700, color: text }}>
                                    {weather.temp}°C · {weather.label}
                                  </div>
                                  <div style={{ fontSize: 11, color: sub }}>현재 날씨</div>
                                </div>
                              </>
                            ) : (
                              <div style={{ fontSize: 12, color: sub }}>날씨 정보 없음</div>
                            )}
                          </div>

                          {/* 무드 태그 */}
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                            {getMoodTags(result.label).map(tag => (
                              <span key={tag} style={{
                                fontSize: 11, padding: '3px 9px', borderRadius: 20, fontWeight: 600,
                                background: 'rgba(249,115,22,0.12)', color: '#fb923c',
                                border: '1px solid rgba(249,115,22,0.25)',
                              }}>
                                # {tag}
                              </span>
                            ))}
                          </div>

                          {/* 메모 */}
                          <div style={{
                            fontSize: 12, color: sub, lineHeight: 1.65,
                            fontStyle: 'italic', opacity: 0.85,
                          }}>
                            "{result.memo}"
                          </div>
                        </div>
                      </div>

                      {/* 지도 보기 버튼 */}
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setIsOpen(false)}
                        style={{
                          width: '100%', padding: '14px', borderRadius: 14, border: 'none',
                          background: 'linear-gradient(135deg, #ea580c, #f97316)',
                          color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                          boxShadow: '0 4px 16px rgba(249,115,22,0.4)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        }}
                      >
                        <span>🗺️</span>
                        <span>{result.label} 지도에서 보기</span>
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}