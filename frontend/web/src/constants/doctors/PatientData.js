import patient1 from "../../assets/images/laure.jpg";
import patient2 from "../../assets/images/michael.jpg";
import patient3 from "../../assets/images/sarah.jpg";
import patient4 from "../../assets/images/sarah.jpg";

export const patients = [
  {
    id: 1,
    patientId: "#234RTTU",
    name: "Emma Johnson",
    age: 29,
    gender: "Female",
    bloodType: "A+",
    lastVisit: "12 Apr 2026",
    isPregnant: true, // 🤰 Flag pour activer le suivi grossesse
    image: patient1,

    // 🫀 Antécédents médicaux
    antecedents: [
      {
        id: 1,
        type: "Maladie",
        nom: "Asthme léger",
        date: "2018",
        statut: "chronique"
      },
      {
        id: 2,
        type: "Chirurgie",
        nom: "Appendicectomie",
        date: "2015",
        statut: "guéri"
      }
    ],

    // 🍎 Habitudes de vie
    habitudes: {
      alimentation: "Équilibrée, riche en fruits et légumes",
      tabac: "Non",
      alcool: "Occasionnel (1-2 verres/semaine)",
      activitePhysique: "Yoga 2x/semaine",
      sommeil: "7-8h/nuit",
      allergies: ["Arachides", "Pollen"]
    },

    // 💉 Vaccins
    vaccins: [
      {
        id: 1,
        nom: "COVID-19 (3ème dose)",
        date: "2023-03-15",
        rappel: "2024-03-15",
        statut: "à_jour"
      },
      {
        id: 2,
        nom: "Grippe saisonnière",
        date: "2023-10-20",
        rappel: "2024-10-20",
        statut: "à_jour"
      },
      {
        id: 3,
        nom: "Tétanos",
        date: "2020-05-10",
        rappel: "2025-05-10",
        statut: "à_jour"
      },
      {
        id: 4,
        nom: "Hépatite B",
        date: "2015-01-15",
        rappel: null,
        statut: "complet"
      },
      {
        id: 5,
        nom: "Rougeole-Oreillons-Rubéole",
        date: "2010-06-20",
        rappel: null,
        statut: "complet"
      }
    ],

    // 🤰 Suivi de grossesse (car isPregnant: true)
    suiviGrossesse: {
      semainesAmenorrhee: 24,
      termePrévu: "2026-09-15",
      nombreVisites: 4,
      prochaineVisite: "2026-06-20",
      poids: 68,
      tension: "12/8",
      groupeSanguin: "A+",
      observations: "Grossesse évolutive sans complication. Échographie T2 prévue. Suppléments de fer et acide folique prescrits."
    },

    consultations: [
      {
        id: 1,
        type: "Consultation",
        reason: "General Checkup",
        doctor: "Michael Brown",
        date: "12 Apr 2026",
        time: "09:30",
        diagnosis: "Healthy condition",
        treatment: "Routine vitamins",
        notes: "Patient in good health. Pregnancy monitoring ongoing.",

        prescriptions: [
          {
            id: 1,
            name: "Vitamin C",
            dosage: "500mg",
            frequency: "1x/day",
            duration: "14 days"
          },
          {
            id: 2,
            name: "Acide folique",
            dosage: "0.4mg",
            frequency: "1x/day",
            duration: "30 days"
          }
        ],

        labResults: [
          {
            id: 1,
            title: "Blood Test.pdf",
            fileUrl: "/files/blood-test.pdf"
          }
        ]
      },

      {
        id: 2,
        type: "Consultation",
        reason: "Headache",
        doctor: "Sarah Wilson",
        date: "18 Jan 2026",
        time: "11:00",
        diagnosis: "Migraine",
        treatment: "Pain relief medication",
        notes: "Reduce screen exposure. Safe for pregnancy.",

        prescriptions: [
          {
            id: 1,
            name: "Paracetamol",
            dosage: "500mg",
            frequency: "2x/day",
            duration: "5 days"
          }
        ],

        labResults: []
      },

      {
        id: 3,
        type: "Consultation",
        reason: "Back Pain",
        doctor: "Michael Brown",
        date: "02 Feb 2026",
        time: "10:15",
        diagnosis: "Muscle strain",
        treatment: "Physiotherapy",
        notes: "Avoid heavy lifting. Pregnancy-related back pain.",

        prescriptions: [],
        labResults: []
      },

      {
        id: 4,
        type: "Consultation",
        reason: "Flu",
        doctor: "Sarah Wilson",
        date: "20 Feb 2026",
        time: "08:45",
        diagnosis: "Seasonal flu",
        treatment: "Rest + fluids",
        notes: "Hydration recommended. Safe medication prescribed.",

        prescriptions: [
          {
            id: 1,
            name: "Paracetamol",
            dosage: "500mg",
            frequency: "3x/day",
            duration: "5 days"
          }
        ],

        labResults: []
      }
    ]
  },

  {
    id: 2,
    patientId: "#987LKPO",
    name: "Daniel Smith",
    age: 41,
    gender: "Male",
    bloodType: "O+",
    lastVisit: "05 Apr 2026",
    image: patient2,

    // 🫀 Antécédents médicaux
    antecedents: [
      {
        id: 1,
        type: "Maladie",
        nom: "Hypertension artérielle",
        date: "2020",
        statut: "chronique"
      },
      {
        id: 2,
        type: "Maladie",
        nom: "Hypercholestérolémie",
        date: "2021",
        statut: "chronique"
      },
      {
        id: 3,
        type: "Chirurgie",
        nom: "Hernie discale L4-L5",
        date: "2018",
        statut: "guéri"
      }
    ],

    // 🍎 Habitudes de vie
    habitudes: {
      alimentation: "Riche en sel, à améliorer",
      tabac: "Ex-fumeur (arrêté en 2020)",
      alcool: "Modéré (3-4 verres/semaine)",
      activitePhysique: "Sédentaire",
      sommeil: "6h/nuit, qualité moyenne",
      allergies: []
    },

    // 💉 Vaccins
    vaccins: [
      {
        id: 1,
        nom: "COVID-19 (3ème dose)",
        date: "2023-02-10",
        rappel: "2024-02-10",
        statut: "à_jour"
      },
      {
        id: 2,
        nom: "Grippe saisonnière",
        date: "2023-10-15",
        rappel: "2024-10-15",
        statut: "à_jour"
      },
      {
        id: 3,
        nom: "Tétanos",
        date: "2018-05-10",
        rappel: "2023-05-10",
        statut: "en_retard"
      },
      {
        id: 4,
        nom: "Hépatite B",
        date: "2010-01-15",
        rappel: null,
        statut: "complet"
      }
    ],

    consultations: [
      {
        id: 1,
        type: "Consultation",
        reason: "Chest Pain",
        doctor: "James Carter",
        date: "05 Apr 2026",
        time: "14:15",
        diagnosis: "Mild stress symptoms",
        treatment: "Rest + ECG requested",
        notes: "No severe abnormality detected. Stress management recommended.",

        prescriptions: [
          {
            id: 1,
            name: "Aspirin",
            dosage: "100mg",
            frequency: "1x/day",
            duration: "7 days"
          }
        ],

        labResults: [
          {
            id: 1,
            title: "ECG Result.pdf",
            fileUrl: "/files/ecg.pdf"
          }
        ]
      },

      {
        id: 2,
        type: "Consultation",
        reason: "Hypertension Follow-up",
        doctor: "Michael Brown",
        date: "10 Mar 2026",
        time: "09:00",
        diagnosis: "High blood pressure",
        treatment: "Diet control + medication",
        notes: "Reduce salt intake. Monitor blood pressure daily.",

        prescriptions: [
          {
            id: 1,
            name: "Amlodipine",
            dosage: "5mg",
            frequency: "1x/day",
            duration: "30 days"
          }
        ],

        labResults: []
      },

      {
        id: 3,
        type: "Consultation",
        reason: "Fatigue",
        doctor: "Sarah Wilson",
        date: "15 Feb 2026",
        time: "11:20",
        diagnosis: "Iron deficiency suspected",
        treatment: "Iron supplements",
        notes: "Further tests recommended. Improve diet.",

        prescriptions: [
          {
            id: 1,
            name: "Fer",
            dosage: "100mg",
            frequency: "1x/day",
            duration: "30 days"
          }
        ],
        labResults: []
      }
    ]
  },

  {
    id: 3,
    patientId: "#556QWER",
    name: "Sophia Davis",
    age: 34,
    gender: "Female",
    bloodType: "B-",
    lastVisit: "29 Mar 2026",
    image: patient3,

    // 🫀 Antécédents médicaux
    antecedents: [
      {
        id: 1,
        type: "Maladie",
        nom: "Allergies saisonnières",
        date: "2015",
        statut: "chronique"
      }
    ],

    // 🍎 Habitudes de vie
    habitudes: {
      alimentation: "Végétarienne",
      tabac: "Non",
      alcool: "Non",
      activitePhysique: "Course à pied 4x/semaine",
      sommeil: "8h/nuit",
      allergies: ["Pollen", "Acariens", "Gluten"]
    },

    // 💉 Vaccins
    vaccins: [
      {
        id: 1,
        nom: "COVID-19 (3ème dose)",
        date: "2023-04-20",
        rappel: "2024-04-20",
        statut: "à_jour"
      },
      {
        id: 2,
        nom: "Grippe saisonnière",
        date: "2023-11-05",
        rappel: "2024-11-05",
        statut: "à_jour"
      },
      {
        id: 3,
        nom: "Tétanos",
        date: "2021-08-15",
        rappel: "2026-08-15",
        statut: "à_jour"
      },
      {
        id: 4,
        nom: "Hépatite B",
        date: "2012-03-10",
        rappel: null,
        statut: "complet"
      },
      {
        id: 5,
        nom: "HPV",
        date: "2015-06-20",
        rappel: null,
        statut: "complet"
      }
    ],

    consultations: [
      {
        id: 1,
        type: "Consultation",
        reason: "Flu Symptoms",
        doctor: "Sarah Wilson",
        date: "29 Mar 2026",
        time: "08:20",
        diagnosis: "Seasonal flu",
        treatment: "Paracetamol + rest",
        notes: "Increase fluids. Allergy medication adjusted.",

        prescriptions: [
          {
            id: 1,
            name: "Paracetamol",
            dosage: "500mg",
            frequency: "3x/day",
            duration: "5 days"
          },
          {
            id: 2,
            name: "Cétirizine",
            dosage: "10mg",
            frequency: "1x/day",
            duration: "14 days"
          }
        ],

        labResults: []
      }
    ]
  },

  {
    id: 4,
    patientId: "#778MNVB",
    name: "William Moore",
    age: 52,
    gender: "Male",
    bloodType: "AB+",
    lastVisit: "20 Mar 2026",
    image: patient4,

    // 🫀 Antécédents médicaux
    antecedents: [
      {
        id: 1,
        type: "Maladie",
        nom: "Diabète type 2",
        date: "2018",
        statut: "chronique"
      },
      {
        id: 2,
        type: "Maladie",
        nom: "Hypertension artérielle",
        date: "2015",
        statut: "chronique"
      },
      {
        id: 3,
        type: "Maladie",
        nom: "Obésité (IMC 32)",
        date: "2016",
        statut: "chronique"
      },
      {
        id: 4,
        type: "Chirurgie",
        nom: "Pontage coronarien",
        date: "2019",
        statut: "guéri"
      }
    ],

    // 🍎 Habitudes de vie
    habitudes: {
      alimentation: "Riche en sucres, à améliorer",
      tabac: "Ex-fumeur (arrêté en 2019)",
      alcool: "Faible (1 verre/semaine)",
      activitePhysique: "Marche 2x/semaine",
      sommeil: "6h/nuit, apnée du sommeil traitée",
      allergies: ["Sulfamides"]
    },

    // 💉 Vaccins
    vaccins: [
      {
        id: 1,
        nom: "COVID-19 (3ème dose)",
        date: "2023-01-15",
        rappel: "2024-01-15",
        statut: "à_jour"
      },
      {
        id: 2,
        nom: "Grippe saisonnière",
        date: "2023-10-10",
        rappel: "2024-10-10",
        statut: "à_jour"
      },
      {
        id: 3,
        nom: "Pneumocoque",
        date: "2022-05-20",
        rappel: "2027-05-20",
        statut: "à_jour"
      },
      {
        id: 4,
        nom: "Tétanos",
        date: "2019-03-15",
        rappel: "2024-03-15",
        statut: "en_retard"
      },
      {
        id: 5,
        nom: "Hépatite B",
        date: "2008-01-10",
        rappel: null,
        statut: "complet"
      }
    ],

    consultations: [
      {
        id: 1,
        type: "Consultation",
        reason: "Diabetes Follow-up",
        doctor: "James Carter",
        date: "20 Mar 2026",
        time: "13:00",
        diagnosis: "Stable glucose level",
        treatment: "Continue medication",
        notes: "Stable condition. HbA1c: 6.8%. Continue diet control.",

        prescriptions: [
          {
            id: 1,
            name: "Metformin",
            dosage: "500mg",
            frequency: "2x/day",
            duration: "30 days"
          }
        ],

        labResults: [
          {
            id: 1,
            title: "Urine Test.pdf",
            fileUrl: "/files/urine.pdf"
          },
          {
            id: 2,
            title: "HbA1c Result.pdf",
            fileUrl: "/files/hba1c.pdf"
          }
        ]
      },

      {
        id: 2,
        type: "Consultation",
        reason: "Foot Pain",
        doctor: "Michael Brown",
        date: "11 Jan 2026",
        time: "16:10",
        diagnosis: "Inflammation",
        treatment: "Anti-inflammatory tablets",
        notes: "Avoid long standing. Diabetic foot care recommended.",

        prescriptions: [
          {
            id: 1,
            name: "Ibuprofen",
            dosage: "400mg",
            frequency: "2x/day",
            duration: "7 days"
          }
        ],
        labResults: []
      }
    ]
  }
];