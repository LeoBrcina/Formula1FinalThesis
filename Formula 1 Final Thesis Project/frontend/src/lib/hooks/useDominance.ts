import useSWR from "swr";

export interface DominanceSection {
  id: string;
  name: string;
  type: string;
  path: string;
  driver1Advantage: string;
}

export interface DriverMeta {
  id:       string;
  fullName: string;
  color:    string | null;
}

export interface DominanceData {
  driver1:       DriverMeta;
  driver2:       DriverMeta;
  circuitLayout: string;
  sections:      DominanceSection[];
}

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error(`Failed to load dominance (${res.status})`);
    return res.json() as Promise<DominanceData>;
  });

export function useDominance(
  year: number,
  round: number,
  driver1: string,
  driver2: string,
  lap1?: number,
  lap2?: number
) {
  const key =
    driver1 && driver2
      ? `${API_BASE}/telemetry/${year}/${round}/dominance?` +
        new URLSearchParams({
          driver1,
          ...(lap1 != null ? { lap1: String(lap1) } : {}),
          driver2,
          ...(lap2 != null ? { lap2: String(lap2) } : {}),
        }).toString()
      : null;

  const { data, error, isLoading } = useSWR<DominanceData>(key, fetcher);

  return {
    data:      data ?? null,
    isLoading: isLoading,
    isError:   Boolean(error),
  };
}
