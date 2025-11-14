// src/components/Standings/ConstructorStandingsCard.tsx
"use client";

import Link from 'next/link';
import { Card } from '../Card';
import { useConstructorStandings } from '../../lib/hooks/useConstructorStandings';
import { LoadingSpinner } from "../LoadingSpinner";

interface ConstructorStandingsCardProps {
  year?: number;
  className?: string;
}

export function ConstructorStandingsCard({ year, className }: ConstructorStandingsCardProps) {
  const season = year ?? new Date().getFullYear();
  const { standings, isLoading, isError } = useConstructorStandings(season);

  if (isError) {
    console.error(`Failed to load constructor standings for ${season}`);
  }

  if (isLoading) {
    return (
      <Card title={`Constructor Standings (${season})`} className={className}>
        <LoadingSpinner/>
      </Card>
    );
  }
  if (isError || !standings) {
    return (
      <Card title={`Constructor Standings (${season})`} className={className}>
        Error loading data.
      </Card>
    );
  }

  return (
    <Link
      href={`/constructors?year=${season}`}
      className="block hover:opacity-90 transition-opacity"
    >
      <Card title={`Constructor Standings (${season})`} className={className}>
        <ul className="space-y-2 text-base">
          {standings.slice(0, 5).map((c) => (
            <li
              key={c.position}
              className="flex justify-between items-center"
              style={{ lineHeight: '1.6' }}
            >
              <div className="text-compressed text-lg">
                <span className="font-bold mr-2">{c.position}.</span>
                {c.constructor}
              </div>
              <div className="font-medium text-sm text-compressed">
                {c.points} pts
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </Link>
  );
}
