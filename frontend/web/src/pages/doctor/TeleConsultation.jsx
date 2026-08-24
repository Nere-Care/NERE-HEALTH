import { useState, useEffect } from "react";
import IdleScreen from "../../components/doctors/teleconsultation/IdleScreen";
import CallScreen from "../../components/doctors/teleconsultation/CallScreen";
import { get, put } from "../../services/apiClient";
import { getUserTimezone } from "../../utils/timezone";

export default function TeleConsultation({ darkMode }) {
  const [consultationActive, setConsultationActive] = useState(null);
  const [rdvList, setRdvList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    get("/api/rendez_vous?limit=100")
      .then(async (rdvs) => {
        const uniquePatientIds = [...new Set(rdvs.map((r) => r.patient_id))];
        const patientsMap = {};
        await Promise.all(
          uniquePatientIds.map(async (pid) => {
            try {
              const p = await get(`/api/patients/${pid}`);
              patientsMap[pid] = p;
            } catch {
              patientsMap[pid] = null;
            }
          })
        );

        const remoteTypes = ["video", "audio", "chat"];
        const allowedStatuses = new Set(["confirme", "en_cours", "termine"]);
        const remoteRdvs = rdvs.filter(
          (r) => remoteTypes.includes(r.type) && allowedStatuses.has(r.statut)
        );

        const now = Date.now();
        const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

        const mapped = remoteRdvs.map((r) => {
          const p = patientsMap[r.patient_id] || {};
          const rdvDate = new Date(r.date_heure_debut);
          const rdvEndTime = new Date(r.date_heure_fin).getTime();
          const rdvLocalDate = rdvDate.toLocaleDateString("sv-SE");
          const todayLocalDate = new Date().toLocaleDateString("sv-SE");
          const isToday = rdvLocalDate === todayLocalDate;
          const isPast = rdvLocalDate < todayLocalDate;
          const heureLocal = rdvDate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: getUserTimezone() });
          const timeParts = heureLocal;
          const dateStr = rdvDate.toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "short",
            year: "numeric",
          });
          const isExpired = now > rdvEndTime + TWO_HOURS_MS;

          let statut = r.statut;
          if (r.statut === "confirme" || r.statut === "en_attente") {
            statut = isExpired ? "expire" : "en_attente";
          }

          return {
            id: r.id,
            patientId: r.patient_id,
            patientName: `${p.prenom || ""} ${p.nom || ""}`.trim() || "Patient",
            age: p.date_naissance
              ? Math.floor((Date.now() - new Date(p.date_naissance).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
              : null,
            motif: r.motif_consultation || "Consultation générale",
            heure: timeParts,
            date: dateStr,
            statut,
            avatar: (p.prenom || "?")[0].toUpperCase(),
            rdvId: r.id,
            webrtcRoomId: r.webrtc_room_id,
            type: r.type,
            dateDebut: r.date_heure_debut,
            dateFin: r.date_heure_fin,
            _isToday: isToday,
            _isPast: isPast,
            _canStart: statut === "en_attente" && new Date(r.date_heure_debut).getTime() - 2 * 60 * 1000 <= now,
            notes_patient: r.notes_patient || "",
            motif_consultation: r.motif_consultation || "",
          };
        });

        setRdvList(mapped);
      })
      .catch(() => setRdvList([]))
      .finally(() => setLoading(false));
  }, []);

  const startConsultation = async (rdv) => {
    if (rdv.statut === "en_cours") {
      setConsultationActive(rdv);
      return;
    }
    try {
      const updated = await put(`/api/rendez_vous/${rdv.rdvId}/start`, {});
      setConsultationActive({
        ...rdv,
        statut: "en_cours",
        webrtcRoomId: updated.webrtc_room_id || rdv.webrtcRoomId,
      });
      setRdvList((prev) => prev.map((r) => (r.id === rdv.id ? { ...r, statut: "en_cours" } : r)));
    } catch (err) {
      console.error("Erreur démarrage consultation:", err);
    }
  };

  const endConsultation = async (dureeSec) => {
    if (consultationActive?.rdvId) {
      try {
        await put(`/api/rendez_vous/${consultationActive.rdvId}/complete`, {});
        setRdvList((prev) =>
          prev.map((r) =>
            r.id === consultationActive.rdvId
              ? { ...r, statut: "termine", dureeReelleSec: dureeSec || 0 }
              : r
          )
        );
      } catch (err) {
        console.error("Erreur finalisation consultation:", err);
      }
    }
    setConsultationActive(null);
  };

  const stats = {
    total: rdvList.filter((r) => (r.statut === "en_attente" || r.statut === "en_cours") && r._isToday).length,
    terminees: rdvList.filter((r) => r.statut === "termine" && r._isToday).length,
    enAttente: rdvList.filter((r) => r.statut === "en_attente" && r._isToday).length,
    enCours: rdvList.filter((r) => r.statut === "en_cours" && r._isToday).length,
  };

  const todayRdvs = rdvList.filter((r) => r._isToday);
  const todayStarted = todayRdvs.filter((r) => r.statut === "en_cours" || r.statut === "termine");

  let avgDurationMin = 0;
  if (todayStarted.length > 0) {
    const durations = todayStarted.map((r) => {
      if (r.dureeReelleSec && r.dureeReelleSec > 0) {
        return r.dureeReelleSec / 60;
      }
      const start = new Date(r.dateDebut).getTime();
      const end = new Date(r.dateFin || r.dateDebut).getTime();
      const diffMin = (end - start) / 60000;
      return diffMin > 0 ? diffMin : 15;
    });
    avgDurationMin = Math.round(durations.reduce((a, b) => a + b, 0) / durations.length);
  }

  const nbTerminesToday = todayStarted.filter((r) => r.statut === "termine").length;
  const tauxCompletion = todayStarted.length > 0
    ? Math.round((nbTerminesToday / todayStarted.length) * 100)
    : 0;

  const todayStats = { count: todayStarted.length, avgDurationMin, tauxCompletion };

  const rdvActifs = rdvList
    .filter((r) => (r.statut === "en_attente" || r.statut === "en_cours") && r._isToday)
    .sort((a, b) => new Date(a.dateDebut) - new Date(b.dateDebut));
  const rdvExpires = rdvList
    .filter((r) => r._isPast || (r._isToday && (r.statut === "expire" || r.statut === "termine" || r.statut.startsWith("annule"))))
    .sort((a, b) => new Date(b.dateDebut) - new Date(a.dateDebut));

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Chargement des rendez-vous...</p>
        </div>
      </div>
    );
  }

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
          rdvDuJour={rdvActifs}
          historique={rdvExpires}
          stats={stats}
          todayStats={todayStats}
        />
      )}

    </>
  );
}
