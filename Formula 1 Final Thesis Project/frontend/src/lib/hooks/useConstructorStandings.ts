import useSWR from 'swr';
import { getConstructorStandings } from '../api';
import { ConstructorStanding } from '../types';

export function useConstructorStandings(year: number) {
  const { data, error } = useSWR(
    ['/standings/constructors', year],
    () => getConstructorStandings(year)
  );

  return {
    standings: data as ConstructorStanding[] | undefined,
    isLoading: !error && !data,
    isError: !!error,
  };
}
