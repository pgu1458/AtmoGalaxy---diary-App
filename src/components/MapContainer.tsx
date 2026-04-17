// src/components/MapContainer.tsx
import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import mapboxgl from 'mapbox-gl';
import type * as GeoJSON from 'geojson';
import 'mapbox-gl/dist/mapbox-gl.css';

import { useMapMode } from '../hooks/useMapMode';
import { useTheme, THEME } from '../context/ThemeContext';
import { DEFAULT_CENTER, DEFAULT_ZOOM } from '../constants/zoomThresholds';
import { nationalPoints } from '../data/mockData';
import { pinStore, panelCloseStore } from '../store/pinStore';
import { loadRecords, recordStore, type AtmoRecord } from '../store/recordStore';
import { bucketMapStore, bucketListStore, type BucketItem } from '../store/bucketListStore';
import RecordModal from './RecordModal';
import RecordsList from './RecordsList';
import StatsPanel from './StatsPanel';
import BucketListPanel from './BucketListPanel';
import BucketListButton from './BucketListButton';
import { RandomDartButton } from './RandomDart';
import FeatureTutorial, { isTutSeen, type TutKey } from './FeatureTutorial';

const API_KEY = import.meta.env.VITE_OPENWEATHER_KEY ?? 'c9e9eb367233cb959d24ff54b9f83801';
const MAPBOX_TOKEN = 'pk.eyJ1IjoicGd1MTQ1OCIsImEiOiJjbW50NzV5YTMwbGYzMnFxMHQ1eW9wZHZ3In0.IWo4C3aKCvn_bmrWVsOm2Q';

if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.innerHTML = `
    .mapboxgl-marker { position: absolute !important; display: block; will-change: transform; }
    .mapboxgl-popup-content {
      background: rgba(13,17,30,0.95) !important; backdrop-filter: blur(8px);
      border-radius: 10px !important; box-shadow: 0 4px 20px rgba(0,0,0,0.5) !important;
      border: 1px solid rgba(255,255,255,0.1); padding: 8px 12px !important;
    }
    .mapboxgl-popup-tip { border-top-color: rgba(13,17,30,0.95) !important; }
    .mapboxgl-popup-content div { color: #e2e8f0 !important; font-size: 13px; font-weight: 600; }
    @keyframes marker-pulse {
      0%,100% { box-shadow: 0 0 8px var(--mc), 0 0 3px var(--mc); }
      50%      { box-shadow: 0 0 20px var(--mc), 0 0 8px var(--mc); }
    }
  `;
  document.head.appendChild(style);
}

function getWeatherStyle(iconCode: string): { color: string; emoji: string; label: string } {
  const code = iconCode.slice(0, 2);
  switch (code) {
    case '01': return { color: '#FFD700', emoji: '☀️', label: '맑음' };
    case '02': return { color: '#00CFFF', emoji: '⛅', label: '구름 조금' };
    case '03':
    case '04': return { color: '#8899AA', emoji: '☁️', label: '흐림' };
    case '09':
    case '10': return { color: '#1D6FFF', emoji: '🌧️', label: '비' };
    case '11': return { color: '#CC00FF', emoji: '⛈️', label: '뇌우' };
    case '13': return { color: '#AAEEFF', emoji: '❄️', label: '눈' };
    case '50': return { color: '#99AAAA', emoji: '🌫️', label: '안개' };
    default:   return { color: '#AAAAAA', emoji: '🌡️', label: '알 수 없음' };
  }
}

// ── 기본 마커 색상 (날씨 로드 전 지역별 임시 색상) ──────────
function getDefaultColor(id: number): string {
  if (id >= 1   && id <= 10)  return '#3b82f6'; // 수도권 파랑
  if (id >= 11  && id <= 20)  return '#10b981'; // 강원 에메랄드
  if (id >= 21  && id <= 30)  return '#f97316'; // 충청 주황
  if (id >= 31  && id <= 35)  return '#f59e0b'; // 충청2 앰버
  if (id >= 36  && id <= 50)  return '#a855f7'; // 경상 보라
  if (id >= 51  && id <= 60)  return '#6366f1'; // 전라 인디고
  if (id >= 61  && id <= 70)  return '#e11d48'; // 제주 로즈
  if (id >= 101 && id <= 110) return '#f43f5e'; // 홋카이도 핑크
  if (id >= 111 && id <= 125) return '#f59e0b'; // 관동 앰버
  if (id >= 126 && id <= 140) return '#84cc16'; // 주부 라임
  if (id >= 141 && id <= 155) return '#38bdf8'; // 간사이 스카이
  return '#a8a29e';
}

// ── 날씨 Glow Heatmap (마커 없이 지도에 직접 색상 표현) ────────────────────
function updateWeatherHeatmap(
  map: mapboxgl.Map,
  points: { lat: number; lng: number; color: string }[]
) {
  if (!points.length) return;
  const geojson: GeoJSON.FeatureCollection = {
    type: 'FeatureCollection',
    features: points.map(p => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [p.lng, p.lat] },
      properties: { color: p.color },
    })),
  };
  try {
    if (map.getSource('weather-glow-src')) {
      (map.getSource('weather-glow-src') as mapboxgl.GeoJSONSource).setData(geojson);
      return;
    }
    map.addSource('weather-glow-src', { type: 'geojson', data: geojson });
    // 외곽 넓은 글로우
    map.addLayer({
      id: 'weather-glow-outer', type: 'circle', source: 'weather-glow-src',
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 1, 80, 7, 200, 9, 60, 14, 0],
        'circle-color': ['get', 'color'],
        'circle-opacity': 0.10, 'circle-blur': 1,
      },
    }, 'waterway-label');
    // 중간 글로우
    map.addLayer({
      id: 'weather-glow-mid', type: 'circle', source: 'weather-glow-src',
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 1, 40, 7, 100, 9, 30, 14, 0],
        'circle-color': ['get', 'color'],
        'circle-opacity': 0.22, 'circle-blur': 0.75,
      },
    }, 'waterway-label');
    // 코어
    map.addLayer({
      id: 'weather-glow-core', type: 'circle', source: 'weather-glow-src',
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 1, 5, 7, 9, 9, 3, 14, 0],
        'circle-color': ['get', 'color'],
        'circle-opacity': 0.80, 'circle-blur': 0.2,
      },
    }, 'waterway-label');
  } catch (e) { console.warn('[Heatmap]', e); }
}

function toggleWeatherHeatmap(map: mapboxgl.Map, visible: boolean) {
  const v = visible ? 'visible' : 'none';
  ['weather-glow-outer', 'weather-glow-mid', 'weather-glow-core'].forEach(id => {
    try { if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', v); } catch {}
  });
}

// ── 버킷리스트 마커 엘리먼트 생성 ─────────────────────────
function createBucketMarkerEl(item: BucketItem): HTMLElement {
  const el = document.createElement('div');
  el.style.cssText = 'width:30px; height:36px; cursor:pointer;';
  const inner = document.createElement('div');
  const isDone = item.completed;
  inner.style.cssText = `
    width:28px; height:28px;
    background:${isDone ? 'linear-gradient(135deg,#22c55e,#4ade80)' : 'linear-gradient(135deg,#7c3aed,#a855f7)'};
    border-radius:50% 50% 50% 0; transform:rotate(-45deg);
    display:flex; align-items:center; justify-content:center;
    border:2px solid rgba(255,255,255,0.35);
    box-shadow:0 4px 12px ${isDone ? 'rgba(74,222,128,0.55)' : 'rgba(168,85,247,0.55)'};
    transition:transform 0.18s ease;
  `;
  const emojiEl = document.createElement('div');
  emojiEl.style.cssText = 'transform:rotate(45deg);font-size:12px;line-height:1;color:white;font-weight:bold;';
  emojiEl.textContent = isDone ? '✓' : item.emoji;
  inner.appendChild(emojiEl);
  el.appendChild(inner);
  el.addEventListener('mouseenter', () => { inner.style.transform = 'rotate(-45deg) scale(1.2)'; });
  el.addEventListener('mouseleave', () => { inner.style.transform = 'rotate(-45deg) scale(1)'; });
  return el;
}

const viewVariants = {
  enterZoomIn:  { opacity: 0, scale: 1.05, y: 10 },
  enterZoomOut: { opacity: 0, scale: 0.95, y: -10 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' as const } },
  exit:    { opacity: 0, transition: { duration: 0.3, ease: 'easeIn' as const } },
};

interface MapContainerProps {
  mapFlyToRef?: React.MutableRefObject<((lng: number, lat: number) => void) | null>;
}

export default function MapContainer({ mapFlyToRef }: MapContainerProps = {}) {
  const { currentMode, transition, updateZoom } = useMapMode();
  const { isDark } = useTheme();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [loadedCount, setLoadedCount] = useState(0);

  const [pendingPin, setPendingPin] = useState<{ lat: number; lng: number; x: number; y: number } | null>(null);
  const [userRecords, setUserRecords] = useState<AtmoRecord[]>(() => loadRecords());
  const [showRecordsList, setShowRecordsList] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showBucketList, setShowBucketList] = useState(false);
  // 온보딩 마지막 탭이 맵 버튼으로 전파되는 것을 막기 위한 딜레이
  const [interactable, setInteractable] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setInteractable(true), 700);
    return () => clearTimeout(t);
  }, []);
  // 다트 튜토리얼은 첫 클릭 시에만 표시 (다른 버튼과 동일한 방식)
  // 버튼별 첫 클릭 튜토리얼
  const [activeTut, setActiveTut] = useState<TutKey | null>(null);
  const userMarkerRefs = useRef<mapboxgl.Marker[]>([]);
  const nationalMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const [spotPois, setSpotPois] = useState<any[]>([]);
  const cachedGlowPointsRef = useRef<{ lat: number; lng: number; color: string }[]>([]);
  const bucketMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const searchLockRef = useRef(false); // 검색 후 클릭 방지

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    mapboxgl.accessToken = MAPBOX_TOKEN;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: DEFAULT_CENTER, zoom: DEFAULT_ZOOM,
      pitch: 45, bearing: 0, antialias: true,
    });

    map.on('zoom', () => updateZoom(map.getZoom()));
    map.on('zoomend', () => updateZoom(map.getZoom()));
    map.on('click', (e) => {
      if (searchLockRef.current) return; // 검색 직후 클릭 무시
      const point = map.project(e.lngLat);
      setPendingPin({ lat: e.lngLat.lat, lng: e.lngLat.lng, x: point.x, y: point.y });
    });

    // mapFlyToRef에 flyTo 함수 등록
    if (mapFlyToRef) {
      mapFlyToRef.current = (lng: number, lat: number) => {
        searchLockRef.current = true;
        setTimeout(() => { searchLockRef.current = false; }, 2000);
        map.flyTo({ center: [lng, lat], zoom: 10, duration: 1500, essential: true });
      };
    }

    map.on('load', () => {
      setIsMapReady(true);

      const safeSet = (layer: string, prop: string, value: any) => {
        try { if (map.getLayer(layer)) map.setPaintProperty(layer, prop as any, value); } catch {}
      };

      safeSet('background', 'background-color', '#060d1f');
      ['land','landuse','landcover','national-park','landuse-residential'].forEach(id => {
        safeSet(id, 'fill-color', '#0a1628'); safeSet(id, 'fill-opacity', 1);
      });
      ['water','water-shadow'].forEach(id => safeSet(id, 'fill-color', '#040e24'));
      ['road-motorway-trunk','road-primary','road-secondary-tertiary','road-street',
       'road-minor','road-path','tunnel-motorway-trunk','road-motorway-trunk-case',
       'road-primary-case','road-secondary-tertiary-case',
      ].forEach(id => safeSet(id, 'line-color', '#1a2744'));
      ['admin-0-boundary','admin-1-boundary','admin-0-boundary-disputed'].forEach(id =>
        safeSet(id, 'line-color', '#1e3a6e'));
      safeSet('building', 'fill-color', '#0d1f3c');
      safeSet('building', 'fill-outline-color', '#162840');

      // 3D 건물
      if (!map.getLayer('atmo-3d-buildings')) {
        try {
          map.addLayer({
            id: 'atmo-3d-buildings', source: 'composite', 'source-layer': 'building',
            filter: ['==', 'extrude', 'true'], type: 'fill-extrusion', minzoom: 14,
            paint: {
              'fill-extrusion-color': ['interpolate', ['linear'], ['coalesce', ['get', 'height'], 10],
                0,'#0d1f3c', 20,'#162a5a', 50,'#1e3a7a', 100,'#244492', 200,'#2a50aa'],
              'fill-extrusion-height': ['interpolate', ['linear'], ['zoom'], 14, 0, 16, ['coalesce', ['get', 'height'], 15]],
              'fill-extrusion-base': ['interpolate', ['linear'], ['zoom'], 14, 0, 16, ['coalesce', ['get', 'min_height'], 0]],
              'fill-extrusion-opacity': 0,
              'fill-extrusion-ambient-occlusion-intensity': 0.6,
              'fill-extrusion-ambient-occlusion-radius': 4,
            },
          });
        } catch(e) {}
      }

      ['country-label','state-label','settlement-label','settlement-subdivision-label',
       'airport-label','poi-label','water-point-label','water-line-label',
       'natural-point-label','waterway-label','road-label',
      ].forEach(id => {
        safeSet(id, 'text-color', '#4a7fa5');
        safeSet(id, 'text-halo-color', '#060d1f');
        safeSet(id, 'text-halo-width', 1.5);
      });
      safeSet('country-label', 'text-color', '#6b9fcf');

      // ── heatmap 초기화 (zoom < 8 전국뷰, 기본 회색) ─────────
      const initialGlow = nationalPoints.map(p => ({
        lat: p.lat, lng: p.lng, color: getDefaultColor(p.id),
      }));
      cachedGlowPointsRef.current = initialGlow;
      updateWeatherHeatmap(map, initialGlow);

      // heatmap은 zoom < 8 에서만, 마커는 항상 표시
      const applyHeatmapOnly = () => toggleWeatherHeatmap(map, map.getZoom() < 8);
      applyHeatmapOnly();
      map.on('zoom', applyHeatmapOnly);

      // ── 1단계: 마커 기본 색상으로 즉시 생성 ─────────────────
      const innerEls: Record<number, HTMLElement> = {};  // ← inner 직접 저장
      const popupRefs: Record<number, mapboxgl.Popup> = {};
      const localNatMarkers: mapboxgl.Marker[] = [];

      nationalPoints.forEach(point => {
        const col = getDefaultColor(point.id);

        // outer: Mapbox가 transform 관리 (절대 건드리지 않음)
        const outer = document.createElement('div');
        outer.style.cssText = 'width:18px;height:18px;cursor:pointer;';

        // inner: 색상·애니메이션 전용
        const inner = document.createElement('div');
        inner.style.cssText = `
          width:18px;height:18px;border-radius:50%;
          background:#ffffff;
          border:3px solid ${col};
          box-shadow:0 0 18px ${col},0 0 6px ${col};
          transition:transform 0.15s ease,border-color 0.6s ease,box-shadow 0.6s ease;
        `;
        outer.appendChild(inner);

        const popup = new mapboxgl.Popup({ closeButton: false, closeOnClick: false, offset: 15 })
          .setHTML(`<div style="display:flex;align-items:center;gap:6px;padding:2px 4px"><span style="color:${col}">●</span><span>${point.label}</span></div>`);

        outer.addEventListener('click', (e) => {
          e.stopPropagation();
          pinStore.emit(point);
          map.flyTo({ center: [point.lng, point.lat], zoom: 8.5, duration: 1200, essential: true });
        });
        outer.addEventListener('mouseenter', () => {
          inner.style.transform = 'scale(1.4)';
          popup.setLngLat([point.lng, point.lat]).addTo(map);
        });
        outer.addEventListener('mouseleave', () => {
          inner.style.transform = 'scale(1)';
          popup.remove();
        });

        const m = new mapboxgl.Marker({ element: outer, anchor: 'center' })
          .setLngLat([point.lng, point.lat])
          .addTo(map);

        innerEls[point.id] = inner;   // ← inner 직접 저장 (outer 아님)
        popupRefs[point.id] = popup;
        localNatMarkers.push(m);
      });

      nationalMarkersRef.current = localNatMarkers;

      // ── 2단계: 날씨 API → inner 직접 색상 업데이트 ──────────
      nationalPoints.forEach((point, idx) => {
        setTimeout(async () => {
          try {
            const res = await fetch(
              `https://api.openweathermap.org/data/2.5/weather?lat=${point.lat}&lon=${point.lng}&appid=${API_KEY}&units=metric`
            );
            if (!res.ok) {
              console.warn(`[Weather] ${point.label} 실패: HTTP ${res.status}`);
              setLoadedCount(n => n + 1); return;
            }

            const data = await res.json();
            if (!data.weather?.[0]?.icon) {
              console.warn(`[Weather] ${point.label} 데이터 없음:`, data);
              setLoadedCount(n => n + 1); return;
            }
            const ws = getWeatherStyle(data.weather[0].icon);

            // inner에 직접 색상 적용 (applyMarkerColor 거치지 않음)
            const inner = innerEls[point.id];
            if (inner) {
              inner.style.border = `3px solid ${ws.color}`;
              inner.style.boxShadow = `0 0 25px ${ws.color},0 0 10px ${ws.color},0 0 4px ${ws.color}`;
              inner.style.animation = 'marker-pulse 2.5s ease-in-out infinite';
            }

            // 팝업 업데이트
            popupRefs[point.id]?.setHTML(`
              <div style="display:flex;align-items:center;gap:6px;padding:2px 4px">
                <span>${ws.emoji}</span>
                <span style="color:#e2e8f0;font-weight:600">${point.label}</span>
                <span style="color:#9ca3af;font-size:11px">${ws.label}</span>
              </div>
            `);

            // heatmap 색상 업데이트
            const gi = cachedGlowPointsRef.current.findIndex(
              p => p.lat === point.lat && p.lng === point.lng
            );
            if (gi !== -1) {
              cachedGlowPointsRef.current[gi].color = ws.color;
              updateWeatherHeatmap(map, cachedGlowPointsRef.current);
            }

            setLoadedCount(n => n + 1);
          } catch {
            setLoadedCount(n => n + 1);
          }
        }, idx * 200);
      });
    });

    mapRef.current = map;

    // safe area 밖까지 캔버스 확장 후 resize 강제 호출
    requestAnimationFrame(() => { try { map.resize(); } catch {} });
    setTimeout(() => { try { map.resize(); } catch {} }, 300);
    setTimeout(() => { try { map.resize(); } catch {} }, 1000);

    const unsubClose = panelCloseStore.subscribe(() => {});
    const unsubRecords = recordStore.subscribe((records) => setUserRecords([...records]));
    return () => { map.remove(); mapRef.current = null; unsubClose(); unsubRecords(); };
  }, []);


  // ── 테마 변경 ────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapReady) return;
    map.setStyle(isDark ? THEME.dark.mapStyle : THEME.light.mapStyle);

    map.once('style.load', () => {
      const safeSet = (layer: string, prop: string, value: any) => {
        try { if (map.getLayer(layer)) map.setPaintProperty(layer, prop as any, value); } catch {}
      };
      if (isDark) {
        safeSet('background', 'background-color', '#060d1f');
        ['land','landuse','landcover','national-park','landuse-residential'].forEach(id => safeSet(id, 'fill-color', '#0a1628'));
        ['water','water-shadow'].forEach(id => safeSet(id, 'fill-color', '#040e24'));
        ['road-motorway-trunk','road-primary','road-secondary-tertiary','road-street','road-minor'].forEach(id => safeSet(id, 'line-color', '#1a2744'));
        ['admin-0-boundary','admin-1-boundary'].forEach(id => safeSet(id, 'line-color', '#1e3a6e'));
        safeSet('building', 'fill-color', '#0d1f3c');
        ['country-label','state-label','settlement-label','settlement-subdivision-label','poi-label','water-point-label','road-label'].forEach(id => {
          safeSet(id, 'text-color', '#4a7fa5'); safeSet(id, 'text-halo-color', '#060d1f');
        });
      }
      if (!map.getLayer('atmo-3d-buildings')) {
        try {
          map.addLayer({
            id: 'atmo-3d-buildings', source: 'composite', 'source-layer': 'building',
            filter: ['==', 'extrude', 'true'], type: 'fill-extrusion', minzoom: 14,
            paint: {
              'fill-extrusion-color': ['interpolate', ['linear'], ['coalesce', ['get', 'height'], 10],
                0, isDark ? '#0d1f3c' : '#b0c4de', 20, isDark ? '#162a5a' : '#8aaac8',
                50, isDark ? '#1e3a7a' : '#6090b4', 200, isDark ? '#2a50aa' : '#4070a0'],
              'fill-extrusion-height': ['interpolate', ['linear'], ['zoom'], 14, 0, 16, ['coalesce', ['get', 'height'], 15]],
              'fill-extrusion-base': ['interpolate', ['linear'], ['zoom'], 14, 0, 16, ['coalesce', ['get', 'min_height'], 0]],
              'fill-extrusion-opacity': 0,
              'fill-extrusion-ambient-occlusion-intensity': 0.6,
              'fill-extrusion-ambient-occlusion-radius': 4,
            },
          });
          if (map.getZoom() >= 14) {
            setTimeout(() => {
              try { if (map.getLayer('atmo-3d-buildings')) map.setPaintProperty('atmo-3d-buildings', 'fill-extrusion-opacity', 0.85); } catch {}
              safeSet('building', 'fill-opacity', 0);
              safeSet('poi-label', 'text-color', '#7dd3fc');
            }, 150);
          }
        } catch(e) {}
      }
      // heatmap 재등록
      if (cachedGlowPointsRef.current.length > 0) {
        updateWeatherHeatmap(map, cachedGlowPointsRef.current);
        toggleWeatherHeatmap(map, map.getZoom() < 8);
      }
    });
  }, [isDark, isMapReady]);


  // ── 사용자 기록 마커 ─────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapReady) return;
    userMarkerRefs.current.forEach(m => m.remove());
    userMarkerRefs.current = [];

    userRecords.forEach(record => {
      const col = record.weatherColor || '#a855f7';
      const el = document.createElement('div');
      el.style.cssText = 'width:28px; height:28px; cursor:pointer;';
      const inner = document.createElement('div');
      inner.style.cssText = `
        width:28px; height:28px; border-radius:50%;
        background:${col};
        border:2.5px solid white;
        box-shadow:0 0 12px ${col}, 0 0 24px ${col}66;
        line-height:28px; text-align:center; font-size:14px;
        transition:transform 0.15s ease;
        display:flex; align-items:center; justify-content:center;
      `;
      inner.textContent = record.weatherEmoji || '★';
      el.appendChild(inner);
      el.addEventListener('mouseenter', () => { inner.style.transform = 'scale(1.4)'; });
      el.addEventListener('mouseleave', () => { inner.style.transform = 'scale(1)'; });
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        pinStore.emit(record);
        map.flyTo({ center: [record.lng, record.lat], zoom: 8.5, duration: 1200, essential: true });
      });
      const marker = new mapboxgl.Marker({ element: el, anchor: 'center' })
        .setLngLat([record.lng, record.lat]).addTo(map);
      userMarkerRefs.current.push(marker);
    });
  }, [userRecords, isMapReady]);


  // ── 버킷리스트 마커 ──────────────────────────────────────
  // 위치 관련 카테고리만 지도에 핀 표시
  const LOCATION_CATEGORIES = new Set(['여행', '자연', '문화', '음식']);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapReady) return;

    const renderBucketMarkers = (items: BucketItem[]) => {
      bucketMarkersRef.current.forEach(m => m.remove());
      bucketMarkersRef.current = [];

      // 여행·자연·문화·음식 카테고리만 지도에 표시
      items.filter(item => LOCATION_CATEGORIES.has(item.category)).forEach(item => {
        const el = createBucketMarkerEl(item);
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          map.flyTo({ center: [item.lng, item.lat], zoom: 12, duration: 1200, essential: true });
        });
        const marker = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
          .setLngLat([item.lng, item.lat]).addTo(map);
        bucketMarkersRef.current.push(marker);
      });
    };

    renderBucketMarkers(bucketListStore.getItems());
    return bucketMapStore.subscribe(renderBucketMarkers);
  }, [isMapReady]);


  // ── SPOT 모드: 3D 건물 + POI ─────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapReady) return;
    const safeSet = (layer: string, prop: string, value: any) => {
      try { if (map.getLayer(layer)) map.setPaintProperty(layer, prop as any, value); } catch {}
    };
    if (currentMode === 'SPOT') {
      try { if (map.getLayer('atmo-3d-buildings')) map.setPaintProperty('atmo-3d-buildings', 'fill-extrusion-opacity', 0.85); } catch {}
      safeSet('building', 'fill-opacity', 0);
      safeSet('poi-label', 'text-color', '#7dd3fc');
      safeSet('poi-label', 'text-halo-color', '#060d1f');
      const center = map.getCenter();
      fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${center.lng},${center.lat}.json?types=poi&limit=8&language=ko&access_token=${MAPBOX_TOKEN}`)
        .then(r => r.json()).then(data => setSpotPois(data.features ?? [])).catch(() => setSpotPois([]));
    } else {
      try { if (map.getLayer('atmo-3d-buildings')) map.setPaintProperty('atmo-3d-buildings', 'fill-extrusion-opacity', 0); } catch {}
      safeSet('building', 'fill-opacity', 1);
      safeSet('poi-label', 'text-color', '#4a7fa5');
      setSpotPois([]);
    }
  }, [currentMode, isMapReady, isDark]);


  // ── 누적 안개 시각화 ─────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapReady || userRecords.length === 0) return;
    const SOURCE_ID = 'atmo-fog-source';
    const geojson: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: userRecords.map(r => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [r.lng, r.lat] },
        properties: { intensity: 1 },
      })),
    };
    try {
      if (map.getSource(SOURCE_ID)) {
        (map.getSource(SOURCE_ID) as mapboxgl.GeoJSONSource).setData(geojson);
      } else {
        map.addSource(SOURCE_ID, { type: 'geojson', data: geojson });
        map.addLayer({
          id: 'atmo-fog-layer', type: 'heatmap', source: SOURCE_ID, maxzoom: 14,
          paint: {
            'heatmap-weight': 1,
            'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 0.4, 9, 1.2],
            'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 20, 9, 60],
            'heatmap-opacity': ['interpolate', ['linear'], ['zoom'], 7, 0.75, 13, 0],
            'heatmap-color': ['interpolate', ['linear'], ['heatmap-density'],
              0,'rgba(0,0,0,0)', 0.2,'rgba(100,30,180,0.4)',
              0.5,'rgba(80,130,255,0.6)', 0.8,'rgba(140,200,255,0.7)', 1.0,'rgba(220,240,255,0.85)'],
          },
        });
      }
    } catch(e) { console.warn('fog layer error', e); }
  }, [userRecords, isMapReady]);


  const enterVariant = transition === 'zoom-in' ? 'enterZoomIn' : 'enterZoomOut';
  const total = nationalPoints.length;

  return (
    <>
      <div style={{
          position: 'absolute',
          inset: 0,
        }}>
        {/* 지도 캔버스: #root 기준 absolute (Safari 주소창 제외) */}
        <div ref={mapContainerRef} style={{
          position: 'absolute',
          inset: 0,
        }} />



      {isMapReady && (
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <AnimatePresence mode="wait">
            <motion.div key={currentMode} style={{ position: 'absolute', inset: 0 }}
              variants={viewVariants} initial={enterVariant} animate="visible" exit="exit" />
          </AnimatePresence>

          {currentMode === 'SPOT' && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }} transition={{ duration: 0.4 }}
              style={{ position: 'absolute', bottom: 'calc(env(safe-area-inset-bottom) + 100px)', left: '16px', right: '16px', pointerEvents: 'none' }}>
              {spotPois.length > 0 && (
                <div style={{ background: 'rgba(6,13,31,0.88)', backdropFilter: 'blur(12px)', borderRadius: '16px', border: '1px solid rgba(16,185,129,0.3)', padding: '12px 14px' }}>
                  <p style={{ fontSize: '10px', color: '#10b981', fontWeight: 700, letterSpacing: '0.1em', margin: '0 0 8px' }}>📍 주변 장소</p>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {spotPois.slice(0, 5).map((poi: any) => (
                      <div key={poi.id} style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '20px', padding: '4px 10px', fontSize: '11px', color: 'rgba(255,255,255,0.8)' }}>
                        {poi.text}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {loadedCount < total && (
            <div style={{ position: 'absolute', bottom: '32px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(13,17,30,0.85)', backdropFilter: 'blur(8px)', borderRadius: '20px', padding: '8px 18px', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', border: '2px solid #374151', borderTopColor: '#60a5fa', animation: 'spin 0.7s linear infinite' }} />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                날씨 데이터 수신 중 {loadedCount}/{total}
              </span>
              <div style={{ width: '80px', height: '3px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: '2px', background: 'linear-gradient(90deg,#3b82f6,#60a5fa)', width: `${(loadedCount / total) * 100}%`, transition: 'width 0.3s ease' }} />
              </div>
            </div>
          )}

          {loadedCount >= total && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
              style={{ position: 'absolute', bottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)', left: '16px', background: 'rgba(13,17,30,0.85)', backdropFilter: 'blur(8px)', borderRadius: '20px', padding: '8px 14px', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', maxWidth: 'calc(100vw - 32px)' }}>
              {[
                { color: '#FFD700', label: '맑음' }, { color: '#00CFFF', label: '구름' },
                { color: '#1D6FFF', label: '비' },   { color: '#CC00FF', label: '뇌우' },
                { color: '#8899AA', label: '흐림' }, { color: '#AAEEFF', label: '눈' },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: item.color, boxShadow: `0 0 6px ${item.color}` }} />
                  <span style={{ fontSize: '11px', color: '#9ca3af' }}>{item.label}</span>
                </div>
              ))}
            </motion.div>
          )}
        </div>
      )}

      <RecordModal pending={pendingPin} onClose={() => setPendingPin(null)} />

      <div style={{ position: 'fixed', bottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)', right: '24px', display: 'flex', gap: '8px', zIndex: 100 }}>
        {userRecords.length >= 1 && (
          <div onClick={() => {
            if (!interactable) return;
            if (!isTutSeen('stats')) { setActiveTut('stats'); return; }
            setShowStats(true);
          }}
            style={{ background: 'rgba(6,13,31,0.92)', backdropFilter: 'blur(12px)', borderRadius: '20px', padding: '7px 14px', border: '1px solid rgba(59,130,246,0.35)', display: 'flex', alignItems: 'center', gap: '7px', cursor: 'pointer' }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(59,130,246,0.7)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(59,130,246,0.35)')}>
            <span style={{ fontSize: '13px' }}>📊</span>
            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', fontWeight: 600 }}>통계</span>
          </div>
        )}
        <div onClick={() => {
          if (!interactable) return;
          if (!isTutSeen('records')) { setActiveTut('records'); return; }
          setShowRecordsList(true);
        }}
          style={{ background: 'rgba(6,13,31,0.92)', backdropFilter: 'blur(12px)', borderRadius: '20px', padding: '7px 14px', border: '1px solid rgba(168,85,247,0.35)', display: 'flex', alignItems: 'center', gap: '7px', cursor: 'pointer' }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(168,85,247,0.7)')}
          onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(168,85,247,0.35)')}>
          <span style={{ color: '#a855f7', fontSize: '13px' }}>★</span>
          <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', fontWeight: 600 }}>기록 {userRecords.length}개</span>
        </div>
      </div>

      <BucketListButton onClick={() => {
        if (!interactable) return;
        if (!isTutSeen('bucket')) { setActiveTut('bucket'); return; }
        setShowBucketList(true);
      }} />

      {/* 🎯 랜덤 여행 추첨 버튼 */}
      <RandomDartButton
        onFlyTo={(lng, lat, _label) => {
          if (mapRef.current) {
            mapRef.current.flyTo({ center: [lng, lat], zoom: 9, duration: 2000, essential: true });
          }
        }}
        onFirstClick={() => {
          if (!interactable) return true;
          if (!isTutSeen('dart')) { setActiveTut('dart'); return true; }
          return false;
        }}
      />

      <RecordsList open={showRecordsList} onClose={() => setShowRecordsList(false)} />
      <StatsPanel open={showStats} onClose={() => setShowStats(false)} />
      <BucketListPanel isOpen={showBucketList} onClose={() => setShowBucketList(false)} />

      {/* 버튼별 첫 클릭 튜토리얼 */}
      <AnimatePresence>
        {activeTut && (
          <FeatureTutorial
            tutKey={activeTut}
            onClose={() => {
              const key = activeTut;
              setActiveTut(null);
              // 튜토리얼 닫힌 후 해당 기능 열기
              setTimeout(() => {
                if (key === 'stats')   setShowStats(true);
                if (key === 'records') setShowRecordsList(true);
                if (key === 'bucket')  setShowBucketList(true);
                // dart는 RandomDartButton이 자체 패널을 열음
              }, 300);
            }}
          />
        )}
      </AnimatePresence>
    </div>
    </>
  );
}