import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar, Clock, MapPin, Video, Loader,
  AlertCircle, Search, RotateCcw, MessageSquare, Hash, Plus,
} from "lucide-react";
import { get } from "../../services/apiClient";
import { getStoredUser } from "../../services/auth";
import PatientCallScreen from "../../components/patient/PatientCallScreen";
import PatientAppointmentChatModal from "../../components/patient/PatientAppointmentChatModal";
import { getUserTimezone } from "../../utils/timezone";

const STATUT_AVENIR = {
  en_attente: { label: "En attente", color: "bg-yellow-100 text-yellow-700" },
  en_attente_paiement: { label: "En attente de paiement", color: "bg-orange-100 text-orange-700" },
  paye_en_attente_validation: { label: "Paiement en vérification", color: "bg-blue-100 text-blue-700" },
  confirme: { label: "Confirmé", color: "bg-green-100 text-green-700" },
  en_cours: { label: "En cours", color: "bg-blue-100 text-blue-700" },
};

const STATUT_PASSE = {
  termine: { label: "Terminé", color: "bg-green-100 text-green-700" },
  annule_patient: { label: "Annulé", color: "bg-red-100 text-red-700" },
  annule_medecin: { label: "Annulé par médecin", color: "bg-red-100 text-red-700" },
  annule_systeme: { label: "Annulé", color: "bg-red-100 text-red-700" },
  no_show_patient: { label: "Absent", color: "bg-orange-100 text-orange-700" },
  no_show_medecin: { label: "Médecin absent", color: "bg-orange-100 text-orange-700" },
  en_attente: { label: "Passé", color: "bg-gray-100 text-gray-700" },
  en_attente_paiement: { label: "Passé (non payé)", color: "bg-gray-100 text-gray-700" },
  paye_en_attente_validation: { label: "Passé", color: "bg-gray-100 text-gray-700" },
  confirme: { label: "Passé", color: "bg-gray-100 text-gray-700" },
};

const TYPE_ICONS = {
  presentiel: { icon: MapPin, label: "Présentiel", color: "bg-blue-50 text-blue-600" },
  video: { icon: Video, label: "Téléconsultation", color: "bg-purple-50 text-purple-600" },
  audio: { icon: Video, label: "Audio", color: "bg-indigo-50 text-indigo-600" },
  chat: { icon: Video, label: "Chat", color: "bg-teal-50 text-teal-600" },
};

function formatDateISO(iso) {
  if (!iso) return "";
  const tz = getUserTimezone();
  const date = new Date(iso);
  return date.toLocaleDateString("fr-FR", { timeZone: tz, weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

function formatTimeISO(iso) {
  if (!iso) return "";
  const tz = getUserTimezone();
  const date = new Date(iso);
  return date.toLocaleTimeString("fr-FR", { timeZone: tz, hour: "2-digit", minute: "2-digit" });
}

const TABS = ["À venir", "Passés"];

export default function RendezVous({ darkMode }) {
  const navigate = useNavigate();
  const user = getStoredUser();
  const [onglet, setOnglet] = useState(0);
  const [rdvs, setRdvs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [docteursMap, setDocteursMap] = useState({});
  const [structuresMap, setStructuresMap] = useState({});
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [videoRdv, setVideoRdv] = useState(null);
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [chatRdv, setChatRdv] = useState(null);

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    get("/api/rendez_vous", { patient_id: user.id, limit: 100 })
      .then(async (data) => {
        const now = new Date();
        const all = (data || []).map((r) => ({
          ...r,
          _isFutur: new Date(new Date(r.date_heure_debut).getTime() + 2 * 60 * 60 * 1000) >= now && !["annule_patient", "annule_medecin", "annule_systeme", "termine"].includes(r.statut),
        }));

        const medIds = [...new Set(all.map((r) => r.medecin_id).filter(Boolean))];
        const structIds = [...new Set(all.map((r) => r.structure_id).filter(Boolean))];

        const [usersResults, structsResults] = await Promise.all([
          Promise.allSettled(medIds.map((id) => get(`/api/users/${id}`).then((u) => [id, u]))),
          Promise.allSettled(structIds.map((id) => get(`/api/structures/${id}`).then((s) => [id, s]))),
        ]);

        const uMap = {};
        usersResults.forEach((r) => {
          if (r.status === "fulfilled") {
            const [id, u] = r.value;
            uMap[id] = u;
          }
        });
        const sMap = {};
        structsResults.forEach((r) => {
          if (r.status === "fulfilled") {
            const [id, s] = r.value;
            sMap[id] = s;
          }
        });

        setDocteursMap(uMap);
        setStructuresMap(sMap);
        setRdvs(all);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    const hasEnAttente = rdvs.some(r => r._isFutur && r.statut !== "en_cours" && !["annule_patient", "annule_medecin", "annule_systeme"].includes(r.statut));
    if (!hasEnAttente) return;
    const poll = setInterval(() => {
      get("/api/rendez_vous", { patient_id: user.id, limit: 100 })
        .then((data) => {
          const now = new Date();
          setRdvs((data || []).map((r) => ({
            ...r,
          _isFutur: new Date(new Date(r.date_heure_debut).getTime() + 2 * 60 * 60 * 1000) >= now && !["annule_patient", "annule_medecin", "annule_systeme", "termine"].includes(r.statut),
          })));
        })
        .catch(() => {});
    }, 10000);
    return () => clearInterval(poll);
  }, [user?.id, rdvs.length]);

  const futurs = rdvs
    .filter((r) => r._isFutur)
    .sort((a, b) => (a.date_heure_debut || "").localeCompare(b.date_heure_debut || ""));

  const passes = rdvs
    .filter((r) => !r._isFutur)
    .sort((a, b) => (b.date_heure_debut || "").localeCompare(a.date_heure_debut || ""));

  const currentList = onglet === 0 ? futurs : passes;

  const filtered = currentList.filter((r) => {
    if (!search.trim()) return true;
    const med = docteursMap[r.medecin_id];
    const medName = med ? `dr. ${med.prenom || ""} ${med.nom || ""}`.toLowerCase() : "";
    const motif = (r.motif_consultation || "").toLowerCase();
    const q = search.toLowerCase();
    return medName.includes(q) || motif.includes(q);
  });

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
        <Loader className="animate-spin text-blue-500" size={32} />
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-3 md:p-6 ${darkMode ? "bg-gray-900 text-white" : "bg-gray-50"}`}>
      <div className="flex items-center justify-between mb-4">
        <h1 className={`text-2xl font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>Rendez-vous</h1>
        <button onClick={() => navigate("/annuaire")}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition shadow">
          <Plus size={16} /> Prendre RDV
        </button>
      </div>

      <div className="flex gap-2 flex-wrap mb-6">
        {TABS.map((label, i) => (
          <button key={i} onClick={() => { setOnglet(i); setSearch(""); }}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${onglet === i ? "bg-blue-600 text-white" : darkMode ? "bg-gray-800 text-gray-300" : "bg-white text-gray-600 border"}`}>
            {label}
            <span className={`ml-1.5 text-xs ${onglet === i ? "text-blue-200" : "text-gray-400"}`}>
              ({i === 0 ? futurs.length : passes.length})
            </span>
          </button>
        ))}
      </div>

      <div className={`flex items-center gap-2 border rounded-xl px-4 py-2.5 mb-6
        ${darkMode ? "bg-gray-800 border-gray-600" : "bg-white border-gray-200"}`}>
        <Search size={16} className="text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher un médecin ou un motif..."
          className={`outline-none text-sm w-full ${darkMode ? "bg-gray-800 text-white placeholder-gray-500" : ""}`}
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 text-red-600 text-sm mb-6">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {filtered.length === 0 && !error ? (
        <div className={`rounded-2xl p-10 text-center ${darkMode ? "bg-gray-800" : "bg-white"}`}>
          <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${onglet === 0 ? "bg-blue-100" : "bg-gray-100"}`}>
            <Calendar size={28} className={onglet === 0 ? "text-blue-500" : "text-gray-400"} />
          </div>
          <h3 className={`text-lg font-bold mb-2 ${darkMode ? "text-white" : "text-gray-800"}`}>
            {onglet === 0 ? "Aucun rendez-vous à venir" : "Aucun rendez-vous passé"}
          </h3>
          <p className={`text-sm mb-6 max-w-md mx-auto ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            {onglet === 0
              ? "Prenez votre santé en main. Réservez facilement votre prochain rendez-vous sur NERE Health."
              : "Votre historique de consultations apparaîtra ici une fois vos rendez-vous terminés."}
          </p>
          {onglet === 0 && (
            <button
              onClick={() => navigate("/annuaire")}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition"
            >
              <Calendar size={18} />
              Prendre rendez-vous
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map((rdv) => {
            const med = docteursMap[rdv.medecin_id];
            const struct = structuresMap[rdv.structure_id];
            const dateDebut = rdv.date_heure_debut;
            const dateFin = rdv.date_heure_fin;
            const statusMap = onglet === 0 ? STATUT_AVENIR : STATUT_PASSE;
            const status = statusMap[rdv.statut] || { label: rdv.statut, color: "bg-gray-100 text-gray-700" };
            const typeConfig = TYPE_ICONS[rdv.type] || TYPE_ICONS.presentiel;
            const TypeIcon = typeConfig.icon;
            const isPasse = onglet === 1;
            const showCode = (() => {
              if (!rdv.code_verification || onglet !== 0 || rdv.type !== "presentiel") return false;
              return rdv.statut === "confirme";
            })();

            return (
              <div
                key={rdv.id}
                className={`rounded-2xl shadow p-5 transition-all hover:shadow-md ${darkMode ? "bg-gray-800" : "bg-white"}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${isPasse ? "bg-gray-100 text-gray-500" : "bg-blue-100 text-blue-500"}`}>
                    <Calendar size={20} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <p className={`font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>
                          {med ? `Dr. ${med.prenom || ""} ${med.nom || ""}`.trim() : "Médecin"}
                        </p>
                        {med && (
                          <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                            {med.specialite || ""}
                          </p>
                        )}
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${status.color}`}>
                        {status.label}
                      </span>
                    </div>

                    <div className="flex flex-col gap-1.5 mb-3">
                      {rdv.motif_consultation && (
                        <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                          <span className="font-medium">Motif :</span> {rdv.motif_consultation}
                        </p>
                      )}
                      <div className="flex items-center gap-3 flex-wrap text-sm">
                        <span className={`inline-flex items-center gap-1.5 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                          <Calendar size={14} />
                          {formatDateISO(dateDebut)}
                        </span>
                        <span className={`inline-flex items-center gap-1.5 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                          <Clock size={14} />
                          {formatTimeISO(dateDebut)} - {formatTimeISO(dateFin)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 flex-wrap text-sm">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-xs font-medium ${typeConfig.color}`}>
                          <TypeIcon size={12} />
                          {typeConfig.label}
                        </span>
                        {struct && (
                          <span className={`inline-flex items-center gap-1.5 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                            <MapPin size={14} />
                            {struct.nom_etablissement || struct.ville || "Structure"}
                          </span>
                        )}
                        {rdv.numero_rdv && (
                          <span className={`inline-flex items-center gap-1.5 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                            <Hash size={14} />
                            {rdv.numero_rdv}
                          </span>
                        )}
                      </div>
                      {showCode && (
                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold mt-1
                          ${darkMode ? "bg-green-900/40 text-green-400" : "bg-green-50 text-green-700"}`}>
                          <span>Code de confirmation :</span>
                          <span className="tracking-widest font-mono">{rdv.code_verification}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {isPasse ? (
                        <>
                          <button
                            onClick={() => navigate(`/medecin/${rdv.medecin_id}`)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all font-medium"
                          >
                            <RotateCcw size={14} />
                            Réserver de nouveau
                          </button>
                          <button
                            onClick={() => navigate("/messages")}
                            className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm rounded-xl transition-all font-medium
                              ${darkMode ? "bg-gray-700 hover:bg-gray-600 text-gray-300" : "bg-gray-100 hover:bg-gray-200 text-gray-700"}`}
                          >
                            <MessageSquare size={14} />
                            Envoyer un message
                          </button>
                        </>
                      ) : (
                        <>
                          {rdv.type !== "presentiel" && rdv.statut === "en_cours" ? (
                            <button
                              onClick={() => {
                                setVideoRdv(rdv);
                                setVideoModalOpen(true);
                              }}
                              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded-xl transition-all font-medium"
                            >
                              <Video size={14} />
                              Rejoindre
                            </button>
                          ) : rdv.type !== "presentiel" ? (
                            <span className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm rounded-xl font-medium
                              ${darkMode ? "bg-gray-700 text-gray-400" : "bg-gray-100 text-gray-400"}`}>
                              <Clock size={14} />
                              En attente du médecin
                            </span>
                          ) : null}
                          {(() => {
                            const hoursUntil = rdv.date_heure_debut ? (new Date(rdv.date_heure_debut) - new Date()) / (1000 * 60 * 60) : 0;
                            const canReschedule = hoursUntil >= 24 && ["confirme", "en_attente"].includes(rdv.statut);
                            return (
                              <>
                                {canReschedule ? (
                                  <button
                                    onClick={() => navigate(`/medecin/${rdv.medecin_id}?reschedule=${rdv.id}`)}
                                    className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm rounded-xl transition-all font-medium
                                      ${darkMode ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"}`}
                                  >
                                    <RotateCcw size={14} />
                                    Reprogrammer
                                  </button>
                                ) : (
                                  <button disabled title="Reprogrammation impossible moins de 24h avant le rendez-vous"
                                    className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm rounded-xl font-medium cursor-not-allowed
                                      ${darkMode ? "bg-gray-700 text-gray-500" : "bg-gray-200 text-gray-400"}`}>
                                    <RotateCcw size={14} />
                                    Reprogrammer
                                  </button>
                                )}
                                <button
                                  onClick={() => {
                                    setChatRdv(rdv);
                                    setChatModalOpen(true);
                                  }}
                                  className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm rounded-xl transition-all font-medium border
                                    ${darkMode ? "border-blue-500 text-blue-400 hover:bg-gray-700" : "border-blue-600 text-blue-600 hover:bg-blue-50"}`}
                                >
                                  <MessageSquare size={14} />
                                  Message
                                </button>
                              </>
                            );
                          })()}
                          <button
                            onClick={() => navigate(`/medecin/${rdv.medecin_id}`)}
                            className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all font-medium"
                          >
                            Voir les détails
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {videoModalOpen && videoRdv && (
        <PatientCallScreen
          darkMode={darkMode}
          rdv={videoRdv}
          medecinName={docteursMap[videoRdv.medecin_id] ? `Dr. ${docteursMap[videoRdv.medecin_id].prenom || ""} ${docteursMap[videoRdv.medecin_id].nom || ""}`.trim() : "Médecin"}
          onClose={() => { setVideoModalOpen(false); setVideoRdv(null); }}
        />
      )}

      <PatientAppointmentChatModal
        open={chatModalOpen}
        onClose={() => {
          setChatModalOpen(false);
          setChatRdv(null);
        }}
        rdv={chatRdv}
        darkMode={darkMode}
      />
    </div>
  );
}
