/**
 * Priority Quran pages for preloading
 * These cover the most commonly read surahs
 */

// Juz 30 (Most memorized - pages 582-604)
export const JUZ_30_PAGES = Array.from({ length: 23 }, (_, i) => 582 + i);

// Al-Fatihah (pages 1-2)
export const AL_FATIHAH_PAGES = [1, 2];

// Al-Kahf (Friday - pages 293-304)
export const AL_KAHF_PAGES = Array.from({ length: 12 }, (_, i) => 293 + i);

// Yasin (pages 440-445)
export const YASIN_PAGES = Array.from({ length: 6 }, (_, i) => 440 + i);

// Al-Mulk (pages 562-564)
export const AL_MULK_PAGES = [562, 563, 564];

// Ar-Rahman (pages 531-534)
export const AR_RAHMAN_PAGES = [531, 532, 533, 534];

// Combined priority pages (53 pages total)
export const PRIORITY_PAGES = [
  ...AL_FATIHAH_PAGES,
  ...AL_KAHF_PAGES,
  ...YASIN_PAGES,
  ...AL_MULK_PAGES,
  ...AR_RAHMAN_PAGES,
  ...JUZ_30_PAGES,
].sort((a, b) => a - b);

// All 604 Quran pages
export const ALL_QURAN_PAGES = Array.from({ length: 604 }, (_, i) => i + 1);

export default {
  JUZ_30_PAGES,
  AL_FATIHAH_PAGES,
  AL_KAHF_PAGES,
  YASIN_PAGES,
  AL_MULK_PAGES,
  AR_RAHMAN_PAGES,
  PRIORITY_PAGES,
  ALL_QURAN_PAGES,
};
