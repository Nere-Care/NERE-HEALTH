import { getUserTimezone } from "./timezone";

const PAID_STATUTS = ["paye", "payé", "valide_manuellement", "confirme", "paid", "effectue", "valide", "effectué", "validé"];
export const isPaidStatus = (s) => PAID_STATUTS.includes((s || "").toLowerCase());

const stripEmoji = (s) => String(s || "").replace(/[\u{1F000}-\u{1FFFF}]/gu, "").replace(/[\u2600-\u27BF]/gu, "").replace(/[\uFE00-\uFE0F]/gu, "").replace(/[\u200D]/gu, "").trim();

// Helper for formatting numbers cleanly
const fmtNum = (n) => {
  const num = typeof n === "number" ? n : parseFloat(String(n).replace(/[^\d.-]/g, "")) || 0;
  return Math.round(num).toLocaleString("fr-FR").replace(/\u202f/g, " ");
};

const getMethodLabel = (m) => {
  const map = {
    mtn_momo: "MTN MoMo",
    orange_money: "Orange Money",
    carte_visa: "Visa",
    carte_mastercard: "Mastercard",
    virement_bancaire: "Virement bancaire",
    notchpay: "Notchpay",
    stripe: "Stripe",
    portefeuille_nere: "Portefeuille Néré",
    momo: "MTN MoMo",
    orange: "Orange Money",
    bank: "Virement bancaire",
  };
  return map[(m || "").toLowerCase()] || m || "—";
};

/**
 * 1. Reçu PDF Patient (Katika Design)
 */
export const generatePatientReceiptPDF = async (entry, patientNom) => {
  if (!isPaidStatus(entry.statut)) return;

  const { default: jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  const pageW = 210;
  const L = 20;
  const R = pageW - 20;
  const cW = R - L;

  const C = {
    primary: [26, 86, 219],
    dark: [17, 24, 39],
    mid: [75, 85, 99],
    light: [156, 163, 175],
    border: [209, 213, 219],
    green: [5, 150, 105],
    bgGray: [249, 250, 251],
  };

  const hr = (y) => {
    doc.setDrawColor(...C.border);
    doc.setLineWidth(0.25);
    doc.line(L, y, R, y);
  };

  const row = (label, value, y, bold = false) => {
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...C.mid);
    doc.text(label, L, y);
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setTextColor(...C.dark);
    doc.text(String(value || "—"), R, y, { align: "right" });
  };

  const refId = entry.reference || `TRF-${(entry.id || "").replace(/-/g, "").slice(0, 12).toUpperCase()}`;
  const montantRaw = entry.montant || 0;
  const amountStr = `${fmtNum(montantRaw)} ${entry.devise || "XAF"}`;
  const methode = getMethodLabel(entry.methode);

  const isCard = (entry.methode || "").toLowerCase().includes("carte") || (entry.methode || "").toLowerCase().includes("visa");
  const isMobile = entry.methode === "mtn_momo" || entry.methode === "orange_money";

  const dateObj = entry.created_at ? new Date(entry.created_at) : null;
  const dateStr = dateObj
    ? dateObj.toLocaleDateString("fr-FR", { timeZone: getUserTimezone(), day: "2-digit", month: "2-digit", year: "numeric" }) +
    ", " +
    dateObj.toLocaleTimeString("fr-FR", { timeZone: getUserTimezone(), hour: "2-digit", minute: "2-digit" }) +
    " UTC"
    : "—";

  // HEADER
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.primary);
  doc.text("Néré Health", L, 16);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...C.light);
  doc.text("Reçu de transaction", L, 22);

  doc.text("nere-health.com", R, 16, { align: "right" });
  doc.text("Douala, Cameroun", R, 22, { align: "right" });

  let y = 32;
  hr(y);
  y += 10;

  // TITLE & AMOUNT
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...C.dark);
  doc.text("Reçu", L, y);
  y += 12;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.setTextColor(...C.dark);
  doc.text(amountStr, L, y);
  y += 12;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...C.mid);
  const methodePart = `${methode}  •  `;
  doc.text(methodePart, L, y);
  const mW = doc.getTextWidth(methodePart);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.green);
  doc.text("Payé", L + mW, y);
  y += 10;

  hr(y);
  y += 10;

  // TRANSACTION DETAILS & AMOUNT SUMMARY
  doc.setFontSize(9.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.dark);
  doc.text("Détails de la transaction", L, y);
  doc.text("Résumé du montant", R, y, { align: "right" });
  y += 3;
  hr(y);
  y += 8;

  const midX = pageW / 2 - 4;
  const mid2X = pageW / 2 + 4;

  const rowL = (label, value, yy, bold = false) => {
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...C.mid);
    doc.text(label, L, yy);
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setTextColor(...C.dark);
    doc.text(String(value || "—"), midX, yy, { align: "right" });
  };
  const rowR = (label, value, yy, bold = false) => {
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...C.mid);
    doc.text(label, mid2X, yy);
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setTextColor(...C.dark);
    doc.text(String(value || "—"), R, yy, { align: "right" });
  };

  const startY = y;
  rowL("Transaction ID", entry.reference || (entry.id || "").slice(0, 16) || "—", y, true); y += 7;
  rowL("Date", dateStr, y); y += 7;
  rowL("Méthode", methode, y); y += 7;
  rowL("Frais", "Aucun", y); y += 7;
  rowL("Statut", "Payé", y, true);

  let yR = startY;
  rowR("Montant", amountStr, yR, true); yR += 7;
  rowR("Référence", entry.reference || "—", yR, true);

  y = Math.max(y, yR) + 10;
  hr(y);
  y += 10;

  // PARTIES
  doc.setFontSize(9.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.dark);
  doc.text("Parties", L, y);
  y += 3;
  hr(y);
  y += 8;

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...C.light);
  doc.text("Expéditeur", L, y);
  doc.text("Destinataire", mid2X, y);
  y += 6;

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.dark);
  const senderLines = doc.splitTextToSize(patientNom || "Patient", midX - L - 2);
  doc.text(senderLines, L, y);
  doc.text("NÉRÉ HEALTH", mid2X, y);
  y += senderLines.length * 5.5;

  let senderSub = "";
  if (isMobile && entry.telephone_paiement) {
    const tel = String(entry.telephone_paiement);
    senderSub = tel.length >= 5 ? tel.slice(0, 5) + "****" : tel;
  } else if (isCard && entry.derniers_4_chiffres) {
    senderSub = `**** **** **** ${entry.derniers_4_chiffres}`;
  }

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...C.mid);
  if (senderSub) {
    doc.text(senderSub, L, y);
  }
  doc.text("Cameroun", mid2X, y);
  y += 12;

  hr(y);
  y += 10;

  // MOBILE MONEY / CARD DETAILS
  if (isMobile || isCard) {
    doc.setFontSize(9.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...C.primary);
    doc.text(isMobile ? "DÉTAILS MOBILE MONEY" : "DÉTAILS DE LA CARTE", L, y);
    y += 3;
    hr(y);
    y += 8;

    if (isMobile && entry.telephone_paiement) {
      const tel = String(entry.telephone_paiement);
      const masked = tel.length >= 5 ? tel.slice(0, 5) + "****" : tel;
      row("Numéro Mobile Money", masked, y, true);
      y += 9;
    }
    if (isCard && entry.derniers_4_chiffres) {
      row("Numéro de carte", `**** **** **** ${entry.derniers_4_chiffres}`, y, true);
      y += 9;
    }

    hr(y);
    y += 10;
  }

  // LEGAL NOTICE
  doc.setFillColor(...C.bgGray);
  doc.roundedRect(L, y, cW, 30, 3, 3, "F");

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.dark);
  doc.text("Conformité, rôles des partenaires & protection des fonds", L + 4, y + 7);

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...C.mid);
  const legal = "Néré Health est un service logiciel de santé numérique. Les paiements sont traités par nos partenaires agréés. Ce reçu constitue la preuve officielle de votre transaction. Pour toute réclamation : support@nere-health.com";
  const legalLines = doc.splitTextToSize(legal, cW - 8);
  doc.text(legalLines, L + 4, y + 13);

  // FOOTER
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...C.light);
  doc.text(
    `Généré le ${new Date().toLocaleDateString("fr-FR", { timeZone: getUserTimezone() })} — Néré Health`,
    pageW / 2, 287, { align: "center" }
  );

  doc.save(`Nere-Health-recu-patient-${refId}.pdf`);
};

/**
 * 2. Reçu PDF Médecin - Consultation d'un Patient (Katika Design)
 * Sender: Patient
 * Recipient: Dr. [Nom du Médecin]
 * Service: Consultation médicale
 */
export const generateDoctorConsultationReceiptPDF = async (payment, doctorName) => {
  if (!isPaidStatus(payment.status || payment.statut)) return;

  const { default: jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  const pageW = 210;
  const L = 20;
  const R = pageW - 20;
  const cW = R - L;

  const C = {
    primary: [26, 86, 219],
    dark: [17, 24, 39],
    mid: [75, 85, 99],
    light: [156, 163, 175],
    border: [209, 213, 219],
    green: [5, 150, 105],
    bgGray: [249, 250, 251],
  };

  const hr = (y) => {
    doc.setDrawColor(...C.border);
    doc.setLineWidth(0.25);
    doc.line(L, y, R, y);
  };

  const refId = payment.matricule || payment.reference || `TRF-RDV-${(payment.id || "").replace(/-/g, "").slice(0, 12).toUpperCase()}`;
  const amountStr = typeof payment.amount === "string" ? payment.amount : `${fmtNum(payment.amountRaw || payment.amount)} ${payment.devise || "XAF"}`;
  const methode = getMethodLabel(payment.method || payment.methode);

  // HEADER
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.primary);
  doc.text("Néré Health", L, 16);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...C.light);
  doc.text("Reçu d'encaissement de consultation", L, 22);

  doc.text("nere-health.com", R, 16, { align: "right" });
  doc.text("Douala, Cameroun", R, 22, { align: "right" });

  let y = 32;
  hr(y);
  y += 10;

  // TITLE & AMOUNT
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...C.dark);
  doc.text("Reçu", L, y);
  y += 12;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.setTextColor(...C.dark);
  doc.text(amountStr, L, y);
  y += 12;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...C.mid);
  const methodePart = `${methode}  •  `;
  doc.text(methodePart, L, y);
  const mW = doc.getTextWidth(methodePart);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.green);
  doc.text("Payé", L + mW, y);
  y += 10;

  hr(y);
  y += 10;

  // DETAILS & SUMMARY
  doc.setFontSize(9.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.dark);
  doc.text("Détails de la transaction", L, y);
  doc.text("Résumé du montant", R, y, { align: "right" });
  y += 3;
  hr(y);
  y += 8;

  const midX = pageW / 2 - 4;
  const mid2X = pageW / 2 + 4;

  const rowL = (label, value, yy, bold = false) => {
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...C.mid);
    doc.text(label, L, yy);
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setTextColor(...C.dark);
    doc.text(String(value || "—"), midX, yy, { align: "right" });
  };
  const rowR = (label, value, yy, bold = false) => {
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...C.mid);
    doc.text(label, mid2X, yy);
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setTextColor(...C.dark);
    doc.text(String(value || "—"), R, yy, { align: "right" });
  };

  const startY = y;
  rowL("Transaction ID", payment.matricule || payment.id || "—", y, true); y += 7;
  rowL("Date", payment.date || "—", y); y += 7;
  rowL("Service", stripEmoji(payment.service || "Consultation médicale"), y); y += 7;
  rowL("Méthode", methode, y); y += 7;
  rowL("Statut", "Payé", y, true);

  let yR = startY;
  rowR("Montant", amountStr, yR, true); yR += 7;
  rowR("Référence", payment.matricule || "—", yR, true);

  y = Math.max(y, yR) + 10;
  hr(y);
  y += 10;

  // PARTIES
  doc.setFontSize(9.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.dark);
  doc.text("Parties", L, y);
  y += 3;
  hr(y);
  y += 8;

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...C.light);
  doc.text("Expéditeur (Patient)", L, y);
  doc.text("Destinataire (Médecin)", mid2X, y);
  y += 6;

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.dark);
  const senderLines = doc.splitTextToSize(payment.patient || "Patient", midX - L - 2);
  doc.text(senderLines, L, y);
  const docLines = doc.splitTextToSize(doctorName || "Médecin", R - mid2X);
  doc.text(docLines, mid2X, y);
  y += Math.max(senderLines.length, docLines.length) * 5.5;

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...C.mid);
  if (payment.patientCode) {
    doc.text(`N° Patient : ${payment.patientCode}`, L, y);
  }
  doc.text("Praticien de santé — Néré Health", mid2X, y);
  y += 12;

  hr(y);
  y += 10;

  // LEGAL NOTICE
  doc.setFillColor(...C.bgGray);
  doc.roundedRect(L, y, cW, 28, 3, 3, "F");

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.dark);
  doc.text("Conformité et encaissement", L + 4, y + 7);

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...C.mid);
  const legal = "Ce reçu d'encaissement est généré par Néré Health pour le compte du praticien. Il confirme le règlement de la consultation par le patient sur la plateforme.";
  const legalLines = doc.splitTextToSize(legal, cW - 8);
  doc.text(legalLines, L + 4, y + 13);

  // FOOTER
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...C.light);
  doc.text(
    `Généré le ${new Date().toLocaleDateString("fr-FR", { timeZone: getUserTimezone() })} — Néré Health`,
    pageW / 2, 287, { align: "center" }
  );

  doc.save(`Nere-Health-recu-consultation-${refId}.pdf`);
};

/**
 * 3. Reçu PDF Médecin - Retrait d'Honoraires (Katika Design)
 * Sender: Néré Health
 * Recipient: Dr. [Nom du Médecin]
 * Service: Retrait d'honoraires médicales
 * Details: Numéro Mobile Money / Carte / IBAN du médecin lors du retrait
 */
export const generateDoctorWithdrawalReceiptPDF = async (retrait, doctorName, configuredMethods = []) => {
  const s = (retrait.statut || "").toLowerCase();
  if (s !== "effectue" && s !== "valide" && s !== "effectué" && s !== "validé") return;

  const { default: jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  const pageW = 210;
  const L = 20;
  const R = pageW - 20;
  const cW = R - L;

  const C = {
    primary: [26, 86, 219],
    dark: [17, 24, 39],
    mid: [75, 85, 99],
    light: [156, 163, 175],
    border: [209, 213, 219],
    green: [5, 150, 105],
    bgGray: [249, 250, 251],
  };

  const hr = (y) => {
    doc.setDrawColor(...C.border);
    doc.setLineWidth(0.25);
    doc.line(L, y, R, y);
  };

  const row = (label, value, y, bold = false) => {
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...C.mid);
    doc.text(label, L, y);
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setTextColor(...C.dark);
    doc.text(String(value || "—"), R, y, { align: "right" });
  };

  const montantRaw = retrait.montant || 0;
  const amountStr = `${fmtNum(montantRaw)} ${retrait.devise || "XAF"}`;
  const methode = getMethodLabel(retrait.methode);

  const isMobile = retrait.methode === "mtn_momo" || retrait.methode === "orange_money" || retrait.methode === "momo" || retrait.methode === "orange";
  const isCard = (retrait.methode || "").toLowerCase().includes("carte") || (retrait.methode || "").toLowerCase().includes("bank");

  const dateObj = retrait.created_at ? new Date(retrait.created_at) : null;
  const dateStr = dateObj
    ? dateObj.toLocaleDateString("fr-FR", { timeZone: getUserTimezone(), day: "2-digit", month: "2-digit", year: "numeric" }) +
    ", " +
    dateObj.toLocaleTimeString("fr-FR", { timeZone: getUserTimezone(), hour: "2-digit", minute: "2-digit" }) +
    " UTC"
    : "—";

  // HEADER
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.primary);
  doc.text("Néré Health", L, 16);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...C.light);
  doc.text("Reçu de retrait d'honoraires", L, 22);

  doc.text("nere-health.com", R, 16, { align: "right" });
  doc.text("Douala, Cameroun", R, 22, { align: "right" });

  let y = 32;
  hr(y);
  y += 10;

  // TITLE & AMOUNT
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...C.dark);
  doc.text("Reçu de versement", L, y);
  y += 12;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.setTextColor(...C.dark);
  doc.text(amountStr, L, y);
  y += 12;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...C.mid);
  const methodePart = `${methode}  •  `;
  doc.text(methodePart, L, y);
  const mW = doc.getTextWidth(methodePart);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.green);
  doc.text("Effectué", L + mW, y);
  y += 10;

  hr(y);
  y += 10;

  // TRANSACTION DETAILS & AMOUNT SUMMARY
  doc.setFontSize(9.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.dark);
  doc.text("Détails de la transaction", L, y);
  doc.text("Résumé du montant", R, y, { align: "right" });
  y += 3;
  hr(y);
  y += 8;

  const midX = pageW / 2 - 4;
  const mid2X = pageW / 2 + 4;

  const rowL = (label, value, yy, bold = false) => {
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...C.mid);
    doc.text(label, L, yy);
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setTextColor(...C.dark);
    doc.text(String(value || "—"), midX, yy, { align: "right" });
  };
  const rowR = (label, value, yy, bold = false) => {
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...C.mid);
    doc.text(label, mid2X, yy);
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setTextColor(...C.dark);
    doc.text(String(value || "—"), R, yy, { align: "right" });
  };

  let rawAccount = retrait.compte || retrait.telephone || retrait.accountNumber || "";

  if (!rawAccount && Array.isArray(configuredMethods) && configuredMethods.length > 0) {
    const mType = (retrait.methode || "").toLowerCase();
    const matched = configuredMethods.find((m) => {
      const t = (m.type || "").toLowerCase();
      if (mType.includes("momo") || mType.includes("mtn")) return t.includes("momo") || t.includes("mtn");
      if (mType.includes("orange")) return t.includes("orange");
      if (mType.includes("bank") || mType.includes("virement")) return t.includes("bank") || t.includes("virement");
      return t === mType;
    });
    if (matched) {
      rawAccount = matched.accountNumber || matched.accountName || "";
    }
  }

  let doctorAccountDetail = "";
  if (rawAccount) {
    const str = String(rawAccount).trim();
    doctorAccountDetail = str.length >= 5 ? str.slice(0, 5) + "****" : str;
  } else {
    doctorAccountDetail = "69471****";
  }

  // Format clean reference ID
  const refId = retrait.reference || `TRF-RET-${(retrait.id || "").replace(/-/g, "").slice(0, 12).toUpperCase()}`;

  const startY = y;
  rowL("Transaction ID", refId, y, true); y += 7;
  rowL("Date", dateStr, y); y += 7;
  rowL("Service", "Retrait d'honoraires Néré Health", y); y += 7;
  rowL("Méthode", methode, y); y += 7;
  rowL("Statut", "Effectué", y, true);

  let yR = startY;
  rowR("Montant", amountStr, yR, true); yR += 7;
  rowR("Référence", refId, yR, true);

  y = Math.max(y, yR) + 10;
  hr(y);
  y += 10;

  // PARTIES
  doc.setFontSize(9.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.dark);
  doc.text("Parties", L, y);
  y += 3;
  hr(y);
  y += 8;

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...C.light);
  doc.text("Expéditeur", L, y);
  doc.text("Destinataire", mid2X, y);
  y += 6;

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.dark);
  doc.text("NÉRÉ HEALTH", L, y);
  const docLines = doc.splitTextToSize(doctorName || "Médecin", R - mid2X);
  doc.text(docLines, mid2X, y);
  y += docLines.length * 5.5;

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...C.mid);
  doc.text("Plateforme de santé numérique", L, y);
  doc.text(doctorAccountDetail, mid2X, y);
  y += 12;

  hr(y);
  y += 10;

  // MOBILE MONEY / BANK DETAILS (Always visible)
  doc.setFontSize(9.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.primary);
  doc.text(isMobile ? "DÉTAILS MOBILE MONEY DU RETRAIT" : "DÉTAILS DE RÉCEPTION DU RETRAIT", L, y);
  y += 3;
  hr(y);
  y += 8;

  row(isMobile ? "Numéro Mobile Money du médecin" : "Compte de versement du médecin", doctorAccountDetail, y, true);
  y += 9;

  hr(y);
  y += 10;

  // LEGAL NOTICE
  doc.setFillColor(...C.bgGray);
  doc.roundedRect(L, y, cW, 30, 3, 3, "F");

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.dark);
  doc.text("Conformité, versement & protection des fonds", L + 4, y + 7);

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...C.mid);
  const legal = "Ce reçu de versement atteste du transfert effectif des honoraires médicales depuis la plateforme Néré Health vers le compte renseigné par le praticien. Pour toute assistance : support@nere-health.com";
  const legalLines = doc.splitTextToSize(legal, cW - 8);
  doc.text(legalLines, L + 4, y + 13);

  // FOOTER
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...C.light);
  doc.text(
    `Généré le ${new Date().toLocaleDateString("fr-FR", { timeZone: getUserTimezone() })} — Néré Health`,
    pageW / 2, 287, { align: "center" }
  );

  doc.save(`Nere-Health-recu-retrait-${refId}.pdf`);
};

/**
 * 4. Reçu PDF Médecin - Séquestre Avis Médical
 * Sender: Médecin (a payé la caution)
 * Recipient: Néré Health (plateforme qui retient les fonds)
 */
export const generateSequestreReceiptPDF = async (payment, doctorName) => {
  const s = (payment.status || payment.statut || "").toLowerCase();
  const isOk = ["confirme", "paid", "valide_manuellement", "payé", "paye", "valide", "effectué", "effectue"].includes(s);
  if (!isOk) return;

  const { default: jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  const pageW = 210;
  const L = 20;
  const R = pageW - 20;
  const cW = R - L;

  const C = {
    primary: [26, 86, 219],
    dark: [17, 24, 39],
    mid: [75, 85, 99],
    light: [156, 163, 175],
    border: [209, 213, 219],
    green: [5, 150, 105],
    amber: [180, 130, 20],
    bgGray: [249, 250, 251],
  };

  const hr = (y) => {
    doc.setDrawColor(...C.border);
    doc.setLineWidth(0.25);
    doc.line(L, y, R, y);
  };

  const row = (label, value, y, bold = false) => {
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...C.mid);
    doc.text(label, L, y);
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setTextColor(...C.dark);
    doc.text(String(value || "—"), R, y, { align: "right" });
  };

  const refId = payment.matricule || payment.reference || `SEQ-${(payment.id || "").replace(/-/g, "").slice(0, 12).toUpperCase()}`;
  const amountStr = typeof payment.amount === "string" ? payment.amount : `${fmtNum(payment.amountRaw || payment.amount)} ${payment.devise || "XAF"}`;
  const methode = getMethodLabel(payment.method || payment.methode);

  const dateObj = payment.created_at ? new Date(payment.created_at) : null;
  const dateStr = dateObj
    ? dateObj.toLocaleDateString("fr-FR", { timeZone: getUserTimezone(), day: "2-digit", month: "2-digit", year: "numeric" }) +
      ", " +
      dateObj.toLocaleTimeString("fr-FR", { timeZone: getUserTimezone(), hour: "2-digit", minute: "2-digit" }) +
      " UTC"
    : "—";

  // HEADER
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.primary);
  doc.text("Néré Health", L, 16);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...C.light);
  doc.text("Reçu de paiement séquestre", L, 22);

  doc.text("nere-health.com", R, 16, { align: "right" });
  doc.text("Douala, Cameroun", R, 22, { align: "right" });

  let y = 32;
  hr(y);
  y += 10;

  // TITLE
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...C.dark);
  doc.text("Paiement envoyé", L, y);
  y += 12;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.setTextColor(...C.dark);
  doc.text(amountStr, L, y);
  y += 12;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...C.mid);
  const methodePart = `${methode}  •  `;
  doc.text(methodePart, L, y);
  const mW = doc.getTextWidth(methodePart);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.amber);
  doc.text("Séquestre", L + mW, y);
  y += 10;

  hr(y);
  y += 10;

  // DETAILS
  doc.setFontSize(9.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.dark);
  doc.text("Détails de la transaction", L, y);
  doc.text("Résumé du montant", R, y, { align: "right" });
  y += 3;
  hr(y);
  y += 8;

  const midX = pageW / 2 - 4;
  const mid2X = pageW / 2 + 4;

  const rowL = (label, value, yy, bold = false) => {
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...C.mid);
    doc.text(label, L, yy);
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setTextColor(...C.dark);
    doc.text(String(value || "—"), midX, yy, { align: "right" });
  };
  const rowR = (label, value, yy, bold = false) => {
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...C.mid);
    doc.text(label, mid2X, yy);
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setTextColor(...C.dark);
    doc.text(String(value || "—"), R, yy, { align: "right" });
  };

  const startY = y;
  rowL("Transaction ID", refId, y, true); y += 7;
  rowL("Date", dateStr, y); y += 7;
  rowL("Service", "Séquestre avis médical", y); y += 7;
  rowL("Méthode", methode, y); y += 7;
  rowL("Statut", "Séquestré", y, true);

  let yR = startY;
  rowR("Montant", amountStr, yR, true); yR += 7;
  rowR("Référence", payment.matricule || "—", yR, true);

  y = Math.max(y, yR) + 10;
  hr(y);
  y += 10;

  // PARTIES — Doctor is sender, Nere Health is recipient
  doc.setFontSize(9.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.dark);
  doc.text("Parties", L, y);
  y += 3;
  hr(y);
  y += 8;

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...C.light);
  doc.text("Expéditeur (Médecin)", L, y);
  doc.text("Destinataire", mid2X, y);
  y += 6;

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.dark);
  const senderLines = doc.splitTextToSize(doctorName || "Médecin", midX - L - 2);
  doc.text(senderLines, L, y);
  doc.text("NÉRÉ HEALTH", mid2X, y);
  y += senderLines.length * 5.5;

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...C.mid);
  doc.text("Médecin inscrit — Néré Health", L, y);
  doc.text("Plateforme de santé numérique", mid2X, y);
  y += 12;

  hr(y);
  y += 10;

  // LEGAL
  doc.setFillColor(...C.bgGray);
  doc.roundedRect(L, y, cW, 30, 3, 3, "F");

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.dark);
  doc.text("Conformité et séquestre", L + 4, y + 7);

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...C.mid);
  const legal = "Ce reçu confirme le versement de la caution de séquestre par le médecin à la plateforme Néré Health. Les fonds sont retenus en garantie jusqu'à la clôture de l'avis médical. Pour toute réclamation : support@nere-health.com";
  const legalLines = doc.splitTextToSize(legal, cW - 8);
  doc.text(legalLines, L + 4, y + 13);

  // FOOTER
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...C.light);
  doc.text(
    `Généré le ${new Date().toLocaleDateString("fr-FR", { timeZone: getUserTimezone() })} — Néré Health`,
    pageW / 2, 287, { align: "center" }
  );

  doc.save(`Nere-Health-sequestre-${refId}.pdf`);
};
