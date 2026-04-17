// src/components/CalendarView.tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { type AtmoRecord } from '../store/recordStore';
import { useTheme, THEME } from '../context/ThemeContext';

interface Props {
  records: AtmoRecord[];
}

// id의 타임스탬프로 날짜 추출 (형식: "timestamp-random")
function getDateFromRecord(r: AtmoRecord): Date {
  const ts = parseInt(r.id.split('-')[0]);
  return isNaN(ts) ? new Date() : new Date(ts);
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

export default function CalendarView({ records }: Props) {
  const { isDark } = useTheme();
  const t = isDark ? THEME.dark : THEME.light;
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  // 이번 달 날짜 배열 생성
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // 6줄 맞추기
  while (cells.length % 7 !== 0) cells.push(null);

  // 날짜별 기록 맵
  const recordsByDay = new Map<string, AtmoRecord[]>();
  records.forEach(r => {
    const d = getDateFromRecord(r);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const key = `${d.getDate()}`;
      if (!recordsByDay.has(key)) recordsByDay.set(key, []);
      recordsByDay.get(key)!.push(r);
    }
  });

  // 선택된 날의 기록
  const selectedRecords = selectedDay
    ? records.filter(r => isSameDay(getDateFromRecord(r), selectedDay))
    : [];

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
    setSelectedDay(null);
  };
  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
    setSelectedDay(null);
  };

  const totalThisMonth = [...recordsByDay.values()].reduce((s, a) => s + a.length, 0);

  return (
    <div style={{ padding: '8px 16px 20px' }}>
      {/* 월 네비게이션 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <button onClick={prevMonth} style={{
          width: '32px', height: '32px', borderRadius: '50%',
          background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
          border: 'none', color: t.text, fontSize: '16px', cursor: 'pointer',
        }}>‹</button>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: t.text, fontWeight: 800, fontSize: '16px', margin: 0 }}>
            {year}년 {month + 1}월
          </p>
          {totalThisMonth > 0 && (
            <p style={{ color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.35)', fontSize: '11px', margin: '2px 0 0' }}>
              이번 달 기록 {totalThisMonth}개
            </p>
          )}
        </div>
        <button onClick={nextMonth} style={{
          width: '32px', height: '32px', borderRadius: '50%',
          background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
          border: 'none', color: t.text, fontSize: '16px', cursor: 'pointer',
        }}>›</button>
      </div>

      {/* 요일 헤더 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: '4px' }}>
        {WEEKDAYS.map((d, i) => (
          <div key={d} style={{
            textAlign: 'center', fontSize: '11px', fontWeight: 600, padding: '4px 0',
            color: i === 0 ? '#ef4444' : i === 6 ? '#3b82f6' : (isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)'),
          }}>{d}</div>
        ))}
      </div>

      {/* 날짜 그리드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '3px' }}>
        {cells.map((day, idx) => {
          if (!day) return <div key={idx} />;
          const dayRecords = recordsByDay.get(`${day}`) ?? [];
          const hasRecord = dayRecords.length > 0;
          const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
          const cellDate = new Date(year, month, day);
          const isSelected = selectedDay ? isSameDay(cellDate, selectedDay) : false;
          const mainRecord = dayRecords[0];
          const col = idx % 7;

          return (
            <motion.div
              key={day}
              whileTap={hasRecord ? { scale: 0.92 } : {}}
              onClick={() => hasRecord ? setSelectedDay(isSelected ? null : cellDate) : null}
              style={{
                borderRadius: '10px',
                padding: '6px 2px',
                minHeight: '54px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
                cursor: hasRecord ? 'pointer' : 'default',
                background: isSelected
                  ? isDark ? 'rgba(168,85,247,0.25)' : 'rgba(168,85,247,0.15)'
                  : hasRecord
                    ? isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'
                    : 'transparent',
                border: isSelected
                  ? '1px solid rgba(168,85,247,0.5)'
                  : isToday
                    ? `1px solid ${isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)'}`
                    : '1px solid transparent',
                transition: 'all 0.15s',
              }}
            >
              <span style={{
                fontSize: '12px', fontWeight: isToday ? 800 : 500,
                color: isToday
                  ? '#a855f7'
                  : col === 0 ? '#ef4444'
                  : col === 6 ? '#3b82f6'
                  : t.text,
              }}>{day}</span>
              {hasRecord && (
                <>
                  <span style={{ fontSize: '16px', lineHeight: 1 }}>{mainRecord.weatherEmoji}</span>
                  <span style={{ fontSize: '10px', color: mainRecord.weatherColor, fontWeight: 700 }}>
                    {mainRecord.temp}°
                  </span>
                  {dayRecords.length > 1 && (
                    <span style={{
                      fontSize: '9px', background: 'rgba(168,85,247,0.6)',
                      color: 'white', borderRadius: '8px', padding: '1px 4px',
                    }}>+{dayRecords.length - 1}</span>
                  )}
                </>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* 선택된 날 기록 상세 */}
      <AnimatePresence>
        {selectedDay && selectedRecords.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
            style={{ marginTop: '16px' }}
          >
            <p style={{
              fontSize: '12px', fontWeight: 700, color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
              margin: '0 0 8px', letterSpacing: '0.06em',
            }}>
              {selectedDay.getMonth() + 1}월 {selectedDay.getDate()}일 기록
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {selectedRecords.map(record => (
                <div key={record.id} style={{
                  background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                  borderRadius: '12px', padding: '12px 14px',
                  border: `1px solid ${record.weatherColor}33`,
                  display: 'flex', gap: '10px', alignItems: 'flex-start',
                }}>
                  {record.photoBase64 && (
                    <img src={record.photoBase64} style={{
                      width: '48px', height: '48px', borderRadius: '8px',
                      objectFit: 'cover', flexShrink: 0,
                    }} />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                      <span style={{ fontSize: '16px' }}>{record.weatherEmoji}</span>
                      <p style={{ color: t.text, fontWeight: 700, fontSize: '13px', margin: 0 }}>
                        {record.label}
                      </p>
                      <span style={{
                        fontSize: '11px', padding: '1px 6px', borderRadius: '8px',
                        background: `${record.weatherColor}22`, color: record.weatherColor,
                      }}>{record.temp}°C</span>
                    </div>
                    {record.memo && (
                      <p style={{
                        color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
                        fontSize: '12px', margin: 0, lineHeight: 1.5,
                      }}>{record.memo}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}