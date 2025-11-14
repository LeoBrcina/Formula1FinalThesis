// src/components/Telemetry/LapTimesChart.tsx
"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Card } from "../Card";
import { useLapTimes, SessionCode } from "../../lib/hooks/useLapTimes";
import { LoadingSpinner } from "../LoadingSpinner";
import type { ApexOptions } from "apexcharts";

// Dynamically import ApexCharts
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

const SESSION_LABELS: Record<SessionCode, string> = {
  FP1: "Practice 1",
  FP2: "Practice 2",
  FP3: "Practice 3",
  Q: "Qualifying",
  SQ: "Sprint Qualifying",
  R: "Race",
  S: "Sprint Race",
};

export function LapTimesChart({
  year,
  round,
}: {
  year: number;
  round: number;
}) {
  const [session, setSession] = useState<SessionCode>("R");
  const [selected, setSelected] = useState<string[]>([]);
  const [showChart, setShowChart] = useState(false);

  // 1) full-session data & available sessions
  const {
    availableSessions,
    data: allData,
    isLoading: loadingAll,
    isError: errorAll,
  } = useLapTimes(year, round, session);

  // 2) filtered data by driver selections
  const {
    data,
    isLoading: loadingFiltered,
    isError: errorFiltered,
  } = useLapTimes(
    year,
    round,
    session,
    selected.length ? selected : undefined
  );

  // session fallback & reset chart
  useEffect(() => {
    if (
      !loadingAll &&
      availableSessions.length > 0 &&
      !availableSessions.includes(session)
    ) {
      setSession(availableSessions[0]);
      setShowChart(false);
    }
  }, [availableSessions, loadingAll, session]);

  // default first two drivers
  useEffect(() => {
    if (!loadingAll && allData && !selected.length) {
      setSelected(allData.drivers.slice(0, 2).map((d) => d.driverId));
    }
  }, [loadingAll, allData, selected.length]);

  // early returns
  if (loadingAll) {
    return (
      <Card title="Lap Time Comparison">
        <LoadingSpinner />
      </Card>
    );
  }
  if (errorAll || !allData) {
    return (
      <Card title="Lap Time Comparison">
        Error loading available sessions
      </Card>
    );
  }

  // prepare chart data
  const laps = data?.laps ?? [];
  const drivers = data?.drivers ?? [];
  const keepIdx = laps.map((_, i) =>
    drivers.some((d) => selected.includes(d.driverId) && d.lapTimes[i] != null)
  );
  const filteredLaps = laps.filter((_, i) => keepIdx[i]);
  const series = drivers
    .filter((d) => selected.includes(d.driverId))
    .map((d) => ({
      name: d.fullName,
      data: d.lapTimes.filter((_, i) => keepIdx[i]),
    }));
  const colors = drivers
    .filter((d) => selected.includes(d.driverId))
    .map((d) => d.color ?? undefined);

  const options: ApexOptions = {
    chart: {
      type: "line",
      height: 350,
      zoom: { enabled: true, type: "x", autoScaleYaxis: true },
      toolbar: { show: false },
    },
    stroke: { curve: "smooth", width: 7.5 },
    markers: {
      size: 0,
      hover: { size: 6, sizeOffset: 3 },
    },
    xaxis: {
      categories: filteredLaps,
      title: { text: "Lap Number" },
      labels: { style: { colors: "#bbb" } },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      title: { text: "Lap Time (s)" },
      labels: {
        formatter: (v) => (v != null ? v.toFixed(1) : ""),
        style: { colors: "#bbb" },
      },
    },
    tooltip: {
      theme: "dark",
      x: { formatter: (x) => `Lap ${x}` },
      y: { formatter: (y) => (y != null ? `${y.toFixed(3)}s` : "") },
    },
    legend: {
      position: "bottom",
      horizontalAlign: "center",
      labels: { colors: "#ccc" },
    },
    colors,
    grid: {
      borderColor: "#444",
      yaxis: { lines: { show: true } },
      xaxis: { lines: { show: false } },
    },
  };

  return (
    <Card title="Lap Time Comparison">
      {/* Controls */}
      <div className="flex flex-wrap items-center space-x-4 mb-4">
        {/* Session */}
        <select
          value={session}
          onChange={(e) => {
            setSession(e.target.value as SessionCode);
            setShowChart(false);
          }}
          className="bg-gray-800 text-white border border-gray-700 px-3 py-1 rounded-none shadow-sm hover:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-200"
        >
          {availableSessions.map((code) => (
            <option
              key={code}
              value={code}
              className="bg-gray-800 text-white"
            >
              {SESSION_LABELS[code]}
            </option>
          ))}
        </select>

        {/* Driver selectors */}
        {selected.map((drvId, idx) => (
          <div key={idx} className="flex items-center space-x-2">
            <select
              value={drvId}
              onChange={(e) => {
                const v = e.target.value;
                setSelected((s) => s.map((x, i) => (i === idx ? v : x)));
                setShowChart(false);
              }}
              className="bg-gray-800 text-white border border-gray-700 px-3 py-1 rounded-none shadow-sm hover:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-200"
            >
              <option value="">Select driver…</option>
              {allData.drivers.map((d) => (
                <option
                  key={d.driverId}
                  value={d.driverId}
                  disabled={
                    selected.includes(d.driverId) && d.driverId !== drvId
                  }
                  className="bg-gray-800 text-white"
                >
                  {d.driverId}
                </option>
              ))}
            </select>
            {selected.length > 1 && (
              <button
                onClick={() => {
                  setSelected((s) => s.filter((_, i) => i !== idx));
                  setShowChart(false);
                }}
                title="Remove driver"
                className="bg-gray-800 text-red-500 border border-gray-700 px-2 py-1 rounded-none shadow-sm hover:border-red-500 hover:text-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-200"
              >
                ×
              </button>
            )}
          </div>
        ))}

        {allData.drivers.length > selected.length && (
          <button
            onClick={() => {
              setSelected((s) => [...s, ""]);
              setShowChart(false);
            }}
            className="bg-gray-800 text-white border border-gray-700 px-4 py-1 rounded-none shadow-sm hover:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-200"
          >
            + Add Driver
          </button>
        )}

        <button
          onClick={() => setShowChart(true)}
          disabled={selected.some((id) => id === "")}
          className={`
            bg-gray-800 text-white border border-gray-700 px-4 py-1 rounded-none shadow-sm
            focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-200
            ${selected.some((id) => id === "")
              ? "opacity-50 cursor-not-allowed"
              : "hover:border-red-500"
            }
          `}
        >
          Load Chart
        </button>
      </div>

      {/* Chart */}
      <div className="min-h-[350px] flex items-center justify-center w-full">
        {showChart ? (
          loadingFiltered ? (
            <LoadingSpinner />
          ) : errorFiltered || !data ? (
            <div className="text-red-500">Error loading lap times</div>
          ) : (
            <div className="w-full">
              <Chart
                options={options}
                series={series}
                type="line"
                height={500}
                width="100%"
              />
            </div>
          )
        ) : (
          <div className="text-gray-500">
            Click “Load Chart” to display lap times.
          </div>
        )}
      </div>
    </Card>
  );
}
