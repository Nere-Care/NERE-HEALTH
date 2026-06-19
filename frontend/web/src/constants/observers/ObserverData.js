/**
 * Données mock pour les dashboards observateurs
 * Toutes les données sont pré-anonymisées
 */

export const mockGlobalStats = {
  totalPatients: 1245000,
  activeProfessionals: 4850,
  activeStructures: 245,
  criticalAlerts: 34,
  vaccinationRate: "78%",
  lastUpdate: new Date().toLocaleDateString("fr-FR"),
};

export const mockAnonPatients = {
  consultations: Array.from({ length: 12 }, (_, i) => ({
    month: ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Aoû", "Sep", "Oct", "Nov", "Déc"][i],
    count: Math.floor(Math.random() * 15000) + 8000,
  })),
  ageGroups: [
    { range: "0-17", percentage: 22 },
    { range: "18-35", percentage: 38 },
    { range: "36-59", percentage: 28 },
    { range: "60+", percentage: 12 },
  ],
  satisfaction: {
    verySatisfied: 45,
    satisfied: 38,
    neutral: 12,
    dissatisfied: 5,
  },
};

export const mockAnonProfessionals = {
  bySpecialty: [
    { specialty: "Médecine G***", count: 1840 },
    { specialty: "Pédiatrie", count: 620 },
    { specialty: "Chirurgie", count: 480 },
    { specialty: "Gynécologie", count: 390 },
    { specialty: "Autres", count: 1520 },
  ],
  experience: {
    "<5 ans": 28,
    "5-10 ans": 35,
    "10-20 ans": 25,
    ">20 ans": 12,
  },
  workload: {
    "<20h": 15,
    "20-40h": 52,
    "40-60h": 28,
    ">60h": 5,
  },
};

export const mockAnonStructures = {
  byType: [
    { type: "Hôpital public", count: 85, capacity: 12500 },
    { type: "Clinique privée", count: 62, capacity: 4200 },
    { type: "CHU", count: 28, capacity: 8900 },
    { type: "Centre de santé", count: 145, capacity: 2100 },
  ],
  byRegion: [
    { region: "L***", structures: 78, capacity: 4200 },
    { region: "C***", structures: 65, capacity: 3100 },
    { region: "N***", structures: 42, capacity: 1800 },
    { region: "O***", structures: 35, capacity: 1200 },
    { region: "S***", structures: 25, capacity: 900 },
  ],
  equipment: {
    full: 45,
    partial: 38,
    minimal: 17,
  },
};