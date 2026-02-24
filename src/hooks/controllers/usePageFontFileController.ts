import RNFS from 'react-native-fs';
import {loadFont} from 'react-native-dynamic-fonts';
import {isFileExists} from '../../utils';

const _renderPageNumber = (pageNumber: number) => {
  let pageNumberFormat = '';
  if (pageNumber < 10) pageNumberFormat = `00${pageNumber}`;
  else if (pageNumber >= 10 && pageNumber < 100)
    pageNumberFormat = `0${pageNumber}`;
  else pageNumberFormat = `${pageNumber}`;
  return pageNumberFormat;
};

const _fontFileFormatGenerator = (currentPageNumber: number) =>
  `QCF_P${_renderPageNumber(currentPageNumber)}`;
const _filePathFormatGenerator = (targetFont: string) =>
  RNFS.DocumentDirectoryPath + `/${targetFont}.ttf`;

const isFontFileExistsBefore = async (currentPageNumber: number) => {
  const targetFont = _fontFileFormatGenerator(currentPageNumber);
  const fontFilePath = _filePathFormatGenerator(targetFont);
  return await isFileExists(fontFilePath);
};

export const downoladThePageFont = async (
  currentPageNumber: number,
  onFontLoaded: () => void,
  quranFontApi: string,
) => {
  if (!quranFontApi) throw new Error('you must add fonts link');

  const targetFont = _fontFileFormatGenerator(currentPageNumber);
  const url = `${quranFontApi}${targetFont}.TTF`;
  const filePath = _filePathFormatGenerator(targetFont);
  const ifFileSavedBefore = await isFileExists(filePath);
  if (ifFileSavedBefore) {
    loadFontFamily(filePath, targetFont, onFontLoaded);
  } else
    return RNFS.downloadFile({
      fromUrl: url,
      toFile: filePath,
      background: true, // Enable downloading in the background (iOS only)
      discretionary: true, // Allow the OS to control the timing and speed (iOS only)
      progress: res => {
        // Handle download progress updates if needed
        const progress = (res.bytesWritten / res.contentLength) * 100;
      },
    })
      .promise.then(res => {
        console.log('res' + `${targetFont}`, JSON.stringify(res));
        return loadFontFamily(filePath, targetFont, onFontLoaded);
      })
      .catch(err => {
        console.log('Download error:', err);
        return err;
      });
};
const loadFontFamily = async (
  fontFilePath: string,
  targetFont: string,
  onFontLoaded: () => void,
) => {
  const base64 = await RNFS.readFile(fontFilePath, {encoding: 'base64'});
  return loadFont(targetFont, base64, 'ttf').then((name: string) => {
    console.log('Loaded font successfully. Font name is: ', name);
    onFontLoaded();
    return name;
  });
};

/**
 * Download multiple Quran page fonts in parallel
 * @param pageNumbers - Array of page numbers to download (1-604)
 * @param quranFontApi - Base URL for font downloads (e.g., "https://raw.githubusercontent.com/...")
 * @param onProgress - Optional callback for progress updates (current, total)
 * @param concurrentDownloads - Max parallel downloads (default: 5)
 * @returns Promise with download results for each page
 */
export const downloadMultiplePageFonts = async (
  pageNumbers: number[],
  quranFontApi: string,
  onProgress?: (current: number, total: number, page: number) => void,
  concurrentDownloads: number = 5,
): Promise<Array<{success: boolean; page: number; cached: boolean; error?: any}>> => {
  if (!quranFontApi) throw new Error('you must add fonts link');
  
  console.log(`📥 Starting batch download of ${pageNumbers.length} Quran fonts...`);
  
  const total = pageNumbers.length;
  let completed = 0;
  const results: Array<{success: boolean; page: number; cached: boolean; error?: any}> = [];

  // Process in batches to avoid overwhelming the network
  for (let i = 0; i < pageNumbers.length; i += concurrentDownloads) {
    const batch = pageNumbers.slice(i, i + concurrentDownloads);
    
    const batchResults = await Promise.all(
      batch.map(async (pageNumber) => {
        try {
          const targetFont = _fontFileFormatGenerator(pageNumber);
          const url = `${quranFontApi}${targetFont}.TTF`;
          const filePath = _filePathFormatGenerator(targetFont);
          
          // Check if already cached
          const ifFileSavedBefore = await isFileExists(filePath);
          if (ifFileSavedBefore) {
            completed++;
            onProgress?.(completed, total, pageNumber);
            return { success: true, page: pageNumber, cached: true };
          }

          // Download the font
          await RNFS.downloadFile({
            fromUrl: url,
            toFile: filePath,
            background: true,
            discretionary: true,
            progressInterval: 1000,
          }).promise;
          
          completed++;
          onProgress?.(completed, total, pageNumber);
          console.log(`✅ Downloaded font for page ${pageNumber} (${completed}/${total})`);
          
          return { success: true, page: pageNumber, cached: false };
        } catch (err) {
          completed++;
          onProgress?.(completed, total, pageNumber);
          console.error(`❌ Failed to download page ${pageNumber}:`, err);
          return { success: false, page: pageNumber, cached: false, error: err };
        }
      })
    );
    
    results.push(...batchResults);
    
    // Small delay between batches to prevent overwhelming the system
    if (i + concurrentDownloads < pageNumbers.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  const successful = results.filter(r => r.success).length;
  const cached = results.filter(r => r.cached).length;
  console.log(`✨ Batch download complete: ${successful}/${total} fonts ready (${cached} from cache)`);
  
  return results;
};

/**
 * Check if a font is already cached locally
 * @param pageNumber - Page number to check (1-604)
 * @returns Promise<boolean> - true if cached, false otherwise
 */
export const isFontCached = async (pageNumber: number): Promise<boolean> => {
  const targetFont = _fontFileFormatGenerator(pageNumber);
  const fontFilePath = _filePathFormatGenerator(targetFont);
  return await isFileExists(fontFilePath);
};

/**
 * Check cache status for multiple pages
 * @param pageNumbers - Array of page numbers to check
 * @returns Promise with object mapping page numbers to cache status
 */
export const checkMultipleFontCache = async (
  pageNumbers: number[]
): Promise<Record<number, boolean>> => {
  const results: Record<number, boolean> = {};
  
  await Promise.all(
    pageNumbers.map(async (pageNumber) => {
      results[pageNumber] = await isFontCached(pageNumber);
    })
  );
  
  return results;
};

/**
 * Get cache statistics
 * @returns Promise with cache info (total cached, size, etc.)
 */
export const getFontCacheStats = async (): Promise<{
  totalCached: number;
  cachedPages: number[];
  totalSizeBytes: number;
}> => {
  try {
    const files = await RNFS.readDir(RNFS.DocumentDirectoryPath);
    const fontFiles = files.filter(file => file.name.startsWith('QCF_P') && file.name.endsWith('.ttf'));
    
    const cachedPages = fontFiles
      .map(file => {
        const match = file.name.match(/QCF_P(\d+)\.ttf/);
        return match ? parseInt(match[1], 10) : null;
      })
      .filter(page => page !== null) as number[];
    
    const totalSizeBytes = fontFiles.reduce((sum, file) => sum + (file.size || 0), 0);
    
    return {
      totalCached: fontFiles.length,
      cachedPages: cachedPages.sort((a, b) => a - b),
      totalSizeBytes,
    };
  } catch (error) {
    console.error('Error getting cache stats:', error);
    return {
      totalCached: 0,
      cachedPages: [],
      totalSizeBytes: 0,
    };
  }
};

/**
 * Clear font cache (delete all downloaded fonts)
 * @param pageNumbers - Optional array of specific pages to clear. If not provided, clears all.
 * @returns Promise with number of fonts deleted
 */
export const clearFontCache = async (pageNumbers?: number[]): Promise<number> => {
  try {
    const files = await RNFS.readDir(RNFS.DocumentDirectoryPath);
    let fontFiles = files.filter(file => file.name.startsWith('QCF_P') && file.name.endsWith('.ttf'));
    
    // If specific pages provided, filter to only those
    if (pageNumbers && pageNumbers.length > 0) {
      const pageSet = new Set(pageNumbers.map(p => _fontFileFormatGenerator(p) + '.ttf'));
      fontFiles = fontFiles.filter(file => pageSet.has(file.name));
    }
    
    await Promise.all(fontFiles.map(file => RNFS.unlink(file.path)));
    
    console.log(`🗑️  Cleared ${fontFiles.length} font files from cache`);
    return fontFiles.length;
  } catch (error) {
    console.error('Error clearing cache:', error);
    return 0;
  }
};

const usePageFontFileController = () => {
  return {
    downoladThePageFont,
    downloadMultiplePageFonts,
    isFontCached,
    checkMultipleFontCache,
    getFontCacheStats,
    clearFontCache,
    _fontFileFormatGenerator,
  };
};

export default usePageFontFileController;
