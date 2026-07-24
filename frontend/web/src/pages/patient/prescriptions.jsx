import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, FileText, Loader, Plus, Trash2, X, RefreshCw } from "lucide-react";
import { get, post } from "../../services/apiClient";
import { getUserTimezone } from "../../utils/timezone";
import { getStoredUser } from "../../services/auth";
import { FORMES } from "../../constants/medicalOptions";
import PosologieBuilder from "../../components/PosologieBuilder";
import MedicamentSearch from "../../components/MedicamentSearch";

export default function Prescriptions({ darkMode }) {
  const navigate = useNavigate();
  const user = getStoredUser();
  const [ordonnances, setOrdonnances] = useState([]);
  const [progressions, setProgressions] = useState({});
  const [loading, setLoading] = useState(true);
  const [recherche, setRecherche] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [renewingId, setRenewingId] = useState(null);
  const [consultations, setConsultations] = useState([]);
  const [mesMedecins, setMesMedecins] = useState([]);
  const [structures, setStructures] = useState([]);
  const [form, setForm] = useState({
    type_consultation: "",
    motif: "",
    consultation_id: "",
    medecin_id: "",
    medecin_nom_libre: "",
    notes: "",
    date_expiration: "",
    date_debut_traitement: "",
    structure_id: "",
    structure_nom: "",
    adresse_structure: "",
    lignes: [{ medicament_nom: "", dosage: "", forme: "comprimes", posologie: "", duree_jours: 7, quantite: 1 }],
  });

  const fetchData = async () => {
    try {
      const data = await get('/api/ordonnances', { limit: 50 });
      setOrdonnances(data || []);

      const progMap = {};
      await Promise.allSettled(
        (data || []).map(o =>
          get(`/api/ordonnances/${o.id}/progression`)
            .then(p => { progMap[o.id] = p; })
            .catch(() => {})
        )
      );
      setProgressions(progMap);
    } catch { setOrdonnances([]); }

    try {
      const [cs, rdvs, allMedecins, allStructures] = await Promise.all([
        get(`/api/consultations?patient_id=${user?.id}&limit=100`).catch(() => []),
        get(`/api/rendez_vous?patient_id=${user?.id}&limit=100`).catch(() => []),
        get('/api/medecins', { limit: 100 }).catch(() => []),
        get('/api/structures', { limit: 100 }).catch(() => []),
      ]);

      const cons = Array.isArray(cs) ? cs : [];
      const rdvList = Array.isArray(rdvs) ? rdvs : [];
      setConsultations(cons);

      const doctorIds = new Set();
      cons.forEach(c => {
        if (c.medecin_id) doctorIds.add(c.medecin_id);
        if (c.medecin?.id) doctorIds.add(c.medecin.id);
      });
      rdvList.forEach(r => {
        if (r.medecin_id) doctorIds.add(r.medecin_id);
      });

      const medList = Array.isArray(allMedecins) ? allMedecins : [];
      const patientMedecins = medList.filter(m => doctorIds.has(m.id));

      // Fallback for any doctor attached directly to a consultation object
      cons.forEach(c => {
        if (c.medecin && c.medecin.id && !patientMedecins.some(m => m.id === c.medecin.id)) {
          patientMedecins.push({
            id: c.medecin.id,
            prenom: c.medecin.prenom || "",
            nom: c.medecin.nom || "",
            specialite: c.medecin.specialite || "",
            structure_id: c.medecin.structure_id || null,
          });
        }
      });

      setMesMedecins(patientMedecins);
      setStructures(Array.isArray(allStructures) ? allStructures : []);
    } catch {
      setConsultations([]);
      setMesMedecins([]);
      setStructures([]);
    }
  };

  useEffect(() => {
    fetchData().finally(() => setLoading(false));
  }, []);

  const filtered = ordonnances.filter(o =>
    o.lignes?.some(l => l.medicament_nom?.toLowerCase().includes(recherche.toLowerCase()))
    || o.numero?.toLowerCase().includes(recherche.toLowerCase())
  );

  const addLigne = () => {
    setForm(f => ({
      ...f,
      lignes: [...f.lignes, { medicament_nom: "", dosage: "", forme: "comprimes", posologie: "", duree_jours: 7, quantite: 1 }],
    }));
  };

  const removeLigne = (idx) => {
    setForm(f => ({ ...f, lignes: f.lignes.filter((_, i) => i !== idx) }));
  };

  const updateLigne = (idx, field, value) => {
    setForm(f => ({
      ...f,
      lignes: f.lignes.map((l, i) => (i === idx ? { ...l, [field]: value } : l)),
    }));
  };

  const hasMedecin = (form.medecin_id && form.medecin_id !== "__autre__") || form.medecin_nom_libre.trim();
  const hasLignes = form.lignes.some(l => l.medicament_nom.trim());

  const handleSubmit = async () => {
    if (!form.type_consultation || !form.motif.trim() || !hasMedecin || !hasLignes) return;
    setSaving(true);
    try {
      const expiration = form.date_expiration
        ? new Date(form.date_expiration).toISOString().slice(0, 10)
        : null;

      const isAutreMedecin = !form.medecin_id || form.medecin_id === "__autre__";

      await post("/api/ordonnances", {
        numero: `ORD-${Date.now().toString(36).toUpperCase()}`,
        consultation_id: form.consultation_id || null,
        medecin_id: isAutreMedecin ? null : form.medecin_id,
        medecin_nom_libre: isAutreMedecin ? form.medecin_nom_libre.trim() : null,
        patient_id: user?.id,
        motif: form.motif.trim(),
        type_consultation: form.type_consultation,
        structure_nom: form.structure_nom.trim() || null,
        adresse_structure: form.adresse_structure.trim() || null,
        date_expiration: expiration,
        date_debut_traitement: form.date_debut_traitement || null,
        qr_code_data: `ordonnance-${Date.now()}`,
        notes_medecin: form.notes,
        lignes: form.lignes.filter(l => l.medicament_nom.trim()).map((l) => ({
          medicament_nom: l.medicament_nom,
          dosage: l.dosage,
          forme: l.forme,
          posologie: l.posologie,
          duree_jours: parseInt(l.duree_jours) || 7,
          quantite: parseInt(l.quantite) || 1,
        })),
      });
      setShowForm(false);
      setForm({
        type_consultation: "", motif: "", consultation_id: "", medecin_id: "", medecin_nom_libre: "",
        notes: "", date_expiration: "", date_debut_traitement: "", structure_id: "", structure_nom: "", adresse_structure: "",
        lignes: [{ medicament_nom: "", dosage: "", forme: "comprimes", posologie: "", duree_jours: 7, quantite: 1 }],
      });
      await fetchData();
    } catch (e) {
      console.error("Erreur création ordonnance", e);
    } finally {
      setSaving(false);
    }
  };

  const handleRenew = async (o) => {
    setRenewingId(o.id);
    try {
      await post(`/api/ordonnances/${o.id}/renew`);
      await fetchData();
    } catch (e) {
      console.error("Erreur renouvellement", e);
    } finally {
      setRenewingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="animate-spin text-blue-500" size={32} />
      </div>
    );
  }

  const inputClass = `w-full px-3 py-2 rounded-xl border text-sm outline-none ${darkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : "bg-white border-gray-300 text-gray-900 placeholder-gray-400"}`;
  const smallInputClass = `w-full px-2.5 py-1.5 rounded-lg border text-xs outline-none ${darkMode ? "bg-gray-600 border-gray-500 text-white placeholder-gray-400" : "bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400"}`;
  const labelClass = `text-xs font-medium mb-1 block ${darkMode ? "text-gray-400" : "text-gray-600"}`;
  const smallLabelClass = `text-[10px] font-medium mb-0.5 block ${darkMode ? "text-gray-400" : "text-gray-500"}`;

  return (
    <div className={`p-6 min-h-screen ${darkMode ? "bg-gray-900 text-white" : "bg-gray-50"}`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-blue-500">Prescriptions</h1>
          <p className={`text-sm mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            Vos ordonnances actives
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition ${showForm
              ? "bg-red-100 text-red-600 hover:bg-red-200"
              : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
        >
          {showForm ? <><X size={16} /> Annuler</> : <><Plus size={16} /> Nouvelle ordonnance</>}
        </button>
      </div>

      {showForm && (
        <div className={`p-5 rounded-2xl border mb-6 space-y-4 ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200 shadow-sm"}`}>
          <p className={`text-sm font-semibold ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
            Nouvelle ordonnance de médicaments
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Type de consultation *</label>
              <select value={form.type_consultation} onChange={(e) => setForm(f => ({ ...f, type_consultation: e.target.value }))} className={inputClass}>
                <option value="">Sélectionner...</option>
                <option value="consultation_generale">Consultation générale</option>
                <option value="consultation_specialiste">Consultation spécialiste</option>
                <option value="suivi">Suivi</option>
                <option value="urgence">Urgence</option>
                <option value="teleconsultation">Téléconsultation</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Motif *</label>
              <input type="text" value={form.motif} onChange={(e) => setForm(f => ({ ...f, motif: e.target.value }))}
                placeholder="Ex: Douleur persistante, renouvellement..." className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Médecin *</label>
              {mesMedecins.length > 0 ? (
                <>
                  <select
                    value={form.medecin_id}
                    onChange={(e) => {
                      const selectedId = e.target.value;
                      if (selectedId === "__autre__") {
                        setForm(f => ({ ...f, medecin_id: "__autre__", medecin_nom_libre: "" }));
                      } else {
                        const selectedMed = mesMedecins.find(m => m.id === selectedId);
                        const matchedStruct = selectedMed?.structure_id
                          ? structures.find(s => s.id === selectedMed.structure_id)
                          : null;

                        setForm(f => ({
                          ...f,
                          medecin_id: selectedId,
                          medecin_nom_libre: "",
                          ...(matchedStruct ? {
                            structure_id: matchedStruct.id,
                            structure_nom: matchedStruct.nom_etablissement || "",
                            adresse_structure: matchedStruct.adresse || matchedStruct.ville || "",
                          } : {})
                        }));
                      }
                    }}
                    className={inputClass}
                  >
                    <option value="">Sélectionner un médecin...</option>
                    {mesMedecins.map(m => (
                      <option key={m.id} value={m.id}>
                        Dr. {m.prenom || ""} {m.nom || ""}{m.specialite ? ` (${m.specialite})` : ""}
                      </option>
                    ))}
                    <option value="__autre__">Autre (saisir le nom)</option>
                  </select>
                  {form.medecin_id === "__autre__" && (
                    <input type="text" value={form.medecin_nom_libre} onChange={(e) => setForm(f => ({ ...f, medecin_nom_libre: e.target.value }))}
                      placeholder="Nom du médecin" className={`${inputClass} mt-2`} />
                  )}
                </>
              ) : (
                <input type="text" value={form.medecin_nom_libre} onChange={(e) => setForm(f => ({ ...f, medecin_nom_libre: e.target.value }))}
                  placeholder="Nom du médecin" className={inputClass} />
              )}
            </div>
            <div>
              <label className={labelClass}>Consultation</label>
              <select value={form.consultation_id} onChange={(e) => setForm(f => ({ ...f, consultation_id: e.target.value }))} className={inputClass}>
                <option value="">Aucune consultation liée</option>
                {consultations.map(c => (
                  <option key={c.id} value={c.id}>{c.date || c.date_heure_debut?.slice(0, 10)} — {c.motif || "Consultation"}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Structure (Établissement)</label>
              {structures.length > 0 ? (
                <>
                  <select
                    value={form.structure_id || (form.structure_nom ? "__autre__" : "")}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "__autre__") {
                        setForm(f => ({ ...f, structure_id: "__autre__", structure_nom: "", adresse_structure: "" }));
                      } else if (!val) {
                        setForm(f => ({ ...f, structure_id: "", structure_nom: "", adresse_structure: "" }));
                      } else {
                        const st = structures.find(s => s.id === val);
                        setForm(f => ({
                          ...f,
                          structure_id: val,
                          structure_nom: st ? st.nom_etablissement : "",
                          adresse_structure: st ? (st.adresse || st.ville || "") : "",
                        }));
                      }
                    }}
                    className={inputClass}
                  >
                    <option value="">Sélectionner une structure...</option>
                    {structures.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.nom_etablissement} {s.ville ? `(${s.ville})` : ""}
                      </option>
                    ))}
                    <option value="__autre__">Autre (saisir le nom)</option>
                  </select>
                  {(form.structure_id === "__autre__" || (!form.structure_id && form.structure_nom)) && (
                    <input
                      type="text"
                      value={form.structure_nom}
                      onChange={(e) => setForm(f => ({ ...f, structure_nom: e.target.value }))}
                      placeholder="Nom de la structure"
                      className={`${inputClass} mt-2`}
                    />
                  )}
                </>
              ) : (
                <input
                  type="text"
                  value={form.structure_nom}
                  onChange={(e) => setForm(f => ({ ...f, structure_nom: e.target.value }))}
                  placeholder="Nom de la structure (optionnel)"
                  className={inputClass}
                />
              )}
            </div>
            <div>
              <label className={labelClass}>Adresse de la structure</label>
              <input type="text" value={form.adresse_structure} onChange={(e) => setForm(f => ({ ...f, adresse_structure: e.target.value }))}
                placeholder="Adresse (ex: 123 Rue de la Santé, Douala)" className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className={labelClass}>Début traitement</label>
              <input type="date" value={form.date_debut_traitement} onChange={(e) => setForm(f => ({ ...f, date_debut_traitement: e.target.value }))} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Expiration</label>
              <input type="date" value={form.date_expiration} onChange={(e) => setForm(f => ({ ...f, date_expiration: e.target.value }))} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Notes</label>
              <input type="text" value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Notes complémentaires (optionnel)" className={inputClass} />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className={`text-xs font-semibold uppercase ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Médicaments</label>
              <button onClick={addLigne} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium">
                <Plus size={12} /> Ajouter
              </button>
            </div>
            <div className="space-y-3">
              {form.lignes.map((ligne, idx) => (
                <div key={idx} className={`p-3 rounded-lg border ${darkMode ? "bg-gray-700 border-gray-600" : "bg-gray-50 border-gray-200"}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-semibold ${darkMode ? "text-gray-300" : "text-gray-500"}`}>Médicament {idx + 1}</span>
                    {form.lignes.length > 1 && (
                      <button onClick={() => removeLigne(idx)} className="text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <MedicamentSearch
                      value={ligne.medicament_nom}
                      darkMode={darkMode}
                      onSelect={(med) => {
                        updateLigne(idx, "medicament_nom", med.nom_commercial);
                        if (med.dosage) updateLigne(idx, "dosage", med.dosage);
                        if (med.forme) updateLigne(idx, "forme", med.forme);
                      }}
                      placeholder="Nom"
                      className="col-span-1"
                    />
                    <input placeholder="Dosage (ex: 500mg)" value={ligne.dosage} onChange={(e) => updateLigne(idx, "dosage", e.target.value)} className={smallInputClass} />
                    <select value={ligne.forme} onChange={(e) => updateLigne(idx, "forme", e.target.value)} className={smallInputClass}>
                      {FORMES.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                    <div>
                      <label className={smallLabelClass}>Nb boîtes/Flacons</label>
                      <input type="number" min="1" value={ligne.quantite} onChange={(e) => updateLigne(idx, "quantite", e.target.value)} className={smallInputClass} />
                    </div>
                  </div>
                  <div className="mt-2">
                    <PosologieBuilder
                      darkMode={darkMode}
                      dureeJours={Number(ligne.duree_jours) || 7}
                      value={ligne.posologieConfig}
                      onChange={(config) => {
                        updateLigne(idx, "posologie", config.posologie);
                        updateLigne(idx, "posologieConfig", config);
                        if (config.dureeJours) updateLigne(idx, "duree_jours", config.dureeJours);
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <button onClick={handleSubmit} disabled={saving || !form.type_consultation || !form.motif.trim() || !hasMedecin || !hasLignes}
              className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition">
              {saving ? "Création..." : "Créer l'ordonnance"}
            </button>
          </div>
        </div>
      )}

      <div className={`flex items-center gap-2 border rounded-xl px-4 py-2.5 mb-6
        ${darkMode ? "bg-gray-800 border-gray-600" : "bg-white border-gray-200"}`}>
        <Search size={16} className="text-gray-400" />
        <input value={recherche} onChange={(e) => setRecherche(e.target.value)}
          placeholder="Rechercher un médicament..."
          className={`outline-none text-sm w-full ${darkMode ? "bg-gray-800 text-white placeholder-gray-500" : ""}`} />
      </div>

      <div className="flex flex-col gap-4">
        {filtered.map((o) => (
          <div key={o.id}
            className={`p-5 rounded-2xl shadow flex justify-between items-center ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-100 text-blue-500">
                <FileText size={20} />
              </div>
              <div>
                <p className={`font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>
                  {o.lignes?.[0]?.medicament_nom || 'Ordonnance'} {o.lignes?.[0]?.dosage ? `— ${o.lignes[0].dosage}` : ''}
                </p>
                <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  {o.lignes?.length > 0 ? `${o.lignes.length} médicament${o.lignes.length > 1 ? 's' : ''}` : 'Aucun médicament'} · {o.numero}
                </p>
                {o.lignes?.[0]?.posologie && (
                  <p className={`text-xs mt-0.5 ${darkMode ? "text-blue-300" : "text-blue-600"}`}>
                    {o.lignes[0].posologie}
                  </p>
                )}
                <p className={`text-xs mt-0.5 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
                  {o.medecin_nom_libre || ''}
                </p>
                <p className="text-xs mt-0.5">
                  {o.date_emission ? new Date(o.date_emission).toLocaleDateString('fr-FR', { timeZone: getUserTimezone() }) : ''}
                  {o.statut_traitement === "EN_COURS" && <span className="ml-2 text-red-500 font-semibold">En cours</span>}
                  {o.statut_traitement === "TERMINE" && <span className="ml-2 text-green-500 font-semibold">Terminé</span>}
                  {o.statut_traitement === "ARRETE" && <span className="ml-2 text-red-500 font-semibold">Arrêté{o.motif_arret_traitement ? ` — ${o.motif_arret_traitement}` : ""}</span>}
                  {!o.statut_traitement && <span className="ml-2 text-gray-400">Non démarré</span>}
                </p>
                {progressions[o.id] && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className={`flex-1 h-1.5 rounded-full overflow-hidden ${darkMode ? "bg-gray-600" : "bg-gray-200"}`}>
                      <div
                        className={`h-1.5 rounded-full transition-all ${
                          progressions[o.id].couleur === "vert" ? "bg-green-500" : "bg-red-400"
                        }`}
                        style={{ width: `${progressions[o.id].pourcentage}%` }}
                      />
                    </div>
                    <span className={`text-[10px] font-bold ${
                      progressions[o.id].couleur === "vert" ? "text-green-500" : "text-red-500"
                    }`}>
                      {progressions[o.id].jours_effectues}j/{progressions[o.id].duree_totale}j
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleRenew(o)}
                disabled={renewingId === o.id || (o.nb_renouvellements >= o.nb_renouvellements_max && o.nb_renouvellements_max > 0)}
                title="Renouveler cette ordonnance"
                className={`px-4 py-2 text-sm rounded-xl transition-all flex items-center gap-1.5 ${
                  renewingId === o.id
                    ? "bg-gray-300 text-gray-500 cursor-wait"
                    : o.nb_renouvellements_max > 0 && o.nb_renouvellements >= o.nb_renouvellements_max
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-700 text-white"
                }`}
              >
                <RefreshCw size={14} className={renewingId === o.id ? "animate-spin" : ""} />
                {renewingId === o.id ? "..." : "Renouveler"}
              </button>
              <button onClick={() => navigate(`/prescription/${o.id}`)}
                className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all">
                Détails
              </button>
            </div>
          </div>
        ))}

        {!loading && filtered.length === 0 && (
          <div className={`text-center py-10 rounded-2xl ${darkMode ? "bg-gray-800 text-gray-400" : "bg-white text-gray-500"}`}>
            Aucune ordonnance trouvée.
          </div>
        )}
      </div>
    </div>
  );
}
