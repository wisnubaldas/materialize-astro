import atexit

from apscheduler.schedulers.background import BackgroundScheduler

from app.tasks.task_fibbonacy import print_fibonacci


class InitApscheduler:
    @staticmethod
    def run():
        InitApscheduler.fibonachi_task()

    @staticmethod
    def fibonachi_task():
        # Inisialisasi scheduler
        scheduler = BackgroundScheduler()
        scheduler.add_job(print_fibonacci, "interval", seconds=3)
        scheduler.start()

        # Pastikan scheduler berhenti dengan rapi saat aplikasi ditutup
        atexit.register(lambda: scheduler.shutdown(wait=False))
