from uuid import UUID

from fastapi import APIRouter, Response
from sqlalchemy import func, select

from app.api.deps import CURRENT_USER, SERVICES
from app.core.exceptions import NotFoundError
from app.integrations.storage import get_storage
from app.models.report import Report
from app.schemas.api import ReportFinalize, ReportOut, ReportRequest
from app.schemas.common import Page
from app.services.reports import ReportService

router = APIRouter(prefix="/reports", tags=["reports"])


@router.post("", response_model=ReportOut, status_code=201)
def create_report(user: CURRENT_USER, services: SERVICES, payload: ReportRequest) -> ReportOut:
    report = ReportService(services).create(user, payload)
    return ReportOut.model_validate(report)


@router.get("", response_model=Page[ReportOut])
def list_reports(user: CURRENT_USER, services: SERVICES, skip: int = 0, limit: int = 50) -> Page[ReportOut]:
    items = ReportService(services).list_for_company(user, skip, limit)
    total = int(services.db.scalar(select(func.count()).select_from(Report).where(Report.company_user_id == user.id)) or 0)
    return Page(
        items=[ReportOut.model_validate(r) for r in items],
        total=total,
        page=skip // limit + 1,
        page_size=limit,
        has_more=skip + len(items) < total,
    )


@router.get("/{report_id}", response_model=ReportOut)
def get_report(report_id: UUID, user: CURRENT_USER, services: SERVICES) -> ReportOut:
    return ReportOut.model_validate(ReportService(services).get(user, report_id))


@router.post("/{report_id}/finalize", response_model=ReportOut)
def finalize_report(report_id: UUID, user: CURRENT_USER, services: SERVICES, payload: ReportFinalize) -> ReportOut:
    return ReportOut.model_validate(ReportService(services).finalize(user, report_id, payload))


@router.get("/{report_id}/download")
def download_report(report_id: UUID, user: CURRENT_USER, services: SERVICES) -> Response:
    report = ReportService(services).get(user, report_id)
    if not report.file_key:
        raise NotFoundError("Report file is not ready yet", code="report_not_ready")
    data = get_storage().get(report.file_key)
    return Response(
        content=data,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{report.file_name or "report.pdf"}"',
        },
    )
