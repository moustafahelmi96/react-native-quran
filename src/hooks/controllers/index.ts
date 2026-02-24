import usePageLineController from './usePageLineController';
import usePageFontFileController, {
  downoladThePageFont,
  downloadMultiplePageFonts,
  isFontCached,
  checkMultipleFontCache,
  getFontCacheStats,
  clearFontCache,
} from './usePageFontFileController';
import useAudioPlayerController from './useAudioPlayerController';
import useOptionsModalController from './useOptionsModalController';

export {
  usePageLineController,
  usePageFontFileController,
  useAudioPlayerController,
  useOptionsModalController,
  // Font management functions
  downoladThePageFont,
  downloadMultiplePageFonts,
  isFontCached,
  checkMultipleFontCache,
  getFontCacheStats,
  clearFontCache,
};
