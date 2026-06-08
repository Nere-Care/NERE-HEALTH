import { useState } from "react";
import IdleScreen from "../../components/doctors/teleconsultation/IdleScreen";
import CallScreen from "../../components/doctors/teleconsultation/CallScreen";

// Données simulées des RDV du jour
const rdvDuJour = [
  {
    id: 1,
    patientName: "Marie Dupont",
    age: 45,
    motif: "Suivi diabète",
    heure: "14:00",
    statut: "en_attente",
    avatar: "M",
    dossier: {
      antecedents: ["Diabète type 2", "Hypertension"],
      allergies: ["Pénicilline"],
      dernierConsultation: "2026-05-15",
    },
  },
  {
    id: 2,
    patientName: "Jean Martin",
    age: 62,
    motif: "Douleurs thoraciques",
    heure: "14:30",
    statut: "en_cours",
    avatar: "J",
    dossier: {
      antecedents: ["Cardiopathie", "Cholestérol"],
      allergies: [],
      dernierConsultation: "2026-04-20",
    },
  },
  {
    id: 3,
    patientName: "Sophie Bernard",
    age: 28,
    motif: "Consultation générale",
    heure: "15:00",
    statut: "en_attente",
    avatar: "S",
    dossier: {
      antecedents: [],
      allergies: ["Latex"],
      dernierConsultation: "2026-01-10",
    },
  },
];

const historiqueRecent = [
  { id: 101, patient: "Paul Durand", date: "Aujourd'hui", heure: "10:30", duree: "25 min", diagnostic: "Rhinite allergique" },
  { id: 102, patient: "Claire Moreau", date: "Aujourd'hui", heure: "09:00", duree: "18 min", diagnostic: "Angine bactérienne" },
  { id: 103, patient: "Luc Petit", date: "Hier", heure: "16:00", duree: "32 min", diagnostic: "Lombalgie aiguë" },
];

export default function TeleConsultation({ darkMode }) {
  const [consultationActive, setConsultationActive] = useState(null);
  const [rdvList, setRdvList] = useState(rdvDuJour);

  const startConsultation = (rdv) => {
    setConsultationActive(rdv);
    // Mettre à jour le statut du RDV
    setRdvList(rdvList.map(r => r.id === rdv.id ? { ...r, statut: "en_cours" } : r));
  };

  const endConsultation = () => {
    setConsultationActive(null);
  };

  const stats = {
    total: rdvList.length,
    terminees: rdvList.filter(r => r.statut === "termine").length,
    enAttente: rdvList.filter(r => r.statut === "en_attente").length,
    enCours: rdvList.filter(r => r.statut === "en_cours").length,
  };

  return (
    <>
      {consultationActive ? (
        <CallScreen
          darkMode={darkMode}
          endCall={endConsultation}
          patient={consultationActive}
        />
      ) : (
        <IdleScreen
          darkMode={darkMode}
          startConsultation={startConsultation}
          rdvDuJour={rdvList}
          historique={historiqueRecent}
          stats={stats}
        />
      )}
    </>
  );
}