export const MAX_LOCALES = 20;

/** Con más locales que lugares, el grupo visible avanza uno por día para que todos aparezcan. */
export function pickDaily(list, max, day) {
  if (list.length <= max) return list;
  const start = day % list.length;
  return Array.from({ length: max }, (_, i) => list[(start + i) % list.length]);
}
