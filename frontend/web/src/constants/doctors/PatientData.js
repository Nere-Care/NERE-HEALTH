

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
    image: patient1,

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
        notes: "Patient in good health.",

        prescriptions: [
          {
            id: 1,
            name: "Vitamin C",
            dosage: "500mg",
            frequency: "1x/day",
            duration: "14 days"
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
        notes: "Reduce screen exposure.",

        prescriptions: [
          {
            id: 1,
            name: "Ibuprofen",
            dosage: "400mg",
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
        notes: "Avoid heavy lifting.",

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
        notes: "Hydration recommended.",

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
        notes: "No severe abnormality detected.",

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
        notes: "Reduce salt intake.",

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
        notes: "Further tests recommended.",

        prescriptions: [],
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
        notes: "Increase fluids.",

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
    id: 4,
    patientId: "#778MNVB",
    name: "William Moore",
    age: 52,
    gender: "Male",
    bloodType: "AB+",
    lastVisit: "20 Mar 2026",
    image: patient4,

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
        notes: "Stable condition.",

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
        notes: "Avoid long standing.",

        prescriptions: [],
        labResults: []
      }
    ]
  }
];