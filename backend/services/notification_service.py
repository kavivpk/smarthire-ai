"""
services/notification_service.py — Notification helper (replaces notificationService.js)
Fire-and-forget: saves notification to DB + optionally sends email.
"""
import asyncio
import logging
from sqlalchemy.orm import Session
from models.notification import Notification

logger = logging.getLogger(__name__)


def notify(
    db: Session,
    user_id: int,
    notification_type: str,
    title: str,
    message: str = "",
    email_fn=None,
):
    """
    Fire-and-forget notification helper.
    Saves a Notification row and optionally calls an async email function.
    Never raises — all errors are logged only.
    """
    async def _run():
        email_sent = False
        if email_fn is not None:
            try:
                await email_fn()
                email_sent = True
            except Exception as e:
                logger.error(f"[NotificationService] Email failed (type={notification_type}): {e}")

        try:
            notif = Notification(
                user_id=user_id,
                notification_type=notification_type,
                title=title,
                message=message,
                status="unread",
                email_sent=email_sent,
            )
            db.add(notif)
            db.commit()
        except Exception as e:
            logger.error(f"[NotificationService] DB save failed (type={notification_type}): {e}")
            db.rollback()

    # Schedule as a background task using asyncio
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            asyncio.ensure_future(_run())
        else:
            loop.run_until_complete(_run())
    except Exception as e:
        logger.error(f"[NotificationService] Failed to schedule: {e}")
