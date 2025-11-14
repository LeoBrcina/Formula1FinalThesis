from .circuits        import router as circuits_router
from .constructors   import router as constructors_router
from .drivers        import router as drivers_router
from .races          import router as races_router
from .results        import router as results_router
from .standings      import router as standings_router

__all__ = [
    "circuits_router", "constructors_router",
    "drivers_router",  "races_router",
    "results_router",  "standings_router"
]
