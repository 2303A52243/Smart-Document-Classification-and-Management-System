"""
Text preprocessing pipeline for the NLP classifier.
Applies consistent cleaning during both training and inference.
"""
import re
import unicodedata


def clean_text(text: str) -> str:
    """
    Preprocessing steps:
    1. Unicode NFKD normalization
    2. Lowercase conversion
    3. URL/email replacement with tokens
    4. Remove special characters (keep alphanumerics and spaces)
    5. Whitespace normalization
    
    NOTE: We deliberately avoid aggressive stop-word removal to preserve
    domain-specific vocabulary (e.g., 'invoice', 'whereas', 'abstract')
    that is highly predictive of document category.
    """
    if not text or not isinstance(text, str):
        return ""

    # 1. Normalize unicode
    text = unicodedata.normalize("NFKD", text)

    # 2. Lowercase
    text = text.lower()

    # 3. Replace URLs
    text = re.sub(r"https?://\S+|www\.\S+", " weblink ", text)

    # 4. Replace email addresses
    text = re.sub(r"\b[\w.+-]+@[\w-]+\.[a-z]{2,}\b", " emailaddr ", text)

    # 5. Remove non-alphanumeric chars (keep spaces and hyphens between words)
    text = re.sub(r"[^\w\s]", " ", text)

    # 6. Normalize whitespace
    text = re.sub(r"\s+", " ", text).strip()

    return text


def get_text_preview(text: str, max_chars: int = 500) -> str:
    """Return a clean, condensed text preview."""
    if not text:
        return ""
    condensed = " ".join(text.split())
    return condensed[:max_chars] + ("..." if len(condensed) > max_chars else "")


def count_words(text: str) -> int:
    """Count words in text."""
    if not text:
        return 0
    return len(text.split())

