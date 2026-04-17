// src/components/RecordsList.tsx
import React, { useEffect, useState, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { loadRecords, deleteRecord, updateRecord, recordStore, type AtmoRecord } from '../store/recordStore';
import CalendarView from './CalendarView';
import { useTheme, THEME } from '../context/ThemeContext';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function RecordsList({ open, onClose }: Props) {
  const [records, setRecords] = useState<AtmoRecord[]>(() => loadRecords());
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editMemo, setEditMemo] = useState('');
  const [editPhoto, setEditPhoto] = useState<string | null>(null);
  const [panelHeight, setPanelHeight] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY = useRef<number | null>(null);
  const dragStartHeight = useRef<number>(50);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isDark } = useTheme();
  const t = isDark ? THEME.dark : THEME.light;

  useEffect(() => {
    const unsub = recordStore.subscribe(setRecords);
    return unsub;
  }, []);

  const handleResizeStart = (e: React.PointerEvent) => {
    dragStartY.current = e.clientY;
    dragStartHeight.current = panelHeight;
    setIsDragging(true);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleResizeMove = (e: React.PointerEvent) => {
    if (dragStartY.current === null) return;
    const delta = dragStartY.current - e.clientY;
    const deltaVh = (delta / window.innerHeight) * 100;
    const next = Math.max(20, Math.min(85, dragStartHeight.current + deltaVh));
    setPanelHeight(next);
  };

  const handleResizeEnd = () => {
    if (dragStartY.current === null) return;
    dragStartY.current = null;
    setIsDragging(false);
    // 스냅: 20vh 이하면 닫기
    if (panelHeight < 22) onClose();
  };

  const startEdit = (record: AtmoRecord) => {
    setEditingId(record.id);
    setEditLabel(record.label);
    setEditMemo(record.memo);
    setEditPhoto(record.photoBase64 ?? null);
  };

  const cancelEdit = () => { setEditingId(null); setEditPhoto(null); };

  const saveEdit = () => {
    if (!editingId) return;
    updateRecord(editingId, { label: editLabel, memo: editMemo, photoBase64: editPhoto ?? undefined });
    setEditingId(null);
  };

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
        setEditPhoto(canvas.toDataURL('image/jpeg', 0.75));
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <AnimatePresence onExitComplete={() => setPanelHeight(50)}>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 9997 }}
          />

          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
            style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9998 }}
          >
          <div
            style={{
              height: `${panelHeight}vh`,
              background: t.panelBg, backdropFilter: 'blur(20px)',
              borderRadius: '20px 20px 0 0',
              border: `1px solid ${t.panelBorder}`,
              borderBottom: 'none',
              display: 'flex', flexDirection: 'column',
              paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            }}
          >
            {/* 드래그 핸들 */}
            <div
              onPointerDown={handleResizeStart}
              onPointerMove={handleResizeMove}
              onPointerUp={handleResizeEnd}
              onPointerCancel={handleResizeEnd}
              style={{
                padding: '12px 0 8px', cursor: 'ns-resize', flexShrink: 0,
                touchAction: 'none', userSelect: 'none',
              }}
            >
              <div style={{
                width: '40px', height: '4px',
                background: isDragging
                  ? (isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.3)')
                  : (isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.12)'),
                borderRadius: '2px', margin: '0 auto',
                transition: 'background 0.15s',
              }} />
            </div>

            {/* 헤더 */}
            <div style={{ padding: '0 20px 12px', borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'}`, flexShrink: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ color: t.text, fontWeight: 700, fontSize: '16px', margin: 0 }}>내 기록</p>
                  <p style={{ color: t.textSub, fontSize: '12px', margin: '3px 0 0' }}>{records.length}개의 대기 기록</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ display: 'flex', background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)', borderRadius: '10px', padding: '3px', gap: '2px' }}>
                    {(['list', 'calendar'] as const).map(v => (
                      <button key={v} onClick={() => setView(v)} style={{
                        padding: '5px 10px', borderRadius: '8px', border: 'none',
                        fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                        background: view === v ? (isDark ? 'rgba(255,255,255,0.15)' : 'white') : 'transparent',
                        color: view === v ? t.text : t.textSub,
                        transition: 'all 0.15s',
                      }}>{v === 'list' ? '📋' : '📅'}</button>
                    ))}
                  </div>
                  <button onClick={onClose} style={{
                    width: '32px', height: '32px', borderRadius: '50%',
                    background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                    color: t.textSub, fontSize: '14px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>✕</button>
                </div>
              </div>
            </div>

            {/* 컨텐츠 */}
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {view === 'calendar' ? (
                <CalendarView records={records} />
              ) : (
                <div style={{ padding: '12px 16px 20px' }}>
                  {records.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 0', color: t.textSub }}>
                      <p style={{ fontSize: '32px', marginBottom: '10px' }}>📭</p>
                      <p style={{ fontSize: '14px' }}>아직 저장된 기록이 없습니다</p>
                      <p style={{ fontSize: '12px', marginTop: '6px' }}>지도를 클릭해서 첫 기록을 남겨보세요</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {[...records].reverse().map(record => (
                        <motion.div key={record.id} layout
                          initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
                          style={{
                            background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                            borderRadius: '14px', padding: '14px 16px',
                            border: `1px solid ${record.weatherColor}33`,
                            display: 'flex', alignItems: 'flex-start', gap: '12px',
                          }}
                        >
                          {editingId === record.id ? (
                            <div style={{ width: '100%' }}>
                              <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: 'none' }} />
                              <input value={editLabel} onChange={e => setEditLabel(e.target.value)} placeholder="장소명"
                                style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text, fontSize: '16px', outline: 'none', boxSizing: 'border-box', marginBottom: '8px' }} />
                              <textarea value={editMemo} onChange={e => setEditMemo(e.target.value)} placeholder="메모" rows={3}
                                style={{ width: '100%', padding: '8px 10px', borderRadius: '8px', background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.text, fontSize: '16px', outline: 'none', resize: 'none', boxSizing: 'border-box', marginBottom: '8px', fontFamily: 'inherit' }} />
                              {editPhoto ? (
                                <div style={{ position: 'relative', marginBottom: '8px', borderRadius: '8px', overflow: 'hidden' }}>
                                  <img src={editPhoto} style={{ width: '100%', height: '100px', objectFit: 'cover', display: 'block' }} />
                                  <button onClick={() => setEditPhoto(null)} style={{ position: 'absolute', top: '4px', right: '4px', width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: 'none', color: 'white', fontSize: '11px', cursor: 'pointer' }}>✕</button>
                                </div>
                              ) : (
                                <button onClick={() => fileInputRef.current?.click()} style={{ width: '100%', padding: '7px', borderRadius: '8px', background: t.inputBg, border: `1px dashed ${t.inputBorder}`, color: t.textSub, fontSize: '12px', cursor: 'pointer', marginBottom: '8px' }}>📷 사진 추가</button>
                              )}
                              <div style={{ display: 'flex', gap: '6px' }}>
                                <button onClick={saveEdit} style={{ flex: 1, padding: '8px', borderRadius: '8px', background: 'linear-gradient(135deg, #a855f7, #3b82f6)', border: 'none', color: 'white', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>저장</button>
                                <button onClick={cancelEdit} style={{ flex: 1, padding: '8px', borderRadius: '8px', background: t.inputBg, border: `1px solid ${t.inputBorder}`, color: t.textSub, fontSize: '13px', cursor: 'pointer' }}>취소</button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div style={{ width: '40px', height: '40px', borderRadius: '10px', flexShrink: 0, background: `${record.weatherColor}22`, border: `1px solid ${record.weatherColor}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                                {record.weatherEmoji}
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                                  <p style={{ color: t.text, fontWeight: 700, fontSize: '14px', margin: 0 }}>{record.label}</p>
                                  <span style={{ fontSize: '11px', padding: '1px 7px', borderRadius: '10px', background: `${record.weatherColor}22`, color: record.weatherColor }}>{record.temp}°C</span>
                                </div>
                                {record.memo && <p style={{ color: t.textSub, fontSize: '12px', margin: '0 0 5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{record.memo}</p>}
                                <p style={{ color: t.textSub, fontSize: '11px', margin: 0, fontFamily: 'monospace', opacity: 0.7 }}>{record.recordedAt}</p>
                              </div>
                              <button onClick={() => startEdit(record)} style={{ width: '28px', height: '28px', borderRadius: '8px', flexShrink: 0, background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)', color: 'rgba(59,130,246,0.8)', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✏️</button>
                              <button onClick={() => deleteRecord(record.id)} style={{ width: '28px', height: '28px', borderRadius: '8px', flexShrink: 0, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: 'rgba(239,68,68,0.7)', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🗑</button>
                            </>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}