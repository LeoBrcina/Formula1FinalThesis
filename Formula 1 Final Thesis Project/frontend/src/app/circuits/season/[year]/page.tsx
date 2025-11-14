// src/app/circuits/season/[year]/page.tsx
"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import { SeasonSelector } from "../../../../components/SeasonSelector";
import type { CircuitSummary } from "../../../../lib/hooks/useCircuits";
import { useCircuits } from "../../../../lib/hooks/useCircuits";
import { LoadingSpinner } from "../../../../components/LoadingSpinner";
import { Card } from "../../../../components/Card";

export default function SeasonCircuitsPage() {
  const { year: yearParam } = useParams();
  const initialYear = Number(yearParam);

  const [season, setSeason] = useState(initialYear);
  const { circuits, isLoading, isError } = useCircuits(season);
  const router = useRouter();

  useEffect(() => {
    router.replace(`/circuits/season/${season}`, { scroll: false });
  }, [season, router]);

  if (isError) {
    return <div className="p-6 text-red-500">Error loading circuits.</div>;
  }
  if (isLoading || !circuits) {
    return (<Card title="Loading circuits">
            <LoadingSpinner />
          </Card>);
  }

  return (
    <main className="container mx-auto p-6 space-y-6">
      {/* Header + Year Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-3xl font-bold text-white text-compressed">
          Circuits in {season}
        </h1>
        <SeasonSelector
          value={season}
          onChange={setSeason}
          startYear={1950}
          endYear={new Date().getFullYear()}
        />
      </div>

      {/* Circuit Cards */}
      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {circuits.map((c) => (
          <li key={c.circuitId}>
            <Link
              href={`/circuits/${c.circuitId}`}
              className="group flex flex-col justify-between p-6 min-h-[150px]
                bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl
                border border-gray-700 shadow-lg
                hover:border-red-500 hover:shadow-red-500/40
                transition-all duration-300 hover:scale-105"
            >
              <div
                className="text-lg font-bold text-white text-compressed leading-snug 
                  transition-colors duration-300 group-hover:text-red-500"
              >
                {c.name}
              </div>
              <div className="text-sm text-gray-400 mt-2">
                {c.locality}, {c.country}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
