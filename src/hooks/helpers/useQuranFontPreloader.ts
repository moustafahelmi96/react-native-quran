import { useEffect, useState, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { downloadMultiplePageFonts } from '../controllers/usePageFontFileController';

interface UseQuranFontPreloaderOptions {
  /**
   * Array of page numbers to preload
   */
  pages: number[];
  
  /**
   * Base URL for font downloads
   */
  quranFontApi: string;
  
  /**
   * Whether to start preloading automatically on mount
   */
  autoStart?: boolean;
  
  /**
   * Cache key for tracking completion
   */
  cacheKey?: string;
  
  /**
   * Cache version for invalidation
   */
  cacheVersion?: string;
  
  /**
   * Max concurrent downloads
   */
  concurrentDownloads?: number;
}

interface PreloadProgress {
  current: number;
  total: number;
  percentage: number;
  lastPage: number;
}

interface UseQuranFontPreloaderResult {
  /**
   * Whether preloading is in progress
   */
  isPreloading: boolean;
  
  /**
   * Whether preload has completed successfully
   */
  isCompleted: boolean;
  
  /**
   * Current progress
   */
  progress: PreloadProgress;
  
  /**
   * Any error that occurred
   */
  error: Error | null;
  
  /**
   * Start preloading manually
   */
  startPreload: () => Promise<void>;
  
  /**
   * Reset preload status (clears cache flag)
   */
  resetPreload: () => Promise<void>;
}

/**
 * React hook for preloading Quran fonts in the background
 * 
 * @example
 * ```typescript
 * const { isPreloading, progress } = useQuranFontPreloader({
 *   pages: PRIORITY_PAGES,
 *   quranFontApi: 'https://raw.githubusercontent.com/...',
 *   autoStart: true,
 * });
 * 
 * if (isPreloading) {
 *   console.log(`Loading: ${progress.percentage}%`);
 * }
 * ```
 */
export const useQuranFontPreloader = (
  options: UseQuranFontPreloaderOptions
): UseQuranFontPreloaderResult => {
  const {
    pages,
    quranFontApi,
    autoStart = true,
    cacheKey = 'quran_fonts_preload',
    cacheVersion = '1.0',
    concurrentDownloads = 5,
  } = options;

  const [isPreloading, setIsPreloading] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [progress, setProgress] = useState<PreloadProgress>({
    current: 0,
    total: pages.length,
    percentage: 0,
    lastPage: 0,
  });
  const [error, setError] = useState<Error | null>(null);
  const hasStartedRef = useRef(false);

  const versionKey = `${cacheKey}_version`;

  const checkIfAlreadyPreloaded = async (): Promise<boolean> => {
    try {
      const completed = await AsyncStorage.getItem(cacheKey);
      const storedVersion = await AsyncStorage.getItem(versionKey);
      return completed === 'true' && storedVersion === cacheVersion;
    } catch (error) {
      console.error('Error checking preload status:', error);
      return false;
    }
  };

  const markAsCompleted = async () => {
    try {
      await AsyncStorage.setItem(cacheKey, 'true');
      await AsyncStorage.setItem(versionKey, cacheVersion);
    } catch (error) {
      console.error('Error marking as completed:', error);
    }
  };

  const resetPreload = async () => {
    try {
      await AsyncStorage.removeItem(cacheKey);
      await AsyncStorage.removeItem(versionKey);
      setIsCompleted(false);
      setProgress({
        current: 0,
        total: pages.length,
        percentage: 0,
        lastPage: 0,
      });
      console.log('🔄 Preload status reset');
    } catch (error) {
      console.error('Error resetting preload:', error);
    }
  };

  const startPreload = async () => {
    if (hasStartedRef.current) {
      console.log('Preload already in progress');
      return;
    }

    // Check if already completed
    const alreadyPreloaded = await checkIfAlreadyPreloaded();
    if (alreadyPreloaded) {
      console.log('✅ Fonts already preloaded');
      setIsCompleted(true);
      return;
    }

    hasStartedRef.current = true;
    setIsPreloading(true);
    setError(null);

    console.log(`🚀 Starting Quran font preload: ${pages.length} pages`);

    try {
      const results = await downloadMultiplePageFonts(
        pages,
        quranFontApi,
        (current, total, page) => {
          const percentage = Math.round((current / total) * 100);
          setProgress({
            current,
            total,
            percentage,
            lastPage: page,
          });
        },
        concurrentDownloads
      );

      const successful = results.filter(r => r.success).length;
      
      if (successful === pages.length) {
        await markAsCompleted();
        setIsCompleted(true);
        console.log('✅ Quran font preload completed successfully');
      } else {
        const failed = pages.length - successful;
        console.warn(`⚠️  Preload completed with ${failed} failures`);
      }
    } catch (err) {
      console.error('❌ Preload error:', err);
      setError(err as Error);
    } finally {
      setIsPreloading(false);
      hasStartedRef.current = false;
    }
  };

  useEffect(() => {
    if (autoStart && !hasStartedRef.current) {
      startPreload();
    }
  }, [autoStart]);

  return {
    isPreloading,
    isCompleted,
    progress,
    error,
    startPreload,
    resetPreload,
  };
};

export default useQuranFontPreloader;
