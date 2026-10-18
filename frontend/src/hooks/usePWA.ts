'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  registerServiceWorker,
  isPWAInstalled,
  isOnline,
  setupNetworkListeners,
  setupInstallPrompt,
  promptInstall,
  checkForUpdates,
  type BeforeInstallPromptEvent,
} from '@/lib/pwa';

export interface UsePWAReturn {
  isInstalled: boolean;
  isOnline: boolean;
  isUpdateAvailable: boolean;
  installPrompt: BeforeInstallPromptEvent | null;
  canInstall: boolean;
  install: () => Promise<void>;
  checkUpdates: () => Promise<void>;
}

export function usePWA(): UsePWAReturn {
  const [isInstalled, setIsInstalled] = useState(false);
  const [online, setOnline] = useState(true);
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  // Check if PWA is installed
  useEffect(() => {
    setIsInstalled(isPWAInstalled());
    setOnline(isOnline());
  }, []);

  // Register service worker
  useEffect(() => {
    registerServiceWorker();
  }, []);

  // Setup network listeners
  useEffect(() => {
    const cleanup = setupNetworkListeners(
      () => setOnline(true),
      () => setOnline(false)
    );
    return cleanup;
  }, []);

  // Setup install prompt listener
  useEffect(() => {
    const cleanup = setupInstallPrompt((event) => {
      setInstallPrompt(event);
    });
    return cleanup;
  }, []);

  // Check for app updates periodically
  useEffect(() => {
    const checkInterval = setInterval(async () => {
      const hasUpdate = await checkForUpdates();
      setIsUpdateAvailable(hasUpdate);
    }, 60000); // Check every minute

    return () => clearInterval(checkInterval);
  }, []);

  // Install handler
  const install = useCallback(async () => {
    if (!installPrompt) return;

    const result = await promptInstall(installPrompt);
    if (result?.outcome === 'accepted') {
      setInstallPrompt(null);
      setIsInstalled(true);
    }
  }, [installPrompt]);

  // Check updates handler
  const checkUpdates = useCallback(async () => {
    const hasUpdate = await checkForUpdates();
    setIsUpdateAvailable(hasUpdate);
  }, []);

  return {
    isInstalled,
    isOnline: online,
    isUpdateAvailable,
    installPrompt,
    canInstall: installPrompt !== null && !isInstalled,
    install,
    checkUpdates,
  };
}
