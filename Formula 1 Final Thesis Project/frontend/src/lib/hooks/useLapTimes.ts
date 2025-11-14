import { useState, useEffect } from "react";

export interface LapTimeDriver {
  driverId:  string;
  fullName:  string;
  color:     string | null;
  lapTimes:  (number | null)[];
}

export interface LapTimesData {
  session:  string;    
  laps:     number[];
  drivers:  LapTimeDriver[];
}

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

const ALL_SESSIONS = ["FP1","FP2","FP3","Q","SQ","R","S"] as const;
export type SessionCode = typeof ALL_SESSIONS[number];

export function useLapTimes(
  year: number,
  round: number,
  sessionCode: SessionCode = "R",
  drivers?: string[],
  lapMin?: number,
  lapMax?: number
) {
  const [availableSessions, setAvailableSessions] = useState<SessionCode[]>([]);
  const [data, setData]           = useState<LapTimesData | null>(null);
  const [isLoading, setLoading]   = useState(true);
  const [isError, setError]       = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(false);
    setData(null);

    const qp = new URLSearchParams();
    if (drivers)  drivers.forEach((d) => qp.append("drivers", d));
    if (lapMin)   qp.set("lap_min", lapMin.toString());
    if (lapMax)   qp.set("lap_max", lapMax.toString());
    const qs = qp.toString() ? `?${qp}` : "";

    Promise.all(
      ALL_SESSIONS.map(async (code) => {
        try {
          const res = await fetch(
            `${API_BASE}/telemetry/${year}/${round}/${code}/lap-times${qs}`
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
          setLoading(false);
          setError(false);
          return;
        }

        return fetch(
          `${API_BASE}/telemetry/${year}/${round}/${sessionCode}/lap-times${qs}`
        )
          .then((res) => {
            if (!res.ok) throw new Error(`Status ${res.status}`);
            return res.json() as Promise<LapTimesData>;
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
  }, [year, round, sessionCode, JSON.stringify(drivers), lapMin, lapMax]);

  return {
    availableSessions, 
    data,              
    isLoading,
    isError,
  };
}
