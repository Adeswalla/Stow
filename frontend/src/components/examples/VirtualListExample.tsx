'use client';

/**
 * Example usage of VirtualList component
 */

import { VirtualList, VirtualGrid } from '@/components/ui/VirtualList';
import { useSavings } from '@/hooks/useApi';
import { QueryErrorBoundary } from '@/components/error';

interface SavingsItem {
  id: string;
  title: string;
  amount: number;
  targetDate: string;
  progress: number;
}

/**
 * Example: Virtual List with API data
 */
export function SavingsListExample() {
  const { data, isLoading, error } = useSavings();

  if (error) {
    return (
      <div className="text-red-600 p-4">
        Error loading savings: {error.message}
      </div>
    );
  }

  const items = (data?.items || []) as SavingsItem[];

  return (
    <QueryErrorBoundary>
      <VirtualList
        items={items}
        isLoading={isLoading}
        estimateSize={80}
        height="500px"
        className="border rounded-lg"
        getItemKey={(item) => item.id}
        renderItem={(item) => (
          <div className="p-4 border-b hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Target: {new Date(item.targetDate).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold text-lg text-gray-900 dark:text-white">
                  ${item.amount.toFixed(2)}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {item.progress}% complete
                </p>
              </div>
            </div>
            <div className="mt-2">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${item.progress}%` }}
                />
              </div>
            </div>
          </div>
        )}
        emptyState={
          <div className="text-center py-8 text-gray-600 dark:text-gray-400">
            No savings goals yet. Create your first goal to get started!
          </div>
        }
      />
    </QueryErrorBoundary>
  );
}

/**
 * Example: Virtual Grid
 */
export function SavingsGridExample() {
  const { data, isLoading } = useSavings();

  const items = (data?.items || []) as SavingsItem[];

  return (
    <VirtualGrid
      items={items}
      isLoading={isLoading}
      columns={3}
      gap={16}
      estimateSize={200}
      height="600px"
      className="border rounded-lg p-4"
      getItemKey={(item) => item.id}
      renderItem={(item) => (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
            {item.title}
          </h3>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-2">
            ${item.amount.toFixed(2)}
          </p>
          <div className="mb-2">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{ width: `${item.progress}%` }}
              />
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {item.progress}% • {new Date(item.targetDate).toLocaleDateString()}
          </p>
        </div>
      )}
    />
  );
}

/**
 * Example: Simple virtual list with static data
 */
export function SimpleVirtualListExample() {
  const items = Array.from({ length: 10000 }, (_, i) => ({
    id: i,
    name: `Item ${i + 1}`,
    description: `Description for item ${i + 1}`,
  }));

  return (
    <VirtualList
      items={items}
      estimateSize={60}
      height={400}
      className="border rounded-lg bg-white dark:bg-gray-800"
      getItemKey={(item) => item.id}
      renderItem={(item, index) => (
        <div
          className={`p-4 border-b ${
            index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-900' : ''
          }`}
        >
          <div className="font-medium text-gray-900 dark:text-white">
            {item.name}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {item.description}
          </div>
        </div>
      )}
    />
  );
}
