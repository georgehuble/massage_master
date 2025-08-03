from .celery_app import celery_app

@celery_app.task
def delete_booking_task(event_id):
    from .google_calendar import delete_event
    delete_event(event_id) 