// src/components/Telemetry/StrategyChart.tsx
"use client";

import { useState, useEffect } from "react";
import { Card } from "../Card";
import { useStrategy, SessionCode } from "../../lib/hooks/useStrategy";
import { LoadingSpinner } from "../LoadingSpinner";

interface StrategyChartProps {
  year: number;
  round: number;
}

// Human-readable labels for the dropdown
const SESSION_LABELS: Record<SessionCode, string> = {
  FP1: "Practice 1",
  FP2: "Practice 2",
  FP3: "Practice 3",
  Q: "Qualifying",
  SQ: "Sprint Qualifying",
  R: "Race",
  S: "Sprint Race",
};

export function StrategyChart({ year, round }: StrategyChartProps) {
  const [session, setSession] = useState<SessionCode>("R");
  const { availableSessions, data, isLoading, isError } =
    useStrategy(year, round, session);

  // default away from "R" if needed
  useEffect(() => {
    if (
      !isLoading &&
      availableSessions.length > 0 &&
      !availableSessions.includes(session)
    ) {
      setSession(availableSessions[0]);
    }
  }, [availableSessions, isLoading, session]);

  if (isLoading) {
    return (
      <Card title="Strategies">
        <LoadingSpinner />
      </Card>
    );
  }
  if (!availableSessions.length) {
    return <Card>No strategy data available</Card>;
  }
  if (isError || !data) {
    return <Card>Error loading strategy</Card>;
  }

  const { drivers } = data;
  const maxLap = Math.max(
    ...drivers.flatMap((d) => d.stints.map((s) => s.endLap))
  );

  const compoundColors: Record<string, string> = {
    SOFT: "#FF4C4C",
    MEDIUM: "#FFD700",
    HARD: "#EEEEEE",
    INTERMEDIATE: "#00AF00",
    WET: "#0077FF",
  };

  return (
    <Card>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-2 border-b border-gray-700">
        <h3 className="text-base md:text-lg font-bold text-white">
          Strategies — {SESSION_LABELS[session]}
        </h3>
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-300">Session</label>
          <select
            value={session}
            onChange={(e) => setSession(e.target.value as SessionCode)}
            className="
              bg-gradient-to-br from-gray-900 to-gray-800
              border border-gray-700
              text-sm font-semibold text-white
              px-3 py-1
              rounded-none
              shadow-sm
              hover:border-red-500
              focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500
              transition-all duration-200
            "
          >
            {availableSessions.map((code) => (
              <option
                key={code}
                value={code}
                className="bg-gray-800 text-gray-200"
                style={{ backgroundColor: "#1f2937", color: "#e5e7eb" }}
              >
                {SESSION_LABELS[code]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Strategy Bars */}
      <div className="flex">
        {/* driver labels */}
        <div className="flex flex-col pr-4">
          {drivers.map((d) => (
            <div
              key={d.driverId}
              className="h-6 mb-1 flex items-center text-sm text-gray-300"
            >
              {d.driverId}
            </div>
          ))}
        </div>

        {/* stints */}
        <div
          className={`
            flex-1 scrollbar-thin scrollbar-thumb-gray-700
            ${session === "R" ? "overflow-x-auto" : "overflow-visible"}
          `}
        >
          <div
            className="relative"
            style={{
              width: session === "R" ? `${maxLap * 16}px` : "100%",
              minWidth: "100%",
            }}
          >
            {drivers.map((d) => (
              <div
                key={d.driverId}
                className="relative h-6 mb-1 overflow-visible"
              >
                {/* background */}
                <div className="absolute inset-0 bg-gray-800 rounded-sm" />

                {d.stints.map((s) => {
                  const leftPct = ((s.startLap - 1) / maxLap) * 100;
                  const widthPct =
                    ((s.endLap - s.startLap + 1) / maxLap) * 100;
                  return (
                    <div
                      key={s.stint}
                      className="absolute h-full cursor-pointer group border-r border-white"
                      style={{
                        left: `${leftPct}%`,
                        width: `${widthPct}%`,
                        backgroundColor:
                          compoundColors[s.compound] || "#888",
                      }}
                    >
                      {/* tooltip */}
                      <div className="
                        absolute -top-8 left-1/2 transform -translate-x-1/2
                        whitespace-nowrap bg-gray-800 text-xs text-white
                        px-2 py-1 rounded shadow-md
                        opacity-0 group-hover:opacity-100
                        transition-opacity duration-150
                        pointer-events-none
                      ">
                        Lap {s.startLap}–{s.endLap}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 flex justify-center space-x-15 text-sm">
        {Object.entries(compoundColors).map(([comp, col]) => (
          <div
            key={comp}
            className="flex items-center space-x-2 whitespace-nowrap"
          >
            <span
              className="w-4 h-4 rounded-sm border border-gray-600"
              style={{ backgroundColor: col }}
            />
            <span className="text-gray-300 capitalize">
              {comp.toLowerCase()}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
