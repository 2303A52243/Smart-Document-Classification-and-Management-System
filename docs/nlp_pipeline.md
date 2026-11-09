# Natural Language Processing Pipeline Specification

## 1. Pipeline Overview
The Smart Document Classification System implements a machine learning text classification pipeline using scikit-learn. The pipeline accepts raw document binaries, extracts raw strings, preprocesses textual features, converts terms to TF-IDF representations, and produces classification decisions with calibrated probabilities.

## 2. Text Preprocessing Specifications
To guarantee model generalization and avoid feature skew between training and inference, identical preprocessing is applied:

1. **Unicode NFKD Normalization**: Converts non-standard Unicode characters into standardized base forms.
2. **Case Normalization**: Converts all characters to lowercase.
3. **URL & Email Masking**: Replaces hyperlinks with `weblink` and email addresses with `emailaddr`.
4. **Alphanumeric Filtering**: Strips noisy symbols while preserving hyphenated words and digits.
5. **Whitespace Collapsing**: Removes duplicate tabs, linebreaks, and spaces.

## 3. Feature Extraction: TF-IDF
- **Term Frequency-Inverse Document Frequency (TF-IDF)** converts textual strings into sparse numerical vectors.
- **N-gram Range**: `(1, 2)` (captures unigrams and bigrams like "tax invoice" or "terms of service").
- **Sublinear TF**: `sublinear_tf=True` applies $1 + \log(\text{TF})$ scaling, dampening the effect of repeated words.
- **Max Features**: Up to 30,000 distinct n-gram tokens.

## 4. Classification & Probability Calibration

### Why Linear Support Vector Classification?
High-dimensional text spaces ($D \approx 10^4$) with sparse feature vectors are almost always linearly separable. Linear SVM finds the maximum-margin hyperplane separating classes.

### The Decision Score vs. Probability Problem
A standard Linear SVM outputs decision scores representing signed Euclidean distances from the separating hyperplane:
$$f(x) = w^T x + b$$
These scores are uncalibrated and unbounded ($-\infty$ to $+\infty$), not probabilities.

### Platt Sigmoid Calibration (`CalibratedClassifierCV`)
To provide mathematically valid confidence scores, we wrap `LinearSVC` with `CalibratedClassifierCV(cv=3, method='sigmoid')`. This fits a sigmoid logistic function mapping decision scores to probabilities:
$$P(y = c \mid x) = \frac{1}{1 + \exp(A \cdot f_c(x) + B)}$$
The resulting vector satisfies $\sum_{c} P(y=c \mid x) = 1$, allowing us to accurately present confidence percentages.

## 5. Conservative Review Policy
The system does not blindly assign high confidence to unfamiliar documents:
- **Threshold**: If $\max_c P(y=c \mid x) < 0.40$, the document is flagged with `needs_review=True`.
- **Ambiguity**: If $P_1 - P_2 < 0.08$ (top two candidate classes are separated by less than 8%), the document is flagged with `needs_review=True`.

## 6. Dataset & Academic Evaluation Disclosure
- **Initial Training Data**: A synthetic development dataset containing 140 labeled business documents (20 per category across 7 categories) is included in `backend/ml_training/dataset/labeled_dataset.csv`.
- **Held-out Split**: Stratified 80/20 train/test split (112 train samples, 28 test samples).
- **Test Metrics**: Held-out test accuracy of 96.4% on synthetic data.
- **Academic Disclaimer**: Performance evaluated on synthetic data does not constitute evidence of real-world operational accuracy. Users can train on real-world datasets by importing custom CSV rows.

