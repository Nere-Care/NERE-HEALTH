import {
  CalendarDays,
  CheckCircle,
  Wallet,
  Smile,
} from "lucide-react";

export const stats = [
  {
    title: "Consultations à venir",
    value: 10,
    subtitle: "Aujourd’hui",
    growth: "+5%",
    icon: CalendarDays,
    color: "green",
  },
  {
    title: "Consultations terminées",
    value: 14,
    subtitle: "Aujourd’hui",
    growth: "+8%",
    icon: CheckCircle,
    color: "blue",
  },
  {
    title: "Revenu journalier",
    value: "85 000 FCFA",
    subtitle: "Aujourd’hui",
    growth: "+12%",
    icon: Wallet,
    color: "purple",
  },
  {
    title: "Satisfaction patients",
    value: "96%",
    subtitle: "Moyenne globale",
    growth: "+2%",
    icon: Smile,
    color: "orange",
  },
];

export const revenueData = [
  { day: "Mon", amount: 12000 },
  { day: "Tue", amount: 18000 },
  { day: "Wed", amount: 15000 },
  { day: "Thu", amount: 25000 },
  { day: "Fri", amount: 30000 },
  { day: "Sat", amount: 22000 },
  { day: "Sun", amount: 10000 },
];

export const consultationsData = [
  { month: "Jan", total: 80 },
  { month: "Feb", total: 95 },
  { month: "Mar", total: 120 },
  { month: "Apr", total: 140 },
];

export const specialtyData = [
  { name: "Cardiology", value: 40 },
  { name: "Dermatology", value: 25 },
  { name: "Pediatrics", value: 20 },
  { name: "General", value: 15 },
];

export const appointments = [
  {
    time: "08:30",
    patient: "John Doe",
    type: "Consultation",
    clinic: "Central Hospital Yaoundé",
    reason: "General check-up",
  },
  
  {
    time: "10:00",
    patient: "Alice Smith",
    type: "Follow-up",
    clinic: "Clinique du Centre",
    reason: "Diabetes monitoring",
  },
  {
    time: "14:00",
    patient: "Robert King",
    type: "Teleconsultation",
    clinic: "Online",
    reason: "Skin infection",
  },
  {
    time: "14:00",
    patient: "Robert King",
    type: "Teleconsultation",
    clinic: "Online",
    reason: "Skin infection",
  },
];

export const patients = [
  { name: "Marie Claire", age: 32 },
  { name: "Paul Njoya", age: 54 },
  { name: "Kevin Momo", age: 26 },
   { name: "Marie Claire", age: 32 },
  { name: "Paul Njoya", age: 54 },
  { name: "Kevin Momo", age: 26 },
];

export const notifications = [
  "3 new lab results available",
  "2 appointments confirmed",
  "1 pending payment",
  "3 new lab results available",
  "2 appointments confirmed",
  "1 pending payment",
];

export const news = [
  {
    id: 1,
    title: "System Update",
    description:
      "New teleconsultation features and performance improvements.",
    type: "update",
    date: "Today",

    fullContent: `
System Update Details

The platform now includes:

• Faster dashboard loading.
• Improved teleconsultation stability.
• Better video and audio quality.
• Real-time appointment synchronization.
• Enhanced mobile responsiveness.
• Improved dark mode support.

Bug Fixes:
- Notification synchronization issues fixed.
- Payment confirmation delays resolved.
- Appointment duplication issue corrected.

Performance has been significantly optimized for both doctors and patients.
    `,
  },

  {
    id: 2,
    title: "Privacy Policy Update",
    description:
      "Changes in data protection and patient confidentiality.",
    type: "policy",
    date: "2 days ago",

    fullContent: `
Privacy Policy Update

We have updated our healthcare privacy and patient confidentiality policy.

Main changes include:

• Enhanced encryption for patient records.
• Better access control for healthcare professionals.
• Improved teleconsultation data protection.
• Secure storage of prescriptions and medical history.
• Compliance with international healthcare privacy standards.

Patients now have:
- More transparency on data usage.
- Better control over shared medical information.
- Improved security for online consultations.

Healthcare professionals are advised to review the new policy carefully before continuing platform usage.
    `,
  },

  {
    id: 3,
    title: "Payment System",
    description:
      "Stripe payments are now fully integrated.",
    type: "payment",
    date: "1 week ago",

    fullContent: `
Payment System Update

Stripe payment integration is now fully active.

Features available:
• Online card payments.
• Secure transaction validation.
• Automatic invoice generation.
• Appointment payment tracking.
• Real-time payment notifications.

Supported payments:
- Visa
- Mastercard
- Mobile payment integrations

Security improvements:
• PCI-compliant processing.
• Secure encryption.
• Fraud monitoring system enabled.
    `,
  },
];