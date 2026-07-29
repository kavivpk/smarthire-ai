"""
routers/notifications.py — Notification routes (replaces routes/notificationRoutes.js)
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from database import get_db
from middleware.auth import get_current_user
from models.notification import Notification

router = APIRouter(prefix="/api/notifications", tags=["notifications"])

@router.get("/")
def get_notifications(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    notifications = (
        db.query(Notification)
        .filter(Notification.user_id == current_user["id"])
        .order_by(desc(Notification.created_at))
        .limit(20)
        .all()
    )

    return [
        {
            "id": n.id,
            "notificationType": n.notification_type,
            "title": n.title,
            "message": n.message,
            "status": n.status,
            "emailSent": n.email_sent,
            "createdAt": n.created_at
        }
        for n in notifications
    ]


@router.patch("/{notification_id}/read")
def mark_read(
    notification_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    notif = (
        db.query(Notification)
        .filter(Notification.id == notification_id, Notification.user_id == current_user["id"])
        .first()
    )
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")

    notif.status = "read"
    db.commit()
    db.refresh(notif)

    return {
        "id": notif.id,
        "notificationType": notif.notification_type,
        "title": notif.title,
        "message": notif.message,
        "status": notif.status,
        "emailSent": notif.email_sent,
        "createdAt": notif.created_at
    }


@router.patch("/read-all")
def mark_all_read(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    db.query(Notification).filter(
        Notification.user_id == current_user["id"],
        Notification.status == "unread"
    ).update({"status": "read"}, synchronize_session=False)
    db.commit()
    return {"message": "All notifications marked as read"}
