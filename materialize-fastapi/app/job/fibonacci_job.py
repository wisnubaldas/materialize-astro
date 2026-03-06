# app/jobs/fibonacci_job.py
from collections.abc import Generator

from app.services.redis_service import rds

CHANNEL_NAME = "fibonacci_channel"


def fibonacci() -> Generator[int, None, None]:
    a, b = 0, 1
    while True:
        yield a
        a, b = b, a + b


fib_gen = fibonacci()


async def publish_fibonacci():
    num = next(fib_gen)
    print(f"🔢 Publish Fibonacci ke Redis: {num}")
    await rds.publish(CHANNEL_NAME, str(num))
