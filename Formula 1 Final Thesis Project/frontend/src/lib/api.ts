const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

import { DriverStanding, ConstructorStanding } from './types';

async function fetcher<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`API error ${res.status}: ${res.statusText}`);
  return res.json();
}

export function getDriverStandings(year: number) {
  return fetcher<DriverStanding[]>(`/standings/drivers/${year}`);
}

export function getConstructorStandings(year: number) {
  return fetcher<ConstructorStanding[]>(`/standings/constructors/${year}`);
}
