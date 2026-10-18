/**
 * Sentry error tracking configuration and utilities
 */

import * as Sentry from '@sentry/nextjs';

export interface SentryConfig {
  dsn: string;
  environment?: string;
  tracesSampleRate?: number;
  replaysSessionSampleRate?: number;
  replaysOnErrorSampleRate?: number;
  enabled?: boolean;
}

/**
 * Initialize Sentry for browser
 */
export function initSentry(config: SentryConfig): void {
  if (!config.enabled || !config.dsn) {
    console.log('Sentry is disabled or DSN is missing');
    return;
  }

  Sentry.init({
    dsn: config.dsn,
    environment: config.environment || process.env.NODE_ENV,
    
    // Performance Monitoring
    tracesSampleRate: config.tracesSampleRate ?? 1.0,
    
    // Session Replay
    replaysSessionSampleRate: config.replaysSessionSampleRate ?? 0.1,
    replaysOnErrorSampleRate: config.replaysOnErrorSampleRate ?? 1.0,
    
    integrations: [
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
      Sentry.browserTracingIntegration(),
      Sentry.feedbackIntegration({
        colorScheme: 'system',
        showBranding: false,
      }),
    ],

    // Ignore common errors
    ignoreErrors: [
      // Network errors
      'NetworkError',
      'Network request failed',
      'Failed to fetch',
      
      // Browser extensions
      'top.GLOBALS',
      'chrome-extension://',
      'moz-extension://',
      
      // Random plugins
      'fb_xd_fragment',
      'bmi_SafeAddOnload',
      'EBCallBackMessageReceived',
      
      // Common spam
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed with undelivered notifications',
      
      // Wallet related
      'User rejected the request',
      'User denied transaction signature',
    ],

    // Filter out personal information
    beforeSend(event, hint) {
      // Remove sensitive data from error messages
      if (event.message) {
        event.message = sanitizeMessage(event.message);
      }

      // Remove sensitive data from breadcrumbs
      if (event.breadcrumbs) {
        event.breadcrumbs = event.breadcrumbs.map((breadcrumb) => {
          if (breadcrumb.data) {
            breadcrumb.data = sanitizeData(breadcrumb.data);
          }
          return breadcrumb;
        });
      }

      // Remove sensitive headers
      if (event.request?.headers) {
        delete event.request.headers['Authorization'];
        delete event.request.headers['Cookie'];
      }

      return event;
    },

    // Normalize transaction names
    beforeSendTransaction(event) {
      // Remove query parameters from transaction names
      if (event.transaction) {
        event.transaction = event.transaction.split('?')[0];
      }
      return event;
    },
  });
}

/**
 * Sanitize sensitive data from messages
 */
function sanitizeMessage(message: string): string {
  // Remove potential private keys, seeds, and tokens
  return message
    .replace(/0x[a-fA-F0-9]{64}/g, '[PRIVATE_KEY_REDACTED]')
    .replace(/\b[A-Za-z0-9+/]{88}==/g, '[SECRET_REDACTED]')
    .replace(/Bearer\s+[A-Za-z0-9-._~+/]+=*/gi, 'Bearer [TOKEN_REDACTED]')
    .replace(/\b[a-z0-9]{40}\b/gi, '[ADDRESS_REDACTED]');
}

/**
 * Sanitize sensitive data from objects
 */
function sanitizeData(data: Record<string, any>): Record<string, any> {
  const sensitiveKeys = [
    'password',
    'token',
    'secret',
    'key',
    'privateKey',
    'mnemonic',
    'seed',
    'authorization',
    'cookie',
  ];

  const sanitized = { ...data };

  for (const key in sanitized) {
    const lowerKey = key.toLowerCase();
    if (sensitiveKeys.some((sensitive) => lowerKey.includes(sensitive))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeData(sanitized[key]);
    }
  }

  return sanitized;
}

/**
 * Set user context for Sentry
 */
export function setSentryUser(user: {
  id?: string;
  username?: string;
  email?: string;
  [key: string]: any;
}): void {
  Sentry.setUser({
    id: user.id,
    username: user.username,
    email: user.email,
  });
}

/**
 * Clear user context
 */
export function clearSentryUser(): void {
  Sentry.setUser(null);
}

/**
 * Set custom context
 */
export function setSentryContext(
  name: string,
  context: Record<string, any>
): void {
  Sentry.setContext(name, context);
}

/**
 * Add breadcrumb
 */
export function addSentryBreadcrumb(
  message: string,
  category?: string,
  level?: Sentry.SeverityLevel,
  data?: Record<string, any>
): void {
  Sentry.addBreadcrumb({
    message,
    category: category || 'custom',
    level: level || 'info',
    data: data ? sanitizeData(data) : undefined,
  });
}

/**
 * Capture exception
 */
export function captureException(
  error: Error,
  context?: Record<string, any>
): string {
  if (context) {
    Sentry.withScope((scope) => {
      Object.entries(context).forEach(([key, value]) => {
        scope.setContext(key, value);
      });
      Sentry.captureException(error);
    });
  }
  return Sentry.captureException(error);
}

/**
 * Capture message
 */
export function captureMessage(
  message: string,
  level?: Sentry.SeverityLevel,
  context?: Record<string, any>
): string {
  const sanitizedMessage = sanitizeMessage(message);
  
  if (context) {
    Sentry.withScope((scope) => {
      Object.entries(context).forEach(([key, value]) => {
        scope.setContext(key, value);
      });
      Sentry.captureMessage(sanitizedMessage, level || 'info');
    });
  }
  return Sentry.captureMessage(sanitizedMessage, level || 'info');
}

/**
 * Start a transaction for performance monitoring
 */
export function startTransaction(
  name: string,
  op: string
): Sentry.Transaction | undefined {
  return Sentry.startTransaction({
    name,
    op,
  });
}

/**
 * Set tag
 */
export function setSentryTag(key: string, value: string): void {
  Sentry.setTag(key, value);
}

/**
 * Set tags
 */
export function setSentryTags(tags: Record<string, string>): void {
  Sentry.setTags(tags);
}

/**
 * Flush events (useful before page unload)
 */
export async function flushSentry(timeout = 2000): Promise<boolean> {
  return await Sentry.flush(timeout);
}

/**
 * Close Sentry client
 */
export async function closeSentry(timeout = 2000): Promise<boolean> {
  return await Sentry.close(timeout);
}
