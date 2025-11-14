"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import { SeasonSelector } from "../../../components/SeasonSelector";
import { LoadingSpinner } from "../../../components/LoadingSpinner";
import { Card } from "../../../components/Card";

interface Race {
  round: number;
  raceName: string;
  circuit: string;
  date: string | null;
}

export default function SeasonRacesPage() {
  const { year: yearParam } = useParams();
  const searchParams = useSearchParams();
  const initialYear = Number(yearParam);
  const [season, setSeason] = useState<number>(initialYear);
  const [races, setRaces] = useState<Race[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // decide startYear based on telemetry flag
  const isTelemetry = searchParams.get("telemetry") !== null;
  const selStart = isTelemetry ? 2019 : 1950;

  useEffect(() => {
    // preserve telemetry query param when changing season
    const base = isTelemetry
      ? `/races/${season}?telemetry=true`
      : `/races/${season}`;
    router.replace(base, { scroll: false });

    setRaces(null);
    setError(null);

    fetch(`http://localhost:8000/races/${season}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Status ${res.status}`);
        return res.json() as Promise<Race[]>;
      })
      .then(setRaces)
      .catch((e) => {
        console.error("Failed to fetch races:", e);
        setError(e.message);
      });
  }, [season, router, isTelemetry]);

  if (error) {
    return <div className="p-6 text-red-500">Error: {error}</div>;
  }
  if (!races) {
    return (<Card title="Loading races">
            <LoadingSpinner />
          </Card>);
  }

  return (
    <main className="container mx-auto p-6 space-y-6">
      {/* Header + SeasonSelector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-3xl font-bold">{season} F1 World Championship</h1>
        <SeasonSelector
          value={season}
          onChange={setSeason}
          startYear={selStart}
          endYear={new Date().getFullYear()}
        />
      </div>

      {/* Race cards grid */}
      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {races.map((race) => (
          <li key={race.round}>
            <Link
              href={`/results/${season}/${race.round}`}
              className="group flex flex-col justify-between p-6 min-h-[180px] 
                bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl 
                border border-gray-700 shadow-lg
                hover:border-red-500 hover:shadow-red-500/40 
                transition-all duration-300 hover:scale-105"
            >
              <div className="text-lg font-bold text-white text-compressed leading-snug 
                transition-colors duration-300 group-hover:text-red-500">
                {race.round}. {race.raceName}
              </div>
              <div className="text-sm text-gray-400 mt-2">{race.circuit}</div>
              {race.date && (
                <div className="mt-1 text-xs text-gray-500">
                  {new Date(race.date).toLocaleDateString()}
                </div>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
