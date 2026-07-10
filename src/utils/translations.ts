// Drop empty strings/arrays from an EN overlay so we never persist junk; the
// server-side resolver ignores empties anyway, but clean payloads keep the DB
// (and the sibling project's contract) tidy.
export function pruneEn<T extends Record<string, unknown>>(en: T | undefined): Partial<T> {
  if (!en) return {};
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(en)) {
    if (typeof v === 'string') {
      if (v.trim()) out[k] = v;
    } else if (Array.isArray(v)) {
      const items = v.map(item => String(item).trim()).filter(Boolean);
      if (items.length) out[k] = items;
    }
  }
  return out as Partial<T>;
}
