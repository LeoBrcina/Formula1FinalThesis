// src/components/Tabs.tsx
"use client";

import React from "react";

export interface Tab {
  value: string;
  label: string;
}

interface TabsProps {
  tabs: Tab[];
  active: string;
  onChange: (value: string) => void;
}

export default function Tabs({ tabs, active, onChange }: TabsProps) {
  return (
    <div className="flex space-x-2 bg-gray-800 rounded-full p-1">
      {tabs.map((t) => {
        const isActive = t.value === active;
        return (
          <button
            key={t.value}
            onClick={() => onChange(t.value)}
            className={
              `px-4 py-2 rounded-full text-sm font-medium transition ` +
              (isActive
                ? "bg-f1red text-red-500"
                : "text-white hover:text-red-500 transition-colors")
            }
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
