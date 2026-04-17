// src/store/pinStore.ts

// ���� �� Ŭ�� store ����������������������������������������������������������������������������������
const pinListeners: Array<(point: any) => void> = [];

export const pinStore = {
  emit(point: any) {
    pinListeners.forEach(fn => fn(point));
  },
  subscribe(fn: (point: any) => void) {
    pinListeners.push(fn);
    return () => {
      const idx = pinListeners.indexOf(fn);
      if (idx > -1) pinListeners.splice(idx, 1);
    };
  },
};

// ���� �г� �ݱ� store ������������������������������������������������������������������������������
// DetailPanel���� �ݱ� ��ư Ŭ�� �� �� MapContainer�� �� �ƿ�
const closeListeners: Array<() => void> = [];

export const panelCloseStore = {
  emit() {
    closeListeners.forEach(fn => fn());
  },
  subscribe(fn: () => void) {
    closeListeners.push(fn);
    return () => {
      const idx = closeListeners.indexOf(fn);
      if (idx > -1) closeListeners.splice(idx, 1);
    };
  },
};