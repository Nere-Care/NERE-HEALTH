import time
import logging
import httpx

logger = logging.getLogger(__name__)

FALLBACK_RATES = {
    "XAF": 1,
    "XOF": 1,
    "EUR": 656,
    "USD": 576,
    "GBP": 768,
}

_cache: dict | None = None
_cache_ts: float = 0
_CACHE_TTL = 24 * 60 * 60  # 24h


def get_rates() -> dict:
    global _cache, _cache_ts
    now = time.time()
    if _cache and (now - _cache_ts) < _CACHE_TTL:
        return _cache

    try:
        resp = httpx.get("https://open.er-api.com/v6/latest/EUR", timeout=10)
        data = resp.json()
        if data.get("result") == "success" and data.get("rates"):
            api_rates = data["rates"]
            xaf_per_eur = api_rates.get("XAF", 656)
            _cache = {
                "XAF": 1,
                "XOF": 1,
                "EUR": xaf_per_eur,
                "USD": xaf_per_eur / api_rates.get("USD", 1.14),
                "GBP": xaf_per_eur / api_rates.get("GBP", 0.85),
            }
            _cache_ts = now
            logger.info("Exchange rates refreshed: %s", _cache)
    except Exception as e:
        logger.warning("Failed to fetch exchange rates: %s", e)

    return _cache or FALLBACK_RATES


def to_xaf(amount: float, devise: str) -> float:
    rates = get_rates()
    rate = rates.get(devise.upper(), 1)
    return round(amount * rate)


def from_xaf(amount_xaf: float, devise: str) -> float:
    rates = get_rates()
    rate = rates.get(devise.upper(), 1)
    return round(amount_xaf / rate)
