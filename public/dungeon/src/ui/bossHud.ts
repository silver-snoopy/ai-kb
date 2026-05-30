/**
 * Multiply each RGB channel of a hex color by `factor` (clamped to 0–255).
 * factor < 1 darkens; used to derive the HUD bar shade from a boss's
 * environmentColor.
 */
export function darken(color: number, factor: number): number {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  const r = clamp(((color >> 16) & 0xff) * factor);
  const g = clamp(((color >> 8) & 0xff) * factor);
  const b = clamp((color & 0xff) * factor);
  return (r << 16) | (g << 8) | b;
}

/**
 * Left-side HUD run label. With a campaign: "Floor <n>/<total> · <domain>"
 * (n is 1-indexed). Without one (isolated/debug fight): just the domain.
 */
export function formatRunLabel(
  campaign: { floorsCleared: number; bossOrder: string[] } | undefined,
  domainShort: string,
): string {
  if (!campaign) return domainShort;
  return `Floor ${campaign.floorsCleared + 1}/${campaign.bossOrder.length} · ${domainShort}`;
}
