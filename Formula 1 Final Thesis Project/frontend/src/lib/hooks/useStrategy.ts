import { useState, useEffect } from "react";

export interface Stint {
  stint:    number;
  startLap: number;
  endLap:   number;
  compound: string;
}

export interface DriverStrategy {
  driverId: string;
  fullName: string;
  color:    string;
  stints:   Stint[];
}

export interface StrategyData {
  session: string;           
  drivers: DriverStrategy[];
}

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

const ALL_SESSIONS = ["FP1","FP2","FP3","Q","SQ","R","S"] as const;
export type SessionCode = typeof ALL_SESSIONS[number];

export function useStrategy(
  year: number,
  round: number,
  sessionCode: SessionCode = "R"
) {
  const [availableSessions, setAvailableSessions] = useState<SessionCode[]>([]);
  const [data, setData]       = useState<StrategyData | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [isError, setError]     = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(false);
    setData(null);

    Promise.all(
      ALL_SESSIONS.map(async (code) => {
        try {
          const res = await fetch(
            `${API_BASE}/telemetry/${year}/${round}/${code}/strategy`
          );
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

        if (!avail.includes(sessionCode)) {
          setError(true);
          setLoading(false);
          return;
        }

        return fetch(
          `${API_BASE}/telemetry/${year}/${round}/${sessionCode}/strategy`
        )
          .then((res) => {
            if (!res.ok) throw new Error(`Status ${res.status}`);
            return res.json() as Promise<StrategyData>;
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
  }, [year, round, sessionCode]);

  return {
    availableSessions, 
    data,              
    isLoading,
    isError,
  };
}
