import useSWR from "swr";

export interface PositionDriver {
  driverId:   string;
  fullName:   string;
  color:      string | null;
  positions:  (number | null)[];
}

export interface PositionsData {
  session: "race" | "sprint";
  laps:    number[];
  drivers: PositionDriver[];
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error(`Failed to load positions (${res.status})`);
    return res.json() as Promise<PositionsData>;
  });

export function usePositions(
  year: number,
  round: number,
  sessionCode: "R" | "S" = "R"
) {
  const key = `${API_BASE}/telemetry/${year}/${round}/${sessionCode}/positions`;
  const { data, error, isLoading } = useSWR<PositionsData>(key, fetcher);

  return {
    data,
    isLoading,
    isError: !!error,
  };
}
