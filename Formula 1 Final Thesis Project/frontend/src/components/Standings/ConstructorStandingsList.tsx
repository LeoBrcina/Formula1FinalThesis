"use client";

import { Card } from "../Card";
import { useConstructorStandings } from "../../lib/hooks/useConstructorStandings";
import { LoadingSpinner } from "../LoadingSpinner";

export function ConstructorStandingsList({ year }: { year: number }) {
  const { standings, isLoading, isError } = useConstructorStandings(year);

  if (isLoading) {
    return <Card title={`Constructor Standings (${year})`}><LoadingSpinner/></Card>;
  }
  if (isError || !standings) {
    return <Card title={`Constructor Standings (${year})`}>Error loading data.</Card>;
  }

  return (
    <Card
      title={`Constructors Standings (${year})`}
      className="w-full max-w-[95%] p-8"
    >
      <ul className="space-y-8 text-lg">
        {standings.map((c) => (
          <li
            key={c.position}
            className="flex justify-between items-center"
            style={{ lineHeight: "1.6" }}
          >
            <div className="text-compressed text-lg">
              <span className="font-bold mr-2">{c.position}.</span>
              {c.constructor}
            </div>
            <div className="font-medium text-base text-compressed">
              {c.points} pts
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
