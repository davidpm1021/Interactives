import { PreferenceAnchor } from '../models/car-preferences.models';

export function nearestAnchor(
  value: number,
  anchors: PreferenceAnchor[],
): PreferenceAnchor {
  if (anchors.length === 0) {
    throw new Error('nearestAnchor: anchors must not be empty');
  }
  let best = anchors[0];
  let bestDist = Math.abs(value - best.value);
  for (let i = 1; i < anchors.length; i++) {
    const dist = Math.abs(value - anchors[i].value);
    if (dist < bestDist || (dist === bestDist && anchors[i].value > best.value)) {
      best = anchors[i];
      bestDist = dist;
    }
  }
  return best;
}
