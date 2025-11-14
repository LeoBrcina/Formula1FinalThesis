import useSWR from 'swr';

export interface Race {
  round: number;
  raceName: string;
  circuit: string;
  date: string | null;
}

const fetcher = (url: string) =>
  fetch(url)
    .then(res => {
      if (!res.ok) throw new Error('Failed to load races');
      return res.json() as Promise<Race[]>;
    });

export function useRaces(year: number) {
  const { data, error, isLoading } = useSWR(`/races/${year}`, fetcher);
  return {
    races: data,
    isLoading,
    isError: !!error,
  };
}
