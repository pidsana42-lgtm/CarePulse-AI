import re
from typing import Any, Dict, List, Union


class PDPAMaskingService:
    """
    PDPA & Healthcare Privacy Masking Service.
    Provides sanitization and anonymization for Thai Citizen IDs, Phone Numbers,
    Full Names, and sensitive health records.
    """

    @staticmethod
    def mask_thai_citizen_id(id_number: str) -> str:
        """
        Mask 13-digit Thai Citizen ID.
        Format: X-XXXX-XXXXX-XX-X -> X-XXXX-*****--X or 1-1234-XXXXX-45-6 -> 1-1234-XXXXX-XX-6
        """
        if not id_number:
            return ""
        clean_id = re.sub(r"\D", "", id_number)
        if len(clean_id) != 13:
            # If not exact 13 digits, mask middle characters
            if len(clean_id) > 4:
                return clean_id[:2] + ("X" * (len(clean_id) - 4)) + clean_id[-2:]
            return "X" * len(clean_id)
        
        # Standard 13-digit pattern masking middle 6 digits
        return f"{clean_id[0]}-{clean_id[1:5]}-XXXXX-XX-{clean_id[-1]}"

    @staticmethod
    def mask_phone_number(phone: str) -> str:
        """
        Mask Thai phone number: 0812345678 -> 081-XXX-5678
        """
        if not phone:
            return ""
        clean_phone = re.sub(r"\D", "", phone)
        if len(clean_phone) == 10:
            return f"{clean_phone[:3]}-XXX-{clean_phone[-4:]}"
        elif len(clean_phone) == 9:
            return f"{clean_phone[:2]}-XXX-{clean_phone[-4:]}"
        return "XXX-XXX-XXXX"

    @staticmethod
    def mask_name(name: str) -> str:
        """
        Mask Person Full Name: สมชาย ใจดี -> สม*** ใ**
        """
        if not name:
            return ""
        parts = name.strip().split()
        masked_parts = []
        for part in parts:
            if len(part) <= 2:
                masked_parts.append(part[0] + "*")
            else:
                visible_prefix = part[:2]
                masked_parts.append(visible_prefix + ("*" * (len(part) - 2)))
        return " ".join(masked_parts)

    @classmethod
    def sanitize_health_data(cls, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Recursively mask sensitive keys in a dictionary before logging or processing.
        """
        sensitive_keys = {
            "citizen_id": cls.mask_thai_citizen_id,
            "id_card": cls.mask_thai_citizen_id,
            "phone": cls.mask_phone_number,
            "phone_number": cls.mask_phone_number,
            "patient_name": cls.mask_name,
            "full_name": cls.mask_name,
            "name": cls.mask_name,
        }

        sanitized = {}
        for key, value in data.items():
            key_lower = key.lower()
            if key_lower in sensitive_keys and isinstance(value, str):
                sanitized[key] = sensitive_keys[key_lower](value)
            elif isinstance(value, dict):
                sanitized[key] = cls.sanitize_health_data(value)
            elif isinstance(value, list):
                sanitized[key] = [
                    cls.sanitize_health_data(item) if isinstance(item, dict) else item
                    for item in value
                ]
            else:
                sanitized[key] = value

        return sanitized


pdpa_masker = PDPAMaskingService()
