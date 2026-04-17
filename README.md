# 🌤️ AtmoGalaxy — 대기 기록 다이어리

> **"Record your travels, design your life"**  
> 지도 위에 날씨와 감성을 기록하는 여행 일기 + AI 버킷리스트 PWA 앱

🔗 **[라이브 데모 보기](https://rainbow-lollipop-859583.netlify.app)**

---

## ✨ 주요 기능

- 🌡️ **실시간 날씨 히트맵** — 한국·일본 주요 도시 날씨를 컬러 글로우로 표현
- 📍 **여행 일기 기록** — 지도 탭 하나로 날씨·사진·메모 자동 저장
- 🏙️ **3D 도시 뷰** — 줌인 시 건물이 입체적으로 렌더링
- 🤖 **AI 버킷리스트** — Gemini AI가 나이대에 맞는 목표 추천
- 🎯 **랜덤 여행 추첨** — 다트 애니메이션으로 여행지 선택
- 📊 **여행 통계** — 기온 분석, 요일별 히스토그램, 날씨 요정 카드
- 📱 **PWA** — 홈화면 설치, 오프라인 캐싱 지원

---

## 🛠️ 기술 스택

| 분류 | 기술 |
|------|------|
| Frontend | React 18, TypeScript, Vite |
| 지도 | Mapbox GL JS |
| 애니메이션 | Framer Motion |
| 차트 | Recharts |
| AI | Google Gemini 1.5 Flash |
| 날씨 | OpenWeather API |
| 이미지 | Wikipedia REST API |
| 스토리지 | localStorage |
| PWA | vite-plugin-pwa + Workbox |
| 배포 | Netlify |

---

## 🚀 로컬 실행 방법

```bash
# 1. 저장소 클론
git clone https://github.com/YOUR_USERNAME/atmogalaxy.git
cd atmogalaxy

# 2. 패키지 설치
npm install

# 3. 환경변수 설정 (.env 파일 생성)
VITE_MAPBOX_TOKEN=your_mapbox_token
VITE_OPENWEATHER_KEY=your_openweather_key
VITE_GEMINI_KEY=your_gemini_key

# 4. 개발 서버 실행
npm run dev
```

---

## 📱 스크린샷

| 메인 지도 | 여행 기록 | 버킷리스트 |
|-----------|-----------|------------|
| 날씨 히트맵 | 일기형 기록 | AI 추천 |

---

## 📄 라이선스

MIT License
