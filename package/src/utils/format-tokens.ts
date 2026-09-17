export function roundCompact(value: number): number {
  return value >= 100 ? Math.round(value) : Number(value.toFixed(1));
}

export function formatTokens(value: number): string {
  const safe = Math.max(0, Math.round(value));
  if (safe < 1000) {
    return String(safe);
  }
  const thousands = roundCompact(safe / 1000);
  return thousands < 1000 ? `${thousands}k` : `${roundCompact(safe / 1_000_000)}M`;
}
