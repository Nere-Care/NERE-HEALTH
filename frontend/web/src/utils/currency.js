const FALLBACK_RATES_TO_XAF = {
  XAF: 1,
  XOF: 1,
  EUR: 656,
  USD: 576,
  GBP: 768,
};

const CURRENCY_SYMBOLS = {
  XAF: "FCFA",
  XOF: "FCFA",
  EUR: "EUR",
  USD: "USD",
  GBP: "GBP",
};

let cachedRates = null;
let cacheTimestamp = 0;
const CACHE_TTL = 24 * 60 * 60 * 1000;

async function fetchRates() {
  const now = Date.now();
  if (cachedRates && now - cacheTimestamp < CACHE_TTL) return cachedRates;

  try {
    const res = await fetch("https://open.er-api.com/v6/latest/EUR");
    const data = await res.json();
    if (data.result === "success" && data.rates) {
      const xafPerEur = data.rates.XAF || 656;
      cachedRates = {
        XAF: 1,
        XOF: 1,
        EUR: xafPerEur,
        USD: xafPerEur / (data.rates.USD || 1.14),
        GBP: xafPerEur / (data.rates.GBP || 0.85),
      };
      cacheTimestamp = now;
    }
  } catch {
    // offline or API error — keep fallback
  }

  return cachedRates || FALLBACK_RATES_TO_XAF;
}

function getRatesSync() {
  return cachedRates || FALLBACK_RATES_TO_XAF;
}

export async function initCurrencyRates() {
  await fetchRates();
}

export function toXAF(montant, devise) {
  const d = (devise || "XAF").toUpperCase();
  const rates = getRatesSync();
  const rate = rates[d] || 1;
  return Math.round(Number(montant || 0) * rate);
}

export function fromXAF(montantXAF, devise) {
  const d = (devise || "XAF").toUpperCase();
  const rates = getRatesSync();
  const rate = rates[d] || 1;
  return Math.round(Number(montantXAF || 0) / rate);
}

export function formatXAF(montant) {
  return `${Number(montant || 0).toLocaleString("fr-FR")} FCFA`;
}

export function formatCurrency(montantXAF, devise) {
  const d = (devise || "XAF").toUpperCase();
  const converted = fromXAF(montantXAF, d);
  const symbol = CURRENCY_SYMBOLS[d] || d;
  return `${converted.toLocaleString("fr-FR")} ${symbol}`;
}
