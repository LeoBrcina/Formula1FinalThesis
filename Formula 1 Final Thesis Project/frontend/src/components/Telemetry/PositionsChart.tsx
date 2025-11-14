"use client";

import dynamic from "next/dynamic";
import { Card } from "../Card";
import { usePositions } from "../../lib/hooks/usePositions";
import { LoadingSpinner } from "../LoadingSpinner";
import type { ApexOptions } from "apexcharts";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface PositionsChartProps {
  year: number;
  round: number;
  session?: "R" | "S";
}

export function PositionsChart({
  year,
  round,
  session = "R",
}: PositionsChartProps) {
  const { data, isLoading, isError } = usePositions(year, round, session);

  if (isLoading) {
    return (
      <Card title="Lap-by-Lap Positions">
        <LoadingSpinner />
      </Card>
    );
  }

  if (isError || !data) {
    return <Card title="Positions">Error loading positions</Card>;
  }

  const { laps, drivers } = data;

  const teamsByColor: Record<string, typeof drivers> = {};
  drivers.forEach((d) => {
    const key = d.color ?? d.driverId;
    (teamsByColor[key] ||= []).push(d);
  });

  const dashArray = drivers.map((d) => {
    const key = d.color ?? d.driverId;
    const roster = teamsByColor[key];
    return roster.length > 1 && roster[1].driverId === d.driverId ? 4 : 0;
  });

  const series = drivers.map((d) => ({
    name: d.fullName,
    data: laps.map((lap, i) => d.positions[i] ?? null),
  }));
  const colors = drivers.map((d) => (d.color ? `#${d.color}` : undefined));

  const options: ApexOptions = {
    chart: {
      type: "line",
      height: 400,
      zoom: { enabled: false },
      toolbar: { show: false },
    },
    stroke: {
      width: 5,
      curve: "smooth",
      dashArray,
    },
    markers: {
      size: 0,
      hover: { size: 6, sizeOffset: 3 },
    },
    colors,
    xaxis: {
      categories: laps,
      title: { text: "Lap" },
      labels: { style: { colors: "#bbb" } },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      reversed: true,
      title: { text: "Position" },
      min: 1,
      max: drivers.length,
      labels: { style: { colors: "#bbb" } },
    },
    tooltip: {
      theme: "dark",
      shared: false,
      intersect: true,
      x: { formatter: (x) => `Lap ${x}` },
      y: { formatter: (y) => (y == null ? "" : `P${y}`) },
    },
    legend: {
      position: "bottom",
      horizontalAlign: "center",
      labels: { colors: "#ccc" },
    },
    grid: {
      borderColor: "#444",
      yaxis: { lines: { show: true } },
      xaxis: { lines: { show: false } },
    },
  };

  return (
    <Card title="Lap-by-Lap Positions">
      <Chart options={options} series={series} type="line" height={550} />
    </Card>
  );
}
