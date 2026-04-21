# 🌍 AtmoGalaxy

> 지도 위에 날씨와 여행 기록을 남기는 PWA 앱  
> React + TypeScript + Mapbox GL JS

🔗 [배포 링크](https://rainbow-lollipop-859583.netlify.app)

---

## 프로젝트 소개

여행지에서 그날의 날씨와 감정을 함께 기록하고 싶었는데 마땅한 앱이 없어서 직접 만들었습니다. SNS 릴스에서 앱을 만드는 과정을 보며 관심이 생겼고, 버킷리스트 추천이나 랜덤 여행 추첨 같은 기능들도 하나씩 붙여나갔습니다.

지도 위에 핀을 꽂듯이 기록을 남기면, 나중에 봤을 때 어디서 어떤 날씨였는지 한눈에 보이는 게 목표였습니다. 단순한 일기 앱이 아니라 지도가 곧 나의 여행 히스토리가 되는 경험을 만들고 싶었습니다.

---

## 앱 화면

> PWA로 제작되어 모바일 홈 화면에 추가하면 네이티브 앱처럼 사용할 수 있습니다.

<!-- 모바일 앱 전체 화면 스크린샷 (세로형 나란히) -->
| 메인 | 일기 작성 | 버킷리스트 | 통계 |
|------|-----------|-----------|------|
| <img width="250" height="500" alt="메인" src="https://github.com/user-attachments/assets/3e275288-341b-4247-89f6-90c1dac4e839" />| <img width="250" height="500" alt="내 기록저장" src="https://github.com/user-attachments/assets/a26d7d76-7114-4b56-ac53-003bc1808ce7" /> | <img width="250" height="500" alt="버킷" src="https://github.com/user-attachments/assets/d3441c72-4b4b-4093-a9e2-70fa2d177368" /> | <img width="250" height="500" alt="통계" src="https://github.com/user-attachments/assets/45cd5747-cfa3-47dc-a47b-afcf2f9c5ed3" /> |




---

## 튜토리얼

처음 앱을 실행하면 주요 기능을 안내하는 튜토리얼이 순서대로 표시됩니다.

### Step 1 — 날씨 히트맵 안내

지도에 표시된 색상이 각 도시의 날씨 상태를 나타낸다는 것을 안내합니다. 줌 레벨에 따라 히트맵과 마커가 자동으로 전환되는 것도 이 단계에서 설명합니다.

<!-- 튜토리얼 Step 1 스크린샷 -->
<img width="300" height="500" alt="튜토리얼1" src="https://github.com/user-attachments/assets/fdcf8fa5-7a6c-462b-8666-4777e1028752" />

### Step 2 — 여행 기록 방법

지도를 탭해서 여행 일기를 기록하는 방법을 안내합니다. 탭하면 해당 위치의 날씨가 자동으로 불러와진다는 것을 설명합니다.

<!-- 튜토리얼 Step 2 스크린샷 -->
![튜토리얼 2 - 기록 방법](screenshots/tutorial_02.png)

### Step 3 — 바텀 시트 사용법

하단 패널을 드래그해서 높이를 조절하고, 저장된 기록 목록을 확인하는 방법을 안내합니다.

<!-- 튜토리얼 Step 3 스크린샷 -->
![튜토리얼 3 - 바텀 시트](screenshots/tutorial_03.png)

### Step 4 — AI 버킷리스트 및 기타 기능

AI 버킷리스트 추천, 랜덤 여행 추첨, 통계 화면 등 추가 기능의 위치와 사용 방법을 안내합니다.

<!-- 튜토리얼 Step 4 스크린샷 -->
![튜토리얼 4 - 추가 기능](screenshots/tutorial_04.png)

---

## 주요 기능

### 🌡️ 실시간 날씨 히트맵

한국·일본 주요 도시의 날씨를 색깔로 표현합니다. 날씨 상태에 따라 마커 색상이 달라지며, 줌 레벨에 따라 히트맵과 마커가 자동으로 전환됩니다.

| 날씨 상태 | 색상 |
|-----------|------|
| 맑음 | 노란색 |
| 흐림 | 회색 |
| 비 | 파란색 |
| 뇌우 | 보라색 |
| 눈 | 흰색 |

줌아웃 시에는 히트맵으로, 줌인 시에는 도시별 개별 마커로 자동 전환되어 정보 과부하 없이 직관적으로 현황을 파악할 수 있습니다.

<!-- 날씨 히트맵 시연 스크린샷 -->
![날씨 히트맵](screenshots/heatmap.png)

---

### 📔 여행 일기 기록

지도의 원하는 위치를 탭하면 해당 위치의 날씨 데이터가 OpenWeather API를 통해 자동으로 저장됩니다. 사진과 메모도 함께 남길 수 있어 그날의 감성을 그대로 기록할 수 있습니다.

- 탭한 좌표 기반으로 도시명 / 기온 / 날씨 상태 자동 수집
- 사진 첨부 및 텍스트 메모 기능
- 기록된 핀은 지도 위에 날씨 아이콘과 함께 표시
- 저장된 일기는 바텀 시트에서 목록으로 확인

<!-- 일기 작성 시연 스크린샷 -->
![여행 일기](screenshots/diary.png)

---

### 🏙️ 3D 도시 뷰

Mapbox GL JS의 3D 레이어를 활용해, 지도를 확대하면 건물이 입체적으로 솟아오릅니다. 내가 기록한 장소를 3D 뷰로 둘러볼 수 있습니다.

<!-- 3D 뷰 시연 스크린샷 -->
![3D 도시 뷰](screenshots/3d_view.png)

---

### 🤖 AI 버킷리스트 추천

Google Gemini 1.5 Flash API를 연동해 나이대에 맞는 버킷리스트를 추천해줍니다. 완료한 항목의 지도 핀은 초록색으로 바뀌어 달성 현황을 시각적으로 확인할 수 있습니다.

- 여행 / 자격증 / 건강 / 재정 등 카테고리별 추천
- 완료 체크 시 지도 핀 색상 변경 (미완료 → 완료: 초록색)
- Gemini API 할당량 초과 시 자체 폴백 DB로 자동 전환되어 서비스 중단 없이 동작

<!-- AI 버킷리스트 시연 스크린샷 -->
![AI 버킷리스트](screenshots/bucketlist.png)

---

### 🎯 랜덤 여행지 추첨

어디 갈지 정하지 못할 때 사용하는 기능입니다. 한국 / 일본 / 전체 범위 중 선택하면 랜덤으로 여행지를 뽑아줍니다.

- 다트가 날아가는 애니메이션 (Framer Motion)
- Wikipedia REST API로 해당 도시의 대표 사진 자동 로드
- 추첨 결과 도시로 지도가 자동 이동

<!-- 랜덤 추첨 시연 스크린샷 -->
![랜덤 여행 추첨](screenshots/random_travel.png)

---

### 📊 여행 통계

쌓인 기록을 분석해서 다양한 통계를 시각화합니다. 날씨 패턴에 따라 나만의 날씨 요정 캐릭터 카드도 부여됩니다.

- 전체 기록 수 / 방문 도시 수 / 평균 기온
- 가장 자주 만난 날씨 유형
- 요일별 기록 수 분포 (Recharts 막대 차트)
- 날씨 패턴 기반 캐릭터 카드 (예: 맑은 날 많으면 "햇살 요정")

<!-- 통계 화면 시연 스크린샷 -->
![여행 통계](screenshots/stats.png)

---

### 🔗 여행 기록 공유

저장된 여행 기록을 친구나 SNS에 공유할 수 있습니다. 공유 버튼을 누르면 기록된 위치 / 날씨 / 메모가 담긴 공유 카드가 생성되며, 기기의 네이티브 공유 시트가 열립니다.

- Web Share API를 활용한 네이티브 공유 시트 호출 (카카오톡, 메일, 메시지 등)
- 공유 카드에 지도 핀 위치 / 날씨 아이콘 / 기온 / 메모 내용 포함
- Web Share API를 지원하지 않는 환경(데스크탑 일부 브라우저)에서는 링크 복사로 자동 폴백
- 공유된 링크로 접속하면 해당 기록의 위치로 지도가 자동 이동

<!-- 공유 기능 시연 스크린샷 -->
![공유 기능](screenshots/share.png)

---

## 기술 스택

| 분류 | 사용 기술 |
|------|----------|
| Frontend | React 18, TypeScript, Vite |
| 지도 | Mapbox GL JS |
| 애니메이션 | Framer Motion |
| 차트 | Recharts |
| 날씨 | OpenWeather API |
| AI | Google Gemini 1.5 Flash |
| 이미지 | Wikipedia REST API |
| 스토리지 | localStorage |
| PWA | vite-plugin-pwa + Workbox |
| 배포 | Netlify |

---

## 개발하면서 신경 쓴 것들

### 모바일 / iOS 대응
- iPhone Safari 안전 영역(Safe Area) 및 화면 밀림 대응
- 검색창 포커스 시 iOS 자동 줌인 방지 (`font-size: 16px` 강제 적용)
- 드래그로 높이를 조절할 수 있는 바텀 시트 패널 구현

### 오프라인 및 PWA
- Workbox 기반 PWA 캐시 설정으로 오프라인 상태에서도 기본 동작
- Netlify 배포로 별도 서버 실행 없이 URL 하나로 바로 접근 가능
- 홈 화면 추가 시 네이티브 앱처럼 전체 화면으로 실행

### API 안정성
- Gemini API 할당량 초과 시 자체 폴백 DB로 자동 전환
- OpenWeather API 응답 실패 시 에러 핸들링 및 빈 상태 UI 처리

### UX 디테일
- 줌 레벨에 따른 히트맵 ↔ 마커 자동 전환
- 네이티브 공유 기능 (카카오톡, 메일 등 Web Share API 활용)
- 다트 애니메이션으로 랜덤 추첨에 시각적 재미 추가
- 첫 실행 시 튜토리얼로 주요 기능 안내
- Web Share API 미지원 환경에서 링크 복사로 자동 폴백 처리

---

## 실행 방법

```bash
npm install
npm run dev
```

`.env` 파일에 아래 키를 입력해야 합니다.

```
VITE_MAPBOX_TOKEN=your_mapbox_token
VITE_OPENWEATHER_KEY=your_openweather_key
VITE_GEMINI_KEY=your_gemini_key
```

---

## 폴더 구조

```
src/
├── components/         # UI 컴포넌트
│   ├── Map/            # Mapbox 지도 관련
│   ├── BottomSheet/    # 바텀 시트 패널
│   ├── BucketList/     # AI 버킷리스트
│   ├── Stats/          # 여행 통계 차트
│   └── RandomTravel/   # 랜덤 추첨
├── hooks/              # 커스텀 훅
├── utils/              # API 호출, 데이터 처리
├── types/              # TypeScript 타입 정의
└── assets/             # 정적 리소스
```

---

## 스크린샷 파일 목록

GitHub에 올릴 때 `screenshots/` 폴더에 아래 파일들을 넣어주세요.

```
screenshots/
├── app_main.png          # 앱 메인 화면 (모바일)
├── app_diary.png         # 일기 작성 화면 (모바일)
├── app_bucket.png        # 버킷리스트 화면 (모바일)
├── app_stats.png         # 통계 화면 (모바일)
├── tutorial_01.png       # 튜토리얼 Step 1 - 히트맵 안내
├── tutorial_02.png       # 튜토리얼 Step 2 - 기록 방법
├── tutorial_03.png       # 튜토리얼 Step 3 - 바텀 시트
├── tutorial_04.png       # 튜토리얼 Step 4 - 추가 기능
├── heatmap.png           # 날씨 히트맵
├── diary.png             # 일기 작성
├── 3d_view.png           # 3D 도시 뷰
├── bucketlist.png        # AI 버킷리스트
├── random_travel.png     # 랜덤 여행 추첨
├── share.png             # 여행 기록 공유
└── stats.png             # 여행 통계
```
