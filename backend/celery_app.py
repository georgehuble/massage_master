from celery import Celery

celery_app = Celery(
    'massage_master',
    broker='redis://localhost:6379/0',
    backend='redis://localhost:6379/0'
)

celery_app.conf.timezone = 'Europe/Moscow'
celery_app.conf.enable_utc = False 