from __future__ import annotations

import html
from dataclasses import dataclass

from config import NotificationSettings


@dataclass(frozen=True)
class EmailSection:
    label: str
    value: str


@dataclass(frozen=True)
class RenderedEmail:
    html: str
    text: str


def render_marketing_email(
    settings: NotificationSettings,
    *,
    eyebrow: str,
    title: str,
    intro: str,
    sections: list[EmailSection] | None = None,
    cta_label: str | None = None,
    cta_url: str | None = None,
    closing: str | None = None,
) -> RenderedEmail:
    safe_eyebrow = html.escape(eyebrow)
    safe_title = html.escape(title)
    safe_intro = _escape_paragraph(intro)
    safe_closing = _escape_paragraph(closing or "DeepPatient")

    section_items = sections or []
    section_rows = "".join(
        (
            "<tr>"
            f"<td style=\"padding: 0 0 12px; width: 144px; color: #5C7066; "
            "font-size: 13px; font-weight: 600; vertical-align: top;\">"
            f"{html.escape(section.label)}</td>"
            "<td style=\"padding: 0 0 12px; color: #202F31; font-size: 14px; "
            "line-height: 1.6; vertical-align: top;\">"
            f"{_escape_paragraph(section.value)}</td>"
            "</tr>"
        )
        for section in section_items
    )
    sections_html = (
        "<table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" "
        "style=\"margin-top: 28px; border-collapse: collapse;\">"
        f"{section_rows}</table>"
    ) if section_rows else ""

    cta_html = ""
    if cta_label and cta_url:
        cta_html = (
            "<div style=\"margin-top: 30px;\">"
            f"<a href=\"{html.escape(cta_url, quote=True)}\" "
            "style=\"display: inline-block; border-radius: 999px; background: #F9D38B; "
            "color: #202F31; font-size: 14px; font-weight: 700; text-decoration: none; "
            "padding: 14px 22px;\">"
            f"{html.escape(cta_label)}</a>"
            "</div>"
        )

    html_body = (
        "<!doctype html>"
        "<html><body style=\"margin: 0; padding: 0; background: #F0EEEC;\">"
        "<div style=\"padding: 32px 18px;\">"
        "<div style=\"max-width: 620px; margin: 0 auto; border-radius: 28px; "
        "overflow: hidden; background: linear-gradient(180deg, #1C2B2D 0%, #202F31 100%);\">"
        "<div style=\"padding: 28px 32px 24px;\">"
        "<div style=\"font-size: 26px; font-weight: 700; line-height: 1; "
        "font-family: Arial, sans-serif;\">"
        "<span style=\"color: #F9D38B;\">Deep</span>"
        "<span style=\"color: #FFFFFF;\">Patient</span>"
        "</div>"
        f"<div style=\"margin-top: 22px; color: #F9D38B; font-size: 12px; font-weight: 700; "
        "letter-spacing: 0.18em; text-transform: uppercase;\">"
        f"{safe_eyebrow}</div>"
        f"<h1 style=\"margin: 14px 0 0; color: #FFFFFF; font-size: 30px; "
        "line-height: 1.15; font-family: Arial, sans-serif;\">"
        f"{safe_title}</h1>"
        "</div>"
        "<div style=\"background: #FFFFFF; border-top-left-radius: 28px; border-top-right-radius: 28px; "
        "padding: 32px; color: #202F31; font-family: Arial, sans-serif;\">"
        f"<p style=\"margin: 0; color: #5C7066; font-size: 15px; line-height: 1.7;\">{safe_intro}</p>"
        f"{sections_html}"
        f"{cta_html}"
        "<p style=\"margin: 30px 0 0; color: #5C7066; font-size: 14px; line-height: 1.7;\">"
        f"{safe_closing}</p>"
        "</div></div></div></body></html>"
    )

    text_lines = [eyebrow.upper(), "", title, "", intro]
    for section in section_items:
        text_lines.append(f"{section.label}: {section.value}")
    if cta_label and cta_url:
        text_lines.extend(["", f"{cta_label}: {cta_url}"])
    if closing:
        text_lines.extend(["", closing])

    return RenderedEmail(html=html_body, text="\n".join(text_lines).strip())


def _escape_paragraph(value: str) -> str:
    return html.escape(value).replace("\n", "<br />")
