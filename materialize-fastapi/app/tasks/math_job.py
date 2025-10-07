# app/jobs/math_jobs.py
from app.services.redis_service import rds

# Channel names
CHANNEL_ARITMETIKA = "arithmetic_channel"
CHANNEL_GEOMETRI = "geometric_channel"
CHANNEL_PANGKAT = "power_channel"
CHANNEL_FAKTORIAL = "factorial_channel"

# ==========================
#  Deret Aritmetika (Un = a + (n-1)d)
# ==========================
a = 2  # suku pertama
d = 3  # beda tetap
n_arit = 1


async def publish_aritmetika():
    global n_arit  # noqa: PLW0603
    term = a + (n_arit - 1) * d
    await rds.publish(CHANNEL_ARITMETIKA, str(term))
    print(f"➕ Aritmetika ke-{n_arit}: {term}")  # noqa: RUF001
    n_arit += 1


# ==========================
#  Deret Geometri (Un = a * r^(n-1))
# ==========================
a_geo = 2
r_geo = 2
n_geo = 1


async def publish_geometri():
    global n_geo  # noqa: PLW0603
    term = a_geo * (r_geo ** (n_geo - 1))
    await rds.publish(CHANNEL_GEOMETRI, str(term))
    print(f"✖️ Geometri ke-{n_geo}: {term}")
    n_geo += 1


# ==========================
#  Deret Pangkat (n^p)
# ==========================
p = 3  # pangkat
n_pow = 1


async def publish_pangkat():
    global n_pow  # noqa: PLW0603
    term = n_pow**p
    await rds.publish(CHANNEL_PANGKAT, str(term))
    print(f"⚡ Pangkat ke-{n_pow}: {term}")
    n_pow += 1


# ==========================
#  Deret Faktorial (n!)
# ==========================
import math  # noqa: E402

n_fact = 1


async def publish_faktorial():
    global n_fact  # noqa: PLW0603
    term = math.factorial(n_fact)
    await rds.publish(CHANNEL_FAKTORIAL, str(term))
    print(f"🧮 Faktorial {n_fact}!: {term}")
    n_fact += 1
