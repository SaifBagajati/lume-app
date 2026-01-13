"use client";

import { POSIntegration as SharedPOSIntegration } from "@/app/components/POSIntegration";

/**
 * POS Integration component for the Settings page.
 * Uses the shared POSIntegration component with Settings-specific configuration.
 */
export function POSIntegration() {
  return (
    <SharedPOSIntegration
      showHero={false}
      showConnectedStatus={true}
      showSyncControls={true}
      callbackPath="/settings"
    />
  );
}
