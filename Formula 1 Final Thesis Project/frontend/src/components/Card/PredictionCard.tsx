"use client";

import React from "react";

interface PredictionCardProps {
  grandPrix: string;
  drivers: [string, string, string]; // [1st, 2nd, 3rd]
}

export function PredictionCard({ grandPrix, drivers }: PredictionCardProps) {
  const colors = ["text-yellow-400", "text-gray-300", "text-orange-400"]; // gold, silver, bronze

  return (
    <div
      className="group flex flex-col p-6 w-full min-h-[180px]
                 bg-gradient-to-br from-gray-900 to-gray-800 
                 rounded-2xl shadow-lg border border-gray-700 
                 hover:border-red-500 hover:shadow-red-500/40 
                 transition-all duration-300 hover:scale-105 cursor-pointer"
    >
      {/* Grand Prix Title - turns red on hover */}
      <h3 className="text-lg font-bold text-white mb-4 transition-colors duration-300 group-hover:text-red-500">
        {grandPrix}
      </h3>

      {/* Predicted Podium */}
      <div className="flex flex-col space-y-2">
        {drivers.map((driver, idx) => (
          <div key={idx} className={`font-semibold ${colors[idx]}`}>
            {idx + 1}. {driver}
          </div>
        ))}
      </div>
    </div>
  );
}
