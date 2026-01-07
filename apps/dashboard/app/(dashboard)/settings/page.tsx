import { getTenantContext } from "@lume-app/shared";
import { SettingsTabs } from "./components/SettingsTabs";

export default async function SettingsPage() {
  const context = await getTenantContext();

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-navy-500">Settings</h1>
        <p className="mt-2 text-slate-600">
          Manage your account settings and integrations
        </p>
      </div>

      {/* Tabbed Settings */}
      <SettingsTabs />
    </div>
  );
}
