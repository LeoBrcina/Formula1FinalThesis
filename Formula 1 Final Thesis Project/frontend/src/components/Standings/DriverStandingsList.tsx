// components/Standings/DriverStandingsList.tsx
"use client";

import { Card } from '../Card';
import { useDriverStandings } from '../../lib/hooks/useDriverStandings';
import { LoadingSpinner } from "../LoadingSpinner";

export function DriverStandingsList({ year }: { year: number }) {
  const { standings, isLoading, isError } = useDriverStandings(year);

  if (isLoading) return <Card title={`Driver Standings (${year})`}><LoadingSpinner/></Card>;
  if (isError || !standings) return <Card title={`Driver Standings (${year})`}>Error loading data.</Card>;

  return (
    <Card title={`Driver Standings (${year})`} className="w-full max-w-[95%] p-8">
      <ul className="space-y-4">
        {standings.map((d) => (
          <li key={d.position} className="flex justify-between">
            <div>
              <span className="font-bold mr-2">{d.position}.</span>
              {d.driver}
              <span className="text-gray-400 ml-1">({d.constructor})</span>
            </div>
            <div className="font-medium">{d.points} pts</div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
