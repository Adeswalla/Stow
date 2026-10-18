'use client';

/**
 * Virtual Scrolling List Component
 * Efficiently renders large lists by only rendering visible items
 */

import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';

export interface VirtualListProps<T> {
  /**
   * Array of items to render
   */
  items: T[];
  /**
   * Estimated size of each item in pixels
   */
  estimateSize?: number;
  /**
   * Number of items to render above and below visible area
   */
  overscan?: number;
  /**
   * Render function for each item
   */
  renderItem: (item: T, index: number) => React.ReactNode;
  /**
   * Optional custom key extractor
   */
  getItemKey?: (item: T, index: number) => string | number;
  /**
   * Optional loading state
   */
  isLoading?: boolean;
  /**
   * Optional empty state
   */
  emptyState?: React.ReactNode;
  /**
   * Optional loading state
   */
  loadingState?: React.ReactNode;
  /**
   * Custom class name for container
   */
  className?: string;
  /**
   * Custom class name for list
   */
  listClassName?: string;
  /**
   * Height of the scrollable container
   */
  height?: string | number;
}

export function VirtualList<T>({
  items,
  estimateSize = 50,
  overscan = 5,
  renderItem,
  getItemKey,
  isLoading = false,
  emptyState,
  loadingState,
  className = '',
  listClassName = '',
  height = '600px',
}: VirtualListProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan,
  });

  // Loading state
  if (isLoading) {
    return (
      <div
        className={`overflow-auto ${className}`}
        style={{ height }}
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        {loadingState || (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Loading...
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Empty state
  if (items.length === 0) {
    return (
      <div
        className={`overflow-auto ${className}`}
        style={{ height }}
        role="status"
        aria-live="polite"
      >
        {emptyState || (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              No items to display
            </p>
          </div>
        )}
      </div>
    );
  }

  const virtualItems = virtualizer.getVirtualItems();

  return (
    <div
      ref={parentRef}
      className={`overflow-auto ${className}`}
      style={{ height }}
      role="list"
    >
      <div
        className={`relative ${listClassName}`}
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
        }}
      >
        {virtualItems.map((virtualItem) => {
          const item = items[virtualItem.index];
          const key = getItemKey
            ? getItemKey(item, virtualItem.index)
            : virtualItem.index;

          return (
            <div
              key={key}
              role="listitem"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualItem.size}px`,
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              {renderItem(item, virtualItem.index)}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Virtual Grid Component
 * For rendering items in a grid layout with virtual scrolling
 */
export interface VirtualGridProps<T> extends Omit<VirtualListProps<T>, 'listClassName'> {
  /**
   * Number of columns in the grid
   */
  columns?: number;
  /**
   * Gap between items in pixels
   */
  gap?: number;
}

export function VirtualGrid<T>({
  items,
  columns = 3,
  gap = 16,
  estimateSize = 200,
  overscan = 3,
  renderItem,
  getItemKey,
  isLoading = false,
  emptyState,
  loadingState,
  className = '',
  height = '600px',
}: VirtualGridProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);

  // Calculate rows
  const rowCount = Math.ceil(items.length / columns);

  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan,
  });

  // Loading state
  if (isLoading) {
    return (
      <div
        className={`overflow-auto ${className}`}
        style={{ height }}
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        {loadingState || (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Loading...
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Empty state
  if (items.length === 0) {
    return (
      <div
        className={`overflow-auto ${className}`}
        style={{ height }}
        role="status"
        aria-live="polite"
      >
        {emptyState || (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              No items to display
            </p>
          </div>
        )}
      </div>
    );
  }

  const virtualItems = virtualizer.getVirtualItems();

  return (
    <div
      ref={parentRef}
      className={`overflow-auto ${className}`}
      style={{ height }}
      role="list"
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualItems.map((virtualRow) => {
          const startIndex = virtualRow.index * columns;
          const rowItems = items.slice(startIndex, startIndex + columns);

          return (
            <div
              key={virtualRow.index}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
                display: 'grid',
                gridTemplateColumns: `repeat(${columns}, 1fr)`,
                gap: `${gap}px`,
              }}
            >
              {rowItems.map((item, colIndex) => {
                const index = startIndex + colIndex;
                const key = getItemKey ? getItemKey(item, index) : index;

                return (
                  <div key={key} role="listitem">
                    {renderItem(item, index)}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
