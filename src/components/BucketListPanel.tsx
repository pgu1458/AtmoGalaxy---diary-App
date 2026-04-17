// src/components/BucketListPanel.tsx
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { bucketListStore, type BucketItem } from '../store/bucketListStore';

type AgeGroup = '10대' | '20대' | '30대' | '40대' | '50대+';
type Tab = 'discover' | 'mylist';
type Rec = Omit<BucketItem, 'id' | 'completed' | 'addedAt'>;

interface Props { isOpen: boolean; onClose: () => void; }

const MAPBOX_TOKEN = 'pk.eyJ1IjoicGd1MTQ1OCIsImEiOiJjbW50NzV5YTMwbGYzMnFxMHQ1eW9wZHZ3In0.IWo4C3aKCvn_bmrWVsOm2Q';
const GEMINI_KEY = import.meta.env.VITE_GEMINI_KEY as string;
// gemini-1.5-flash: 무료 한도 더 넉넉 (분당 15회, 일 1500회)
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`;

// ── 큐레이션 폴백 DB (API 할당량 초과 시 사용) ──────────────
const FALLBACK_DB: Record<string, Rec[]> = {
  '10대': [
    { name: '제주도 한달살기', description: '고등학교 졸업 후 제주에서 한 달', category: '여행', lat: 33.4890, lng: 126.4983, country: 'KR', emoji: '🌊', ageGroup: '10대' },
    { name: '운전면허 취득', description: '자유로운 이동의 시작', category: '자격증', lat: 37.5665, lng: 126.9780, country: 'KR', emoji: '🚗', ageGroup: '10대' },
    { name: '일본 도쿄 배낭여행', description: '처음 혼자 떠나는 해외여행', category: '여행', lat: 35.6895, lng: 139.6917, country: 'JP', emoji: '✈️', ageGroup: '10대' },
    { name: '교내 동아리 창설', description: '내가 원하는 활동으로 동아리 만들기', category: '도전', lat: 37.5665, lng: 126.9780, country: 'KR', emoji: '🎯', ageGroup: '10대' },
    { name: '한국사능력검정시험', description: '한국사 1급 취득', category: '자격증', lat: 37.5665, lng: 126.9780, country: 'KR', emoji: '📜', ageGroup: '10대' },
    { name: '교환학생 지원', description: '해외 학교에서 한 학기 경험', category: '학습', lat: 37.5665, lng: 126.9780, country: 'KR', emoji: '🎒', ageGroup: '10대' },
    { name: '봉사활동 100시간', description: '지역사회 봉사로 성장', category: '경험', lat: 37.5665, lng: 126.9780, country: 'KR', emoji: '🤝', ageGroup: '10대' },
    { name: '오사카 먹방 여행', description: '타코야키·라멘 맛집 투어', category: '음식', lat: 34.6937, lng: 135.5022, country: 'JP', emoji: '🍜', ageGroup: '10대' },
    { name: '마라톤 10km 완주', description: '체력의 한계를 도전', category: '건강', lat: 37.5665, lng: 126.9780, country: 'KR', emoji: '🏃', ageGroup: '10대' },
    { name: '첫 아르바이트', description: '내 손으로 번 첫 월급', category: '경험', lat: 37.5665, lng: 126.9780, country: 'KR', emoji: '💰', ageGroup: '10대' },
    { name: '경주 역사 탐방', description: '불국사·첨성대 천년 역사 체험', category: '문화', lat: 35.8561, lng: 129.2247, country: 'KR', emoji: '🏛️', ageGroup: '10대' },
    { name: '교토 사찰 투어', description: '아라시야마·금각사 문화 체험', category: '문화', lat: 35.0116, lng: 135.7681, country: 'JP', emoji: '⛩️', ageGroup: '10대' },
  ],
  '20대': [
    { name: '토익 900점 달성', description: '취업 경쟁력을 위한 영어 실력', category: '자격증', lat: 37.5665, lng: 126.9780, country: 'KR', emoji: '📝', ageGroup: '20대' },
    { name: '정보처리기사 취득', description: 'IT 직군 필수 자격증', category: '자격증', lat: 37.5665, lng: 126.9780, country: 'KR', emoji: '💻', ageGroup: '20대' },
    { name: '도쿄 한 달 살기', description: '일본 문화를 깊이 체험', category: '여행', lat: 35.6895, lng: 139.6917, country: 'JP', emoji: '🗼', ageGroup: '20대' },
    { name: '첫 직장 인턴십', description: '원하는 분야 인턴 경험', category: '경험', lat: 37.5665, lng: 126.9780, country: 'KR', emoji: '💼', ageGroup: '20대' },
    { name: '적금 1000만원 달성', description: '재테크의 첫 걸음', category: '재정', lat: 37.5665, lng: 126.9780, country: 'KR', emoji: '💰', ageGroup: '20대' },
    { name: '제주 올레길 완주', description: '제주 해안선 따라 걷기', category: '자연', lat: 33.4890, lng: 126.4983, country: 'KR', emoji: '🌿', ageGroup: '20대' },
    { name: '워킹홀리데이', description: '호주·캐나다 등 해외 생활', category: '경험', lat: 37.5665, lng: 126.9780, country: 'KR', emoji: '🌏', ageGroup: '20대' },
    { name: '오사카 미식 탐방', description: '도톤보리·구로몬시장 먹방', category: '음식', lat: 34.6937, lng: 135.5022, country: 'JP', emoji: '🍣', ageGroup: '20대' },
    { name: '헬스 6개월 꾸준히', description: '체형 관리 습관 만들기', category: '건강', lat: 37.5665, lng: 126.9780, country: 'KR', emoji: '💪', ageGroup: '20대' },
    { name: '부산 여행', description: '광안대교 야경·해운대 힐링', category: '여행', lat: 35.1796, lng: 129.0756, country: 'KR', emoji: '🌅', ageGroup: '20대' },
    { name: '삿포로 설경 여행', description: '홋카이도 겨울 여행', category: '여행', lat: 43.0621, lng: 141.3544, country: 'JP', emoji: '❄️', ageGroup: '20대' },
    { name: '포트폴리오 완성', description: '취업·이직을 위한 포폴 구축', category: '학습', lat: 37.5665, lng: 126.9780, country: 'KR', emoji: '📂', ageGroup: '20대' },
  ],
  '30대': [
    { name: '내 집 마련', description: '첫 부동산 구매 목표', category: '재정', lat: 37.5665, lng: 126.9780, country: 'KR', emoji: '🏠', ageGroup: '30대' },
    { name: '한라산 등반', description: '백록담까지 완주', category: '자연', lat: 33.3617, lng: 126.5292, country: 'KR', emoji: '🏔️', ageGroup: '30대' },
    { name: '교토 료칸 스테이', description: '일본 전통 온천 여관 경험', category: '여행', lat: 35.0116, lng: 135.7681, country: 'JP', emoji: '♨️', ageGroup: '30대' },
    { name: '마라톤 풀코스 완주', description: '42.195km 완주', category: '건강', lat: 37.5665, lng: 126.9780, country: 'KR', emoji: '🏅', ageGroup: '30대' },
    { name: '투자 포트폴리오 구성', description: '주식·ETF·채권 분산투자', category: '재정', lat: 37.5665, lng: 126.9780, country: 'KR', emoji: '📈', ageGroup: '30대' },
    { name: '전주 한옥마을 여행', description: '비빔밥·한옥 숙박 체험', category: '문화', lat: 35.8242, lng: 127.1480, country: 'KR', emoji: '🏯', ageGroup: '30대' },
    { name: 'MBA 과정 이수', description: '경영 역량 강화', category: '학습', lat: 37.5665, lng: 126.9780, country: 'KR', emoji: '🎓', ageGroup: '30대' },
    { name: '여수 밤바다', description: '돌산대교 야경·해산물', category: '여행', lat: 34.7604, lng: 127.6622, country: 'KR', emoji: '🌙', ageGroup: '30대' },
    { name: '명상·요가 루틴', description: '번아웃 예방 마음 건강', category: '건강', lat: 37.5665, lng: 126.9780, country: 'KR', emoji: '🧘', ageGroup: '30대' },
    { name: '후쿠오카 미식 여행', description: '야타이 포장마차·라멘', category: '음식', lat: 33.5902, lng: 130.4017, country: 'JP', emoji: '🍜', ageGroup: '30대' },
    { name: '제2외국어 중급', description: '일본어·스페인어 등 취득', category: '학습', lat: 37.5665, lng: 126.9780, country: 'KR', emoji: '🗣️', ageGroup: '30대' },
    { name: '가족 해외여행', description: '부모님과 일본 여행', category: '경험', lat: 35.6895, lng: 139.6917, country: 'JP', emoji: '👨‍👩‍👧', ageGroup: '30대' },
  ],
  '40대': [
    { name: '자전거 국토종주', description: '서울~부산 633km 완주', category: '도전', lat: 37.5665, lng: 126.9780, country: 'KR', emoji: '🚴', ageGroup: '40대' },
    { name: '정기 건강검진', description: '종합건강검진 매년 챙기기', category: '건강', lat: 37.5665, lng: 126.9780, country: 'KR', emoji: '🏥', ageGroup: '40대' },
    { name: '교토 단풍 여행', description: '가을 교토 아라시야마', category: '여행', lat: 35.0116, lng: 135.7681, country: 'JP', emoji: '🍁', ageGroup: '40대' },
    { name: '수익형 부동산 투자', description: '안정적 노후 준비', category: '재정', lat: 37.5665, lng: 126.9780, country: 'KR', emoji: '🏢', ageGroup: '40대' },
    { name: '안동 하회마을', description: '전통 한국 문화 체험', category: '문화', lat: 36.5684, lng: 128.7296, country: 'KR', emoji: '🎭', ageGroup: '40대' },
    { name: '등산 100대 명산 도전', description: '대한민국 명산 완등', category: '자연', lat: 37.5665, lng: 126.9780, country: 'KR', emoji: '⛰️', ageGroup: '40대' },
    { name: '자녀와 캠핑', description: '가족 추억 만들기', category: '경험', lat: 37.5665, lng: 126.9780, country: 'KR', emoji: '⛺', ageGroup: '40대' },
    { name: '삿포로 라멘 투어', description: '홋카이도 라멘 명소 탐방', category: '음식', lat: 43.0621, lng: 141.3544, country: 'JP', emoji: '🍥', ageGroup: '40대' },
    { name: '제주 한달살기', description: '자연 속 힐링 리셋', category: '여행', lat: 33.4890, lng: 126.4983, country: 'KR', emoji: '🌺', ageGroup: '40대' },
    { name: '악기 배우기', description: '기타·피아노 취미 시작', category: '학습', lat: 37.5665, lng: 126.9780, country: 'KR', emoji: '🎸', ageGroup: '40대' },
    { name: '나가사키 역사 탐방', description: '평화공원·군함도 역사 여행', category: '문화', lat: 32.7898, lng: 129.8738, country: 'JP', emoji: '🕊️', ageGroup: '40대' },
    { name: '조기 은퇴 계획 수립', description: '파이어족 목표 설정', category: '재정', lat: 37.5665, lng: 126.9780, country: 'KR', emoji: '🎯', ageGroup: '40대' },
  ],
  '50대+': [
    { name: '유럽 배낭여행', description: '버킷리스트 유럽 한 달', category: '여행', lat: 35.6895, lng: 139.6917, country: 'JP', emoji: '✈️', ageGroup: '50대+' },
    { name: '벳푸 온천 여행', description: '일본 최고 온천 마을', category: '여행', lat: 33.2382, lng: 131.6126, country: 'JP', emoji: '♨️', ageGroup: '50대+' },
    { name: '텃밭 가꾸기', description: '귀농·귀촌 전 체험', category: '자연', lat: 37.5665, lng: 126.9780, country: 'KR', emoji: '🌱', ageGroup: '50대+' },
    { name: '손자와 제주 여행', description: '가족 3대 추억 만들기', category: '경험', lat: 33.4890, lng: 126.4983, country: 'KR', emoji: '👴', ageGroup: '50대+' },
    { name: '건강식 요리 배우기', description: '영양 균형 식단 관리', category: '건강', lat: 37.5665, lng: 126.9780, country: 'KR', emoji: '🥗', ageGroup: '50대+' },
    { name: '전주 한옥마을 여행', description: '느리게 걷는 문화 여행', category: '문화', lat: 35.8242, lng: 127.1480, country: 'KR', emoji: '🏮', ageGroup: '50대+' },
    { name: '은퇴 후 창업', description: '카페·공방 등 소자본 창업', category: '도전', lat: 37.5665, lng: 126.9780, country: 'KR', emoji: '☕', ageGroup: '50대+' },
    { name: '교토 료칸 여행', description: '온천과 가이세키 요리', category: '여행', lat: 35.0116, lng: 135.7681, country: 'JP', emoji: '🌸', ageGroup: '50대+' },
    { name: '회고록 쓰기', description: '나의 인생을 책으로 남기기', category: '학습', lat: 37.5665, lng: 126.9780, country: 'KR', emoji: '📖', ageGroup: '50대+' },
    { name: '등산 국토 종주', description: '백두대간 트레킹', category: '자연', lat: 37.5665, lng: 126.9780, country: 'KR', emoji: '🥾', ageGroup: '50대+' },
    { name: '강릉 바다 힐링', description: '경포해변 여유로운 휴식', category: '여행', lat: 37.7519, lng: 128.8761, country: 'KR', emoji: '🌊', ageGroup: '50대+' },
    { name: '노후 자금 완성', description: '연금·저축 포트폴리오 완비', category: '재정', lat: 37.5665, lng: 126.9780, country: 'KR', emoji: '🏦', ageGroup: '50대+' },
  ],
};

const AGE_GROUPS = [
  { label: '10대' as AgeGroup, emoji: '🎒', color: '#FF6B6B', desc: '꿈·도전·성장' },
  { label: '20대' as AgeGroup, emoji: '🚀', color: '#4ECDC4', desc: '자격증·탐험·커리어' },
  { label: '30대' as AgeGroup, emoji: '🌿', color: '#45B7D1', desc: '안정·미식·경험' },
  { label: '40대' as AgeGroup, emoji: '🏔️', color: '#96CEB4', desc: '자연·건강·문화' },
  { label: '50대+', emoji: '🌸', color: '#F7C59F', desc: '여유·전통·버킷' },
];

// ✅ 여행 + 인생목표 통합 카테고리
const CATEGORIES = ['여행', '자격증', '학습', '경험', '건강', '도전', '재정', '문화', '자연', '음식'];
const CAT_COLOR: Record<string, string> = {
  여행: '#38bdf8', 자격증: '#f59e0b', 학습: '#a78bfa', 경험: '#f472b6',
  건강: '#4ade80', 도전: '#f87171', 재정: '#fbbf24', 문화: '#c084fc',
  자연: '#34d399', 음식: '#fb923c',
};
const CAT_EMOJI: Record<string, string> = {
  여행: '✈️', 자격증: '📜', 학습: '📚', 경험: '🎭',
  건강: '💪', 도전: '🎯', 재정: '💰', 문화: '🎨',
  자연: '🌿', 음식: '🍜',
};

// ── 직접 추가 / 수정 폼 ──────────────────────────────────────
interface FormState {
  name: string; emoji: string; description: string;
  category: string; country: 'KR' | 'JP' | 'ETC';
  ageGroup: string; searchQuery: string;
  lat: number | null; lng: number | null; locationLabel: string;
}
const EMPTY_FORM: FormState = {
  name: '', emoji: '📍', description: '', category: '경험',
  country: 'KR', ageGroup: '20대',
  searchQuery: '', lat: null, lng: null, locationLabel: '',
};
const itemToForm = (item: BucketItem): FormState => ({
  name: item.name, emoji: item.emoji, description: item.description,
  category: item.category, country: item.country as any, ageGroup: item.ageGroup,
  searchQuery: '', lat: item.lat, lng: item.lng, locationLabel: item.name,
});

function AddEditModal({ editItem, onClose, isDark }: {
  editItem: BucketItem | null; onClose: () => void; isDark: boolean;
}) {
  const [form, setForm] = useState<FormState>(editItem ? itemToForm(editItem) : EMPTY_FORM);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const text = isDark ? '#e8f0ff' : '#1a2340';
  const sub = isDark ? '#7a9bc4' : '#5a7a9c';
  const bdr = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
  const iBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';
  const pBg = isDark ? 'rgba(8,14,32,0.99)' : 'rgba(248,250,255,0.99)';

  const handleSearch = (val: string) => {
    setForm(f => ({ ...f, searchQuery: val }));
    clearTimeout(searchTimer.current);
    if (!val.trim()) { setSearchResults([]); return; }
    searchTimer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(val)}.json?access_token=${MAPBOX_TOKEN}&language=ko&limit=5`
        );
        const d = await res.json();
        setSearchResults(d.features ?? []);
      } catch {}
      setSearching(false);
    }, 400);
  };

  const selectPlace = (f: any) => {
    const [lng, lat] = f.center;
    setForm(prev => ({
      ...prev, searchQuery: f.place_name, lat, lng, locationLabel: f.place_name,
      name: prev.name || f.text,
      country: f.place_name.toLowerCase().includes('japan') || f.place_name.includes('일본') ? 'JP' : 'KR',
    }));
    setSearchResults([]);
  };

  // 위치 없이 추가 (자격증 등 장소 무관한 목표)
  const useSeoulDefault = () => {
    setForm(f => ({ ...f, lat: 37.5665, lng: 126.9780, locationLabel: '한국 (기본 위치)', searchQuery: '한국' }));
  };

  const isValid = form.name.trim() && form.lat !== null;

  const handleSubmit = () => {
    if (!isValid) return;
    const payload = {
      name: form.name.trim(), emoji: form.emoji || '📍',
      description: form.description.trim(),
      category: form.category, country: (form.country === 'ETC' ? 'KR' : form.country) as 'KR' | 'JP',
      ageGroup: form.ageGroup, lat: form.lat!, lng: form.lng!,
    };
    if (editItem) bucketListStore.updateItem(editItem.id, payload);
    else bucketListStore.addItem(payload);
    onClose();
  };

  const iStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px', borderRadius: 10,
    border: `1px solid ${bdr}`, background: iBg,
    color: text, fontSize: 16, outline: 'none', boxSizing: 'border-box',
  };

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 1300, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }} />
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 32, stiffness: 300 }}
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1400,
          background: pBg, borderRadius: '24px 24px 0 0',
          padding: '20px 20px calc(env(safe-area-inset-bottom) + 20px)',
          maxHeight: '88vh', overflowY: 'auto',
          border: `1px solid ${bdr}`, borderBottom: 'none',
          boxShadow: '0 -20px 60px rgba(0,0,0,0.5)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: text }}>
            {editItem ? '✏️ 목표 수정' : '➕ 목표 직접 추가'}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: sub, fontSize: 20, cursor: 'pointer' }}>✕</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* 목표명 */}
          <div>
            <div style={{ fontSize: 12, color: sub, fontWeight: 600, marginBottom: 6 }}>🏷️ 목표 이름 *</div>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="예: 토익 900점, 후지산 등반, 마라톤 완주..." style={iStyle} />
          </div>

          {/* 이모지 + 카테고리 */}
          <div style={{ display: 'grid', gridTemplateColumns: '72px 1fr', gap: 10 }}>
            <div>
              <div style={{ fontSize: 12, color: sub, fontWeight: 600, marginBottom: 6 }}>이모지</div>
              <input value={form.emoji} onChange={e => setForm(f => ({ ...f, emoji: e.target.value }))}
                maxLength={2} placeholder="📍" style={{ ...iStyle, textAlign: 'center', fontSize: 22 }} />
            </div>
            <div>
              <div style={{ fontSize: 12, color: sub, fontWeight: 600, marginBottom: 6 }}>카테고리</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {CATEGORIES.map(c => (
                  <button key={c} onClick={() => {
                    const isLocationCat = ['여행', '자연', '문화', '음식'].includes(c);
                    setForm(f => ({
                      ...f,
                      category: c,
                      emoji: CAT_EMOJI[c] ?? f.emoji,
                      // 위치 무관 카테고리면 자동으로 기본 위치 적용
                      lat: isLocationCat ? f.lat : 37.5665,
                      lng: isLocationCat ? f.lng : 126.9780,
                      locationLabel: isLocationCat ? f.locationLabel : '',
                      searchQuery: isLocationCat ? f.searchQuery : '',
                    }));
                  }}
                    style={{
                      padding: '5px 10px', borderRadius: 16, cursor: 'pointer', fontSize: 11, fontWeight: 600,
                      border: `1px solid ${form.category === c ? CAT_COLOR[c] : bdr}`,
                      background: form.category === c ? `${CAT_COLOR[c]}20` : iBg,
                      color: form.category === c ? CAT_COLOR[c] : sub,
                    }}>
                    {CAT_EMOJI[c]} {c}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 위치 검색 — 위치 관련 카테고리만 표시 */}
          {['여행', '자연', '문화', '음식'].includes(form.category) ? (
          <div>
            <div style={{ fontSize: 12, color: sub, fontWeight: 600, marginBottom: 6 }}>📍 관련 위치</div>
            <div style={{ position: 'relative' }}>
              <input value={form.searchQuery} onChange={e => handleSearch(e.target.value)}
                placeholder="장소 검색 (없으면 아래 버튼 사용)" style={iStyle} />
              {searching && <div style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: sub }}>검색 중...</div>}
            </div>
            {form.lat !== null && (
              <div style={{ fontSize: 11, color: '#4ade80', marginTop: 4 }}>✓ {form.locationLabel}</div>
            )}
            {searchResults.length > 0 && (
              <div style={{ background: isDark ? 'rgba(10,16,35,0.99)' : '#fff', borderRadius: 10, border: `1px solid ${bdr}`, marginTop: 4, overflow: 'hidden' }}>
                {searchResults.map((f: any) => (
                  <div key={f.id} onClick={() => selectPlace(f)}
                    style={{ padding: '10px 12px', cursor: 'pointer', fontSize: 13, color: text, borderBottom: `1px solid ${bdr}` }}
                    onMouseEnter={e => (e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    {f.place_name}
                  </div>
                ))}
              </div>
            )}
            {form.lat === null && (
              <button onClick={useSeoulDefault}
                style={{ marginTop: 6, background: 'none', border: `1px solid ${bdr}`, borderRadius: 8, padding: '6px 12px', color: sub, fontSize: 11, cursor: 'pointer' }}>
                📌 위치 없이 추가 (기본 위치 사용)
              </button>
            )}
          </div>
          ) : (
          <div style={{
            background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
            border: `1px solid ${bdr}`, borderRadius: 10, padding: '10px 14px',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span style={{ fontSize: 16 }}>📋</span>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: text }}>위치 없는 목표</div>
              <div style={{ fontSize: 11, color: sub, marginTop: 1 }}>
                {form.category} 목표는 지도 핀 없이 내 목록에만 저장돼요
              </div>
            </div>
          </div>
          )}

          {/* 나이대 */}
          <div>
            <div style={{ fontSize: 12, color: sub, fontWeight: 600, marginBottom: 6 }}>나이대</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {AGE_GROUPS.map(a => (
                <button key={a.label} onClick={() => setForm(f => ({ ...f, ageGroup: a.label }))}
                  style={{
                    padding: '6px 12px', borderRadius: 16, cursor: 'pointer', fontSize: 12, fontWeight: 600,
                    border: `1px solid ${form.ageGroup === a.label ? a.color : bdr}`,
                    background: form.ageGroup === a.label ? `${a.color}18` : iBg,
                    color: form.ageGroup === a.label ? a.color : sub,
                  }}>
                  {a.emoji} {a.label}
                </button>
              ))}
            </div>
          </div>

          {/* 메모 */}
          <div>
            <div style={{ fontSize: 12, color: sub, fontWeight: 600, marginBottom: 6 }}>메모 (선택)</div>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="이 목표에 대한 메모를 남겨보세요" rows={2}
              style={{ ...iStyle, resize: 'none', lineHeight: 1.5 }} />
          </div>

          {/* 저장 */}
          <motion.button whileTap={{ scale: 0.97 }} onClick={handleSubmit} disabled={!isValid}
            style={{
              width: '100%', padding: '14px', borderRadius: 14, border: 'none',
              background: isValid ? 'linear-gradient(135deg,#7c3aed,#a855f7)' : 'rgba(255,255,255,0.08)',
              color: isValid ? '#fff' : sub, fontSize: 15, fontWeight: 700,
              cursor: isValid ? 'pointer' : 'default',
              boxShadow: isValid ? '0 4px 20px rgba(168,85,247,0.4)' : 'none',
            }}>
            {editItem ? '수정 완료 ✓' : '버킷리스트에 추가 ✨'}
          </motion.button>
        </div>
      </motion.div>
    </>
  );
}

// ── Main Panel ────────────────────────────────────────────────
export const BucketListPanel: React.FC<Props> = ({ isOpen, onClose }) => {
  const { isDark } = useTheme();
  const [selectedAge, setSelectedAge] = useState<AgeGroup | null>(null);
  const [recs, setRecs] = useState<Rec[]>([]);
  const [myList, setMyList] = useState<BucketItem[]>(bucketListStore.getItems());
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<Tab>('discover');
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<BucketItem | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const bg = isDark ? 'rgba(6,13,31,0.97)' : 'rgba(248,250,255,0.97)';
  const card = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)';
  const text = isDark ? '#e8f0ff' : '#1a2340';
  const sub = isDark ? '#7a9bc4' : '#5a7a9c';
  const border = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';

  useEffect(() => bucketListStore.subscribe(setMyList), []);

  // ── Gemini: 여행+인생목표 통합, 매번 랜덤 ────────────────
  const fetchRecs = async (age: AgeGroup) => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setLoading(true); setError(null); setRecs([]);

    // 랜덤 시드로 매번 다른 추천
    const seed = Math.random().toString(36).slice(2, 8);
    const ageDescMap: Record<AgeGroup, string> = {
      '10대': '고등학생·대학 입시·청소년. 교환학생, 봉사활동, 운전면허 준비, 스포츠 도전, 여행',
      '20대': '대학생·직장 초년생. 토익/토플, 자격증(기사·산업기사·정보처리기사), 어학연수, 인턴십, 해외여행, 재테크 입문',
      '30대': '직장인·육아기. 마라톤/등산, 내 집 마련 계획, 해외여행, MBA, 새로운 취미, 재정 목표',
      '40대': '중견 직장인. 건강 검진, 제2외국어, 가족 여행, 투자 포트폴리오, 자전거 국토종주, 자녀와 추억',
      '50대+': '50대 이상. 세계 여행, 은퇴 후 귀농, 손자와 추억, 버킷리스트 명소, 취미 마스터, 건강 관리',
    };

    try {
      const res = await fetch(GEMINI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abortRef.current.signal,
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `${age} (${ageDescMap[age]})를 위한 버킷리스트 12개를 추천해줘.
랜덤 시드: ${seed} (반드시 매번 다른 추천을 해줘, 이전과 겹치지 않게)

중요: 단순 여행지뿐 아니라 자격증 취득, 학습 목표, 경험, 건강, 도전, 재정 목표 등 인생 전반의 버킷리스트를 포함해줘.
카테고리 비율: 여행 4개, 자격증/학습/도전/경험/건강/재정 등 나머지 8개

자격증/목표 항목의 lat/lng는 해당 자격증 주관 기관이나 가장 관련 있는 장소의 실제 좌표 사용 (예: 토익 → 한국외대 서울캠퍼스).

반드시 순수 JSON 배열만 반환. 마크다운·설명 없이:
[{"name":"목표명","description":"한 줄 설명","category":"여행|자격증|학습|경험|건강|도전|재정|문화|자연|음식 중 하나","lat":위도숫자,"lng":경도숫자,"country":"KR 또는 JP","emoji":"이모지1개","ageGroup":"${age}"}]`
            }]
          }],
          generationConfig: { temperature: 1.0, maxOutputTokens: 2000 },
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData?.error?.message || `HTTP ${res.status}`);
      }

      const data = await res.json();
      const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed)) setRecs(parsed);
      else throw new Error('응답 형식 오류');
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        // API 할당량 초과 시 큐레이션 폴백 사용
        const fallback = FALLBACK_DB[age];
        if (fallback) {
          // 셔플해서 매번 다른 순서로
          const shuffled = [...fallback].sort(() => Math.random() - 0.5);
          setRecs(shuffled);
          setError(null); // 폴백 성공 시 에러 숨김
        } else {
          setError('추천을 불러오지 못했어요. 잠시 후 다시 시도해주세요.');
        }
        console.warn('[Gemini] API 오류, 큐레이션 폴백 사용:', e.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const done = myList.filter(i => i.completed).length;
  const pct = myList.length > 0 ? (done / myList.length) * 100 : 0;

  const categoryStats = myList.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, zIndex: 1100, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          />

          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 300 }}
            style={{
              position: 'fixed', bottom: 0, left: 0, right: 0,
              height: '68vh',
              maxHeight: '68vh',
              zIndex: 1200,
              background: bg, backdropFilter: 'blur(24px)',
              borderRadius: '24px 24px 0 0', display: 'flex', flexDirection: 'column', overflow: 'hidden',
              border: `1px solid ${border}`, borderBottom: 'none',
              boxShadow: '0 -24px 64px rgba(0,0,0,0.45)',
            }}
          >
            {/* ── 헤더 ── */}
            <div style={{
              background: 'linear-gradient(135deg,#0f0324 0%,#2d0a5e 35%,#5b21b6 65%,#7c3aed 85%,#a855f7 100%)',
              padding: 'calc(env(safe-area-inset-top) + 18px) 20px 16px',
              position: 'relative', overflow: 'hidden', flexShrink: 0,
            }}>
              {/* 별 파티클 */}
              {Array.from({ length: 20 }).map((_, i) => (
                <motion.div key={i}
                  animate={{ opacity: [0.15, 1, 0.15], scale: [0.5, 1.4, 0.5] }}
                  transition={{ duration: 1.8 + i * 0.22, repeat: Infinity, delay: i * 0.16 }}
                  style={{
                    position: 'absolute',
                    left: `${(i * 31 + 7) % 100}%`, top: `${(i * 47 + 5) % 100}%`,
                    width: i % 4 === 0 ? 3 : 2, height: i % 4 === 0 ? 3 : 2,
                    borderRadius: '50%', background: 'white', pointerEvents: 'none',
                  }}
                />
              ))}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#c4b5fd', boxShadow: '0 0 6px #c4b5fd' }} />
                    <span style={{ fontSize: 10, color: 'rgba(196,181,253,0.8)', letterSpacing: '2px', fontWeight: 700, textTransform: 'uppercase' }}>
                      AI POWERED BY GEMINI
                    </span>
                  </div>
                  <div style={{ fontSize: 21, fontWeight: 900, color: '#fff', letterSpacing: '-0.5px', marginBottom: 3 }}>
                    ✨ 인생 버킷리스트
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(196,181,253,0.7)' }}>
                    여행 · 자격증 · 도전 · 경험 — 나이별 맞춤 추천
                  </div>
                </div>
                <button onClick={onClose} style={{
                  background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: 10,
                  width: 34, height: 34, color: '#fff', fontSize: 14,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  backdropFilter: 'blur(8px)',
                }}>✕</button>
              </div>

              {/* 진행률 */}
              {myList.length > 0 && (
                <div style={{ marginTop: 12, position: 'relative' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'rgba(255,255,255,0.6)', marginBottom: 5 }}>
                    <span>🎯 달성률</span>
                    <span style={{ fontWeight: 700, color: pct === 100 ? '#4ade80' : 'rgba(255,255,255,0.8)' }}>
                      {done}/{myList.length} {pct === 100 ? '🎉 모두 완료!' : `(${Math.round(pct)}%)`}
                    </span>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.15)', borderRadius: 6, height: 8, overflow: 'hidden' }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.7, ease: 'easeOut' }}
                      style={{
                        height: '100%', borderRadius: 6,
                        background: pct === 100
                          ? 'linear-gradient(90deg,#4ade80,#22c55e)'
                          : 'linear-gradient(90deg,#a78bfa,#f0abfc)',
                        boxShadow: `0 0 10px ${pct === 100 ? 'rgba(74,222,128,0.8)' : 'rgba(167,139,250,0.8)'}`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* ── 탭 ── */}
            <div style={{ display: 'flex', borderBottom: `1px solid ${border}`, background: card, flexShrink: 0 }}>
              {(['discover', 'mylist'] as Tab[]).map(t => (
                <button key={t} onClick={() => setTab(t)} style={{
                  flex: 1, padding: '12px 0', background: 'none', border: 'none',
                  borderBottom: tab === t ? '2px solid #a855f7' : '2px solid transparent',
                  color: tab === t ? '#a855f7' : sub, fontWeight: tab === t ? 700 : 400,
                  fontSize: 14, cursor: 'pointer', transition: 'all 0.2s',
                }}>
                  {t === 'discover' ? '🔍 AI 탐색' : `📋 내 목록${myList.length > 0 ? ` (${myList.length})` : ''}`}
                </button>
              ))}
            </div>

            {/* ── 컨텐츠 ── */}
            <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' as any }}>

              {/* ── 탐색 탭 ── */}
              {tab === 'discover' && (
                <div style={{ padding: '16px 16px 48px' }}>

                  {/* 나이대 선택 */}
                  <div style={{ marginBottom: 18 }}>
                    <div style={{ fontSize: 12, color: sub, fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: 10 }}>
                      나이대 선택 (클릭할 때마다 새로운 추천!)
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {AGE_GROUPS.map(ag => (
                        <motion.button key={ag.label} whileTap={{ scale: 0.91 }}
                          onClick={() => { setSelectedAge(ag.label as AgeGroup); fetchRecs(ag.label as AgeGroup); }}
                          style={{
                            padding: '9px 14px', borderRadius: 22, cursor: 'pointer',
                            border: `1.5px solid ${selectedAge === ag.label ? ag.color : border}`,
                            background: selectedAge === ag.label ? `${ag.color}20` : card,
                            color: selectedAge === ag.label ? ag.color : sub,
                            fontSize: 13, fontWeight: selectedAge === ag.label ? 700 : 400,
                            display: 'flex', alignItems: 'center', gap: 5, transition: 'all 0.2s',
                          }}>
                          <span>{ag.emoji}</span>
                          <span>{ag.label}</span>
                          {selectedAge === ag.label && <span style={{ fontSize: 10, opacity: 0.75 }}>· {ag.desc}</span>}
                        </motion.button>
                      ))}
                    </div>
                    {selectedAge && !loading && recs.length > 0 && (
                      <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => fetchRecs(selectedAge)}
                        style={{
                          marginTop: 10, background: 'rgba(168,85,247,0.12)',
                          border: '1px solid rgba(168,85,247,0.35)', borderRadius: 20,
                          padding: '6px 14px', color: '#a855f7', fontSize: 12, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: 5,
                        }}>
                        🔄 다시 추천받기
                      </motion.button>
                    )}
                  </div>

                  {/* 로딩 */}
                  {loading && (
                    <div style={{ textAlign: 'center', padding: '50px 0' }}>
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                        style={{ fontSize: 42, display: 'inline-block', marginBottom: 14 }}>🌍</motion.div>
                      <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.5, repeat: Infinity }}
                        style={{ color: sub, fontSize: 13 }}>
                        Gemini AI가 맞춤 목표를 분석 중...
                      </motion.div>
                    </div>
                  )}

                  {/* 에러 */}
                  {error && !loading && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      style={{ background: 'rgba(239,68,68,0.08)', borderRadius: 14, padding: 18, textAlign: 'center', border: '1px solid rgba(239,68,68,0.2)' }}>
                      <div style={{ fontSize: 28, marginBottom: 8 }}>⚠️</div>
                      <div style={{ color: '#ef4444', fontSize: 13, marginBottom: 12, wordBreak: 'break-all' }}>{error}</div>
                      <button onClick={() => selectedAge && fetchRecs(selectedAge)}
                        style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '7px 16px', color: '#ef4444', cursor: 'pointer', fontSize: 12 }}>
                        다시 시도
                      </button>
                    </motion.div>
                  )}

                  {/* 추천 카드 */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {recs.map((item, i) => {
                      const added = bucketListStore.hasItem(item.name);
                      const cc = CAT_COLOR[item.category] || '#888';
                      return (
                        <motion.div key={`${item.name}-${i}`}
                          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.045 }}
                          style={{ background: card, borderRadius: 16, padding: '13px', border: `1px solid ${border}`, display: 'flex', gap: 12, alignItems: 'center' }}>
                          <div style={{
                            width: 46, height: 46, borderRadius: 13, flexShrink: 0,
                            background: `${cc}15`, border: `1px solid ${cc}30`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
                          }}>
                            {item.emoji}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3, flexWrap: 'wrap' }}>
                              <span style={{ fontSize: 14, fontWeight: 700, color: text }}>{item.name}</span>
                              <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 20, background: `${cc}15`, color: cc, fontWeight: 700 }}>
                                {CAT_EMOJI[item.category]} {item.category}
                              </span>
                              <span style={{ fontSize: 11, marginLeft: 'auto' }}>{item.country === 'KR' ? '🇰🇷' : '🇯🇵'}</span>
                            </div>
                            <div style={{ fontSize: 12, color: sub, lineHeight: 1.5 }}>{item.description}</div>
                          </div>
                          <motion.button whileTap={{ scale: 0.86 }}
                            onClick={() => !added && bucketListStore.addItem(item)} disabled={added}
                            style={{
                              width: 36, height: 36, borderRadius: 10, border: 'none', flexShrink: 0,
                              cursor: added ? 'default' : 'pointer',
                              background: added ? 'rgba(74,222,128,0.15)' : 'linear-gradient(135deg,#7c3aed,#a855f7)',
                              color: added ? '#4ade80' : '#fff', fontSize: added ? 16 : 20,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              boxShadow: added ? 'none' : '0 4px 12px rgba(168,85,247,0.4)',
                            }}>
                            {added ? '✓' : '+'}
                          </motion.button>
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* 빈 상태 */}
                  {!loading && !error && recs.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '50px 20px', color: sub }}>
                      <div style={{ fontSize: 54, marginBottom: 16 }}>✨</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: text, marginBottom: 8 }}>나이대를 선택해주세요</div>
                      <div style={{ fontSize: 13, lineHeight: 1.8, opacity: 0.75 }}>
                        여행지부터 자격증, 도전 목표까지<br />Gemini AI가 딱 맞는 버킷리스트를<br />매번 새롭게 추천해드려요
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── 내 목록 탭 ── */}
              {tab === 'mylist' && (
                <div style={{ padding: '16px 16px 48px' }}>
                  {/* 직접 추가 버튼 */}
                  <motion.button whileTap={{ scale: 0.97 }} onClick={() => setShowAddForm(true)}
                    style={{
                      width: '100%', padding: '13px', marginBottom: 16, borderRadius: 14,
                      border: '1.5px dashed rgba(168,85,247,0.45)', background: 'rgba(168,85,247,0.06)',
                      color: '#a855f7', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    }}>
                    ➕ 목표 직접 추가
                  </motion.button>

                  {myList.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '30px 20px', color: sub }}>
                      <div style={{ fontSize: 48, marginBottom: 14 }}>📋</div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: text, marginBottom: 8 }}>아직 목록이 비어있어요</div>
                      <div style={{ fontSize: 13, opacity: 0.8, lineHeight: 1.7 }}>AI 탐색에서 추가하거나<br />직접 목표를 입력해보세요</div>
                    </div>
                  ) : (
                    <>
                      {/* 통계 카드 */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 12 }}>
                        {[
                          { label: '전체 목표', value: myList.length, color: '#a855f7' },
                          { label: '완료 ✓', value: done, color: '#4ade80' },
                          { label: '진행 중', value: myList.length - done, color: '#fb923c' },
                        ].map(s => (
                          <div key={s.label} style={{ background: card, borderRadius: 14, padding: '11px 8px', textAlign: 'center', border: `1px solid ${border}` }}>
                            <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
                            <div style={{ fontSize: 10, color: sub, marginTop: 2 }}>{s.label}</div>
                          </div>
                        ))}
                      </div>

                      {/* 카테고리 뱃지 */}
                      {Object.keys(categoryStats).length > 0 && (
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
                          {Object.entries(categoryStats).map(([cat, cnt]) => (
                            <div key={cat} style={{
                              fontSize: 11, padding: '3px 9px', borderRadius: 20, fontWeight: 600,
                              background: `${CAT_COLOR[cat] || '#888'}18`,
                              color: CAT_COLOR[cat] || '#888',
                              border: `1px solid ${CAT_COLOR[cat] || '#888'}30`,
                            }}>
                              {CAT_EMOJI[cat]} {cat} {cnt}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* 아이템 */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {myList.map((item, i) => {
                          const cc = CAT_COLOR[item.category] || '#888';
                          return (
                            <motion.div key={item.id}
                              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.035 }}
                              style={{
                                background: item.completed ? 'rgba(74,222,128,0.06)' : card,
                                borderRadius: 14, padding: '12px 14px',
                                border: `1px solid ${item.completed ? 'rgba(74,222,128,0.22)' : border}`,
                                display: 'flex', gap: 10, alignItems: 'center',
                                opacity: item.completed ? 0.72 : 1, transition: 'all 0.2s',
                              }}>
                              <motion.button whileTap={{ scale: 0.8 }}
                                onClick={() => bucketListStore.toggleComplete(item.id)}
                                style={{
                                  width: 26, height: 26, borderRadius: 7, border: 'none', flexShrink: 0, cursor: 'pointer',
                                  background: item.completed ? 'linear-gradient(135deg,#4ade80,#22c55e)' : 'transparent',
                                  boxShadow: item.completed ? 'none' : `inset 0 0 0 1.5px ${border}`,
                                  color: '#fff', fontSize: 12,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                {item.completed ? '✓' : ''}
                              </motion.button>

                              <div style={{ fontSize: 20, flexShrink: 0 }}>{item.emoji}</div>

                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 13, fontWeight: 600, color: text, textDecoration: item.completed ? 'line-through' : 'none' }}>
                                  {item.name}
                                </div>
                                <div style={{ display: 'flex', gap: 5, marginTop: 3, flexWrap: 'wrap', alignItems: 'center' }}>
                                  <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 10, background: `${cc}15`, color: cc, fontWeight: 600 }}>
                                    {CAT_EMOJI[item.category]} {item.category}
                                  </span>
                                  <span style={{ fontSize: 10, color: sub }}>{item.country === 'KR' ? '🇰🇷' : '🇯🇵'} · {item.ageGroup}</span>
                                </div>
                              </div>

                              <button onClick={() => setEditingItem(item)}
                                style={{ background: 'none', border: 'none', color: sub, fontSize: 13, cursor: 'pointer', padding: 4, opacity: 0.55 }}>✏️</button>
                              <button onClick={() => bucketListStore.removeItem(item.id)}
                                style={{ background: 'none', border: 'none', color: sub, fontSize: 13, cursor: 'pointer', padding: 4, opacity: 0.45 }}>🗑</button>
                            </motion.div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </motion.div>

          {/* 추가/수정 모달 */}
          <AnimatePresence>
            {(showAddForm || editingItem) && (
              <AddEditModal
                editItem={editingItem}
                isDark={isDark}
                onClose={() => { setShowAddForm(false); setEditingItem(null); }}
              />
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  );
};

export default BucketListPanel;