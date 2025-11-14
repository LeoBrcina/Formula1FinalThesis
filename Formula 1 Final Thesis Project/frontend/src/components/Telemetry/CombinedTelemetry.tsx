// src/components/Telemetry/CombinedTelemetry.tsx
"use client";

import { useState, useEffect } from "react";
import { Card } from "../Card";
import { usePositions } from "../../lib/hooks/usePositions";
import { useLapTimes } from "../../lib/hooks/useLapTimes";
import { useTelemetry, SessionCode } from "../../lib/hooks/useTelemetry";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { LoadingSpinner } from "../LoadingSpinner";

// Human‐readable labels for each session code
const SESSION_LABELS: Record<SessionCode, string> = {
  FP1: "Practice 1",
  FP2: "Practice 2",
  FP3: "Practice 3",
  Q:   "Qualifying",
  SQ:  "Sprint Qual.",
  R:   "Race",
  S:   "Sprint Race",
};

export function CombinedTelemetry({
  year,
  round,
}: {
  year: number;
  round: number;
}) {
  // ── State ───────────────────────────────────────────────────────
  const [session, setSession]       = useState<SessionCode>("R");
  const [drv1, setDrv1]            = useState("");
  const [drv2, setDrv2]            = useState("");
  const [lap, setLap]              = useState<"fastest" | string>("fastest");
  const [showTelemetry, setShowTelemetry] = useState(false);

  // ── Load base data (always race session) ────────────────────────
  const {
    data: posData,
    isLoading: posLoading,
    isError: posError,
  } = usePositions(year, round, "R");
  const {
    data: lapData,
    isLoading: lapLoading,
    isError: lapError,
  } = useLapTimes(year, round, "R");

  // auto‐pick first driver when the race results arrive
  useEffect(() => {
    if (posData?.drivers.length && !drv1) {
      setDrv1(posData.drivers[0].driverId);
    }
  }, [posData, drv1]);

  // prepare <option>s
  const driverOpts = posData?.drivers.map((d) => (
    <option
      key={d.driverId}
      value={d.driverId}
      disabled={d.driverId === drv1}    // prevent picking same twice
      className="bg-gray-800 text-white"
    >
      {d.driverId}
    </option>
  ));
  const lapOpts = lapData?.laps.map((n) => (
    <option key={n} value={String(n)} className="bg-gray-800 text-white">
      Lap {n}
    </option>
  ));

  // ── Probe & fetch telemetry for chosen session/driver(s)/lap ─────
  const {
    availableSessions,
    data: telData,
    isLoading: telLoading,
    isError: telError,
  } = useTelemetry(
    year,
    round,
    session,
    drv1,
    drv2 || undefined,
    lap === "fastest" ? undefined : Number(lap)
  );

  // if “R” wasn’t available, fall back to the first probed session
  useEffect(() => {
    if (
      !telLoading &&
      availableSessions.length > 0 &&
      !availableSessions.includes(session)
    ) {
      setSession(availableSessions[0]);
    }
  }, [availableSessions, telLoading, session]);

  // ── Global loading / error for base data ───────────────────────
  if (posLoading || lapLoading) {
    return (
      <Card title="Telemetry">
        <LoadingSpinner />
      </Card>
    );
  }
  if (posError || lapError || !posData || !lapData) {
    return <Card title="Telemetry">Error loading base data</Card>;
  }

  // ── Build the four series functions ────────────────────────────
  const { driver1: d1, driver2: d2 } = telData ?? { driver1: { telemetry: { distance: [], speed: [], throttle: [], brake: [], gear: [] }, fullName: "", color: "" }, driver2: null };
  const makeSeries = (field: keyof typeof d1.telemetry) =>
    d1.telemetry.distance.map((dist, i) => {
      const v1 = (d1.telemetry as any)[field][i];
      const v2 = d2 ? (d2.telemetry as any)[field][i] : undefined;
      return {
        distance: +dist.toFixed(2),
        d1: field === "brake" ? (v1 ? 1 : 0) : v1,
        d2: field === "brake" ? (v2 ? 1 : 0) : v2,
      };
    });

  // ── Render ─────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* ── Control‐bar (smaller) ────────────────────────────────── */}
      <Card title={`Telemetry — ${SESSION_LABELS[session]}`}>
        <div className="flex flex-wrap items-center space-x-2 mb-2">
          {/* Session */}
          <select
            value={session}
            onChange={(e) => { setSession(e.target.value as SessionCode); setShowTelemetry(false); }}
            className="bg-gray-800 text-white border border-gray-700 px-2 py-1 rounded-none shadow-sm hover:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 transition"
          >
            {availableSessions.map((code) => (
              <option key={code} value={code} className="bg-gray-800 text-white">
                {SESSION_LABELS[code]}
              </option>
            ))}
          </select>

          {/* Driver 1 */}
          <select
            value={drv1}
            onChange={(e) => { setDrv1(e.target.value); setShowTelemetry(false); }}
            className="bg-gray-800 text-white border border-gray-700 px-2 py-1 rounded-none shadow-sm hover:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 transition"
          >
            <option value="" disabled>Driver 1…</option>
            {driverOpts}
          </select>

          {/* Lap */}
          <select
            value={lap}
            onChange={(e) => { setLap(e.target.value); setShowTelemetry(false); }}
            className="bg-gray-800 text-white border border-gray-700 px-2 py-1 rounded-none shadow-sm hover:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 transition"
          >
            <option value="fastest">Fastest</option>
            {lapOpts}
          </select>

          <span className="font-bold text-white">vs</span>

          {/* Driver 2 */}
          <select
            value={drv2}
            onChange={(e) => { setDrv2(e.target.value); setShowTelemetry(false); }}
            className="bg-gray-800 text-white border border-gray-700 px-2 py-1 rounded-none shadow-sm hover:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 transition"
          >
            <option value="">Driver 2 (opt.)</option>
            {posData.drivers.map((d) => (
              <option
                key={d.driverId}
                value={d.driverId}
                disabled={d.driverId === drv1}
                className="bg-gray-800 text-white"
              >
                {d.driverId}
              </option>
            ))}
          </select>

          {/* Load Telemetry */}
          <button
            onClick={() => setShowTelemetry(true)}
            disabled={!drv1}
            className={`px-3 py-1 rounded-none border border-gray-700 shadow-sm font-semibold text-white
              ${drv1
                ? "bg-gradient-to-br from-gray-900 to-gray-800 hover:border-red-500 focus:ring-2 focus:ring-red-500"
                : "opacity-50 cursor-not-allowed"}
              transition`}
          >
            Load Telemetry
          </button>
        </div>
      </Card>

      {/* ── Telemetry Charts ──────────────────────────────────────── */}
      {showTelemetry && (
        <>
          {telLoading && (
            <Card><LoadingSpinner /></Card>
          )}
          {telError && (
            <Card>Error loading telemetry</Card>
          )}
          {!telLoading && !telError && telData && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {(["speed","throttle","brake","gear"] as Array<keyof typeof d1.telemetry>)
                .map((field) => (
                  <Card key={field} title={field[0].toUpperCase() + field.slice(1)}>
                    <div style={{ width: "100%", height: 300 }}>
                      <ResponsiveContainer>
                        <LineChart data={makeSeries(field)}>
                          <XAxis dataKey="distance" unit="m" />
                          <YAxis
                            domain={field === "brake" ? [0,1] : undefined}
                            tickCount={field === "brake" ? 2 : undefined}
                            style={{ color: "#bbb" }}
                          />
                          <Tooltip contentStyle={{ backgroundColor: "#1f2937" }} />
                          <Line
                            name={d1.fullName}
                            type="monotone"
                            dataKey="d1"
                            stroke={d1.color || "#8884d8"}
                            dot={false}
                          />
                          {d2 && (
                            <Line
                              name={d2.fullName}
                              type="monotone"
                              dataKey="d2"
                              stroke={d2.color || "#82ca9d"}
                              dot={false}
                            />
                          )}
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                ))
              }
            </div>
          )}
        </>
      )}
    </div>
  );
}
