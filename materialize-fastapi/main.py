from fastapi import FastAPI
from core.env import ENV
from router.default_route import router

app = FastAPI(
    title=ENV.TITLE,
    version=ENV.VERSION,
    description=ENV.DESC,
)
app.include_router(router)
