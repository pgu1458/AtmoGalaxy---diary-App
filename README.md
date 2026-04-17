# AtmoGalaxy

지도 위에 날씨랑 여행 기록을 남기는 PWA 앱입니다.

🔗 [배포 링크](https://rainbow-lollipop-859583.netlify.app)

---

## 만든 이유

여행 갔을 때 그날 날씨랑 기분을 같이 기록하고 싶었는데
마땅한 앱이 없어서 직접 만들었고 sns를 보다 릴스에서 어플을 만드는 과정을 보며 관심이 갔습니다.
또 버킷리스트들과 재밌는 기능들을 추가해보고 싶었습니다.

---

## 주요 기능

- 지도 탭하면 그 위치 날씨 자동 저장 + 사진/메모 기록
- 한국·일본 실시간 날씨 히트맵
- 줌인하면 3D 건물 뷰
- AI 버킷리스트 추천 (나이대별)
- 랜덤 여행지 추첨
- 여행 통계 (기온, 요일별 기록 등)
- PWA라 홈화면에 설치해서 앱처럼 사용 가능

---

## 기술 스택

- React 18 + TypeScript + Vite
- Mapbox GL JS
- Framer Motion
- OpenWeather API
- Google Gemini 1.5 Flash
- Netlify 배포

---

## 실행 방법

```bash
npm install
npm run dev
```

`.env` 파일에 아래 키 필요합니다.

```
VITE_MAPBOX_TOKEN=
VITE_OPENWEATHER_KEY=
VITE_GEMINI_KEY=
```
