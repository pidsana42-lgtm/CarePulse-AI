import io
import os
import re
import logging
from typing import Dict, Any, List, Optional
from PIL import Image, ImageEnhance, ImageFilter

logger = logging.getLogger(__name__)


class RealOCRService:
    """
    High-Speed Production Optical Character Recognition (OCR) Engine.
    Extracts text from Thai medical certificates, clinical records, and referral letters.
    Supports Tesseract OCR (tha+eng), PDF direct text extraction, and image pre-processing.
    """

    @staticmethod
    def preprocess_image(image: Image.Image) -> Image.Image:
        """Enhances contrast, grayscale, and upscale for high OCR accuracy."""
        try:
            gray = image.convert("L")
            enhancer = ImageEnhance.Contrast(gray)
            enhanced = enhancer.enhance(1.8)
            if enhanced.width < 1200:
                factor = 1200 / enhanced.width
                enhanced = enhanced.resize(
                    (int(enhanced.width * factor), int(enhanced.height * factor)),
                    Image.Resampling.LANCZOS
                )
            return enhanced
        except Exception:
            return image

    @classmethod
    def extract_text(cls, file_bytes: bytes, filename: str) -> Dict[str, Any]:
        extracted_text = ""
        engine_used = "none"
        confidence = 0.0

        # 1. Check if PDF document
        if filename.lower().endswith(".pdf"):
            try:
                import pypdf
                reader = pypdf.PdfReader(io.BytesIO(file_bytes))
                pdf_text = ""
                for page in reader.pages:
                    pdf_text += (page.extract_text() or "") + "\n"
                if len(pdf_text.strip()) > 10:
                    return {
                        "text": pdf_text.strip(),
                        "engine": "pypdf (PDF Direct Extraction)",
                        "confidence": 0.99
                    }
            except Exception as e:
                logger.warning(f"pypdf extraction failed: {e}")

        # 2. Open image with Pillow
        try:
            image = Image.open(io.BytesIO(file_bytes))
            processed_image = cls.preprocess_image(image)
        except Exception as e:
            logger.error(f"Cannot open image: {e}")
            return {
                "text": "",
                "engine": "failed",
                "confidence": 0.0
            }

        # 3. Try Tesseract OCR (with Thai + English language pack)
        try:
            import pytesseract
            for p in ["/opt/homebrew/bin/tesseract", "/usr/local/bin/tesseract", "tesseract"]:
                if os.path.exists(p) or p == "tesseract":
                    pytesseract.pytesseract.tesseract_cmd = p
                    break

            tess_text = pytesseract.image_to_string(processed_image, lang="tha+eng", timeout=5)
            if tess_text and len(tess_text.strip()) > 5:
                return {
                    "text": tess_text.strip(),
                    "engine": "Tesseract OCR (tha+eng)",
                    "confidence": 0.95
                }
        except Exception as e:
            logger.debug(f"pytesseract tha+eng: {e}")

        # 4. Try Tesseract OCR (English fallback)
        try:
            import pytesseract
            tess_eng = pytesseract.image_to_string(processed_image, lang="eng", timeout=5)
            if tess_eng and len(tess_eng.strip()) > 5:
                return {
                    "text": tess_eng.strip(),
                    "engine": "Tesseract OCR (eng)",
                    "confidence": 0.90
                }
        except Exception as e:
            logger.debug(f"pytesseract eng: {e}")

        return {
            "text": extracted_text,
            "engine": engine_used,
            "confidence": confidence
        }


real_ocr_service = RealOCRService()
