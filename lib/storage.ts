// localStorage fallback for when PocketBase is unavailable
const PREFIX = 'gut-reset-v2:';

export function lsGet<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function lsSet<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // Ignore storage errors
  }
}

export function lsDelete(key: string): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(PREFIX + key);
}

// Log storage
export function getLocalLog(date: string) {
  return lsGet(`log:${date}`);
}

export function setLocalLog(date: string, data: unknown) {
  lsSet(`log:${date}`, data);
}

export function getLocalProfile() {
  return lsGet('profile');
}

export function setLocalProfile(data: unknown) {
  lsSet('profile', data);
}

export function getLocalBaseline() {
  return lsGet('baseline');
}

export function setLocalBaseline(data: unknown) {
  lsSet('baseline', data);
}

export function getLocalSupplementLogs(date: string) {
  return lsGet(`supps:${date}`) as Record<string, boolean> | null;
}

export function setLocalSupplementLogs(date: string, data: Record<string, boolean>) {
  lsSet(`supps:${date}`, data);
}

export function getLocalMealLogs(date: string) {
  return lsGet(`meals:${date}`) as Record<string, boolean> | null;
}

export function setLocalMealLogs(date: string, data: Record<string, boolean>) {
  lsSet(`meals:${date}`, data);
}

export function getAllLocalLogs(): Array<{ date: string; data: unknown }> {
  if (typeof window === 'undefined') return [];
  const results: Array<{ date: string; data: unknown }> = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(PREFIX + 'log:')) {
      const date = key.replace(PREFIX + 'log:', '');
      const data = lsGet(`log:${date}`);
      if (data) results.push({ date, data });
    }
  }
  return results.sort((a, b) => a.date.localeCompare(b.date));
}
