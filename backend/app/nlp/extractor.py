"""
NLP Text Extraction — PDF, DOCX, and TXT support.
"""
import io
import logging
from pathlib import Path
from typing import Tuple

logger = logging.getLogger(__name__)


class ExtractionError(Exception):
    pass


def extract_pdf(file_bytes: bytes) -> Tuple[str, int]:
    """Extract text from PDF bytes. Returns (text, page_count)."""
    try:
        import pymupdf
        doc = pymupdf.open(stream=file_bytes, filetype="pdf")
        pages = []
        for page in doc:
            text = page.get_text("text")
            if text.strip():
                pages.append(text)
        full_text = "\n\n".join(pages).strip()
        page_count = len(doc)
        if not full_text:
            raise ExtractionError(
                "No text could be extracted. This may be a scanned/image PDF. "
                "OCR is not enabled by default."
            )
        return full_text, page_count
    except ExtractionError:
        raise
    except Exception as e:
        raise ExtractionError(f"PDF extraction failed: {str(e)}")


def extract_docx(file_bytes: bytes) -> Tuple[str, int]:
    """Extract text from DOCX bytes. Returns (text, paragraph_count)."""
    try:
        import docx
        doc = docx.Document(io.BytesIO(file_bytes))
        paragraphs = [p.text.strip() for p in doc.paragraphs if p.text.strip()]
        # Also grab text from tables
        for table in doc.tables:
            for row in table.rows:
                for cell in row.cells:
                    if cell.text.strip() and cell.text.strip() not in paragraphs:
                        paragraphs.append(cell.text.strip())
        full_text = "\n\n".join(paragraphs).strip()
        if not full_text:
            raise ExtractionError("DOCX document contains no readable text.")
        return full_text, len(paragraphs)
    except ExtractionError:
        raise
    except Exception as e:
        raise ExtractionError(f"DOCX extraction failed: {str(e)}")


def extract_txt(file_bytes: bytes) -> Tuple[str, int]:
    """Extract text from TXT bytes with encoding fallback."""
    for encoding in ["utf-8", "utf-8-sig", "latin-1", "cp1252"]:
        try:
            raw = file_bytes.decode(encoding)
            text = raw.strip()
            lines = [l for l in text.splitlines() if l.strip()]
            return text, len(lines)
        except (UnicodeDecodeError, LookupError):
            continue
    raise ExtractionError("Could not decode text file. Ensure it is UTF-8 encoded.")


def extract_text(file_bytes: bytes, filename: str) -> Tuple[str, str, str]:
    """
    Master dispatcher.
    Returns (extracted_text, extraction_status, error_message)
    """
    ext = Path(filename).suffix.lower().lstrip(".")

    try:
        if ext == "pdf":
            text, _ = extract_pdf(file_bytes)
        elif ext == "docx":
            text, _ = extract_docx(file_bytes)
        elif ext == "txt":
            text, _ = extract_txt(file_bytes)
        else:
            return "", "unsupported", f"File type '.{ext}' is not supported."

        if not text or len(text.strip()) < 10:
            return "", "empty", "Document contains insufficient text for classification."

        return text, "success", ""

    except ExtractionError as e:
        msg = str(e)
        if "no readable text" in msg.lower() or "insufficient" in msg.lower():
            return "", "empty", msg
        return "", "failed", msg
    except Exception as e:
        logger.error(f"Unexpected extraction error for {filename}: {e}")
        return "", "failed", f"Unexpected error during text extraction: {str(e)}"
