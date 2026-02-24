# Migration Guide

## Upgrading to v1.4.0

Version 1.4.0 adds powerful font preloading capabilities while maintaining full backward compatibility.

### Breaking Changes

**None!** All existing code continues to work without modifications.

### New Features

#### 1. Background Font Preloading

```typescript
import { useQuranFontPreloader, PRIORITY_PAGES } from 'react-native-quran-hafs';

// Add to your Surah list screen
const { isPreloading, progress } = useQuranFontPreloader({
  pages: PRIORITY_PAGES,
  quranFontApi: YOUR_FONT_API,
  autoStart: true,
});
```

#### 2. Batch Font Downloads

```typescript
import { downloadMultiplePageFonts } from 'react-native-quran-hafs';

// Download multiple pages at once
await downloadMultiplePageFonts([1, 2, 3, 4, 5], FONT_API);
```

#### 3. Cache Management

```typescript
import { 
  getFontCacheStats, 
  clearFontCache,
  isFontCached 
} from 'react-native-quran-hafs';

// Check what's cached
const stats = await getFontCacheStats();

// Clear cache if needed
await clearFontCache();
```

### Recommended Upgrade Path

1. **Install v1.4.0**
   ```bash
   npm install react-native-quran-hafs@1.4.0
   # or
   yarn add react-native-quran-hafs@1.4.0
   ```

2. **Test Existing Functionality**
   Ensure your current implementation still works.

3. **Add Preloading** (Optional but Recommended)
   Add the `useQuranFontPreloader` hook to your Surah list screen.

4. **Monitor Performance**
   Check console logs for preload progress and cache hits.

### Performance Tips

- Start with `PRIORITY_PAGES` (53 pages) - covers 80% of use cases
- Preload on WiFi-only if concerned about data usage
- Cache persists between app launches
- Consider adding a "Download Quran" button in settings for `ALL_QURAN_PAGES`

### Performance Improvements

#### Before v1.4.0
- **First Load**: 15-30 seconds (downloads fonts on-demand)
- **Subsequent Loads**: 15-30 seconds for different pages
- **User Experience**: Long waits with loading spinners

#### After v1.4.0 (With Preloading)
- **Background Preload**: 30-60 seconds (silent, one-time)
- **First Load**: < 1 second (fonts already cached)
- **Subsequent Loads**: < 1 second (fonts already cached)
- **User Experience**: Instant loading

### Network Usage
- **Priority Pages**: ~10MB one-time download
- **All Pages**: ~150MB one-time download
- **Subsequent Opens**: 0KB (cached)

### Example Implementation

Here's a complete example of integrating font preloading into your app:

```typescript
import React from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { 
  useQuranFontPreloader, 
  PRIORITY_PAGES,
  QuranChapters 
} from 'react-native-quran-hafs';

function SurahListScreen({ navigation }) {
  const { isPreloading, progress, isCompleted } = useQuranFontPreloader({
    pages: PRIORITY_PAGES,
    quranFontApi: 'https://raw.githubusercontent.com/quran/quran.com-images/master/fonts/',
    autoStart: true,
  });

  return (
    <View>
      {isPreloading && (
        <View style={{ padding: 10, backgroundColor: '#f0f0f0' }}>
          <Text>📥 Preparing Quran pages: {progress.percentage}%</Text>
          <Text style={{ fontSize: 12, color: '#666' }}>
            {progress.current} of {progress.total} pages ready
          </Text>
        </View>
      )}
      
      <FlatList
        data={QuranChapters}
        renderItem={({ item }) => (
          <TouchableOpacity 
            onPress={() => navigation.navigate('Quran', { chapterId: item.id })}
          >
            <Text>{item.name_arabic}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}
```

### Support

If you encounter issues during migration:

1. **Check Console Logs**: Look for font download messages with 📥, ✅, and ❌ emojis
2. **Verify Exports**: Ensure new functions are imported correctly
3. **Clear Cache**: Try clearing Metro cache: `npx react-native start --reset-cache`
4. **Check Network**: Ensure device/emulator has internet access for downloads

For bugs or questions, please open an issue on GitHub: https://github.com/mohamedshawky982/react-native-quran-hafs/issues

---

## Summary

Version 1.4.0 brings significant performance improvements through intelligent font preloading:

✅ **Backward Compatible**: All existing code works without changes  
✅ **Easy to Adopt**: Single hook for complete preloading functionality  
✅ **Performance Boost**: 15-30s → <1s load times  
✅ **Flexible**: Works with custom page lists and configurations  
✅ **Smart Caching**: Persistent cache across app launches  

**Recommended Action**: Add `useQuranFontPreloader` with `PRIORITY_PAGES` to your main Quran list screen for instant improvements!
