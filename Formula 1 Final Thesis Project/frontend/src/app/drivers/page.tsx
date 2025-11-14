"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { SeasonSelector } from "../../components/SeasonSelector";
import { DriverStandingsList } from "../../components/Standings/DriverStandingsList";

export default function DriversPage() {
  const params = useSearchParams();
  const currentYear = new Date().getFullYear();
  const urlYear = Number(params.get("year")) || currentYear;
  const [season, setSeason] = useState<number>(urlYear);

  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("year", String(season));
    window.history.replaceState(null, "", url.toString());
  }, [season]);

  return (
    <main className="w-full max-w-[95%] mx-auto px-10 py-12 space-y-8">
      {/* Left-Aligned Header */}
      <section className="flex justify-center space-x-3">
        <h1 className="text-3xl font-bold text-white text-compressed">
          Driver Standings
        </h1>
        <SeasonSelector
          value={season}
          onChange={setSeason}
          startYear={1950}
          endYear={new Date().getFullYear()}
        />
      </section>

      {/* Centered standings list */}
      <section className="flex justify-center">
        <DriverStandingsList year={season} />
      </section>
    </main>
  );
}
