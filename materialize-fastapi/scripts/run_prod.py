import subprocess


def main():
    cmd = [
        "gunicorn",
        "--bind", "0.0.0.0:8000",
        "-w", "4",
        "-k", "uvicorn.workers.UvicornWorker",
        "app.main:app"
    ]
    subprocess.run(cmd, check=False)
