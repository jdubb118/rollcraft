const cache: Record<string, HTMLImageElement | 'loading' | 'failed'> = {};

export function getRegionBG(regionId: string): HTMLImageElement | null {
  const url = `/sprites/region-bgs/${regionId}.png`;
  const c = cache[url];
  if (c === 'loading' || c === 'failed') return null;
  if (c) return c;
  const img = new Image();
  cache[url] = 'loading';
  img.onload = () => { cache[url] = img; };
  img.onerror = () => { cache[url] = 'failed'; };
  img.src = url;
  return null;
}
