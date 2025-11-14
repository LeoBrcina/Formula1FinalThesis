import useSWR from 'swr';

export interface CircuitSummary {
  circuitId: string;
  name:      string;
  locality:  string;
  country:   string;
  lat:       number;
  long:      number;
}

const fetcher = (url: string) =>
  fetch(url).then(res => {
    if (!res.ok) throw new Error(`Failed to load circuits (${res.status})`);
    return res.json() as Promise<CircuitSummary[]>;
  });

export function useCircuits(year: number) {
  const { data, error, isLoading } = useSWR(
    `http://localhost:8000/circuits/season/${year}`,
    fetcher
  );

  return {
    circuits: data,
    isLoading,
    isError:  !!error,
  };
}
