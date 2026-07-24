import re

_PHONE_RE = re.compile(r"^6\d{8}$")


def validate_phone(phone: str | None) -> str | None:
    """Normalize and validate a Cameroon phone number.

    Rules:
      - Must be exactly 9 digits
      - Must start with 6
      - Country prefix +237 or 237 is stripped if present

    Returns the normalized number (9 digits) or raises ValueError.
    """
    if not phone:
        return phone
    digits = re.sub(r"[\s\-+()]", "", phone)
    if digits.startswith("237"):
        digits = digits[3:]
    if not _PHONE_RE.match(digits):
        raise ValueError(
            "Numéro de téléphone invalide : 9 chiffres commençant par 6 attendus"
        )
    return digits
