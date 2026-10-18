'use client';

/**
 * Example usage of Error Boundary components
 */

import { useState } from 'react';
import { ErrorBoundary, QueryErrorBoundary, AsyncErrorBoundary } from '@/components/error';
import { useSavings } from '@/hooks/useApi';

/**
 * Component that throws an error for testing
 */
function BuggyComponent({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('This is a test error from BuggyComponent');
  }
  return <div>Component is working fine!</div>;
}

/**
 * Example: Basic Error Boundary
 */
export function BasicErrorBoundaryExample() {
  const [shouldThrow, setShouldThrow] = useState(false);

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold">Basic Error Boundary Example</h2>
      <button
        onClick={() => setShouldThrow(!shouldThrow)}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        {shouldThrow ? 'Reset' : 'Trigger Error'}
      </button>
      <ErrorBoundary
        resetKeys={[shouldThrow]}
        onError={(error) => {
          console.error('Error caught:', error);
        }}
      >
        <BuggyComponent shouldThrow={shouldThrow} />
      </ErrorBoundary>
    </div>
  );
}

/**
 * Example: Custom Error Boundary Fallback
 */
export function CustomErrorBoundaryExample() {
  const [shouldThrow, setShouldThrow] = useState(false);

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold">Custom Error Boundary Example</h2>
      <button
        onClick={() => setShouldThrow(!shouldThrow)}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        {shouldThrow ? 'Reset' : 'Trigger Error'}
      </button>
      <ErrorBoundary
        resetKeys={[shouldThrow]}
        fallback={(error, resetError) => (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
              Oops! Something went wrong
            </h3>
            <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-4">
              {error.message}
            </p>
            <button
              onClick={resetError}
              className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
            >
              Try again
            </button>
          </div>
        )}
      >
        <BuggyComponent shouldThrow={shouldThrow} />
      </ErrorBoundary>
    </div>
  );
}

/**
 * Example: Query Error Boundary with React Query
 */
export function QueryErrorBoundaryExample() {
  const { data, isLoading } = useSavings();

  if (isLoading) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold">Query Error Boundary Example</h2>
      <QueryErrorBoundary
        fallback={(props) => (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
              Failed to load savings data
            </h3>
            <p className="text-sm text-red-700 dark:text-red-300 mb-4">
              {props.error.message}
            </p>
            <button
              onClick={props.resetErrorBoundary}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        )}
      >
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <h3 className="font-semibold mb-2">Savings Data</h3>
          <pre className="text-sm bg-gray-100 dark:bg-gray-900 p-3 rounded overflow-auto">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      </QueryErrorBoundary>
    </div>
  );
}

/**
 * Example: Async Error Boundary with Suspense
 */
export function AsyncErrorBoundaryExample() {
  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold">Async Error Boundary Example</h2>
      <AsyncErrorBoundary
        loadingFallback={
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              <span className="ml-3 text-blue-600 dark:text-blue-400">
                Loading data...
              </span>
            </div>
          </div>
        }
        errorFallback={(error, resetError) => (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
              Async Error
            </h3>
            <p className="text-sm text-red-700 dark:text-red-300 mb-4">
              {error.message}
            </p>
            <button
              onClick={resetError}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Try again
            </button>
          </div>
        )}
      >
        <AsyncDataComponent />
      </AsyncErrorBoundary>
    </div>
  );
}

/**
 * Simulated async component
 */
function AsyncDataComponent() {
  // This would typically be a component that uses Suspense
  // For example, with React Server Components or Suspense for data fetching
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <h3 className="font-semibold mb-2">Async Data Loaded</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        This component successfully loaded async data.
      </p>
    </div>
  );
}

/**
 * Example: Nested Error Boundaries
 */
export function NestedErrorBoundariesExample() {
  const [throwInChild, setThrowInChild] = useState(false);
  const [throwInParent, setThrowInParent] = useState(false);

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold">Nested Error Boundaries Example</h2>
      <div className="space-x-2">
        <button
          onClick={() => setThrowInChild(!throwInChild)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          {throwInChild ? 'Reset Child' : 'Trigger Child Error'}
        </button>
        <button
          onClick={() => setThrowInParent(!throwInParent)}
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
        >
          {throwInParent ? 'Reset Parent' : 'Trigger Parent Error'}
        </button>
      </div>

      <ErrorBoundary
        resetKeys={[throwInParent]}
        fallback={(error, reset) => (
          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-6">
            <h3 className="font-semibold text-purple-800 dark:text-purple-200">
              Parent Boundary Caught Error
            </h3>
            <p className="text-sm text-purple-700 dark:text-purple-300 mt-2">
              {error.message}
            </p>
            <button
              onClick={reset}
              className="mt-4 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              Reset Parent
            </button>
          </div>
        )}
      >
        <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
          <h4 className="font-semibold mb-2">Parent Component</h4>
          <BuggyComponent shouldThrow={throwInParent} />

          <ErrorBoundary
            resetKeys={[throwInChild]}
            fallback={(error, reset) => (
              <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 dark:text-blue-200">
                  Child Boundary Caught Error
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-2">
                  {error.message}
                </p>
                <button
                  onClick={reset}
                  className="mt-2 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                >
                  Reset Child
                </button>
              </div>
            )}
          >
            <div className="mt-4 border rounded-lg p-4 bg-white dark:bg-gray-700">
              <h5 className="font-semibold mb-2">Child Component</h5>
              <BuggyComponent shouldThrow={throwInChild} />
            </div>
          </ErrorBoundary>
        </div>
      </ErrorBoundary>
    </div>
  );
}
