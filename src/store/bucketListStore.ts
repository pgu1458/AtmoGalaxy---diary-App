// src/store/bucketListStore.ts

export interface BucketItem {
  id: string;
  name: string;
  description: string;
  category: string;
  lat: number;
  lng: number;
  country: 'KR' | 'JP';
  completed: boolean;
  emoji: string;
  ageGroup: string;
  addedAt: string;
}

type Listener = (items: BucketItem[]) => void;

let items: BucketItem[] = (() => {
  try { return JSON.parse(localStorage.getItem('atmoBucketList') || '[]'); }
  catch { return []; }
})();

let listeners: Listener[] = [];
let mapListeners: Listener[] = [];

const save = () => {
  try { localStorage.setItem('atmoBucketList', JSON.stringify(items)); }
  catch (e) { console.warn('[BucketList] save failed', e); }
};
const notify = () => { const c = [...items]; listeners.forEach(fn => fn(c)); };

export const bucketListStore = {
  getItems: (): BucketItem[] => [...items],

  addItem: (item: Omit<BucketItem, 'id' | 'completed' | 'addedAt'>): BucketItem => {
    const n: BucketItem = {
      ...item,
      id: `bucket-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      completed: false,
      addedAt: new Date().toLocaleString('ko-KR'),
    };
    items = [...items, n];
    save(); notify();
    bucketMapStore.emit([...items]);
    return n;
  },

  updateItem: (id: string, updates: Partial<Omit<BucketItem, 'id' | 'addedAt'>>) => {
    items = items.map(i => i.id === id ? { ...i, ...updates } : i);
    save(); notify();
    bucketMapStore.emit([...items]);
  },

  toggleComplete: (id: string) => {
    items = items.map(i => i.id === id ? { ...i, completed: !i.completed } : i);
    save(); notify();
    bucketMapStore.emit([...items]);
  },

  removeItem: (id: string) => {
    items = items.filter(i => i.id !== id);
    save(); notify();
    bucketMapStore.emit([...items]);
  },

  // 이름 기준 중복 체크 (좌표 동일한 항목 오인식 방지)
  hasItem: (name: string): boolean =>
    items.some(i => i.name === name),

  subscribe: (fn: Listener): (() => void) => {
    listeners = [...listeners, fn];
    return () => { listeners = listeners.filter(l => l !== fn); };
  },
};

export const bucketMapStore = {
  emit: (updated: BucketItem[]) => mapListeners.forEach(fn => fn(updated)),
  subscribe: (fn: Listener): (() => void) => {
    mapListeners = [...mapListeners, fn];
    return () => { mapListeners = mapListeners.filter(l => l !== fn); };
  },
};