// src/components/Card/QuickStatCard.tsx
"use client";

import React from "react";
import Link from "next/link";

export interface QuickStatCardProps {
  title: string;
  main: string;
  sub: string;
  icon: React.ReactNode;
  href?: string;
  onClick?: () => void;
}

export function QuickStatCard({
  title,
  main,
  sub,
  icon,
  href,
  onClick,
}: QuickStatCardProps) {
  const content = (
    <div
      className="flex items-center space-x-4 p-6 w-full min-h-[180px]
                 bg-gradient-to-br from-gray-900 to-gray-800 
                 rounded-2xl shadow-lg border border-gray-700 
                 hover:border-red-500 hover:shadow-red-500/40 
                 transition-all duration-300 hover:scale-105 cursor-pointer"
    >
      <div className="w-10 h-10 flex items-center justify-center text-red-500">
        {icon}
      </div>
      <div>
        {/* Keep labels light and clean */}
        <div className="text-xs text-gray-400">{title}</div>
        {/* Apply compression/stretch to the main stat */}
        <div className="text-lg font-bold text-white text-compressed">
          {main}
        </div>
        <div className="text-xs text-gray-500">{sub}</div>
      </div>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  if (onClick) {
    return <div onClick={onClick}>{content}</div>;
  }

  return content;
}
