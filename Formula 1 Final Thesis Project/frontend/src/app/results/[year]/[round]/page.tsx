// src/app/results/[year]/[round]/page.tsx
"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import Tabs from "../../../../components/Tabs";
import { PositionsChart } from "../../../../components/Telemetry/PositionsChart";
import { StrategyChart } from "../../../../components/Telemetry/StrategyChart";
import { LapTimesChart } from "../../../../components/Telemetry/LapTimesChart";
import { DominanceChart } from "../../../../components/Telemetry/DominanceChart";
import { CombinedTelemetry } from "../../../../components/Telemetry/CombinedTelemetry";
import { LoadingSpinner } from "../../../../components/LoadingSpinner";
import { Card } from "../../../../components/Card";

interface Result {
  position: number;
  driver: string;
  constructor: string;
  grid: number;
  laps: number;
  status: string;
  points: number;
}

interface RaceInfo {
  round: number;
  raceName: string;
  circuit: string;
  date: string | null;
}

type TabValue =
  | "results"
  | "positions"
  | "strategy"
  | "laptimes"
  | "dominance"
  | "telemetry";

export default function RaceResultsPage() {
  const { year: yearParam, round: roundParam } = useParams();
  const year = Number(yearParam);
  const round = Number(roundParam);

  const hasTelemetry = year >= 2019;

  const [raceName, setRaceName] = useState<string>("");
  const [results, setResults] = useState<Result[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<TabValue>("results");

  // Fetch race name
  useEffect(() => {
    fetch(`http://localhost:8000/races/${year}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Status ${res.status}`);
        return res.json() as Promise<RaceInfo[]>;
      })
      .then((r) => {
        const info = r.find((x) => x.round === round);
        setRaceName(info ? info.raceName : `GP #${round}`);
      })
      .catch(() => setRaceName(`GP #${round}`));
  }, [year, round]);

  // Fetch results
  useEffect(() => {
    fetch(`http://localhost:8000/results/${year}/${round}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Status ${res.status}`);
        return res.json() as Promise<Result[]>;
      })
      .then(setResults)
      .catch((e) => setError(e.message));
  }, [year, round]);

  if (error) {
    return <div className="p-6 text-red-500">Error: {error}</div>;
  }
  if (!results) {
    return (<Card title="Loading results">
                <LoadingSpinner />
              </Card>);
  }

  const tabs = [
    { value: "results" as TabValue, label: "Results" },
    ...(hasTelemetry
      ? [
        { value: "positions" as TabValue, label: "Positions" },
        { value: "strategy" as TabValue, label: "Strategy" },
        { value: "laptimes" as TabValue, label: "Lap Times" },
        { value: "dominance" as TabValue, label: "Track Dominance" },
        { value: "telemetry" as TabValue, label: "Telemetry" },
      ]
      : []),
  ];

  return (
    <main className="w-full max-w-[95%] mx-auto px-10 py-12 space-y-10">
      {/* Page Header */}
      <h1 className="text-3xl font-bold text-white text-compressed text-center">
        {year} {raceName} Results
      </h1>

      {/* Tabs (Telemetry) */}
      {hasTelemetry && (
        <div className="flex justify-center">
          <Tabs
            tabs={tabs}
            active={activeTab}
            onChange={(v) => setActiveTab(v as TabValue)}
          />
        </div>
      )}

      {/* Results Table Styled Like a Card */}
      {activeTab === "results" && (
        <div
          className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl border border-gray-700 shadow-lg
             hover:border-red-500 hover:shadow-red-500/40 transition-all duration-300 hover:scale-[1.01] overflow-x-auto"
        >
          <table className="min-w-full text-white">
            <thead className="bg-gray-100 dark:bg-gray-700 text-gray-300">
              <tr>
                <th className="px-4 py-2 text-left">Pos</th>
                <th className="px-4 py-2 text-left">Driver</th>
                <th className="px-4 py-2 text-left">Constructor</th>
                <th className="px-4 py-2 text-right">Grid</th>
                <th className="px-4 py-2 text-right">Laps</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-right">Pts</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => (
                <tr
                  key={r.position}
                  className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-800 transition duration-200 group"
                >
                  <td className="px-4 py-2 group-hover:text-red-500 transition-colors">{r.position}</td>
                  <td className="px-4 py-2 group-hover:text-red-500 transition-colors">
                    {r.driver}
                  </td>
                  <td className="px-4 py-2 group-hover:text-red-500 transition-colors">{r.constructor}</td>
                  <td className="px-4 py-2 group-hover:text-red-500 transition-colors">{r.grid}</td>
                  <td className="px-4 py-2 group-hover:text-red-500 transition-colors">{r.laps}</td>
                  <td className="px-4 py-2 group-hover:text-red-500 transition-colors">{r.status}</td>
                  <td className="px-4 py-2 group-hover:text-red-500 transition-colors">{r.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Telemetry Charts */}
      {hasTelemetry && activeTab === "positions" && (
        <PositionsChart year={year} round={round} />
      )}
      {hasTelemetry && activeTab === "strategy" && (
        <StrategyChart year={year} round={round} />
      )}
      {hasTelemetry && activeTab === "laptimes" && (
        <LapTimesChart year={year} round={round} />
      )}
      {hasTelemetry && activeTab === "dominance" && (
        <DominanceChart year={year} round={round} />
      )}
      {hasTelemetry && activeTab === "telemetry" && (
        <CombinedTelemetry year={year} round={round} />
      )}
    </main>
  );
}
