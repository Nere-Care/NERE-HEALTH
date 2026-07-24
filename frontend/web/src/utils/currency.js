const RATES_TO_XAF = {
  XAF: 1,
  XOF: 1,
  EUR: 660,
  USD: 580,
  GBP: 790,
};

export function toXAF(montant, devise) {
  const d = (devise || "XAF").toUpperCase();
  const rate = RATES_TO_XAF[d] || 1;
  return Math.round(Number(montant || 0) * rate);
}

export function formatXAF(montant) {
  return `${Number(montant || 0).toLocaleString("fr-FR")} FCFA`;
}
