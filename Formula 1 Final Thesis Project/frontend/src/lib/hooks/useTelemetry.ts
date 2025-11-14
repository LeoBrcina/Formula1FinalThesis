import { useState, useEffect } from "react";

export interface TelemetrySeries {
  distance: number[];
  speed:    number[];
  throttle: number[];
  brake:    boolean[];
  gear:     number[];
}

export interface DriverTelemetry {
  id:        string;
  fullName:  string;
  color:     string | null;
  lap:       number;
  telemetry: TelemetrySeries;
}

export interface TelemetryResponse {
  session:  string;       
  driver1:  DriverTelemetry;
  driver2?: DriverTelemetry | null;
}

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export const ALL_SESSIONS = [
  "FP1",
  "FP2",
  "FP3",
  "Q",
  "SQ",
  "R",
  "S",
] as const;
export type SessionCode = typeof ALL_SESSIONS[number];

export function useTelemetry(
  year:    number,
  round:   number,
  session: SessionCode = "R",
  driver1: string,
  driver2?: string,
  lap?:     number
) {
  const [availableSessions, setAvailableSessions] = useState<SessionCode[]>([]);
  const [data,               setData]              = useState<TelemetryResponse | null>(null);
  const [isLoading,          setLoading]           = useState(true);
  const [isError,            setError]             = useState(false);

  useEffect(() => {
    let mounted = true;

    if (!driver1) {
      setAvailableSessions([]);
      setData(null);
      setLoading(false);
      setError(false);
      return;
    }

    setLoading(true);
    setError(false);
    setData(null);

    Promise.all(
      ALL_SESSIONS.map(async (code) => {
        try {
          const url = `${API_BASE}/telemetry/${year}/${round}/${code}/lapdata?driver1=${driver1}`;
          const res = await fetch(url);
          return res.ok ? code : null;
        } catch {
          return null;
        }
      })
    )
      .then((results) => {
        if (!mounted) return;
        const avail = results.filter((c): c is SessionCode => c !== null);
        setAvailableSessions(avail);

        if (!avail.includes(session)) {
          setLoading(false);
          setError(false);
          return;
        }

        const params = new URLSearchParams({
          driver1,
          ...(driver2 ? { driver2 } : {}),
          ...(lap     ? { lap: String(lap) } : {}),
        }).toString();

        return fetch(
          `${API_BASE}/telemetry/${year}/${round}/${session}/lapdata?${params}`
        )
          .then((res) => {
            if (!res.ok) throw new Error(`Status ${res.status}`);
            return res.json() as Promise<TelemetryResponse>;
          })
          .then((json) => {
            if (!mounted) return;
            setData(json);
          })
          .catch(() => {
            if (!mounted) return;
            setError(true);
          })
          .finally(() => {
            if (!mounted) return;
            setLoading(false);
          });
      })
      .catch(() => {
        if (!mounted) return;
        setError(true);
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [year, round, session, driver1, driver2, lap]);

  return {
    availableSessions, 
    data,              
    isLoading,
    isError,
  };
}
