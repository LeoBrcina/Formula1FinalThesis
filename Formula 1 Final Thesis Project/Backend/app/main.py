from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from app.api.general import (
    circuits_router,
    constructors_router,
    drivers_router,
    races_router,
    results_router,
    standings_router,
)
from app.api.telemetry import (
    dominance_router,
    lap_data_router,
    lap_times_router,
    positions_router,
    strategies_router,
)

load_dotenv()

app = FastAPI(
    title="F1 API",
    version="0.1",
    description="Exposes endpoints for general Formula 1 Historical Data & 2019 to Present Telemetry"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], 
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

app.include_router(standings_router)
app.include_router(races_router)
app.include_router(results_router)
app.include_router(drivers_router)
app.include_router(constructors_router)
app.include_router(circuits_router)
app.include_router(positions_router)
app.include_router(strategies_router)
app.include_router(lap_times_router)
app.include_router(dominance_router)
app.include_router(lap_data_router)
