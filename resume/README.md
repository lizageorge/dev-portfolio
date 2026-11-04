# Resume

- [`Liza_George_Resume.pdf`](Liza_George_Resume.pdf): the generated resume.
- [`resume.md`](resume.md): editable resume content.
- [`render_resume.py`](render_resume.py): local PDF renderer using ReportLab.

## Regenerate

With Python 3.10 or newer, run from the repository root:

```bash
cd resume
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
.venv/bin/python render_resume.py
```

The renderer writes `Liza_George_Resume.pdf` next to the source. It uses bundled
fonts and generates the portfolio QR code locally; no resume content is uploaded
to a rendering service.

Edit the body content in `resume.md`. Header contact information, the portfolio
URL, typography, and layout are configured in `render_resume.py`. The layout uses
US Letter pages, a burgundy header, Source Serif 4 headings, Source Sans 3 body
text, and three skill columns. Only the name uses 22 pt; other text uses 11 pt.
The second page starts at Technical Skills. Review pagination after adding content.

The renderer supports the Markdown structure used by this resume: section and
entry headings, bold entry metadata with dates after `|`, bullets, bold labels,
and inline links. Skill labels map to explicitly defined columns.

## Fonts

The unmodified static fonts come from Adobe's
[Source Sans](https://github.com/adobe-fonts/source-sans/tree/release/TTF) and
[Source Serif](https://github.com/adobe-fonts/source-serif/tree/release/TTF)
releases. They are redistributed under the SIL Open Font License 1.1; the license
and copyright notices are included in [`fonts/`](fonts/).
