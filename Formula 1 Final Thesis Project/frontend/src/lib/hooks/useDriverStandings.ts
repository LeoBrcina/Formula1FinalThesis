import useSWR from 'swr';
import { getDriverStandings } from '../api';
import { DriverStanding } from '../types';

export function useDriverStandings(year: number) {
  const { data, error } = useSWR(
    ['/standings/drivers', year],
    () => getDriverStandings(year)
  );

  return {
    standings: data as DriverStanding[] | undefined,
    isLoading: !error && !data,
    isError: !!error,
  };
}
