"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import { LoadingSpinner } from "../../../components/LoadingSpinner";
import { Card } from "../../../components/Card";

interface CircuitProfile {
  circuitId: string;
  name: string;
  url?: string;
  locality: string;
  country: string;
  lat: number;
  long: number;
  stats: {
    firstYear: number;
    lastYear: number;
    totalEvents: number;
    lastWinner: {
      season: number;
      driverId: string;
      givenName: string;
      familyName: string;
      constructor: string;
    };
    fastestLap: {
      season: number;
      driverId: string;
      givenName: string;
      familyName: string;
      time: string;
    };
  };
}

export default function CircuitProfilePage() {
  const { circuitId } = useParams();
  const [profile, setProfile] = useState<CircuitProfile | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`http://localhost:8000/circuits/${circuitId}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Status ${res.status}`);
        return res.json() as Promise<CircuitProfile>;
      })
      .then(async (data) => {
        setProfile(data);

        // Fetch lead image from Wikipedia if URL is present
        if (data.url) {
          const title = decodeURIComponent(data.url.split("/").pop() || "");
          try {
            const resWiki = await fetch(
              `https://en.wikipedia.org/api/rest_v1/page/summary/${title}`
            );
            const wikiData = await resWiki.json();
            setImageUrl(wikiData?.thumbnail?.source || null);
          } catch {
            setImageUrl(null);
          }
        }
      })
      .catch((e) => {
        console.error("Failed to fetch circuit:", e);
        setError(e.message);
      });
  }, [circuitId]);

  if (error) {
    return <div className="p-6 text-red-500">Error: {error}</div>;
  }
  if (!profile) {
    return (<Card title="Loading circuit">
                <LoadingSpinner />
              </Card>);
  }

  const { name, locality, country, stats, url } = profile;

  return (
    <main className="container mx-auto p-6 space-y-12">
      {/* Circuit Title */}
      <h1 className="text-3xl font-bold text-white text-center text-compressed">
        {name}
      </h1>
      <p className="text-center text-gray-400 text-compressed">
        {locality}, {country}
      </p>

      {/* Official Page as Card */}
      {url && (
        <div className="flex justify-center">
          <Link
            href={url}
            target="_blank"
            rel="noreferrer"
            className="group block p-6 text-lg font-semibold
              bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl border border-gray-700
              shadow-lg hover:border-red-500 hover:shadow-red-500/40
              transition-all duration-300 hover:scale-105 text-white text-compressed w-full sm:w-1/2 text-center ml-30 mt-20"
          >
            <span className="transition-colors duration-300 group-hover:text-red-500">
              Visit Official Circuit Page →
            </span>
          </Link>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-12">
        {[
          { title: "First Held", value: stats.firstYear },
          { title: "Last Held", value: stats.lastYear },
          { title: "Total Events", value: stats.totalEvents + 1 },
        ].map((item, idx) => (
          <div
            key={idx}
            className="group p-6 text-center bg-gradient-to-br from-gray-900 to-gray-800 
              rounded-2xl border border-gray-700 shadow-lg
              hover:border-red-500 hover:shadow-red-500/40 transition-all duration-300 hover:scale-105"
          >
            <h3 className="text-lg font-bold text-white text-compressed 
                transition-colors duration-300 group-hover:text-red-500">
              {item.title}
            </h3>
            <p className="text-gray-400">{item.value}</p>
          </div>
        ))}
      </div>

      {/* Winner & Fastest Lap Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-12">
        <div className="group p-6 text-center bg-gradient-to-br from-gray-900 to-gray-800 
            rounded-2xl border border-gray-700 shadow-lg
            hover:border-red-500 hover:shadow-red-500/40 transition-all duration-300 hover:scale-105">
          <h3 className="text-lg font-bold text-white text-compressed 
              transition-colors duration-300 group-hover:text-red-500">
            Previous Winner
          </h3>
          <p className="text-gray-400">
            {stats.lastWinner.givenName} {stats.lastWinner.familyName} (
            {stats.lastWinner.constructor}) — {stats.lastWinner.season}
          </p>
        </div>

        <div className="group p-6 text-center bg-gradient-to-br from-gray-900 to-gray-800 
            rounded-2xl border border-gray-700 shadow-lg
            hover:border-red-500 hover:shadow-red-500/40 transition-all duration-300 hover:scale-105">
          <h3 className="text-lg font-bold text-white text-compressed 
              transition-colors duration-300 group-hover:text-red-500">
            Fastest Racing Lap
          </h3>
          <p className="text-gray-400">
            {stats.fastestLap.givenName} {stats.fastestLap.familyName} —{" "}
            {stats.fastestLap.time} ({stats.fastestLap.season})
          </p>
        </div>
      </div>

      {/* Wikipedia Circuit Image (below all cards) */}
      {imageUrl && (
        <div className="flex justify-center mt-12">
          <img
            src={imageUrl}
            alt={`${name} Layout`}
            className="max-w-lg w-full rounded-lg shadow-lg bg-white p-4
        border border-gray-300 transition-all duration-300
        hover:scale-105 hover:border-red-500 hover:shadow-red-500/40"
          />
        </div>
      )}
    </main>
  );
}
