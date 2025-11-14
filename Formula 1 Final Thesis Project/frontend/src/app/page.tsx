"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SeasonSelector } from "../components/SeasonSelector";
import { DriverStandingsCard } from "../components/Standings/DriverStandingsCard";
import { ConstructorStandingsCard } from "../components/Standings/ConstructorStandingsCard";
import { QuickStatCard } from "../components/Card/QuickStatCard";
import {
  ChartBarIcon,
  BoltIcon,
  UserGroupIcon,
  BeakerIcon
} from "@heroicons/react/24/outline";

export default function HomePage() {
  const currentYear = new Date().getFullYear();
  const [season, setSeason] = useState<number>(currentYear);
  const router = useRouter();

  return (
    <main className="w-full max-w-[98%] mx-auto px-10 py-12 space-y-12">
      {/* Hero / Title */}
      <section className="text-center space-y-4">
        <h1 className="text-3xl font-extrabold text-f1red">
          F1 Data Analytics
        </h1>
        <p className="text-gray-400 dark:text-gray-300 max-w-3xl mx-auto text-base leading-relaxed mt-10">
          Comprehensive Formula 1 Data Analysis App with data ranging from 1950 to Today, featuring
          race data, driver standings, constructors standings and advanced telemetry data.
        </p>
      </section>

      {/* Section 2 – Standings (pushed down slightly) */}
      <section className="space-y-6 mt-32">
        <h2 className="text-xl font-bold text-white text-center">Current Standings</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 w-full">
          <DriverStandingsCard year={season} />
          <ConstructorStandingsCard year={season} />
        </div>
      </section>

      {/* Section 3 – Quick Analysis Tools */}
      <section className="space-y-6">
        <h2 className="text-xl font-bold text-white text-center">
          Quick Analysis Tools
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-16 w-full">
          <QuickStatCard
            title="Historical Data"
            main={`1950 — ${currentYear}`}
            sub="Complete race history"
            icon={<ChartBarIcon className="w-8 h-8 text-f1red" />}
            href={`/races/${season}`}
          />
          <QuickStatCard
            title="Telemetry Data"
            main={`2019 — ${currentYear}`}
            sub="In-depth race analysis"
            icon={<BoltIcon className="w-8 h-8 text-purple-500" />}
            onClick={() => router.push(`/races/${season}?telemetry=true`)}
          />
          <QuickStatCard
            title="Circuit Statistics"
            main="70+"
            sub="Complete profiles"
            icon={<UserGroupIcon className="w-8 h-8 text-green-500" />}
            href={`/circuits/season/${currentYear}`}
          />
        </div>
          <div className="col-span-1 lg:col-start-2 flex justify-center mt-10">
            <QuickStatCard
              title="Race Predictions"
              main="ML Insights"
              sub="Projected race podiums"
              icon={<BeakerIcon className="w-8 h-8 text-blue-400" />}
              href="/predictions"
            />
          </div>
      </section>
    </main>
  );
}
