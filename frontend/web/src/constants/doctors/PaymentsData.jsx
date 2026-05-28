export const paymentStats = [
  {
    id: 1,
    title: "Withdrawn Amount",
    amount: "450 000 XAF",
  },
  {
    id: 2,
    title: "Ready To Withdraw",
    amount: "120 000 XAF",
  },
  {
    id: 3,
    title: "Settlements",
    amount: "80 000 XAF",
  },
];

// Dans PaymentsData.js
export const patientPayments = [
  {
    id: 1,
    matricule: "PAT-0001", // ✅ Ajouté
    patient: "Marie Ndzi",
    service: "Teleconsultation",
    amount: "25 000 XAF",
    method: "MTN MoMo",
    date: "12 May 2026",
    status: "Paid", // ✅ Peut être: Paid, Pending, Failed, Refunded
    receipt: "/receipts/receipt1.pdf",
  },
  {
    id: 2,
    matricule: "PAT-0002",
    patient: "John Doe",
    service: "Cardiology Consultation",
    amount: "40 000 XAF",
    method: "Orange Money",
    date: "10 May 2026",
    status: "Paid",
    receipt: "/receipts/receipt2.pdf",
  },
  {
    id: 3,
    matricule: "PAT-0003",
    patient: "Sarah Williams",
    service: "Neurology Follow-up",
    amount: "30 000 XAF",
    method: "Bank Card",
    date: "08 May 2026",
    status: "Pending",
    receipt: "/receipts/receipt3.pdf",
  },
  // ... autres paiements
];

// ✅ DOCTOR PAYMENTS - Mise à jour avec matricule, recipient et status
export const doctorPayments = [
  {
    matricule: "PAY-2026-001",
    recipient: "Dr. Ntone",
    service: "Specialist Opinion",
    amount: "15 000 XAF",
    method: "Orange Money",
    date: "11 May 2026",
    status: "Completed",
    receipt: "/receipts/doc_receipt1.pdf",
  },
  {
    matricule: "PAY-2026-002",
    recipient: "Dr. Manga",
    service: "Neurology Consultation",
    amount: "30 000 XAF",
    method: "MTN MoMo",
    date: "09 May 2026",
    status: "Completed",
    receipt: "/receipts/doc_receipt2.pdf",
  },
  {
    matricule: "PAY-2026-003",
    recipient: "Dr. Yakam",
    service: "Cardiology Expertise",
    amount: "45 000 XAF",
    method: "Bank Transfer",
    date: "05 May 2026",
    status: "Pending",
    receipt: "/receipts/doc_receipt3.pdf",
  },
  {
    matricule: "PAY-2026-004",
    recipient: "Dr. Atangana",
    service: "General Consultation",
    amount: "20 000 XAF",
    method: "MTN MoMo",
    date: "03 May 2026",
    status: "Completed",
    receipt: "/receipts/doc_receipt4.pdf",
  },
  {
    matricule: "PAY-2026-005",
    recipient: "Dr. Mbarga",
    service: "Pediatrics Follow-up",
    amount: "18 000 XAF",
    method: "Orange Money",
    date: "01 May 2026",
    status: "Failed",
    receipt: "/receipts/doc_receipt5.pdf",
  },
];