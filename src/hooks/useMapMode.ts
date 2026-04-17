// ============================================================
// useMapMode.ts
// MapModeContext를 소비하는 커스텀 훅
//
// 역할:
//   - Context를 직접 import하는 보일러플레이트 제거
//   - Provider 밖에서 사용 시 명확한 에러 메시지 제공
//   - 자주 쓰는 파생 상태(derived state)를 한 곳에서 계산
// ============================================================

import { useContext } from 'react';
import { MapModeContext } from '../context/MapModeContext';
import type { MapModeContextValue, MapMode } from '../types/mode.types';

// ─────────────────────────────────────────────
// 메인 훅: Context 전체 반환
// ─────────────────────────────────────────────

/**
 * useMapMode
 *
 * MapModeProvider 안에서만 사용 가능.
 * Provider 밖에서 호출하면 명확한 에러를 던져 디버깅을 도움.
 *
 * 사용 예시:
 * ```tsx
 * function MyComponent() {
 *   const { currentMode, updateZoom, getModeLabel } = useMapMode();
 *   return <div>{getModeLabel()}</div>;
 * }
 * ```
 */
export function useMapMode(): MapModeContextValue {
  const context = useContext(MapModeContext);

  if (context === undefined) {
    // 개발 중 실수를 즉시 잡아주는 명확한 에러 메시지
    throw new Error(
      '[AtmoGalaxy] useMapMode()는 <MapModeProvider> 내부에서만 사용 가능합니다.\n' +
      '컴포넌트 트리에서 <MapModeProvider>가 상위에 있는지 확인하세요.'
    );
  }

  return context;
}

// ─────────────────────────────────────────────
// 파생 훅: 특정 상태만 필요할 때 불필요한 구독 최소화
// ─────────────────────────────────────────────

/**
 * useCurrentMode
 * 현재 모드만 필요한 컴포넌트에 최적화된 훅.
 * (예: 조건부 렌더링만 하는 컴포넌트)
 */
export function useCurrentMode(): MapMode {
  const { currentMode } = useMapMode();
  return currentMode;
}

/**
 * useIsMode
 * 특정 모드인지 boolean으로 반환.
 * 조건부 스타일링이나 렌더링에 편리.
 *
 * 사용 예시:
 * ```tsx
 * const isSpot = useIsMode('SPOT');
 * return <div className={isSpot ? 'spot-active' : ''}> ... </div>;
 * ```
 */
export function useIsMode(mode: MapMode): boolean {
  const { currentMode } = useMapMode();
  return currentMode === mode;
}

/**
 * useZoomLevel
 * 현재 줌 레벨과 업데이트 함수만 필요한 컴포넌트용.
 * (예: MapContainer에서 Mapbox 이벤트 연결 시)
 */
export function useZoomLevel(): {
  zoomLevel: number;
  updateZoom: (zoom: number) => void;
} {
  const { zoomLevel, updateZoom } = useMapMode();
  return { zoomLevel, updateZoom };
}

/**
 * useTransition
 * 전환 애니메이션 관련 상태만 구독.
 * (예: FogLayer, GlowSphere 등 3D 컴포넌트의 fade-in/out 타이밍)
 *
 * 반환값:
 * - isTransitioning: 전환 애니메이션 진행 중 여부
 * - transition: 'zoom-in' | 'zoom-out' | 'none'
 * - previousMode: 이전 모드 (전환 시작 시에만 존재)
 */
export function useTransition() {
  const { isTransitioning, transition, previousMode } = useMapMode();
  return { isTransitioning, transition, previousMode };
}

/**
 * useModeInfo
 * 현재 모드에 대한 메타 정보를 한 번에 제공.
 * ModeIndicator HUD 같은 UI 컴포넌트에 적합.
 *
 * 반환값:
 * - currentMode: 현재 모드
 * - label: 한국어 레이블 (예: '🌐 전국 뷰')
 * - zoomLevel: 현재 줌 레벨 (소수점 1자리)
 * - description: 현재 모드에 대한 설명 텍스트
 */
export function useModeInfo() {
  const { currentMode, getModeLabel, zoomLevel } = useMapMode();

  const descriptions: Record<MapMode, string> = {
    NATIONAL: '기록이 쌓인 곳을 발광 구체로 표시합니다',
    ARCHIVE: '소음과 분위기를 3D 안개로 시각화합니다',
    SPOT: '저장된 사진, 오디오, 날씨 정보를 확인합니다',
  };

  return {
    currentMode,
    label: getModeLabel(),
    zoomLevel: Math.round(zoomLevel * 10) / 10, // 소수점 1자리
    description: descriptions[currentMode],
  };
}