from html import escape
from pathlib import Path
import re

from reportlab.graphics import renderPDF
from reportlab.graphics.barcode.qr import QrCodeWidget
from reportlab.graphics.shapes import Drawing
from reportlab.lib import colors
from reportlab.lib.enums import TA_RIGHT
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate,
    Flowable,
    Frame,
    KeepTogether,
    NextPageTemplate,
    PageBreak,
    PageTemplate,
    Paragraph,
)


ROOT = Path(__file__).resolve().parent
ASSETS = ROOT / "fonts"
SOURCE = ROOT / "resume.md"
OUTPUT = ROOT / "Liza_George_Resume.pdf"
MAROON = colors.HexColor("#470303")
INK = colors.HexColor("#171717")
MUTED = colors.HexColor("#555555")
PAGE_WIDTH, PAGE_HEIGHT = 612, 792
MARGIN = 34
WIDTH = PAGE_WIDTH - MARGIN * 2
TEXT_SIZE = 11
NAME_SIZE = 22
LEADING = 14
PORTFOLIO_URL = "https://liza-george.chiramattel.com"
QR_SIZE = 56


def register_fonts():
    for name, filename in [
        ("Heading", "SourceSerif4-Semibold.ttf"),
        ("Body", "SourceSans3-Regular.ttf"),
        ("BodyBold", "SourceSans3-Semibold.ttf"),
        ("BodyItalic", "SourceSans3-Italic.ttf"),
    ]:
        pdfmetrics.registerFont(TTFont(name, str(ASSETS / filename)))
    pdfmetrics.registerFontFamily(
        "Body", normal="Body", bold="BodyBold", italic="BodyItalic",
        boldItalic="BodyBold",
    )


def inline(text):
    text = escape(text)
    text = re.sub(
        r"\[([^\]]+)\]\((https?://[^)]+)\)",
        lambda match: (
            f'<link href="{match[2]}" color="#470303">{match[1]}</link>'
        ),
        text,
    )
    return re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", text)


class SectionHeading(Flowable):
    def __init__(self, title):
        super().__init__()
        self.title = title
        self.height = 22
        self.spaceBefore = 6
        self.spaceAfter = 4
        self.keepWithNext = True

    def wrap(self, available_width, available_height):
        self.width = available_width
        return self.width, self.height

    def draw(self):
        canvas = self.canv
        canvas.setFillColor(MAROON)
        canvas.setFont("Heading", TEXT_SIZE)
        canvas.drawString(0, 8, self.title)
        canvas.setStrokeColor(MAROON)
        canvas.setLineWidth(1.1)
        canvas.line(0, 3, self.width, 3)


class EntryHeader(Flowable):
    def __init__(self, title, metadata, styles):
        super().__init__()
        self.spaceBefore = 4
        self.spaceAfter = 2
        self.keepWithNext = True
        title_parts = title.split(" | ", 1)
        heading = f"<b>{inline(title_parts[0])}</b>"
        if len(title_parts) == 2:
            heading += f", <i>{inline(title_parts[1])}</i>"
        metadata = metadata.removeprefix("**").removesuffix("**")
        meta_parts = metadata.rsplit(" | ", 1)
        if len(meta_parts) == 2:
            detail, date = meta_parts
        else:
            detail, date = "", metadata
        if detail:
            heading += f"<br/>{inline(detail)}"
        self.left = Paragraph(heading, styles["entry"])
        self.right = Paragraph(inline(date), styles["date"])

    def wrap(self, available_width, available_height):
        self.width = available_width
        self.date_width = 137
        self.title_width = available_width - self.date_width - 12
        _, self.left_height = self.left.wrap(self.title_width, available_height)
        _, self.right_height = self.right.wrap(self.date_width, available_height)
        self.height = max(self.left_height, self.right_height)
        return self.width, self.height

    def draw(self):
        self.left.drawOn(self.canv, 0, self.height - self.left_height)
        self.right.drawOn(
            self.canv, self.width - self.date_width,
            self.height - self.right_height,
        )


class SkillsColumns(Flowable):
    def __init__(self, skills, style):
        super().__init__()
        groups = [
            ["Languages", "Robotics"],
            ["AI"],
            ["Application development", "Cloud and engineering"],
        ]
        expected = {label for column in groups for label in column}
        if set(skills) != expected:
            raise ValueError(f"Unexpected skills categories: {set(skills) ^ expected}")
        self.columns = [
            [
                Paragraph(f"<b>{escape(label)}</b><br/>{inline(skills[label])}", style)
                for label in column
            ]
            for column in groups
        ]
        self.spaceAfter = 4

    def wrap(self, available_width, available_height):
        self.width = available_width
        self.gap = 18
        self.column_width = (available_width - self.gap * 2) / 3
        self.heights = [
            [paragraph.wrap(self.column_width, available_height)[1] for paragraph in column]
            for column in self.columns
        ]
        self.height = max(
            sum(heights) + 8 * (len(heights) - 1) for heights in self.heights
        )
        return self.width, self.height

    def draw(self):
        for index, (column, heights) in enumerate(zip(self.columns, self.heights)):
            x = index * (self.column_width + self.gap)
            y = self.height
            for paragraph, height in zip(column, heights):
                y -= height
                paragraph.drawOn(self.canv, x, y)
                y -= 8


def draw_portfolio_qr(canvas):
    x = PAGE_WIDTH - MARGIN - QR_SIZE
    y = 724
    canvas.setFillColor(colors.white)
    canvas.rect(x, y, QR_SIZE, QR_SIZE, fill=1, stroke=0)
    code = QrCodeWidget(
        PORTFOLIO_URL, barFillColor=MAROON, barBorder=4, barLevel="M",
    )
    x0, y0, x1, y1 = code.getBounds()
    scale = QR_SIZE / (x1 - x0)
    drawing = Drawing(
        QR_SIZE, QR_SIZE,
        transform=[scale, 0, 0, scale, -x0 * scale, -y0 * scale],
    )
    drawing.add(code)
    renderPDF.draw(drawing, canvas, x, y)
    canvas.linkURL(PORTFOLIO_URL, (x, y, x + QR_SIZE, y + QR_SIZE), relative=0)
    canvas.setFillColor(colors.white)
    canvas.setFont("Body", TEXT_SIZE)
    canvas.drawCentredString(x + QR_SIZE / 2, 709, "Portfolio")


def decorate_page(canvas, doc):
    canvas.saveState()
    canvas.setFillColor(MAROON)
    if doc.page == 1:
        canvas.rect(0, 702, PAGE_WIDTH, 90, fill=1, stroke=0)
        canvas.setFillColor(colors.white)
        canvas.setFont("Heading", NAME_SIZE)
        contact_width = WIDTH - QR_SIZE - 16
        canvas.drawCentredString(MARGIN + contact_width / 2, 752, "Liza George")
        contact_style = ParagraphStyle(
            "contact", fontName="Body", fontSize=TEXT_SIZE, leading=LEADING,
            textColor=colors.white, alignment=1,
        )
        contacts = [
            (
                '<link href="mailto:hi.liza.george@gmail.com" color="white">'
                'hi.liza.george@gmail.com</link> &nbsp; | &nbsp; '
                '<link href="tel:+16692042873" color="white">'
                '(669) 204-2873</link> &nbsp; | &nbsp; '
                '<link href="https://liza-george.chiramattel.com" color="white">'
                'liza-george.chiramattel.com</link>'
            ),
            (
                'Seattle, WA &nbsp; | &nbsp; '
                '<link href="https://github.com/lizageorge" color="white">'
                'github.com/lizageorge</link> &nbsp; | &nbsp; '
                '<link href="https://www.linkedin.com/in/george-liza/" '
                'color="white">linkedin.com/in/george-liza</link>'
            ),
        ]
        for text, y in zip(contacts, [726, 711]):
            paragraph = Paragraph(text, contact_style)
            paragraph.wrap(contact_width, 20)
            paragraph.drawOn(canvas, MARGIN, y)
        draw_portfolio_qr(canvas)
    else:
        canvas.rect(0, 746, PAGE_WIDTH, 46, fill=1, stroke=0)
        canvas.setFillColor(colors.white)
        canvas.setFont("Heading", TEXT_SIZE)
        canvas.drawString(MARGIN, 764, "Liza George")
        canvas.setFont("Body", TEXT_SIZE)
        canvas.drawRightString(PAGE_WIDTH - MARGIN, 765, "Resume")
    canvas.setFillColor(MUTED)
    canvas.setFont("Body", TEXT_SIZE)
    canvas.drawRightString(PAGE_WIDTH - MARGIN, 21, str(doc.page))
    canvas.restoreState()


def build():
    register_fonts()
    body = ParagraphStyle(
        "body", fontName="Body", fontSize=TEXT_SIZE, leading=LEADING,
        textColor=INK, spaceAfter=4,
    )
    styles = {
        "body": body,
        "bullet": ParagraphStyle(
            "bullet", parent=body, leftIndent=13, firstLineIndent=-9,
            spaceAfter=2,
        ),
        "entry": ParagraphStyle(
            "entry", parent=body, spaceAfter=0,
        ),
        "skill": ParagraphStyle(
            "skill", parent=body, spaceAfter=0,
        ),
        "date": ParagraphStyle(
            "date", parent=body,
            textColor=MAROON, alignment=TA_RIGHT, spaceAfter=0,
        ),
    }
    source = SOURCE.read_text(encoding="utf-8")
    lines = source.splitlines()
    story = []
    start = next(i for i, line in enumerate(lines) if line.startswith("## "))
    i = start
    while i < len(lines):
        line = lines[i].strip()
        if not line:
            i += 1
            continue
        if line.startswith("## "):
            title = line[3:]
            if title == "Technical Skills":
                story.extend([NextPageTemplate("continuation"), PageBreak()])
            story.append(SectionHeading(title))
            if title == "Technical Skills":
                skills = {}
                next_index = i + 1
                while next_index < len(lines) and not lines[next_index].startswith("## "):
                    skill_line = lines[next_index].strip()
                    if skill_line:
                        match = re.fullmatch(r"\*\*(.+?):\*\*\s+(.+)", skill_line)
                        if not match:
                            raise ValueError(f"Invalid skills entry: {skill_line}")
                        if match[1] in skills:
                            raise ValueError(f"Duplicate skills category: {match[1]}")
                        skills[match[1]] = match[2]
                    next_index += 1
                story.append(SkillsColumns(skills, styles["skill"]))
                i = next_index - 1
        elif line.startswith("### "):
            metadata_index = i + 1
            while not lines[metadata_index].strip():
                metadata_index += 1
            header = EntryHeader(line[4:], lines[metadata_index].strip(), styles)
            next_index = metadata_index + 1
            while next_index < len(lines) and not lines[next_index].strip():
                next_index += 1
            if next_index < len(lines) and not lines[next_index].startswith("#"):
                first_text = lines[next_index].strip()
                is_bullet = first_text.startswith("- ")
                first = Paragraph(
                    ("- " + inline(first_text[2:])) if is_bullet else inline(first_text),
                    styles["bullet" if is_bullet else "body"],
                )
                story.append(KeepTogether([header, first]))
                i = next_index
            else:
                story.append(header)
                i = metadata_index
        elif line.startswith("- "):
            story.append(Paragraph("- " + inline(line[2:]), styles["bullet"]))
        else:
            story.append(Paragraph(inline(line), styles["body"]))
        i += 1
    doc = BaseDocTemplate(
        str(OUTPUT), pagesize=(PAGE_WIDTH, PAGE_HEIGHT),
        title="Liza George - Resume", author="Liza George",
        subject="Software engineering resume",
        leftMargin=MARGIN, rightMargin=MARGIN,
        topMargin=106, bottomMargin=34,
    )
    for name, top in [("first", 686), ("continuation", 726)]:
        frame = Frame(
            MARGIN, 36, WIDTH, top - 36,
            leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0,
        )
        doc.addPageTemplates(
            PageTemplate(id=name, frames=[frame], onPage=decorate_page)
        )
    doc.build(story)
    print(OUTPUT)


if __name__ == "__main__":
    build()
