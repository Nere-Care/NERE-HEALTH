import { useState, useEffect, useCallback } from "react";
import IdleScreen from "../../components/doctors/teleconsultation/IdleScreen";
import CallScreen from "../../components/doctors/teleconsultation/CallScreen";
import {
  fetchTeleconsultationsDuJour,
  fetchTeleconsultationsHistorique,
  demarrerTeleconsultation,
  terminerTeleconsultation,
} from "../../services/rendezVousService";

export default function TeleConsultation({ darkMode }) {
  const [consultationActive, setConsultationActive] = useState(null);
  const [rdvList, setRdvList] = useState([]);
  const [historique, setHistorique] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState(null);

  const charger = useCallback(async () => {
    try {
      setLoading(true);
      setErreur(null);
      const [rdvs, hist] = await Promise.all([
        fetchTeleconsultationsDuJour(),
        fetchTeleconsultationsHistorique(),
      ]);
      setRdvList(rdvs ?? []);
      setHistorique(hist ?? []);
    } catch (err) {
      setErreur(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { charger(); }, [charger]);

  const startConsultation = async (rdv) => {
    try {
      // Appel backend pour demarrer et generer le lien Jitsi
      const data = await demarrerTeleconsultation(rdv.id);

      // Mettre a jour le RDV avec le lien genere
      const rdvAvecLien = {
        ...rdv,
        statut: "en_cours",
        lien_video: data.lien_video,
        room_name: data.room_name,
      };

      setRdvList(prev => prev.map(r =>
        r.id === rdv.id ? { ...r, statut: "en_cours", lien_video: data.lien_video } : r
      ));
      setConsultationActive(rdvAvecLien);
    } catch (err) {
      setErreur(err.message);
    }
  };

  const endConsultation = async () => {
    if (consultationActive?.id) {
      try {
        await terminerTeleconsultation(consultationActive.id);
        setRdvList(prev => prev.map(r =>
          r.id === consultationActive.id ? { ...r, statut: "termine" } : r
        ));
      } catch (err) {
        console.error("Erreur fin consultation:", err.message);
      }
    }
    setConsultationActive(null);
    charger(); // Rafraichir la liste
  };

  const stats = {
    total: rdvList.length,
    terminees: rdvList.filter(r => r.statut === "termine").length,
    enAttente: rdvList.filter(r => r.statut === "en_attente" || r.statut === "confirme").length,
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
          historique={historique}
          stats={stats}
          loading={loading}
          erreur={erreur}
        />
      )}
    </>
  );
}