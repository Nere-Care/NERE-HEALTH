export const invoiceData = {
  patient: "John Doe",
  service: "Second Medical Opinion",
  requestedBy: "Dr. Emma Wilson",
  specialist: "Dr. Michael Smith",
  specialty: "Cardiology",
  amount: 15000,
  currency: "XAF",
  createdAt: "2026-04-22",
  status: "unpaid",
};

export const paymentsHistory = [
  {
    id: 1,
    method: "Card",
    amount: 15000,
    status: "paid",
    date: "2026-04-20",
    service: "Second Opinion",
    reference: "PAY-2026-001",
  },
  {
    id: 2,
    method: "Mobile Money",
    amount: 10000,
    status: "pending",
    date: "2026-04-18",
    service: "Expert Review",
    reference: "PAY-2026-002",
  },
  {
    id: 3,
    method: "Wallet",
    amount: 20000,
    status: "failed",
    date: "2026-04-15",
    service: "Specialist Validation",
    reference: "PAY-2026-003",
  },
  {
    id: 4,
    method: "Card",
    amount: 15000,
    status: "paid",
    date: "2026-04-20",
    service: "Second Opinion",
    reference: "PAY-2026-001",
  },
  {
    id: 5,
    method: "Mobile Money",
    amount: 10000,
    status: "pending",
    date: "2026-04-18",
    service: "Expert Review",
    reference: "PAY-2026-002",
  },
  {
    id: 6,
    method: "Wallet",
    amount: 20000,
    status: "failed",
    date: "2026-04-15",
    service: "Specialist Validation",
    reference: "PAY-2026-003",
  },
];

export const paymentMethods = [
  { key: "card", label: "Card", icon: "CreditCard" },
  { key: "mobile", label: "Mobile Money", icon: "Smartphone" },
  { key: "wallet", label: "Wallet", icon: "Banknote" },
];