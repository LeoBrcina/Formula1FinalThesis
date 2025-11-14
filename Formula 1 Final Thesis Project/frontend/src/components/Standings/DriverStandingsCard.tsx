"use client";

import Link from 'next/link';
import { Card } from '../Card';
import { useDriverStandings } from '../../lib/hooks/useDriverStandings';
import { LoadingSpinner } from "../LoadingSpinner";

interface DriverStandingsCardProps {
  year?: number;
  className?: string;
}

export function DriverStandingsCard({ year, className }: DriverStandingsCardProps) {
  const season = year ?? new Date().getFullYear();
  const { standings, isLoading, isError } = useDriverStandings(season);

  if (isLoading) {
    return <Card title={`Driver Standings (${season})`} className={className}><LoadingSpinner/></Card>;
  }
  if (isError || !standings) {
    return <Card title={`Driver Standings (${season})`} className={className}>Error loading data.</Card>;
  }

  return (
    <Link
      href={`/drivers?year=${season}`}
      className="block hover:opacity-90 transition-opacity"
    >
      <Card title={`Driver Standings (${season})`} className={className}>
        <ul className="space-y-2 text-base">
          {standings.slice(0, 5).map((d) => (
            <li
              key={d.position}
              className="flex justify-between items-center"
              style={{ lineHeight: "1.6" }}
            >
              <div className="text-compressed text-lg">
                <span className="font-bold mr-2">{d.position}.</span>
                {d.driver}
                <span className="text-gray-400 ml-1 text-sm">
                  ({d.constructor})
                </span>
              </div>
              <div className="font-medium text-sm text-compressed">
                {d.points} pts
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </Link>
  );
}
