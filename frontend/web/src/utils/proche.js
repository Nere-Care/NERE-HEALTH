export function getRelativeBeneficiary(rdv) {
  if (!rdv) return null;
  if (rdv.notes_patient && rdv.notes_patient.includes("Bénéficiaire")) {
    const match = rdv.notes_patient.match(/Bénéficiaire(?:\s*du\s*RDV)?\s*:\s*([^\n\r]+)/i);
    if (match) return match[1].trim();
  }
  if (rdv.motif_consultation && rdv.motif_consultation.startsWith("[Pour ")) {
    const match = rdv.motif_consultation.match(/^\[Pour\s+([^\]]+)\]/i);
    if (match) return match[1].trim();
  }
  return null;
}
