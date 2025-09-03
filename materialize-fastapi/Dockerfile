# Menggunakan image base yang sudah dioptimasi dari Tiangolo
FROM tiangolo/uvicorn-gunicorn-fastapi:python3.10

# Atur working directory di dalam container
WORKDIR /app

# Copy file pyproject.toml dan poetry.lock untuk instalasi dependensi
COPY ./pyproject.toml ./poetry.lock* ./

# Instal dependensi menggunakan Poetry
# Gunakan --no-root untuk menghindari instalasi proyek itu sendiri sebagai paket
RUN poetry install --no-root --no-dev

# Copy semua kode aplikasi Anda ke working directory
COPY ./app ./app

# Expose port yang digunakan oleh aplikasi
EXPOSE 8000