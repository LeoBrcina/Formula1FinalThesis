from fastapi import APIRouter, HTTPException
import fastf1

fastf1.Cache.enable_cache("Cache")

router = APIRouter(
    prefix="/races",
    tags=["races"],
    responses={404: {"description": "No races found"}}
)

@router.get("/{year}", summary="List all races in a season")
def race_list(year: int):
    try:
        schedule = fastf1.get_event_schedule(year, include_testing=False)
        if schedule.empty:
            raise HTTPException(status_code=404, detail=f"No races found for {year}")
        return [
            {
                "round": int(row["RoundNumber"]),
                "raceName": row["EventName"],
                "circuit": row["Location"],
                "date": row["EventDate"].isoformat() if row["EventDate"] is not None else None,
            }
            for _, row in schedule.iterrows()
        ]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Schedule error: {e}")
