import React, { createContext, useCallback, useReducer, useEffect, useRef } from 'react';
import type { MapMode, MapModeContextValue, MapModeState } from '../types/mode.types';
import { DEFAULT_ZOOM, TRANSITION_DURATION_MS, ZOOM_THRESHOLDS } from '../constants/zoomThresholds';

const initialState: MapModeState = {
  currentMode: 'NATIONAL',
  previousMode: null,
  transition: 'none',
  zoomLevel: DEFAULT_ZOOM,
  isTransitioning: false,
};

type Action =
  | { type: 'UPDATE_STATE'; payload: Partial<MapModeState> }
  | { type: 'TRANSITION_COMPLETE' };

function mapModeReducer(state: MapModeState, action: Action): MapModeState {
  switch (action.type) {
    case 'UPDATE_STATE':
      return { ...state, ...action.payload };
    case 'TRANSITION_COMPLETE':
      return { ...state, isTransitioning: false, previousMode: null, transition: 'none' };
    default:
      return state;
  }
}

const MapModeContext = createContext<MapModeContextValue | undefined>(undefined);

export function MapModeProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(mapModeReducer, initialState);
  const transitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 1. 줌 레벨에 따른 모드 결정 함수
  const getModeForZoom = (zoom: number): MapMode => {
    if (zoom <= ZOOM_THRESHOLDS.NATIONAL.max) return 'NATIONAL';
    if (zoom <= ZOOM_THRESHOLDS.ARCHIVE.max) return 'ARCHIVE';
    return 'SPOT';
  };

  // 2. 핵심: 줌 업데이트 (고정값/버퍼 0%)
  const updateZoom = useCallback((newZoom: number) => {
    const nextMode = getModeForZoom(newZoom);
    const isModeChanging = nextMode !== state.currentMode;

    if (isModeChanging) {
      // 모드가 바뀔 때: transition 방향과 함께 새 줌 레벨(실수)을 즉시 반영
      dispatch({
        type: 'UPDATE_STATE',
        payload: {
          currentMode: nextMode,
          previousMode: state.currentMode,
          zoomLevel: newZoom, // 7.5 같은 고정값 절대 안 씀
          isTransitioning: true,
          transition: newZoom > state.zoomLevel ? 'zoom-in' : 'zoom-out'
        }
      });
    } else {
      // 모드가 유지될 때: 실시간 수치 업데이트
      dispatch({
        type: 'UPDATE_STATE',
        payload: { zoomLevel: newZoom }
      });
    }
  }, [state]);

  // 애니메이션 타이머 클린업
  useEffect(() => {
    if (!state.isTransitioning) return;
    if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
    transitionTimerRef.current = setTimeout(() => dispatch({ type: 'TRANSITION_COMPLETE' }), TRANSITION_DURATION_MS);
    return () => { if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current); };
  }, [state.isTransitioning]);

  const contextValue: MapModeContextValue = {
    ...state,
    updateZoom,
    forceMode: (mode) => dispatch({ type: 'UPDATE_STATE', payload: { currentMode: mode, isTransitioning: true } }),
    getModeLabel: () => {
      const labels: Record<MapMode, string> = { NATIONAL: '🌐 전국 뷰', ARCHIVE: '🌫️ 지역 아카이브', SPOT: '📍 스팟 상세' };
      return labels[state.currentMode];
    },
    getModeForZoom,
  };

  return <MapModeContext.Provider value={contextValue}>{children}</MapModeContext.Provider>;
}

export { MapModeContext };