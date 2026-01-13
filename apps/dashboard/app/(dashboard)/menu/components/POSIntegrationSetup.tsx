"use client";

import { POSIntegration } from "@/app/components/POSIntegration";

/**
 * POS Integration setup component for the Menu page.
 * Uses the shared POSIntegration component with Menu-specific configuration.
 * Shows hero section when no POS is connected.
 */
export function POSIntegrationSetup() {
  return (
    <POSIntegration
      showHero={true}
      showConnectedStatus={true}
      showSyncControls={true}
      callbackPath="/menu"
    />
  );
}
