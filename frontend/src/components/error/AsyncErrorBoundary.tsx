'use client';

/**
 * Async Error Boundary
 * Error boundary with suspense support for async operations
 */

import { Suspense, ReactNode } from 'react';
import { ErrorBoundary } from './ErrorBoundary';

interface AsyncErrorBoundaryProps {
  children: ReactNode;
  /**
   * Loading fallback while suspense is active
   */
  loadingFallback?: ReactNode;
  /**
   * Error fallback when an error occurs
   */
  errorFallback?: ReactNode | ((error: Error, resetError: () => void) => ReactNode);
  /**
   * Callback when an error is caught
   */
  onError?: (error: Error) => void;
}

function DefaultLoadingFallback() {
  return (
    <div className="flex items-center justify-center p-8" role="status" aria-live="polite">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
        <span className="sr-only">Loading...</span>
      </div>
    </div>
  );
}

/**
 * Combines Suspense and ErrorBoundary for async components
 */
export function AsyncErrorBoundary({
  children,
  loadingFallback,
  errorFallback,
  onError,
}: AsyncErrorBoundaryProps) {
  return (
    <ErrorBoundary
      fallback={errorFallback}
      onError={(error) => {
        onError?.(error);
        // Log to error service in production
        if (process.env.NODE_ENV === 'production') {
          console.error('Async error:', error);
        }
      }}
    >
      <Suspense fallback={loadingFallback || <DefaultLoadingFallback />}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
}
