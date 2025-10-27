/**
 * OptimizedFlatList Component - Performance-optimized list rendering
 * 
 * Features:
 * - Memoized list items
 * - Optimized getItemLayout
 * - Proper keyExtractor
 * - Memory-efficient rendering
 * - Scroll performance optimizations
 */
import React, { memo, useCallback, useMemo } from 'react';
import { 
  FlatList, 
  type FlatListProps, 
  type ListRenderItem 
} from 'react-native';

export interface OptimizedFlatListProps<T> extends Omit<FlatListProps<T>, 'renderItem'> {
  data: T[];
  renderItem: ListRenderItem<T>;
  itemHeight?: number;
  keyExtractor?: (item: T, index: number) => string;
  estimatedItemSize?: number;
}

function OptimizedFlatListComponent<T>({
  data,
  renderItem,
  itemHeight,
  keyExtractor,
  estimatedItemSize = 60,
  ...flatListProps
}: OptimizedFlatListProps<T>) {
  // Memoized render item to prevent unnecessary re-renders
  const memoizedRenderItem = useCallback<ListRenderItem<T>>(
    ({ item, index }) => {
      const MemoizedItem = memo(() => renderItem({ item, index, separators: {} as any }));
      return <MemoizedItem />;
    },
    [renderItem]
  );

  // Optimized getItemLayout for fixed height items
  const getItemLayout = useMemo(() => {
    if (itemHeight) {
      return (data: any, index: number) => ({
        length: itemHeight,
        offset: itemHeight * index,
        index,
      });
    }
    return undefined;
  }, [itemHeight]);

  // Default key extractor
  const defaultKeyExtractor = useCallback(
    (item: T, index: number) => {
      if (keyExtractor) {
        return keyExtractor(item, index);
      }
      
      // Try to use id field if available
      if (typeof item === 'object' && item !== null && 'id' in item) {
        return String((item as any).id);
      }
      
      // Fallback to index
      return String(index);
    },
    [keyExtractor]
  );

  return (
    <FlatList
      data={data}
      renderItem={memoizedRenderItem}
      keyExtractor={defaultKeyExtractor}
      getItemLayout={getItemLayout}
      // Performance optimizations
      removeClippedSubviews={true}
      maxToRenderPerBatch={10}
      updateCellsBatchingPeriod={50}
      initialNumToRender={10}
      windowSize={10}
      // Scroll optimizations
      scrollEventThrottle={16}
      // Memory optimizations
      disableVirtualization={false}
      {...flatListProps}
    />
  );
}

// Export as generic component
export const OptimizedFlatList = OptimizedFlatListComponent as <T>(
  props: OptimizedFlatListProps<T>
) => React.ReactElement;

export default OptimizedFlatList;