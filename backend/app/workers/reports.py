import io

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

from app.core import security
from app.db.session import SessionLocal
from app.integrations.storage import get_storage
from app.models.enums import ReportStatus
from app.models.report import Report
from app.repositories.report import ReportQuery
from app.workers.celery_app import celery


def _compile(report: Report):
    with SessionLocal() as db:
        query = ReportQuery(db)
        hours, volunteers, ngos = query.totals(
            report.company_user_id, report.period_start, report.period_end, report.project_id
        )
        breakdown = query.schedule_vii_breakdown(
            report.company_user_id, report.period_start, report.period_end, report.project_id
        )
        expenses = query.expenses_total(
            report.company_user_id, report.period_start, report.period_end, report.project_id
        )
        attendance = query.attendance_count(
            report.company_user_id, report.period_start, report.period_end, report.project_id
        )
        rows = query.detail_rows(report.company_user_id, report.period_start, report.period_end, report.project_id)
        detail = {
            "period_start": report.period_start.isoformat(),
            "period_end": report.period_end.isoformat(),
            "total_hours": hours,
            "total_volunteers": volunteers,
            "ngos_involved": ngos,
            "schedule_vii": breakdown,
            "expense_receipts": expenses,
            "attendance_sheets": attendance,
            "entries": rows,
        }
        return detail


def _build_pdf(report: Report, detail: dict) -> bytes:
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, leftMargin=20 * mm, rightMargin=20 * mm)
    styles = getSampleStyleSheet()
    story = []
    story.append(Paragraph("Kards — CSR Compliance Report", styles["Title"]))
    story.append(Spacer(1, 6))
    story.append(Paragraph(f"Period: {detail['period_start']} to {detail['period_end']}", styles["Normal"]))
    story.append(Spacer(1, 10))

    summary = Table(
        [
            ["Total volunteer hours", f"{detail['total_hours']:.1f}"],
            ["Volunteers", str(detail["total_volunteers"])],
            ["NGOs involved", str(detail["ngos_involved"])],
            ["Expense receipts", str(detail["expense_receipts"])],
            ["Attendance sheets", str(detail["attendance_sheets"])],
        ]
    )
    summary.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("BACKGROUND", (0, 0), (-1, 0), colors.whitesmoke),
    ]))
    story.append(summary)
    story.append(Spacer(1, 12))

    breakdown = detail["schedule_vii"]
    if breakdown:
        story.append(Paragraph("Schedule VII breakdown", styles["Heading2"]))
        data = [["Category", "Hours", "Volunteers"]]
        for cat, values in breakdown.items():
            data.append([cat.replace("_", " ").title(), f"{values['hours']:.1f}", str(values["volunteers"])])
        table = Table(data)
        table.setStyle(TableStyle([
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ]))
        story.append(table)
        story.append(Spacer(1, 12))

    story.append(Paragraph("Signed by Kards platform. Data sourced exclusively from approved records.", styles["Italic"]))
    doc.build(story)
    return buf.getvalue()


@celery.task(name="app.workers.reports.generate_report", bind=True, max_retries=3)
def generate_report(self, report_id: str) -> None:
    with SessionLocal() as db:
        report = db.get(Report, report_id)
        if not report:
            return
        report.status = ReportStatus.PROCESSING
        db.commit()
        try:
            detail = _compile(report)
            pdf = _build_pdf(report, detail)
            key = f"reports/{report_id}/report.pdf"
            get_storage().put(key, pdf, "application/pdf")
            report.status = ReportStatus.READY
            report.total_hours = detail["total_hours"]
            report.total_volunteers = detail["total_volunteers"]
            report.total_expense = detail["expense_receipts"]
            report.schedule_vii_breakdown = detail["schedule_vii"]
            report.detail = detail
            report.file_key = key
            report.file_name = f"csr-compliance-{report.period_start}-{report.period_end}.pdf"
        except Exception as exc:
            report.status = ReportStatus.FAILED
            report.error_message = str(exc)
            db.commit()
            raise self.retry(exc=exc)
        db.commit()
