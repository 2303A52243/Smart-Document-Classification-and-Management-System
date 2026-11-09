"""
NLP Model Training Script for Smart Document Classification System.

This script:
1. Loads the labeled training dataset (CSV)
2. Validates columns and category distribution
3. Applies text preprocessing
4. Splits into stratified train/test sets
5. Trains TF-IDF + Linear SVM pipeline (with calibration for probabilities)
6. Evaluates on the held-out test set
7. Saves the trained pipeline and metrics report

Usage:
    cd backend
    python -m ml_training.train

Dataset format (CSV):
    document_text,category
    "text content here","resume"
    ...

Supported categories:
    resume, invoice, research_paper, academic_document, legal_document, report, other
"""
import sys
import json
import logging
import warnings
from pathlib import Path
from datetime import datetime, timezone

import joblib
import numpy as np
import pandas as pd
from sklearn.calibration import CalibratedClassifierCV
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.svm import LinearSVC
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    precision_recall_fscore_support,
)
from sklearn.preprocessing import LabelEncoder

# Add parent to path so we can import from app
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.nlp.preprocessor import clean_text
from app.core.config import settings

warnings.filterwarnings("ignore")
logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger(__name__)

DATASET_PATH = Path(__file__).parent / "dataset" / "labeled_dataset.csv"
MODEL_OUTPUT = settings.MODEL_PATH
METRICS_OUTPUT = settings.MODEL_DIR / "model_metrics.json"
RANDOM_SEED = 42
MIN_SAMPLES_PER_CLASS = 5
TEST_SIZE = 0.20


def load_dataset(path: Path) -> pd.DataFrame:
    """Load and validate the dataset CSV."""
    logger.info(f"Loading dataset: {path}")
    if not path.exists():
        raise FileNotFoundError(
            f"Dataset not found at {path}.\n"
            "Run: python -m ml_training.create_dataset  to generate the synthetic dataset."
        )

    df = pd.read_csv(path)

    # Validate columns
    required = {"document_text", "category"}
    if not required.issubset(df.columns):
        raise ValueError(f"Dataset must have columns: {required}. Found: {list(df.columns)}")

    initial = len(df)
    df = df.dropna(subset=["document_text", "category"]).copy()
    df["document_text"] = df["document_text"].astype(str).str.strip()
    df["category"] = df["category"].astype(str).str.strip().str.lower()

    # Remove empty text
    df = df[df["document_text"].str.len() >= 20].copy()
    logger.info(f"Loaded {len(df)} valid samples (dropped {initial - len(df)} invalid rows).")

    return df


def validate_distribution(df: pd.DataFrame) -> dict:
    """Check category distribution and warn about imbalanced classes."""
    dist = df["category"].value_counts().to_dict()
    logger.info("Category distribution:")
    for cat, count in dist.items():
        logger.info(f"  {cat}: {count} samples")

    low_classes = [c for c, n in dist.items() if n < MIN_SAMPLES_PER_CLASS]
    if low_classes:
        logger.warning(
            f"⚠️  Categories with <{MIN_SAMPLES_PER_CLASS} samples: {low_classes}. "
            "Consider adding more training examples for reliable classification."
        )
    return dist


def build_pipeline() -> Pipeline:
    """
    Build the TF-IDF + LinearSVC pipeline wrapped in CalibratedClassifierCV
    so that predict_proba() returns calibrated probability estimates.

    Note on calibration: CalibratedClassifierCV uses Platt scaling (sigmoid)
    or isotonic regression to map SVM decision scores to probabilities.
    These probabilities are approximate and should not be treated as
    precise confidence values, especially on a small synthetic dataset.
    """
    base_svm = LinearSVC(
        C=1.0,
        max_iter=2000,
        random_state=RANDOM_SEED,
        class_weight="balanced",
    )
    calibrated_svm = CalibratedClassifierCV(base_svm, cv=3, method="sigmoid")

    pipeline = Pipeline([
        (
            "tfidf",
            TfidfVectorizer(
                preprocessor=clean_text,
                ngram_range=(1, 2),
                max_features=30000,
                sublinear_tf=True,
                min_df=1,
            ),
        ),
        ("classifier", calibrated_svm),
    ])
    return pipeline


def train(df: pd.DataFrame) -> dict:
    """Train and evaluate the classification pipeline. Returns metrics dict."""
    texts = df["document_text"].tolist()
    labels = df["category"].tolist()

    unique_classes = sorted(set(labels))
    logger.info(f"Classes: {unique_classes}")

    # Stratified split
    can_stratify = all(labels.count(c) >= 2 for c in unique_classes)
    stratify = labels if can_stratify else None
    if not can_stratify:
        logger.warning("Cannot use stratified split — some classes have < 2 samples. Using random split.")

    X_train, X_test, y_train, y_test = train_test_split(
        texts, labels,
        test_size=TEST_SIZE,
        random_state=RANDOM_SEED,
        stratify=stratify,
    )
    logger.info(f"Train: {len(X_train)}, Test: {len(X_test)}")

    pipeline = build_pipeline()

    # Fit ONLY on training data (no test leakage)
    logger.info("Training TF-IDF + Calibrated LinearSVC pipeline...")
    pipeline.fit(X_train, y_train)
    logger.info("Training complete.")

    # Evaluate on held-out test set
    y_pred = pipeline.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    report = classification_report(y_test, y_pred, output_dict=True)
    cm = confusion_matrix(y_test, y_pred, labels=unique_classes)

    logger.info(f"\nTest Accuracy: {accuracy:.4f}")
    logger.info("\nClassification Report:")
    logger.info(classification_report(y_test, y_pred))

    # Build metrics dict
    per_category = {}
    for cat in unique_classes:
        if cat in report:
            per_category[cat] = {
                "precision": round(report[cat]["precision"], 4),
                "recall": round(report[cat]["recall"], 4),
                "f1_score": round(report[cat]["f1-score"], 4),
                "support": report[cat]["support"],
            }

    dist = df["category"].value_counts().to_dict()
    metrics = {
        "model_version": "1.0.0-tfidf-svm-calibrated",
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "total_samples": len(df),
        "train_samples": len(X_train),
        "test_samples": len(X_test),
        "categories": unique_classes,
        "accuracy": round(accuracy, 4),
        "precision_macro": round(report["macro avg"]["precision"], 4),
        "recall_macro": round(report["macro avg"]["recall"], 4),
        "f1_macro": round(report["macro avg"]["f1-score"], 4),
        "precision_weighted": round(report["weighted avg"]["precision"], 4),
        "recall_weighted": round(report["weighted avg"]["recall"], 4),
        "f1_weighted": round(report["weighted avg"]["f1-score"], 4),
        "per_category": per_category,
        "confusion_matrix": cm.tolist(),
        "dataset_distribution": dist,
        "is_synthetic": True,
        "disclaimer": (
            "⚠️  This model was trained on a synthetic/development dataset. "
            "Reported metrics reflect performance on synthetic held-out data only. "
            "Do NOT interpret these as real-world accuracy estimates. "
            "Replace with a large, properly labeled dataset for production use."
        ),
    }

    return pipeline, metrics, unique_classes


def save_artifacts(pipeline, metrics: dict, classes: list):
    """Save the trained pipeline and metrics report."""
    artifact = {
        "pipeline": pipeline,
        "version": metrics["model_version"],
        "classes": classes,
        "trained_at": metrics["trained_at"],
    }
    joblib.dump(artifact, MODEL_OUTPUT)
    logger.info(f"✅ Model saved: {MODEL_OUTPUT}")

    with open(METRICS_OUTPUT, "w") as f:
        json.dump(metrics, f, indent=2)
    logger.info(f"✅ Metrics saved: {METRICS_OUTPUT}")


def main():
    logger.info("=" * 60)
    logger.info("Smart Document Classification — Model Training")
    logger.info("=" * 60)

    df = load_dataset(DATASET_PATH)
    dist = validate_distribution(df)
    pipeline, metrics, classes = train(df)
    save_artifacts(pipeline, metrics, classes)

    logger.info("\n" + "=" * 60)
    logger.info(f"Training complete!")
    logger.info(f"Accuracy : {metrics['accuracy']:.4f}")
    logger.info(f"F1 Macro : {metrics['f1_macro']:.4f}")
    logger.info(f"Model    : {MODEL_OUTPUT}")
    logger.info("=" * 60)
    logger.info("\n⚠️  " + metrics["disclaimer"])


if __name__ == "__main__":
    main()

