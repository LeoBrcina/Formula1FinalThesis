// src/components/Telemetry/DominanceChart.tsx
"use client";

import { useState, useEffect } from "react";
import { Card } from "../Card";
import { usePositions } from "../../lib/hooks/usePositions";
import { useLapTimes } from "../..//lib/hooks/useLapTimes";
import { useDominance } from "../../lib/hooks/useDominance";
import { LoadingSpinner } from "../LoadingSpinner";

export function DominanceChart({
  year,
  round,
}: {
  year: number;
  round: number;
}) {
  // only render SVG on client
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // load drivers & laps
  const { data: posData, isLoading: posL, isError: posE } =
    usePositions(year, round, "R");
  const { data: lapData, isLoading: lapL, isError: lapE } =
    useLapTimes(year, round, "R");

  // UI state
  const [drv1, setDrv1] = useState("");
  const [drv2, setDrv2] = useState("");
  const [lap1, setLap1] = useState<"fastest" | string>("fastest");
  const [lap2, setLap2] = useState<"fastest" | string>("fastest");
  const [show, setShow] = useState(false);

  // fetch dominance when both chosen
  const { data: dom, isLoading: domL, isError: domE } = useDominance(
    year,
    round,
    drv1,
    drv2,
    lap1 === "fastest" ? undefined : Number(lap1),
    lap2 === "fastest" ? undefined : Number(lap2)
  );

  // loading / error states
  if (posL || lapL) {
    return (
      <Card title="Track Dominance">
        <LoadingSpinner />
      </Card>
    );
  }
  if (posE || lapE || !posData || !lapData) {
    return <Card title="Track Dominance">Error loading race data</Card>;
  }

  // dropdown options
  const driverOpts = posData.drivers.map((d) => (
    <option key={d.driverId} value={d.driverId}>
      {d.driverId}
    </option>
  ));
  const lapOpts = lapData.laps.map((n) => (
    <option key={n} value={String(n)}>
      Lap {n}
    </option>
  ));

  const canCompare = drv1 && drv2;

  // compute same-team tint
  const sameColor = dom && dom.driver1.color === dom.driver2?.color;
  const stroke2 = dom
    ? sameColor
      ? "#FFF"
      : dom.driver2!.color!
    : undefined;

  return (
    <Card title="Track Dominance">
      {/* Controls */}
      <div className="flex flex-wrap items-center space-x-4 mb-4">
        {/* Driver 1 */}
        <select
          value={drv1}
          onChange={(e) => { setDrv1(e.target.value); setShow(false); }}
          className="bg-gray-800 text-white border border-gray-700 px-3 py-1 rounded-none shadow-sm hover:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-200"
        >
          <option value="" disabled>
            Driver 1
          </option>
          {posData.drivers.map((d) => (
            <option
              key={d.driverId}
              value={d.driverId}
              disabled={d.driverId === drv2}
              className="bg-gray-800 text-white"
            >
              {d.driverId}
            </option>
          ))}
        </select>

        {/* Lap 1 */}
        <select
          value={lap1}
          onChange={(e) => { setLap1(e.target.value); setShow(false); }}
          className="bg-gray-800 text-white border border-gray-700 px-3 py-1 rounded-none shadow-sm hover:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-200"
        >
          <option value="fastest">Fastest</option>
          {lapOpts}
        </select>

        <span className="font-bold text-white">vs</span>

        {/* Driver 2 */}
        <select
          value={drv2}
          onChange={(e) => { setDrv2(e.target.value); setShow(false); }}
          className="bg-gray-800 text-white border border-gray-700 px-3 py-1 rounded-none shadow-sm hover:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-200"
        >
          <option value="" disabled>
            Driver 2
          </option>
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

        {/* Lap 2 */}
        <select
          value={lap2}
          onChange={(e) => { setLap2(e.target.value); setShow(false); }}
          className="bg-gray-800 text-white border border-gray-700 px-3 py-1 rounded-none shadow-sm hover:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-200"
        >
          <option value="fastest">Fastest</option>
          {lapOpts}
        </select>

        {/* Compare button */}
        <button
          onClick={() => setShow(true)}
          disabled={!canCompare}
          className={`
            bg-gradient-to-br from-gray-900 to-gray-800
            border border-gray-700
            text-sm font-semibold text-white
            px-4 py-1
            rounded-none shadow-sm
            focus:outline-none focus:ring-2 focus:ring-red-500
            transition-all duration-200
            ${canCompare
              ? "hover:border-red-500 cursor-pointer"
              : "opacity-50 cursor-not-allowed"
            }
          `}
        >
          Compare
        </button>
      </div>

      {/* Prompt */}
      {!show && (
        <p className="text-gray-400">
          Select two drivers and laps, then click Compare.
        </p>
      )}

      {/* Loading / Error */}
      {show && domL && <LoadingSpinner />}
      {show && domE && (
        <Card title="Track Dominance">Error loading comparison</Card>
      )}

      {/* SVG */}
      {show && !domL && !domE && dom && mounted && (
        <div className="w-full flex justify-center">
          <svg
            viewBox="-0.20 -0.03 1.06 1.06"
            preserveAspectRatio="xMidYMid meet"
            className="max-w-full h-[750px]"
          >
            <defs>
              <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow
                  dx="0"
                  dy="0"
                  stdDeviation="0.003"
                  floodColor="#000"
                  floodOpacity="0.5"
                />
              </filter>
            </defs>

            {/* Base track */}
            <path
              d={dom.circuitLayout}
              stroke="#444"
              strokeWidth={0.005}
              fill="none"
              filter="url(#shadow)"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Driver2 segments (underneath) */}
            {dom.sections
              .filter((s) => s.driver1Advantage === dom.driver2.id)
              .map((s) => (
                <path
                  key={s.id}
                  d={s.path}
                  stroke={stroke2}
                  strokeWidth={0.014}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ))}

            {/* Driver1 segments on top */}
            {dom.sections
              .filter((s) => s.driver1Advantage === dom.driver1.id)
              .map((s) => (
                <path
                  key={s.id}
                  d={s.path}
                  stroke={dom.driver1.color!}
                  strokeWidth={0.014}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ))}
          </svg>
        </div>
      )}

      {/* Legend */}
      {show && dom && (
        <div className="mt-6 flex justify-center space-x-12 text-sm">
          {/* Driver1 */}
          <div className="flex flex-col items-center space-y-1">
            <div className="flex items-center space-x-2">
              <span
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: dom.driver1.color! }}
              />
              <span className="font-medium text-white">
                {dom.driver1.fullName}
              </span>
            </div>
            <span className="text-gray-400">
              Lap {lap1 === "fastest" ? "Fastest" : lap1}:{" "}
              {(() => {
                const d = lapData.drivers.find(
                  (d) => d.driverId === dom.driver1.id
                )!;
                if (lap1 === "fastest") {
                  const times = d.lapTimes.filter(
                    (t): t is number => t != null
                  );
                  return times.length
                    ? `${Math.min(...times).toFixed(3)}s`
                    : "n/a";
                }
                const idx = lapData.laps.indexOf(Number(lap1));
                return idx >= 0 && d.lapTimes[idx] != null
                  ? `${d.lapTimes[idx]!.toFixed(3)}s`
                  : "n/a";
              })()}
            </span>
          </div>

          {/* Driver2 */}
          <div className="flex flex-col items-center space-y-1">
            <div className="flex items-center space-x-2">
              <span
                className="w-4 h-4 rounded-full"
                style={{
                  backgroundColor: sameColor
                    ? "#FFF"
                    : dom.driver2.color!,
                }}
              />
              <span className="font-medium text-white">
                {dom.driver2.fullName}
              </span>
            </div>
            <span className="text-gray-400">
              Lap {lap2 === "fastest" ? "Fastest" : lap2}:{" "}
              {(() => {
                const d = lapData.drivers.find(
                  (d) => d.driverId === dom.driver2.id
                )!;
                if (lap2 === "fastest") {
                  const times = d.lapTimes.filter(
                    (t): t is number => t != null
                  );
                  return times.length
                    ? `${Math.min(...times).toFixed(3)}s`
                    : "n/a";
                }
                const idx = lapData.laps.indexOf(Number(lap2));
                return idx >= 0 && d.lapTimes[idx] != null
                  ? `${d.lapTimes[idx]!.toFixed(3)}s`
                  : "n/a";
              })()}
            </span>
          </div>
        </div>
      )}
    </Card>
  );
}
