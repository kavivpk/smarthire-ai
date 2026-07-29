"""
routers/analytics.py — Analytics routes (replaces routes/analyticsRoutes.js and controllers/analyticsController.js)
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from database import get_db
from middleware.auth import get_current_user, require_admin
from services.analytics_service import (
    get_user_analytics,
    get_weekly_activity,
    get_recent_reports,
    get_admin_analytics
)

router = APIRouter(prefix="/api/analytics", tags=["analytics"])

@router.get("/summary")
def get_summary(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    return get_user_analytics(db, current_user["id"])


@router.get("/weekly")
def get_weekly(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    return get_weekly_activity(db, current_user["id"])


@router.get("/recent")
def get_recent(
    limit: int = Query(5, ge=1, le=20),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return get_recent_reports(db, current_user["id"], limit)


@router.get("/admin")
def get_admin(current_admin: dict = Depends(require_admin), db: Session = Depends(get_db)):
    return get_admin_analytics(db)
