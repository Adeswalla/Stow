'use client';

import { useEffect, useCallback } from 'react';
import {
  setSentryUser,
  clearSentryUser,
  captureException,
  captureMessage,
  addSentryBreadcrumb,
  setSentryContext,
  type SeverityLevel,
} from '@/lib/sentry';
import * as Sentry from '@sentry/nextjs';

interface User {
  id?: string;
  username?: string;
  email?: string;
  [key: string]: any;
}

export interface UseSentryReturn {
  setUser: (user: User | null) => void;
  clearUser: () => void;
  captureError: (error: Error, context?: Record<string, any>) => string;
  logMessage: (message: string, level?: SeverityLevel, context?: Record<string, any>) => string;
  addBreadcrumb: (message: string, category?: string, level?: SeverityLevel, data?: Record<string, any>) => void;
  setContext: (name: string, context: Record<string, any>) => void;
}

export function useSentry(): UseSentryReturn {
  // Track route changes
  useEffect(() => {
    const handleRouteChange = (url: string) => {
      addSentryBreadcrumb(
        `Navigation to ${url}`,
        'navigation',
        'info'
      );
    };

    // This would need to be integrated with your router
    // For Next.js App Router, you might use usePathname and useSearchParams
    
    return () => {
      // Cleanup if needed
    };
  }, []);

  const setUser = useCallback((user: User | null) => {
    if (user) {
      setSentryUser(user);
    } else {
      clearSentryUser();
    }
  }, []);

  const clearUser = useCallback(() => {
    clearSentryUser();
  }, []);

  const captureError = useCallback((error: Error, context?: Record<string, any>) => {
    return captureException(error, context);
  }, []);

  const logMessage = useCallback((
    message: string,
    level?: SeverityLevel,
    context?: Record<string, any>
  ) => {
    return captureMessage(message, level, context);
  }, []);

  const addBreadcrumb = useCallback((
    message: string,
    category?: string,
    level?: SeverityLevel,
    data?: Record<string, any>
  ) => {
    addSentryBreadcrumb(message, category, level, data);
  }, []);

  const setContext = useCallback((name: string, context: Record<string, any>) => {
    setSentryContext(name, context);
  }, []);

  return {
    setUser,
    clearUser,
    captureError,
    logMessage,
    addBreadcrumb,
    setContext,
  };
}
