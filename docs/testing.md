# Automated Testing & Verification Documentation

## 1. Overview
The testing suite covers backend API routes, authentication flows, NLP preprocessing, text extraction, model classification, and error resilience.

---

## 2. Test Suite Structure

```
backend/tests/
├── conftest.py          # Session fixtures, TestClient, test JWT generation
├── test_api.py          # API endpoint tests: Auth, Documents, Categories, Analytics
└── test_nlp.py          # NLP logic: Preprocessor, Extractor, Pipeline, Calibration
```

---

## 3. Running Backend Tests
Execute pytest from the `backend/` directory:
```bash
cd backend
python -m pytest tests/ -v
```

### Verified Test Cases (15/15 Passing):
1. `test_health_check`: Verifies `/health` returns status 200, database availability, and loaded model version.
2. `test_get_metrics`: Verifies `/api/analytics/metrics` exposes valid accuracy, precision, and confusion matrix.
3. `test_auth_workflow`: Verifies user registration, duplicate email rejection, login verification, invalid password rejection, and `/auth/me` profile fetching.
4. `test_document_lifecycle`: Tests full document pipeline: Upload &rarr; Text Extraction &rarr; NLP Classification &rarr; List &rarr; Search &rarr; Detail &rarr; Category Correction &rarr; Reclassify &rarr; Download &rarr; Deletion.
5. `test_analytics_endpoints`: Validates `/analytics/overview`, `/analytics/categories`, and `/analytics/activity`.
6. `test_clean_text_normalization`: Validates regex cleaning, email/URL tokens, and NFKD Unicode normalization.
7. `test_word_counter`: Verifies whitespace word counting.
8. `test_text_preview`: Validates preview generation under 500 characters.
9. `test_txt_extractor_valid`: Validates parsing of text streams.
10. `test_txt_extractor_empty`: Ensures empty files return `empty` extraction status.
11. `test_extractor_unsupported`: Ensures unsupported formats return `unsupported` status.
12. `test_nlp_classifier_prediction`: Verifies scikit-learn pipeline inference on resume text.
13. `test_nlp_classifier_invoice`: Verifies classification on invoice text.
14. `test_nlp_classifier_legal`: Verifies classification on legal agreement text.
15. `test_nlp_classifier_empty_fallback`: Verifies fallback to `other` with `needs_review=True` on empty documents.

---

## 4. Frontend Build & Syntax Verification
Execute Vite production build:
```bash
cd frontend
npm run build
```
Result: `✓ built in 2.56s` with 0 errors.
