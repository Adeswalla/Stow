import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV,
  
  // Performance Monitoring
  tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '1.0'),
  
  // Don't send in development
  enabled: process.env.SENTRY_ENABLED === 'true',

  // Ignore common errors
  ignoreErrors: [
    'ECONNREFUSED',
    'ENOTFOUND',
    'ETIMEDOUT',
    'ECONNRESET',
  ],

  beforeSend(event, hint) {
    // Remove sensitive data from error messages
    if (event.message) {
      event.message = event.message
        .replace(/0x[a-fA-F0-9]{64}/g, '[PRIVATE_KEY_REDACTED]')
        .replace(/Bearer\s+[A-Za-z0-9-._~+/]+=*/gi, 'Bearer [TOKEN_REDACTED]');
    }

    // Remove sensitive headers
    if (event.request?.headers) {
      delete event.request.headers['authorization'];
      delete event.request.headers['cookie'];
    }

    // Remove sensitive environment variables
    if (event.contexts?.runtime?.env) {
      const sensitiveEnvVars = [
        'DATABASE_URL',
        'JWT_SECRET',
        'API_KEY',
        'PRIVATE_KEY',
        'SECRET',
      ];
      
      for (const envVar of sensitiveEnvVars) {
        if (event.contexts.runtime.env[envVar]) {
          event.contexts.runtime.env[envVar] = '[REDACTED]';
        }
      }
    }

    return event;
  },
});
