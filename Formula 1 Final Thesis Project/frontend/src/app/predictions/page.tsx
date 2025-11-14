"use client";

import React from "react";
import { PredictionCard } from "../../components/Card/PredictionCard";

export default function PredictionsPage() {
    const predictions = [
        {
            grandPrix: "2025 Australian Grand Prix",
            drivers: ["Lando Norris", "Oscar Piastri", "George Russell"],
        },
        {
            grandPrix: "2025 Chinese Grand Prix",
            drivers: ["Oscar Piastri", "George Russell", "Lando Norris"],
        },
        {
            grandPrix: "2025 Japanese Grand Prix",
            drivers: ["Max Verstappen", "Lando Norris", "Oscar Piastri"],
        },
        {
            grandPrix: "2025 Bahrian Grand Prix",
            drivers: ["Oscar Piastri", "Lando Norris", "Max Verstappen"],
        },
        {
            grandPrix: "2025 Saudi Arabian Grand Prix",
            drivers: ["Lando Norris", "Oscar Piastri", "George Russell"],
        },
        {
            grandPrix: "2025 Belgian Grand Prix",
            drivers: ["Lando Norris", "Oscar Piastri", "Max Verstappen"],
        },
        {
            grandPrix: "2025 Hungarian Grand Prix",
            drivers: ["Lando Norris", "Oscar Piastri", "George Russell"],
        },
        {
            grandPrix: "2025 Italian Grand Prix",
            drivers: ["Max Verstappen", "Oscar Piastri", "Lando Norris"],
        },
        {
            grandPrix: "2025 Singaporean Grand Prix",
            drivers: ["George Russell", "Max Verstappen", "Lando Norris"],
        },
    ];

    return (
        <main className="w-full max-w-[98%] mx-auto px-10 py-12 space-y-12">
            {/* Title */}
            <section className="text-center space-y-4">
                <h1 className="text-3xl font-extrabold text-f1red">
                    ML Podium Predictions
                </h1>
                <p className="text-gray-400 dark:text-gray-300 max-w-3xl mx-auto text-base leading-relaxed mt-10">
                    Explore machine learning-driven podium outcome predictions based on historical and modern Formula 1 data. This page will showcase projected podiums for every race weekend, available soon after qualifying.        </p>
            </section>

            {/* Prediction Cards */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 w-full mt-12">
                {predictions.map((p, idx) => (
                    <PredictionCard key={idx} grandPrix={p.grandPrix} drivers={p.drivers} />
                ))}
            </section>
        </main>
    );
}
