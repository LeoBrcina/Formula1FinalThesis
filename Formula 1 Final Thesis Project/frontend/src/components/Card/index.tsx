// src/components/Card.tsx
import React, { ReactNode } from 'react';

export interface CardProps {
  title?: string;
  icon?: ReactNode;
  footer?: ReactNode;
  className?: string;
  children: ReactNode;
}

export function Card({ title, icon, footer, className = '', children }: CardProps) {
  return (
    <div
      className={`w-full min-h-[100px] p-6
                  bg-gradient-to-br from-gray-900 to-gray-800
                  rounded-2xl border border-gray-700 shadow-lg
                  hover:border-red-500 hover:shadow-red-500/40
                  transition-all duration-300 hover:scale-105
                  ${className}`}
    >
      {title && (
        <div className="flex items-center mb-4">
          {icon && <span className="mr-2">{icon}</span>}
          {/* Card title now inherits the global F1Wide scaling via h3 */}
          <h3 className="text-base md:text-lg font-bold text-white">{title}</h3>
        </div>
      )}
      {/* Shrink content slightly */}
      <div className="text-gray-200 text-sm">{children}</div>
      {footer && (
        <div className="pt-4 border-t border-gray-700 text-gray-400 text-xs">
          {footer}
        </div>
      )}
    </div>
  );
}
