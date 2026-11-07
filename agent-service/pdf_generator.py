
import re
from io import BytesIO
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    HRFlowable,
)


def format_inline(text):
    text = escape(text.strip())
    text = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", text)
    text = re.sub(r"\*(.+?)\*", r"<i>\1</i>", text)
    text = re.sub(r"`(.+?)`", r'<font name="Courier">\1</font>', text)
    return text


def build_report_pdf(dataset_name, report):
    buffer = BytesIO()

    styles = getSampleStyleSheet()

    styles.add(ParagraphStyle(
        name="ReportTitle",
        parent=styles["Title"],
        fontSize=21,
        leading=26,
        textColor=colors.HexColor("#6045D8"),
        alignment=TA_CENTER,
        spaceAfter=12,
    ))

    styles.add(ParagraphStyle(
        name="SectionHeading",
        parent=styles["Heading2"],
        fontSize=13,
        leading=18,
        textColor=colors.HexColor("#6045D8"),
        spaceBefore=12,
        spaceAfter=7,
    ))

    styles.add(ParagraphStyle(
        name="ReportBody",
        parent=styles["BodyText"],
        fontSize=9,
        leading=14,
        spaceAfter=7,
    ))

    styles.add(ParagraphStyle(
        name="ReportBullet",
        parent=styles["BodyText"],
        fontSize=9,
        leading=13,
        leftIndent=15,
        firstLineIndent=-8,
        spaceAfter=5,
    ))

    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=20 * mm,
        leftMargin=20 * mm,
        topMargin=22 * mm,
        bottomMargin=20 * mm,
        title=f"Data Analysis Report - {dataset_name}",
        author="InsightFlow",
    )

    story = []

    story.append(Paragraph("INSIGHTFLOW", styles["ReportTitle"]))
    story.append(Paragraph(
        "AI-Powered Data Analysis Report",
        styles["Heading2"]
    ))
    story.append(Spacer(1, 8))
    story.append(Paragraph(
        f"<b>Dataset:</b> {escape(dataset_name)}",
        styles["ReportBody"]
    ))
    story.append(HRFlowable(
        width="100%",
        thickness=1,
        color=colors.HexColor("#6045D8"),
        spaceAfter=15,
    ))

    lines = report.splitlines()
    index = 0

    while index < len(lines):
        line = lines[index].strip()

        if not line:
            index += 1
            continue

        # Markdown tables
        if line.startswith("|") and index + 1 < len(lines) and "---" in lines[index + 1]:
            table_data = []

            while index < len(lines) and lines[index].strip().startswith("|"):
                cells = [
                    cell.strip()
                    for cell in lines[index].strip().strip("|").split("|")
                ]

                if not all(re.fullmatch(r"[-: ]+", cell or "-") for cell in cells):
                    table_data.append([
                        Paragraph(format_inline(cell), styles["ReportBody"])
                        for cell in cells
                    ])

                index += 1

            if table_data:
                table = Table(table_data, repeatRows=1)
                table.setStyle(TableStyle([
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#6045D8")),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                    ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#CCCCCC")),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("LEFTPADDING", (0, 0), (-1, -1), 6),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                    ("TOPPADDING", (0, 0), (-1, -1), 5),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                ]))
                story.append(table)
                story.append(Spacer(1, 10))

            continue

        # Markdown headings
        if line.startswith("# "):
            story.append(Paragraph(
                format_inline(line[2:]),
                styles["ReportTitle"]
            ))

        elif line.startswith("## ") or line.startswith("### "):
            heading = line.lstrip("#").strip()
            story.append(Paragraph(
                format_inline(heading),
                styles["SectionHeading"]
            ))

        # Bullet points
        elif line.startswith(("- ", "* ")):
            story.append(Paragraph(
                "• " + format_inline(line[2:]),
                styles["ReportBullet"]
            ))

        # Numbered lists
        elif re.match(r"^\d+\.\s", line):
            story.append(Paragraph(
                format_inline(line),
                styles["ReportBullet"]
            ))

        elif line == "---":
            story.append(HRFlowable(
                width="100%",
                thickness=0.5,
                color=colors.grey,
                spaceAfter=8,
            ))

        else:
            story.append(Paragraph(
                format_inline(line),
                styles["ReportBody"]
            ))

        index += 1

    def add_page_number(canvas, document):
        canvas.saveState()
        canvas.setFont("Helvetica", 8)
        canvas.setFillColor(colors.grey)
        canvas.drawString(
            20 * mm,
            12 * mm,
            "Generated by InsightFlow"
        )
        canvas.drawRightString(
            A4[0] - 20 * mm,
            12 * mm,
            f"Page {document.page}"
        )
        canvas.restoreState()

    doc.build(
        story,
        onFirstPage=add_page_number,
        onLaterPages=add_page_number,
    )

    buffer.seek(0)
    return buffer.getvalue()
