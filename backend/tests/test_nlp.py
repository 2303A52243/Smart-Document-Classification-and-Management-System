import pytest
from app.nlp.preprocessor import clean_text, count_words, get_text_preview
from app.nlp.extractor import extract_text, extract_txt
from app.nlp.classifier import classifier

def test_clean_text_normalization():
    raw = "  CONTACT: test@domain.com, visit http://example.com/cv.pdf   \n\nExperienced Engineer!  "
    cleaned = clean_text(raw)
    assert "emailaddr" in cleaned
    assert "weblink" in cleaned
    assert "experienced engineer" in cleaned
    assert not cleaned.startswith(" ")
    assert not cleaned.endswith(" ")

def test_word_counter():
    text = "The quick brown fox jumps over the lazy dog"
    assert count_words(text) == 9
    assert count_words("") == 0
    assert count_words(None) == 0

def test_text_preview():
    long_text = "word " * 200
    preview = get_text_preview(long_text, max_chars=50)
    assert len(preview) <= 55
    assert preview.endswith("...")

def test_txt_extractor_valid():
    sample_bytes = b"Professional Summary:\nSenior Backend Developer with 10 years experience."
    text, status, error = extract_text(sample_bytes, "profile.txt")
    assert status == "success"
    assert "Senior Backend Developer" in text
    assert error == ""

def test_txt_extractor_empty():
    sample_bytes = b"   \n\n  "
    text, status, error = extract_text(sample_bytes, "empty.txt")
    assert status == "empty"
    assert "insufficient" in error.lower()

def test_extractor_unsupported():
    sample_bytes = b"RIFF....WAVEfmt "
    text, status, error = extract_text(sample_bytes, "audio.wav")
    assert status == "unsupported"
    assert "not supported" in error

def test_nlp_classifier_prediction():
    assert classifier.is_loaded() is True
    
    # Test resume classification
    resume_text = "Senior Software Engineer Experience Python React PostgreSQL AWS Docker Kubernetes B.Tech"
    res = classifier.predict(resume_text)
    assert res.predicted_category == "resume"
    assert res.confidence_score is not None
    assert 0.0 <= res.confidence_score <= 1.0
    assert isinstance(res.alternatives, list)

def test_nlp_classifier_invoice():
    invoice_text = "TAX INVOICE Invoice Number INV-2024-998 Billed to Acme Corp Total Amount Due $5,400.00 Net 30"
    res = classifier.predict(invoice_text)
    assert res.predicted_category == "invoice"
    assert res.confidence_score >= 0.50

def test_nlp_classifier_legal():
    legal_text = "NON-DISCLOSURE AGREEMENT Confidential Information Disclosing Party Receiving Party Governing Law State of Delaware"
    res = classifier.predict(legal_text)
    assert res.predicted_category == "legal_document"

def test_nlp_classifier_empty_fallback():
    res = classifier.predict("", extraction_status="empty")
    assert res.predicted_category == "other"
    assert res.needs_review is True
    assert res.confidence_score == 0.0

