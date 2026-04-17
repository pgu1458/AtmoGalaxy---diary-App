// src/store/recordStore.ts

export interface AtmoRecord {
  id: string;
  lat: number;
  lng: number;
  label: string;
  memo: string;
  temp: number;
  weather: string;
  weatherEmoji: string;
  weatherColor: string;
  humidity: number;
  windSpeed: number;
  recordedAt: string;
  photoBase64?: string; // ���� ÷�� (base64, ����)
}

const STORAGE_KEY = 'atmogalaxy_records';

export function saveRecord(record: AtmoRecord): void {
  const all = loadRecords();
  all.push(record);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  recordListeners.forEach(fn => fn(all));
}

export function loadRecords(): AtmoRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function deleteRecord(id: string): void {
  const all = loadRecords().filter(r => r.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  recordListeners.forEach(fn => fn(all));
}

const recordListeners: Array<(records: AtmoRecord[]) => void> = [];

export const recordStore = {
  subscribe(fn: (records: AtmoRecord[]) => void) {
    recordListeners.push(fn);
    return () => {
      const idx = recordListeners.indexOf(fn);
      if (idx > -1) recordListeners.splice(idx, 1);
    };
  },
};

export function updateRecord(id: string, updates: Partial<AtmoRecord>): void {
  const all = loadRecords().map(r => r.id === id ? { ...r, ...updates } : r);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  recordListeners.forEach(fn => fn(all));
}