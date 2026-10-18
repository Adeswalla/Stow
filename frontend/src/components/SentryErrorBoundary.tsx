'use client';

import React from 'react';
import * as Sentry from '@sentry/nextjs';
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';

interface SentryErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetErrorBoundary: () => void }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

function DefaultErrorFallback({ 
  error, 
  resetErrorBoundary 
}: { 
  error: Error; 
  resetErrorBoundary: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 dark:bg-red-900/20 rounded-full mb-4">
          <svg
            className="w-6 h-6 text-red-600 dark:text-red-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white text-center mb-2">
          Something went wrong
        </h2>
        
        <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-6">
          An unexpected error occurred. Our team has been notified and is working on a fix.
        </p>
        
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <p className="text-xs font-mono text-gray-800 dark:text-gray-200 break-all">
              {error.message}
            </p>
          </div>
        )}
        
        <div className="flex gap-3">
          <button
            onClick={resetErrorBoundary}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Try Again
          </button>
          <button
            onClick={() => window.location.href = '/'}
            className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white text-sm font-medium rounded-lg transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    </div>
  );
}

export function SentryErrorBoundary({ 
  children, 
  fallback: FallbackComponent,
  onError 
}: SentryErrorBoundaryProps) {
  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    // Log to Sentry
    Sentry.withScope((scope) => {
      scope.setContext('errorInfo', errorInfo);
      Sentry.captureException(error);
    });

    // Call custom error handler
    onError?.(error, errorInfo);
  };

  return (
    <ReactErrorBoundary
      fallbackRender={({ error, resetErrorBoundary }) => {
        if (FallbackComponent) {
          return <FallbackComponent error={error} resetErrorBoundary={resetErrorBoundary} />;
        }
        return <DefaultErrorFallback error={error} resetErrorBoundary={resetErrorBoundary} />;
      }}
      onError={handleError}
    >
      {children}
    </ReactErrorBoundary>
  );
}
