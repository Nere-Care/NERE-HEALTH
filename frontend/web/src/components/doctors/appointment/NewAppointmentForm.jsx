import { X, Mail, MapPin, Search, Loader2, Clock, AlertCircle, ChevronDown, Video, Building2 } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { get, post } from "../../../services/apiClient";
import { getStoredUser } from "../../../services/auth";
import { slotToUTCISO } from "../../../utils/timezone";

export default function NewAppointmentForm({ open, onClose, darkMode, onCreated }) {
  const user = getStoredUser();

  const [patientSearch, setPatientSearch] = useState("");
  const [patientResults, setPatientResults] = useState([]);
  const [searchingPatients, setSearchingPatients] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [myPatients, setMyPatients] = useState([]);
  const [loadingMyPatients, setLoadingMyPatients] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  const [date, setDate] = useState("");
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);

  const [typeRdv, setTypeRdv] = useState("presentiel");
  const [motif, setMotif] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      setPatientSearch("");
      setPatientResults([]);
      setSelectedPatient(null);
      setDate("");
      setAvailableSlots([]);
      setSelectedSlot(null);
      setTypeRdv("presentiel");
      setMotif("");
      setError("");
      setShowSearch(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open || !user?.id) return;
    setLoadingMyPatients(true);
    (async () => {
      try {
        const rdvs = await get("/api/rendez_vous", { medecin_id: user.id, limit: 200 });
        const patientIds = [...new Set((Array.isArray(rdvs) ? rdvs : []).map((r) => r.patient_id).filter(Boolean))];
        if (patientIds.length === 0) { setMyPatients([]); return; }

        const results = await Promise.all(
          patientIds.map((pid) => get(`/api/patients/${pid}`).catch(() => null))
        );
        setMyPatients(results.filter(Boolean));
      } catch {
        setMyPatients([]);
      } finally {
        setLoadingMyPatients(false);
      }
    })();
  }, [open, user?.id]);

  const searchPatients = useCallback(async (query) => {
    if (!query || query.length < 2) {
      setPatientResults([]);
      return;
    }
    setSearchingPatients(true);
    try {
      const data = await get("/api/patients", { search: query, limit: 10 });
      setPatientResults(Array.isArray(data) ? data : []);
    } catch {
      setPatientResults([]);
    } finally {
      setSearchingPatients(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (patientSearch) searchPatients(patientSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [patientSearch, searchPatients]);

  useEffect(() => {
    if (!date || !user?.id) {
      setAvailableSlots([]);
      setSelectedSlot(null);
      return;
    }
    setLoadingSlots(true);
    setSelectedSlot(null);
    get(`/api/disponibilites/creneaux/${user.id}`, { date })
      .then((data) => setAvailableSlots(Array.isArray(data) ? data : []))
      .catch(() => setAvailableSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [date, user?.id]);

  const formatTimeDisplay = (timeStr) => {
    if (!timeStr) return "";
    return timeStr.length > 5 ? timeStr.slice(0, 5) : timeStr;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!selectedPatient) {
      setError("Veuillez sélectionner un patient");
      return;
    }
    if (!date || !selectedSlot) {
      setError("Veuillez sélectionner une date et un créneau");
      return;
    }

    const startTime = selectedSlot.start;
    const endTime = selectedSlot.end;

    const debut = slotToUTCISO(date, startTime, user?.timezone || "Africa/Douala");
    const fin = slotToUTCISO(date, endTime, user?.timezone || "Africa/Douala");

    const numeroRdv = `RDV-${Date.now().toString(36).toUpperCase()}`;

    setSubmitting(true);
    try {
      await post("/api/rendez_vous", {
        numero_rdv: numeroRdv,
        patient_id: selectedPatient.id,
        medecin_id: user.id,
        date_heure_debut: debut,
        date_heure_fin: fin,
        type: typeRdv,
        motif_consultation: motif || null,
        statut: "en_attente",
      });
      if (onCreated) onCreated();
      onClose();
    } catch (err) {
      setError(err.message || "Erreur lors de la création du rendez-vous");
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  const inputClass = `w-full border rounded-xl px-3 py-2.5 sm:px-4 sm:py-3 outline-none ${
    darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-300"
  }`;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center">
      <div
        className={`w-full sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl p-6 shadow-xl border transition-all duration-300 ${
          darkMode ? "bg-gray-900 text-white border-gray-700" : "bg-white text-gray-900 border-gray-200"
        }`}
      >
        {/* HEADER */}
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-xl font-semibold text-blue-500">Nouveau rendez-vous</h2>
          <button onClick={onClose} disabled={submitting}
            className={`p-2 rounded-lg transition ${darkMode ? "hover:bg-gray-800 text-gray-300" : "hover:bg-gray-100 text-gray-600"}`}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ERROR */}
        {error && (
          <div className="flex items-center gap-2 p-3 mb-4 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 text-sm font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* PATIENT */}
          <div className="relative">
            <label className="block text-xs font-medium mb-1.5 opacity-70">Patient</label>
            {selectedPatient ? (
              <div className={`flex items-center justify-between gap-2 p-3 rounded-xl border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-300"}`}>
                <div>
                  <p className="font-semibold text-sm">{selectedPatient.prenom} {selectedPatient.nom}</p>
                  <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{selectedPatient.code_patient || selectedPatient.numero_patient}</p>
                </div>
                <button type="button" onClick={() => { setSelectedPatient(null); setPatientSearch(""); setShowSearch(false); }}
                  className="text-xs text-red-500 hover:text-red-600 font-medium">Changer</button>
              </div>
            ) : showSearch ? (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Rechercher par nom, email ou numéro..."
                    value={patientSearch}
                    onChange={(e) => setPatientSearch(e.target.value)}
                    className={`${inputClass} pl-10`}
                    autoFocus
                  />
                  {searchingPatients && (
                    <Loader2 className="absolute right-3 top-3 w-4 h-4 text-gray-400 animate-spin" />
                  )}
                </div>
                {patientResults.length > 0 && (
                  <div className={`absolute z-10 w-full mt-1 rounded-xl border shadow-lg max-h-48 overflow-y-auto ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
                    {patientResults.map((p) => (
                      <button key={p.id} type="button"
                        onClick={() => { setSelectedPatient(p); setPatientSearch(""); setPatientResults([]); setShowSearch(false); }}
                        className={`w-full text-left px-3 py-2.5 text-sm hover:bg-blue-500/10 transition border-b last:border-b-0 ${darkMode ? "border-gray-700" : "border-gray-100"}`}>
                        <span className="font-medium">{p.prenom} {p.nom}</span>
                        <span className={`ml-2 text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{p.code_patient || p.numero_patient}</span>
                      </button>
                    ))}
                  </div>
                )}
                <button type="button" onClick={() => { setShowSearch(false); setPatientSearch(""); setPatientResults([]); }}
                  className="text-xs text-blue-500 hover:text-blue-600 mt-2 font-medium">
                  ← Retour à la liste
                </button>
              </>
            ) : (
              <>
                {loadingMyPatients ? (
                  <div className="flex items-center gap-2 py-3">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                    <span className="text-xs text-gray-400">Chargement des patients...</span>
                  </div>
                ) : myPatients.length > 0 ? (
                  <div className="relative">
                    <select
                      value=""
                      onChange={(e) => {
                        if (e.target.value === "__search__") { setShowSearch(true); return; }
                        const p = myPatients.find((mp) => mp.id === e.target.value);
                        if (p) setSelectedPatient(p);
                      }}
                      className={`${inputClass} appearance-none pr-10 cursor-pointer`}
                    >
                      <option value="">Sélectionner un patient...</option>
                      {myPatients.map((p) => (
                        <option key={p.id} value={p.id}>{p.prenom} {p.nom} — {p.code_patient || p.numero_patient || ""}</option>
                      ))}
                      <option value="__search__">🔍 Autre patient (recherche)</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                ) : (
                  <div>
                    <p className={`text-xs mb-2 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>Aucun patient avec des RDV existants</p>
                    <button type="button" onClick={() => setShowSearch(true)}
                      className="flex items-center gap-1.5 text-xs text-blue-500 hover:text-blue-600 font-medium">
                      <Search className="w-3 h-3" /> Rechercher un patient
                    </button>
                  </div>
                )}
                {myPatients.length > 0 && (
                  <button type="button" onClick={() => setShowSearch(true)}
                    className="text-xs text-blue-500 hover:text-blue-600 mt-2 font-medium">
                    🔍 Rechercher un autre patient
                  </button>
                )}
              </>
            )}
          </div>

          {/* DATE */}
          <div>
            <label className="block text-xs font-medium mb-1.5 opacity-70">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className={inputClass}
              required
            />
          </div>

          {/* TYPE RDV */}
          <div>
            <label className="block text-xs font-medium mb-1.5 opacity-70">Type de rendez-vous</label>
            <div className="flex gap-2">
              <button type="button" onClick={() => setTypeRdv("presentiel")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border transition ${
                  typeRdv === "presentiel"
                    ? "bg-blue-600 text-white border-blue-600"
                    : darkMode ? "bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-750" : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                }`}>
                <Building2 className="w-4 h-4" />
                Présentiel
              </button>
              <button type="button" onClick={() => setTypeRdv("video")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border transition ${
                  typeRdv === "video"
                    ? "bg-blue-600 text-white border-blue-600"
                    : darkMode ? "bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-750" : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                }`}>
                <Video className="w-4 h-4" />
                Téléconsultation
              </button>
            </div>
          </div>

          {/* AVAILABLE SLOTS */}
          <div>
            <label className="block text-xs font-medium mb-1.5 opacity-70">Créneau horaire</label>
            {!date ? (
              <p className={`text-xs ${darkMode ? "text-gray-500" : "text-gray-400"}`}>Sélectionnez d'abord une date</p>
            ) : loadingSlots ? (
              <div className="flex items-center gap-2 py-3">
                <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                <span className="text-xs text-gray-400">Chargement des créneaux...</span>
              </div>
            ) : availableSlots.length === 0 ? (
              <p className={`text-xs ${darkMode ? "text-gray-500" : "text-gray-400"}`}>Aucun créneau disponible pour cette date</p>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-40 overflow-y-auto">
                {availableSlots.map((slot, idx) => {
                  const isSelected = selectedSlot?.start === slot.start && selectedSlot?.end === slot.end;
                  return (
                    <button key={idx} type="button"
                      onClick={() => setSelectedSlot(slot)}
                      className={`flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-medium border transition ${
                        isSelected
                          ? "bg-blue-600 text-white border-blue-600"
                          : darkMode ? "bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-750" : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                      }`}>
                      <Clock className="w-3 h-3" />
                      {formatTimeDisplay(slot.start)}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* MOTIF */}
          <div>
            <label className="block text-xs font-medium mb-1.5 opacity-70">Motif</label>
            <textarea
              placeholder="Motif de la consultation..."
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              rows="3"
              className={`${inputClass} resize-none`}
            />
          </div>

          {/* SUBMIT */}
          <button
            type="submit"
            disabled={submitting || !selectedPatient || !selectedSlot}
            className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition font-medium disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Création en cours...
              </>
            ) : (
              "Créer le rendez-vous"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
