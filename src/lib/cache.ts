interface CacheEntry {
  value: unknown;
  expiry: number;
}

const store = new Map<string, CacheEntry>();

export function cacheGet(key: string): unknown | undefined {
  const entry = store.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expiry) {
    store.delete(key);
    return undefined;
  }
  return entry.value;
}

export function cacheSet(key: string, value: unknown, ttlSeconds: number): void {
  store.set(key, {
    value,
    expiry: Date.now() + ttlSeconds * 1000,
  });
}

export function cacheKey(toolName: string, input: unknown): string {
  return `${toolName}:${JSON.stringify(input)}`;
}
