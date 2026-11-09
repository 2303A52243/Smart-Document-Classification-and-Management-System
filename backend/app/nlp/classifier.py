"""
NLP Classifier Service — loads the trained scikit-learn pipeline and runs predictions.
Uses CalibratedClassifierCV to generate probability estimates from LinearSVC.
Ensures all return values are native Python primitives (bool, float, str) for BSON compatibility.
"""
import logging
from pathlib import Path
from typing import Optional, List, Tuple
import joblib

from app.core.config import settings
from app.nlp.preprocessor import clean_text

logger = logging.getLogger(__name__)


class PredictionResult:
    def __init__(
        self,
        predicted_category: str,
        confidence_score: Optional[float],
        needs_review: bool,
        alternatives: List[Tuple[str, float]],
        model_version: str,
        extraction_status: str,
    ):
        self.predicted_category = str(predicted_category)
        self.confidence_score = float(confidence_score) if confidence_score is not None else None
        self.needs_review = bool(needs_review)
        self.alternatives = [(str(c), float(s)) for c, s in alternatives]
        self.model_version = str(model_version)
        self.extraction_status = str(extraction_status)


class ClassifierService:
    """Singleton NLP classifier service."""

    def __init__(self):
        self.pipeline = None
        self.model_version = "not-loaded"
        self.classes_: List[str] = []
        self._load()

    def _load(self):
        """Load the saved model pipeline from disk."""
        model_path = settings.MODEL_PATH
        if not model_path.exists():
            logger.warning(
                f"Model file not found at {model_path}. "
                "Run ml_training/train.py to train the model."
            )
            return

        try:
            artifact = joblib.load(model_path)
            if isinstance(artifact, dict):
                self.pipeline = artifact.get("pipeline")
                self.model_version = str(artifact.get("version", "1.0.0"))
                self.classes_ = [str(c) for c in artifact.get("classes", settings.CATEGORIES)]
            else:
                self.pipeline = artifact
                self.model_version = "1.0.0"
                self.classes_ = [str(c) for c in settings.CATEGORIES]

            logger.info(f"✅ NLP model loaded (version: {self.model_version}, classes: {self.classes_})")
        except Exception as e:
            logger.error(f"❌ Failed to load model: {e}")
            self.pipeline = None

    def is_loaded(self) -> bool:
        return self.pipeline is not None

    def predict(self, text: str, extraction_status: str = "success") -> PredictionResult:
        """
        Classify document text. Returns a PredictionResult with:
        - predicted_category: top predicted label
        - confidence_score: calibrated probability (0.0–1.0) or None
        - needs_review: True if confidence is below threshold
        - alternatives: top-3 alternative categories with scores
        """
        if extraction_status != "success" or not text or len(text.strip()) < 10:
            return PredictionResult(
                predicted_category="other",
                confidence_score=0.0,
                needs_review=True,
                alternatives=[],
                model_version=self.model_version,
                extraction_status=str(extraction_status),
            )

        if not self.is_loaded():
            raise RuntimeError(
                "Classification model is not loaded. Train the model using ml_training/train.py."
            )

        cleaned = clean_text(text)
        if not cleaned:
            return PredictionResult(
                predicted_category="other",
                confidence_score=0.0,
                needs_review=True,
                alternatives=[],
                model_version=self.model_version,
                extraction_status="empty_after_preprocessing",
            )

        # Use predict_proba (available because of CalibratedClassifierCV)
        if hasattr(self.pipeline, "predict_proba"):
            probs = self.pipeline.predict_proba([cleaned])[0]
            classes = self.classes_
            scored = sorted(zip(classes, probs), key=lambda x: x[1], reverse=True)
            top_cat, top_score = scored[0]
            alternatives = [(str(c), round(float(s), 4)) for c, s in scored[1:4]]

            top_score_val = float(top_score)
            needs_review = bool(top_score_val < settings.CONFIDENCE_THRESHOLD)
            if len(scored) > 1 and float(top_score_val - float(scored[1][1])) < 0.08:
                needs_review = True

            return PredictionResult(
                predicted_category=str(top_cat),
                confidence_score=round(top_score_val, 4),
                needs_review=needs_review,
                alternatives=alternatives,
                model_version=self.model_version,
                extraction_status="success",
            )
        else:
            pred = str(self.pipeline.predict([cleaned])[0])
            return PredictionResult(
                predicted_category=pred,
                confidence_score=None,
                needs_review=False,
                alternatives=[],
                model_version=self.model_version,
                extraction_status="success",
            )

    def reload(self):
        """Reload the model from disk (call after retraining)."""
        self.pipeline = None
        self._load()


# Global singleton instance
classifier = ClassifierService()
