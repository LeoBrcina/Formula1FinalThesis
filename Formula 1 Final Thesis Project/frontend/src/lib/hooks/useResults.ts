import useSWR from 'swr';

export interface Result {
  position: number;
  driver: string;
  constructor: string;
  grid: number;
  laps: number;
  status: string;
  points: number;
}

export function useResults(year: number, round: number) {
  const fetcher = (url: string) =>
    fetch(url).then(res => {
      if (!res.ok) throw new Error('Failed to load results');
      return res.json() as Promise<Result[]>;
    });

  const key = `/results/${year}/${round}`;
  const { data, error, isLoading } = useSWR(key, fetcher);

  return {
    results: data as Result[]|undefined,
    isLoading,
    isError: !!error,
  };
}
