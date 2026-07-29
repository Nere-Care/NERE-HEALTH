let cachedRates = null;
let cacheTime = 0;
const CACHE_DURATION = 24 * 60 * 60 * 1000;

const FALLBACK_RATES = { XAF: 1, EUR: 655.957, USD: 576.06, GBP: 768.04, XOF: 1 };

export async function initCurrencyRates() {
  try {
    const now = Date.now();
    if (cachedRates && now - cacheTime < CACHE_DURATION) return cachedRates;
    const res = await fetch("https://open.er-api.com/v6/latest/EUR");
    const data = await res.json();
    if (data?.rates) {
      const eurToXAF = data.rates.XAF || 655.957;
      cachedRates = {
        XAF: 1,
        EUR: eurToXAF,
        USD: eurToXAF / (data.rates.USD || 1.08),
        GBP: eurToXAF / (data.rates.GBP || 0.84),
        XOF: 1,
      };
      cacheTime = now;
    }
  } catch {
    cachedRates = FALLBACK_RATES;
  }
  return cachedRates || FALLBACK_RATES;
}

export function toXAF(amount, devise) {
  const num = Number(amount);
  if (!num || isNaN(num)) return 0;
  if (!devise) return num;
  const rates = cachedRates || FALLBACK_RATES;
  return num * (rates[devise] || 1);
}

export function formatXAF(amount) {
  return new Intl.NumberFormat("fr-FR").format(Math.round(amount));
}
