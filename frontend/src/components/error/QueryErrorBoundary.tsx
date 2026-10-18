'use client';

/**
 * Query Error Boundary
 * Specialized error boundary for React Query errors
 */

import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';
import { useQueryErrorResetBoundary } from '@tanstack/react-query';
import { ReactNode } from 'react';

interface QueryErrorBoundaryProps {
  children: ReactNode;
  /**
   * Custom fallback component
   */
  fallback?: ReactNode | ((props: ErrorFallbackProps) => ReactNode);
}

interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

function DefaultErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
  return (
    <div
      role="alert"
      className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-800 p-4"
    >
      <div className="flex items-start">
        <svg
          className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">
            Failed to load data
          </h3>
          <p className="text-sm text-red-700 dark:text-red-300 mb-3">
            {error.message || 'An unexpected error occurred while fetching data.'}
          </p>
          <button
            onClick={resetErrorBoundary}
            className="text-sm font-medium text-red-700 dark:text-red-300 hover:text-red-800 dark:hover:text-red-200 underline focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded"
          >
            Try again
          </button>
        </div>
      </div>
    </div>
  );
}

export function QueryErrorBoundary({
  children,
  fallback,
}: QueryErrorBoundaryProps) {
  const { reset } = useQueryErrorResetBoundary();

  return (
    <ReactErrorBoundary
      onReset={reset}
      fallbackRender={(props) => {
        if (typeof fallback === 'function') {
          return fallback(props);
        }
        if (fallback) {
          return <>{fallback}</>;
        }
        return <DefaultErrorFallback {...props} />;
      }}
    >
      {children}
    </ReactErrorBoundary>
  );
}
