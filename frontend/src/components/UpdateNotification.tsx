'use client';

import { usePWA } from '@/hooks/usePWA';

export function UpdateNotification() {
  const { isUpdateAvailable } = usePWA();

  const handleUpdate = () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((registration) => {
        if (registration?.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          window.location.reload();
        }
      });
    }
  };

  if (!isUpdateAvailable) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50 animate-in slide-in-from-bottom-5 duration-300">
      <div className="bg-blue-600 text-white rounded-lg shadow-2xl p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold mb-1">
              Update Available
            </h3>
            <p className="text-sm opacity-90 mb-3">
              A new version of the app is available. Update now for the latest features and improvements.
            </p>
            <button
              onClick={handleUpdate}
              className="px-4 py-2 bg-white text-blue-600 hover:bg-blue-50 text-sm font-medium rounded-lg transition-colors"
            >
              Update Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
