"use client";

import { useState } from "react";
import { PasswordUpdateForm } from "./PasswordUpdateForm";
import { POSIntegration } from "./POSIntegration";

type Tab = "pos" | "password";

export function SettingsTabs() {
  const [activeTab, setActiveTab] = useState<Tab>("pos");

  const tabs = [
    {
      id: "pos" as Tab,
      name: "POS Integrations",
      description: "Connect your existing Point of Sale system",
    },
    {
      id: "password" as Tab,
      name: "Password",
      description: "Update your password to keep your account secure",
    },
  ];

  return (
    <div className="bg-white shadow rounded-xl">
      {/* Tab Navigation */}
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                ${
                  activeTab === tab.id
                    ? "border-orange-500 text-orange-500"
                    : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                }
              `}
            >
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="px-6 py-6">
        {/* POS Integration Tab */}
        {activeTab === "pos" && (
          <div>
            <div className="mb-6">
              <h2 className="text-lg font-medium text-navy-500">
                POS Integration
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Connect your existing Point of Sale system
              </p>
            </div>
            <POSIntegration />
          </div>
        )}

        {/* Password Tab */}
        {activeTab === "password" && (
          <div>
            <div className="mb-6">
              <h2 className="text-lg font-medium text-navy-500">
                Account Security
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Update your password to keep your account secure
              </p>
            </div>
            <PasswordUpdateForm />
          </div>
        )}
      </div>
    </div>
  );
}
