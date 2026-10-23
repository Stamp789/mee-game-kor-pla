// Limit bloom buffers on Retina / 4K displays without changing the camera or art.
export function renderPixelRatio(width: number, height: number, dpr: number, quality = 1): number {
  const pixels = Math.max(1, width) * Math.max(1, height);
  return Math.min(Math.max(.1, dpr), width < 700 ? 1.25 : 1.5, Math.sqrt(2_600_000 / pixels)) * quality;
}
