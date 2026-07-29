const PHONE_RE = /^(237)?[6][0-9]{8}$/;

export function validatePhone(phone) {
  if (!phone || !phone.trim()) return true;
  const digits = phone.replace(/[\s\-+()]/g, "");
  return PHONE_RE.test(digits);
}

export function phoneError() {
  return "Numéro invalide : 9 chiffres commençant par 6 (ex: 6XXXXXXXX)";
}
