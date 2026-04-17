// src/components/FogOverlay.tsx

import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import type mapboxgl from 'mapbox-gl';

interface FogDatum {
  lat: number;
  lng: number;
  color: string;
  label: string;
  weatherEmoji: string;
  isUserRecord?: boolean; // ����� ���� ������ ��� �� �Ȱ� �� ���ϰ�
}

interface Props {
  map: mapboxgl.Map;
  fogData: FogDatum[];
}

// hex �� {r,g,b}
function hexToRgb(hex: string) {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

export default function FogOverlay({ map, fogData }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const tRef = useRef(0);

  const project = (lat: number, lng: number) => {
    const p = map.project([lng, lat]);
    return { x: p.x, y: p.y };
  };

  useEffect(() => {
    if (fogData.length === 0) return;

    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Canvas ũ�� ����ȭ
      const rect = canvas.getBoundingClientRect();
      if (canvas.width !== rect.width || canvas.height !== rect.height) {
        canvas.width = rect.width;
        canvas.height = rect.height;
      }

      tRef.current += 0.006;
      const t = tRef.current;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      fogData.forEach((fd, i) => {
        const { x, y } = project(fd.lat, fd.lng);
        const { r, g, b } = hexToRgb(fd.color);

        // �� ����Ʈ���� ���� �ٸ���
        const phase = i * 2.1;
        const density = fd.isUserRecord ? 1.8 : 1.0; // ����� ����� 1.8�� ���ϰ�

        // ���� ���̾� 1: �а� �帴�� �ܰ� �Ȱ� ����������������������������
        const outerR = 140 + Math.sin(t * 0.4 + phase) * 20;
        const outer = ctx.createRadialGradient(x, y, 0, x, y, outerR);
        outer.addColorStop(0,   `rgba(${r},${g},${b},${0.13 * density})`);
        outer.addColorStop(0.5, `rgba(${r},${g},${b},${0.06 * density})`);
        outer.addColorStop(1,   `rgba(${r},${g},${b},0)`);
        ctx.beginPath();
        ctx.arc(x, y, outerR, 0, Math.PI * 2);
        ctx.fillStyle = outer;
        ctx.fill();

        // ���� ���̾� 2: ���� ��� 3~4�� (���Ī ��ġ) ��������
        const blobs = [
          { ox: 0,                              oy: 0,                              r: 55 + Math.sin(t * 0.5 + phase) * 8 },
          { ox: 38 * Math.cos(t * 0.2 + phase), oy: 20 * Math.sin(t * 0.3 + phase), r: 42 + Math.sin(t * 0.7 + phase + 1) * 6 },
          { ox: -30 * Math.sin(t * 0.25 + phase), oy: -25 * Math.cos(t * 0.2 + phase), r: 38 + Math.sin(t * 0.6 + phase + 2) * 5 },
          { ox: 15 * Math.sin(t * 0.3 + phase + 1), oy: 35 * Math.cos(t * 0.15 + phase), r: 30 + Math.sin(t * 0.8 + phase + 3) * 4 },
        ];

        blobs.forEach(blob => {
          const bx = x + blob.ox;
          const by = y + blob.oy;
          const grad = ctx.createRadialGradient(bx, by, 0, bx, by, blob.r);
          grad.addColorStop(0,   `rgba(${r},${g},${b},0.20)`);
          grad.addColorStop(0.4, `rgba(${r},${g},${b},0.12)`);
          grad.addColorStop(0.8, `rgba(${r},${g},${b},0.03)`);
          grad.addColorStop(1,   `rgba(${r},${g},${b},0)`);
          ctx.beginPath();
          ctx.arc(bx, by, blob.r, 0, Math.PI * 2);
          ctx.fillStyle = grad;
          ctx.fill();
        });

        // ���� ���̾� 3: �߽� �߱� �ھ� ��������������������������������������������
        const coreSize = 16 + Math.sin(t * 1.5 + phase) * 3;
        const corePulse = 0.5 + Math.sin(t * 1.5 + phase) * 0.2;
        const core = ctx.createRadialGradient(x, y, 0, x, y, coreSize);
        core.addColorStop(0,   `rgba(${r},${g},${b},${corePulse})`);
        core.addColorStop(0.6, `rgba(${r},${g},${b},${corePulse * 0.3})`);
        core.addColorStop(1,   `rgba(${r},${g},${b},0)`);
        ctx.beginPath();
        ctx.arc(x, y, coreSize, 0, Math.PI * 2);
        ctx.fillStyle = core;
        ctx.fill();
      });

      // ���� ���� ����Ʈ ���ἱ ��������������������������������������������������������
      fogData.forEach((fd1, i) => {
        const p1 = project(fd1.lat, fd1.lng);
        fogData.forEach((fd2, j) => {
          if (j <= i) return;
          const p2 = project(fd2.lat, fd2.lng);
          const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
          if (dist < 180) {
            const alpha = (1 - dist / 180) * 0.08 * (0.6 + Math.sin(tRef.current + i + j) * 0.4);
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        });
      });

      rafRef.current = requestAnimationFrame(render);
    };

    rafRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafRef.current);
  }, [fogData]);

  return (
    <motion.canvas
      ref={canvasRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.2 }}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
    />
  );
}