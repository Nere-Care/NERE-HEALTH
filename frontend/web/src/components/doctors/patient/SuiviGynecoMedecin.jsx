import { useState, useEffect, useRef } from "react";
import {
  Stethoscope, Shield, Baby, CalendarDays, Heart,
  ChevronDown, ChevronUp, Trash2, Plus, X, AlertCircle,
  Calendar, Loader, Upload, FileText, Eye, ClipboardList,
  Pencil, Lock, Unlock,
} from "lucide-react";
import { put, get } from "../../../services/apiClient";
import { DOC_TYPES } from "../../../constants/medicalOptions";
import ObstetricTimeline from "../../common/ObstetricTimeline";
import Modal from "../../common/Modal";

const INFO_TIPS = {
  date_prevue: "Date à laquelle cette visite était initialement prévue selon le calendrier prénatal.",
  date_reelle: "Date à laquelle la visite a effectivement eu lieu.",
  age_gestationnel: "Nombre de semaines d'aménorrhée (SA) au moment de la visite.",
  ta_max: "Tension artérielle systolique (la plus élevée). Normal: < 14.",
  ta_min: "Tension artérielle diastolique (la plus basse). Normal: < 9.",
  poids: "Poids de la patiente au moment de la visite.",
  hauteur_uterine: "Distance en cm du pubis au sommet de l'utérus.",
  rcf: "Rythme cardiaque fœtal. Normal: 110–160 bpm.",
  proteinurie: "Recherche de protéines dans les urines. Peut révéler un risque de pré-éclampsie.",
  glycemie: "Taux de sucre dans le sang. À jeun, normal: 0.70–1.10 g/L.",
  biomtrie: "Poids estimé du fœtus, mesures (BIP, CF, PA).",
  presentation: "Position du bébé dans l'utérus. Céphalique = normal pour l'accouchement.",
  liquide: "Quantité de liquide amniotique. Oligoamnios = trop peu, Polyamnios = trop.",
  prochaine: "Date de la prochaine visite prénatale recommandée.",
};

function InfoTip({ text, darkMode }) {
  return (
    <span className="relative group inline-flex ml-1 cursor-help">
      <AlertCircle size={11} className={`${darkMode ? "text-gray-500" : "text-gray-400"} group-hover:text-blue-500 transition`} />
      <span className={`absolute bottom-full left-0 mb-1.5 w-56 p-2 rounded-lg text-[10px] leading-tight opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 ${darkMode ? "bg-gray-600 text-gray-200" : "bg-gray-800 text-white"} shadow-lg`}>
        {text}
      </span>
    </span>
  );
}

function TooltipLabel({ label, tip, darkMode }) {
  return (
    <label className={`text-xs mb-1 flex items-center ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
      {label} {tip && <InfoTip text={tip} darkMode={darkMode} />}
    </label>
  );
}

/* ── Prenatal Visits Timeline (côté médecin) ── */
function PrenatalVisitsTimeline({ visites, onUpdate, grossesses, darkMode, readOnly }) {
  const [expandedId, setExpandedId] = useState(null);
  const grossesseEnCours = grossesses.find((g) => g.issue === "Grossesse en cours");
  const dateDebut = grossesseEnCours?.date_debut || "";

  const calcWeeks = (dateStr) => {
    if (!dateDebut || !dateStr) return "";
    const diff = (new Date(dateStr) - new Date(dateDebut)) / (1000 * 60 * 60 * 24 * 7);
    return diff >= 0 ? Math.round(diff) : "";
  };

  const statusColor = {
    completee: { bg: darkMode ? "bg-green-900/30" : "bg-green-100", text: darkMode ? "text-green-400" : "text-green-700" },
    planifiee: { bg: darkMode ? "bg-yellow-900/30" : "bg-yellow-100", text: darkMode ? "text-yellow-400" : "text-yellow-700" },
    non_planifiee: { bg: darkMode ? "bg-gray-700/50" : "bg-gray-100", text: darkMode ? "text-gray-400" : "text-gray-500" },
  };
  const statusLabel = { completee: "Complétée", planifiee: "Planifiée", non_planifiee: "Non planifiée" };

  const handleUpdate = (id, updates) => onUpdate(visites.map((v) => (v.id === id ? { ...v, ...updates } : v)));
  const handleDelete = (id) => { if (window.confirm("Supprimer cette visite ?")) onUpdate(visites.filter((v) => v.id !== id)); };

  const addVisit = () => {
    const newVisit = {
      id: Date.now(), numero: `VP${visites.length + 1}`, statut: "non_planifiee",
      date_prevue: "", date_reelle: "", lieu: "", praticien: "", age_gestationnel: "",
      ta_systolique: "", ta_diastolique: "", poids: "", hauteur_uterine: "", rcf: "",
      oeudemes: "", proteinurie: "", glycemie: "", groupe_sanguin_confirme: false,
      anticorps: "", rubeole: "", syphilis: "", hbs_ag: "", vih: "", toxoplasmose: "",
      echo_realisee: false, echo_date: "", echo_biometrie: "", echo_presentation: "", echo_liquide: "",
      traitement: "", prochaine_visite: "", observations: "", documents: [],
    };
    onUpdate([newVisit, ...visites]);
    setExpandedId(newVisit.id);
  };

  const handleFileUpload = async (visitId, file) => {
    if (!file) return;
    try {
      const reader = new FileReader();
      const base64 = await new Promise((resolve, reject) => { reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(file); });
      const visit = visites.find((v) => v.id === visitId);
      const newDoc = { id: Date.now(), nom: file.name, type: "", url: base64, taille: file.size, mime: file.type };
      handleUpdate(visitId, { documents: [...(visit?.documents || []), newDoc] });
    } catch (err) { console.error("File read error:", err); }
  };

  const handleDocType = (visitId, docId, type) => {
    const visit = visites.find((v) => v.id === visitId);
    if (!visit) return;
    handleUpdate(visitId, { documents: (visit.documents || []).map((d) => (d.id === docId ? { ...d, type } : d)) });
  };

  const handleRemoveDoc = (visitId, docId) => {
    const visit = visites.find((v) => v.id === visitId);
    if (!visit) return;
    handleUpdate(visitId, { documents: (visit.documents || []).filter((d) => d.id !== docId) });
  };

  const sorted = [...visites].sort((a, b) => (parseInt((a.numero || "").replace(/\D/g, "")) || 0) - (parseInt((b.numero || "").replace(/\D/g, "")) || 0));

  return (
    <div className="relative">
      <div className={`absolute left-6 top-0 bottom-0 w-0.5 ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} />
      <div className="space-y-4">
        {sorted.map((v) => {
          const sc = statusColor[v.statut] || statusColor.non_planifiee;
          const isExpanded = expandedId === v.id;
          const weeksCalc = v.date_reelle ? calcWeeks(v.date_reelle) : (v.date_prevue ? calcWeeks(v.date_prevue) : v.age_gestationnel);

          return (
            <div key={v.id} className="relative flex gap-4">
              <div className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${sc.bg} ${sc.text} shadow-sm`}>
                <Stethoscope size={18} />
              </div>
              <div className={`flex-1 border rounded-2xl transition-all duration-300 overflow-hidden ${isExpanded ? "shadow-md" : "hover:shadow-sm"} ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
                <div className={`p-4 cursor-pointer flex items-center justify-between ${isExpanded ? (darkMode ? "bg-gray-750" : "bg-gray-50") : ""}`} onClick={() => setExpandedId(isExpanded ? null : v.id)}>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className={`font-semibold text-sm ${darkMode ? "text-white" : "text-gray-800"}`}>{v.numero || `VP${visites.indexOf(v) + 1}`}</h4>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${sc.bg} ${sc.text}`}>{statusLabel[v.statut]}</span>
                      {weeksCalc !== "" && <span className={`text-[10px] ${darkMode ? "text-gray-500" : "text-gray-400"}`}>~{weeksCalc} SA</span>}
                    </div>
                    {!isExpanded && (
                      <div className={`mt-1 text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                        <span>{v.date_reelle || v.date_prevue || "Pas de date"}</span>
                        {v.poids && <span className="ml-2">• {v.poids} kg</span>}
                        {v.ta_systolique && <span className="ml-2">• TA {v.ta_systolique}/{v.ta_diastolique}</span>}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button disabled={readOnly} onClick={(e) => { e.stopPropagation(); handleDelete(v.id); }} className={`p-1.5 rounded-lg transition-colors ${readOnly ? "opacity-30 cursor-not-allowed" : ""} ${darkMode ? "hover:bg-gray-700 text-gray-400 hover:text-red-400" : "hover:bg-gray-100 text-gray-400 hover:text-red-500"}`}><Trash2 size={14} /></button>
                    {isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-4 pt-0 border-t border-dashed animate-in fade-in slide-in-from-top-2 duration-200 space-y-5 mt-3">
                    {/* Général */}
                    <Section title="Informations générales" darkMode={darkMode}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <FieldV label="Numéro" value={v.numero} onChange={(val) => handleUpdate(v.id, { numero: val })} placeholder="VP1" darkMode={darkMode} />
                        <div>
                          <label className={`text-xs mb-1 block ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Statut</label>
                          <select value={v.statut} onChange={(e) => handleUpdate(v.id, { statut: e.target.value })} className={`w-full border rounded-lg px-3 py-2 text-sm outline-none ${darkMode ? "bg-gray-800 border-gray-600" : "bg-white border-gray-200"}`}>
                            <option value="non_planifiee">Non planifiée</option>
                            <option value="planifiee">Planifiée</option>
                            <option value="completee">Complétée</option>
                          </select>
                        </div>
                        <div>
                          <TooltipLabel label="Date prévue" tip={INFO_TIPS.date_prevue} darkMode={darkMode} />
                          <input type="date" value={v.date_prevue || ""} onChange={(e) => handleUpdate(v.id, { date_prevue: e.target.value })} className={`w-full border rounded-lg px-3 py-2 text-sm outline-none ${darkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-200"}`} />
                        </div>
                        <div>
                          <TooltipLabel label="Date réelle" tip={INFO_TIPS.date_reelle} darkMode={darkMode} />
                          <input type="date" value={v.date_reelle || ""} onChange={(e) => handleUpdate(v.id, { date_reelle: e.target.value })} className={`w-full border rounded-lg px-3 py-2 text-sm outline-none ${darkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-200"}`} />
                        </div>
                        <FieldV label="Lieu / Structure" value={v.lieu} onChange={(val) => handleUpdate(v.id, { lieu: val })} placeholder="Hôpital..." darkMode={darkMode} />
                        <FieldV label="Praticien" value={v.praticien} onChange={(val) => handleUpdate(v.id, { praticien: val })} placeholder="Dr..." darkMode={darkMode} />
                        <div>
                          <TooltipLabel label="Âge gestationnel (SA)" tip={INFO_TIPS.age_gestationnel} darkMode={darkMode} />
                          <input type="number" min="0" value={v.age_gestationnel || ""} onChange={(e) => handleUpdate(v.id, { age_gestationnel: e.target.value })} placeholder={dateDebut ? `~${calcWeeks(new Date().toISOString().split("T")[0]) || "?"}` : "Ex: 20"} className={`w-full border rounded-lg px-3 py-2 text-sm outline-none ${darkMode ? "bg-gray-800 border-gray-600 text-white placeholder:text-gray-600" : "bg-white border-gray-200 placeholder:text-gray-400"}`} />
                        </div>
                      </div>
                    </Section>

                    {/* Constantes */}
                    <Section title="Constantes" darkMode={darkMode}>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <TooltipLabel label="TA max" tip={INFO_TIPS.ta_max} darkMode={darkMode} />
                            <input type="number" value={v.ta_systolique || ""} onChange={(e) => handleUpdate(v.id, { ta_systolique: e.target.value })} placeholder="12" className={`w-full border rounded-lg px-3 py-2 text-sm outline-none ${darkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-200"}`} />
                          </div>
                          <div>
                            <TooltipLabel label="TA min" tip={INFO_TIPS.ta_min} darkMode={darkMode} />
                            <input type="number" value={v.ta_diastolique || ""} onChange={(e) => handleUpdate(v.id, { ta_diastolique: e.target.value })} placeholder="8" className={`w-full border rounded-lg px-3 py-2 text-sm outline-none ${darkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-200"}`} />
                          </div>
                        </div>
                        <div>
                          <TooltipLabel label="Poids (kg)" tip={INFO_TIPS.poids} darkMode={darkMode} />
                          <input type="number" step="0.1" value={v.poids || ""} onChange={(e) => handleUpdate(v.id, { poids: e.target.value })} className={`w-full border rounded-lg px-3 py-2 text-sm outline-none ${darkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-200"}`} />
                        </div>
                        <div>
                          <TooltipLabel label="Hauteur utérine (cm)" tip={INFO_TIPS.hauteur_uterine} darkMode={darkMode} />
                          <input type="number" step="0.5" value={v.hauteur_uterine || ""} onChange={(e) => handleUpdate(v.id, { hauteur_uterine: e.target.value })} className={`w-full border rounded-lg px-3 py-2 text-sm outline-none ${darkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-200"}`} />
                        </div>
                        <div>
                          <TooltipLabel label="RCF (bpm)" tip={INFO_TIPS.rcf} darkMode={darkMode} />
                          <input type="number" value={v.rcf || ""} onChange={(e) => handleUpdate(v.id, { rcf: e.target.value })} placeholder="140" className={`w-full border rounded-lg px-3 py-2 text-sm outline-none ${darkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-200"}`} />
                        </div>
                        <div>
                          <label className={`text-xs mb-1 block ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Œdèmes</label>
                          <select value={v.oeudemes || ""} onChange={(e) => handleUpdate(v.id, { oeudemes: e.target.value })} className={`w-full border rounded-lg px-3 py-2 text-sm outline-none ${darkMode ? "bg-gray-800 border-gray-600" : "bg-white border-gray-200"}`}>
                            <option value="">Non évalué</option><option value="Non">Non</option><option value="Légers">Légers</option><option value="Importants">Importants</option>
                          </select>
                        </div>
                        <div>
                          <TooltipLabel label="Protéinurie" tip={INFO_TIPS.proteinurie} darkMode={darkMode} />
                          <select value={v.proteinurie || ""} onChange={(e) => handleUpdate(v.id, { proteinurie: e.target.value })} className={`w-full border rounded-lg px-3 py-2 text-sm outline-none ${darkMode ? "bg-gray-800 border-gray-600" : "bg-white border-gray-200"}`}>
                            <option value="">Non faite</option><option value="Négative">Négative</option><option value="Positive">Positive</option>
                          </select>
                        </div>
                        <div>
                          <TooltipLabel label="Glycémie (g/L)" tip={INFO_TIPS.glycemie} darkMode={darkMode} />
                          <input type="number" step="0.01" value={v.glycemie || ""} onChange={(e) => handleUpdate(v.id, { glycemie: e.target.value })} placeholder="0.85" className={`w-full border rounded-lg px-3 py-2 text-sm outline-none ${darkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-200"}`} />
                        </div>
                      </div>
                    </Section>

                    {/* Biologie */}
                    <Section title="Biologie" darkMode={darkMode}>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        <label className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer text-sm ${v.groupe_sanguin_confirme ? (darkMode ? "bg-blue-900/30 text-blue-300" : "bg-blue-50 text-blue-700") : (darkMode ? "bg-gray-800 text-gray-300" : "bg-white text-gray-600 border border-gray-200")}`}>
                          <input type="checkbox" checked={v.groupe_sanguin_confirme || false} onChange={(e) => handleUpdate(v.id, { groupe_sanguin_confirme: e.target.checked })} className="accent-blue-500" />
                          Groupe sanguin confirmé
                        </label>
                        {[
                          { label: "Anticorps", field: "anticorps", options: ["", "Faite", "Non faite", "Anormale"] },
                          { label: "Rubéole (IgG)", field: "rubeole", options: ["", "Négative", "Positive", "Non faite"] },
                          { label: "Syphilis (VDRL)", field: "syphilis", options: ["", "Négative", "Positive", "Non faite"] },
                          { label: "Hbs Ag", field: "hbs_ag", options: ["", "Négatif", "Positif", "Non fait"] },
                          { label: "VIH", field: "vih", options: ["", "Négatif", "Positif", "Non fait"] },
                          { label: "Toxoplasmose", field: "toxoplasmose", options: ["", "Négative", "Positive", "Non faite"] },
                        ].map(({ label, field, options }) => (
                          <div key={field}>
                            <label className={`text-xs mb-1 block ${darkMode ? "text-gray-300" : "text-gray-600"}`}>{label}</label>
                            <select value={v[field] || ""} onChange={(e) => handleUpdate(v.id, { [field]: e.target.value })} className={`w-full border rounded-lg px-3 py-2 text-sm outline-none ${darkMode ? "bg-gray-800 border-gray-600" : "bg-white border-gray-200"}`}>
                              {options.map((o) => <option key={o} value={o}>{o || "Non fait"}</option>)}
                            </select>
                          </div>
                        ))}
                      </div>
                    </Section>

                    {/* Échographie */}
                    <Section title="Échographie" darkMode={darkMode}>
                      <label className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer text-sm mb-3 ${v.echo_realisee ? (darkMode ? "bg-purple-900/30 text-purple-300" : "bg-purple-50 text-purple-700") : (darkMode ? "bg-gray-800 text-gray-300" : "bg-white text-gray-600 border border-gray-200")}`}>
                        <input type="checkbox" checked={v.echo_realisee || false} onChange={(e) => handleUpdate(v.id, { echo_realisee: e.target.checked })} className="accent-purple-500" />
                        Échographie réalisée lors de cette visite
                      </label>
                      {v.echo_realisee && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className={`text-xs mb-1 block ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Date écho</label>
                            <input type="date" value={v.echo_date || ""} onChange={(e) => handleUpdate(v.id, { echo_date: e.target.value })} className={`w-full border rounded-lg px-3 py-2 text-sm outline-none ${darkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-200"}`} />
                          </div>
                          <div>
                            <TooltipLabel label="Biométrie fœtale" tip={INFO_TIPS.biomtrie} darkMode={darkMode} />
                            <input value={v.echo_biometrie || ""} onChange={(e) => handleUpdate(v.id, { echo_biometrie: e.target.value })} placeholder="BIP, PA, Poids estimé..." className={`w-full border rounded-lg px-3 py-2 text-sm outline-none ${darkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-200"}`} />
                          </div>
                          <div>
                            <TooltipLabel label="Présentation fœtale" tip={INFO_TIPS.presentation} darkMode={darkMode} />
                            <select value={v.echo_presentation || ""} onChange={(e) => handleUpdate(v.id, { echo_presentation: e.target.value })} className={`w-full border rounded-lg px-3 py-2 text-sm outline-none ${darkMode ? "bg-gray-800 border-gray-600" : "bg-white border-gray-200"}`}>
                              <option value="">Non précisé</option><option value="Céphalique">Céphalique</option><option value="Siège">Siège</option><option value="Transverse">Transverse</option>
                            </select>
                          </div>
                          <div>
                            <TooltipLabel label="Liquide amniotique" tip={INFO_TIPS.liquide} darkMode={darkMode} />
                            <select value={v.echo_liquide || ""} onChange={(e) => handleUpdate(v.id, { echo_liquide: e.target.value })} className={`w-full border rounded-lg px-3 py-2 text-sm outline-none ${darkMode ? "bg-gray-800 border-gray-600" : "bg-white border-gray-200"}`}>
                              <option value="">Non précisé</option><option value="Normal">Normal</option><option value="Oligoamnios">Oligoamnios</option><option value="Polyamnios">Polyamnios</option>
                            </select>
                          </div>
                        </div>
                      )}
                    </Section>

                    {/* Prescription & Suivi */}
                    <Section title="Prescription & Suivi" darkMode={darkMode}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className={`text-xs mb-1 block ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Traitement prescrit</label>
                          <textarea value={v.traitement || ""} onChange={(e) => handleUpdate(v.id, { traitement: e.target.value })} rows={2} placeholder="Acide folique, fer..." className={`w-full border rounded-lg px-3 py-2 text-sm outline-none resize-none ${darkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-200"}`} />
                        </div>
                        <div>
                          <TooltipLabel label="Prochaine visite prévue" tip={INFO_TIPS.prochaine} darkMode={darkMode} />
                          <input type="date" value={v.prochaine_visite || ""} onChange={(e) => handleUpdate(v.id, { prochaine_visite: e.target.value })} className={`w-full border rounded-lg px-3 py-2 text-sm outline-none ${darkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-200"}`} />
                        </div>
                        <div className="md:col-span-2">
                          <label className={`text-xs mb-1 block ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Observations</label>
                          <textarea value={v.observations || ""} onChange={(e) => handleUpdate(v.id, { observations: e.target.value })} rows={2} placeholder="Notes..." className={`w-full border rounded-lg px-3 py-2 text-sm outline-none resize-none ${darkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-200"}`} />
                        </div>
                      </div>
                    </Section>

                    {/* Documents */}
                    <Section title="Documents joints" darkMode={darkMode}>
                      <div className="space-y-2">
                        {(v.documents || []).map((doc) => (
                          <div key={doc.id} className={`flex items-center gap-2 p-2 rounded-lg ${darkMode ? "bg-gray-800" : "bg-white border border-gray-200"}`}>
                            <FileText size={14} className="text-blue-500 flex-shrink-0" />
                            <span className={`text-sm flex-1 truncate ${darkMode ? "text-gray-300" : "text-gray-700"}`}>{doc.nom}</span>
                            <select value={doc.type || ""} onChange={(e) => handleDocType(v.id, doc.id, e.target.value)} className={`text-[10px] border rounded px-1.5 py-1 outline-none max-w-[120px] ${darkMode ? "bg-gray-700 border-gray-600 text-gray-300" : "bg-gray-50 border-gray-200 text-gray-600"}`}>
                              <option value="">Type...</option>
                              {DOC_TYPES.map((dt) => <option key={dt.value} value={dt.value}>{dt.label}</option>)}
                            </select>
                            {doc.url && (
                              <button onClick={() => { const w = window.open("", "_blank"); w.document.write(`<html><head><title>${doc.nom}</title><style>body{margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#f5f5f5;}img{max-width:100%;max-height:100vh;}embed{width:100%;height:100vh;}</style></head><body>${doc.mime?.includes("image") ? `<img src="${doc.url}" alt="${doc.nom}"/>` : `<embed src="${doc.url}" type="${doc.mime || "application/pdf"}"/>`}</body></html>`); w.document.title = doc.nom; }} className={`p-1 rounded transition ${darkMode ? "text-gray-400 hover:text-blue-400 hover:bg-gray-700" : "text-gray-400 hover:text-blue-600 hover:bg-gray-100"}`}><Eye size={14} /></button>
                            )}
                            <button onClick={() => handleRemoveDoc(v.id, doc.id)} className="text-gray-400 hover:text-red-500 flex-shrink-0"><X size={14} /></button>
                          </div>
                        ))}
                      </div>
                      <label className={`mt-2 flex items-center gap-2 p-2 rounded-lg cursor-pointer text-sm transition ${darkMode ? "bg-gray-800 text-gray-400 hover:bg-gray-750" : "bg-white border border-dashed border-gray-300 text-gray-500 hover:border-blue-400"}`}>
                        <Upload size={14} />
                        <span>Ajouter un document</span>
                        <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => { handleFileUpload(v.id, e.target.files?.[0]); e.target.value = ""; }} />
                      </label>
                    </Section>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        <button disabled={readOnly} onClick={addVisit} className={`ml-16 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${readOnly ? "opacity-50 cursor-not-allowed" : ""} ${darkMode ? "bg-gray-700 hover:bg-gray-600 text-white" : "bg-gray-100 hover:bg-gray-200 text-gray-700"}`}>
          <Plus size={16} /> Ajouter une visite prénatale
        </button>
      </div>
    </div>
  );
}

/* ── Small helpers ── */
function Section({ title, darkMode, children }) {
  return (
    <div className={`p-3 rounded-xl ${darkMode ? "bg-gray-700/50" : "bg-gray-50"}`}>
      <h5 className={`text-[10px] uppercase tracking-wider font-bold mb-3 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{title}</h5>
      {children}
    </div>
  );
}

function FieldV({ label, value, onChange, placeholder, darkMode }) {
  return (
    <div>
      <label className={`text-xs mb-1 block ${darkMode ? "text-gray-300" : "text-gray-600"}`}>{label}</label>
      <input value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={`w-full border rounded-lg px-3 py-2 text-sm outline-none ${darkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-200"}`} />
    </div>
  );
}

function Activity(props) {
  return <Stethoscope {...props} />;
}

/* ══════════════════════════════════════════
   COMPOSANT PRINCIPAL — SUIVI GYNÉCO MÉDECIN
   ══════════════════════════════════════════ */
let unlockTimestamp = null;
const UNLOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

export default function SuiviGynecoMedecin({ dossier, patientId, onDossierUpdate, darkMode }) {
  const [data, setData] = useState({
    date_derniere_consultation: "", nom_gynecologue: "",
    dernier_frottis_date: "", dernier_frottis_resultat: "",
    derniere_mammographie_date: "", derniere_mammographie_resultat: "",
    contraception: "", cycles_reguliers: "", observations: "",
    grossesses: [], visites_prenatales: [],
    cycles_regulite: "", cycles_duree_cycle: "", cycles_duree_regles: "",
    cycles_flux: "", cycles_douleurs: "", cycles_date_dernieres_regles: "",
    menopause_statut: "", menopause_age: "", menopause_annee: "",
    menopause_thm: "", menopause_thm_nom: "", menopause_thm_commentaires: "",
    menopause_peri_symptomes: [], menopause_peri_autre: "",
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [canEdit, setCanEdit] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [nssInput, setNssInput] = useState("");
  const [nssError, setNssError] = useState("");
  const [nssVerifying, setNssVerifying] = useState(false);
  const verifiedNss = useRef("");
  const dossierRef = useRef(dossier);
  const saveTimer = useRef(null);

  useEffect(() => {
    dossierRef.current = dossier;
    if (dossier?.antecedents_gyneco) {
      try {
        const x = JSON.parse(dossier.antecedents_gyneco);
        if (typeof x === "object" && x !== null) setData((prev) => ({ ...prev, ...x }));
      } catch {}
    }
  }, [dossier]);

  useEffect(() => {
    if (unlockTimestamp && Date.now() - unlockTimestamp < UNLOCK_DURATION_MS) {
      setCanEdit(true);
    }
  }, []);

  useEffect(() => () => { if (saveTimer.current) clearTimeout(saveTimer.current); }, []);

  const handleChange = (field, value) => {
    const newData = { ...data, [field]: value };
    setData(newData);
    debouncedSave(newData);
  };

  const handleGrossessesChange = (newGrossesses) => {
    const newData = { ...data, grossesses: newGrossesses };
    setData(newData);
    debouncedSave(newData);
  };

  const handleVisitesChange = (newVisites) => {
    const newData = { ...data, visites_prenatales: newVisites };
    setData(newData);
    debouncedSave(newData);
  };

  const debouncedSave = (newData) => {
    if (!canEdit) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setSaving(true); setSaveError(null);
      try {
        const d = dossierRef.current;
        if (d?.id) {
          const updated = await put(`/api/dossiers_medicaux/${d.id}`, { antecedents_gyneco: JSON.stringify(newData), nss: verifiedNss.current });
          dossierRef.current = updated;
          if (onDossierUpdate) onDossierUpdate(updated);
        }
      } catch (err) { console.error(err); setSaveError("Erreur de sauvegarde."); } finally { setSaving(false); }
    }, 1000);
  };

  const handleUnlock = async () => {
    if (!nssInput.trim()) { setNssError("Veuillez entrer le NSS du patient."); return; }
    setNssVerifying(true); setNssError("");
    try {
      const patient = await get(`/api/patients/${patientId}`);
      if (patient && patient.nss && patient.nss.trim() === nssInput.trim()) {
        verifiedNss.current = nssInput.trim();
        unlockTimestamp = Date.now();
        setCanEdit(true);
        setShowUnlockModal(false);
        setNssInput("");
      } else if (patient && !patient.nss) {
        setNssError("Ce patient n'a pas de NSS enregistré. Veuillez enregistrer son NSS d'abord.");
      } else {
        setNssError("NSS incorrect. Vérifiez auprès du patient.");
      }
    } catch {
      setNssError("Impossible de vérifier le NSS. Contactez l'administration.");
    } finally { setNssVerifying(false); }
  };

  const CONTRACEPTION_OPTIONS = [
    "Aucune", "Pilule combinée", "Pilule progestative", "DIU au cuivre",
    "DIU hormonal (Mirena)", "Préservatif masculin", "Préservatif féminin",
    "Implant", "Injectable", "Patch", "Anneau vaginal", "Stérilisation",
    "Methodes naturelles", "Autre",
  ];

  const Field = ({ label, field, type = "text", placeholder = "", options = null }) => (
    <div className="mb-4">
      <label className={`text-xs font-medium mb-1.5 block ${darkMode ? "text-gray-300" : "text-gray-600"}`}>{label}</label>
      {options ? (
        <select value={data[field] || ""} onChange={(e) => handleChange(field, e.target.value)} disabled={!canEdit} className={`w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400 ${!canEdit ? "opacity-60 cursor-not-allowed" : ""} ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "border-gray-200 text-gray-800"}`}>
          <option value="">Sélectionner...</option>
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : type === "date" ? (
        <div className="relative">
          <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="date" value={data[field] || ""} onChange={(e) => handleChange(field, e.target.value)} disabled={!canEdit} className={`w-full border rounded-xl pl-10 pr-3 py-2.5 text-sm outline-none focus:border-blue-400 ${!canEdit ? "opacity-60 cursor-not-allowed" : ""} ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "border-gray-200 text-gray-800"}`} />
        </div>
      ) : (
        <input type="text" value={data[field] || ""} onChange={(e) => handleChange(field, e.target.value)} disabled={!canEdit} placeholder={placeholder} className={`w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400 ${!canEdit ? "opacity-60 cursor-not-allowed" : ""} ${darkMode ? "bg-gray-700 border-gray-600 text-white placeholder:text-gray-500" : "border-gray-200 text-gray-800 placeholder:text-gray-400"}`} />
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {!canEdit && (
        <div className={`rounded-2xl p-4 flex items-center gap-3 ${darkMode ? "bg-gray-800 border border-gray-700" : "bg-white shadow border border-gray-200"}`}>
          <Lock size={20} className="text-amber-500 flex-shrink-0" />
          <div className="flex-1">
            <p className={`text-sm font-medium ${darkMode ? "text-gray-200" : "text-gray-700"}`}>Consultation en lecture seule</p>
            <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Cliquez sur le crayon pour déverrouiller l'édition avec le NSS du patient.</p>
          </div>
          <button onClick={() => setShowUnlockModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition">
            <Pencil size={14} /> Modifier
          </button>
        </div>
      )}

      {/* Unlock Modal */}
      {showUnlockModal && (
        <Modal open={true} onClose={() => { setShowUnlockModal(false); setNssError(""); setNssInput(""); }} title="Déverrouiller l'édition" darkMode={darkMode} size="max-w-sm">
          <p className={`text-xs mb-4 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            Entrez le Numéro de Sécurité Sociale (NSS) du patient pour pouvoir modifier les données gynécologiques.
          </p>
          <input
            type="text" value={nssInput} onChange={(e) => { setNssInput(e.target.value); setNssError(""); }}
            placeholder="NSS du patient"
            autoFocus
            className={`w-full border rounded-xl px-3 py-2.5 text-sm outline-none mb-2 ${darkMode ? "bg-gray-700 border-gray-600 text-white placeholder:text-gray-500" : "border-gray-200 text-gray-800"}`}
            onKeyDown={(e) => { if (e.key === "Enter") handleUnlock(); }}
          />
          {nssError && <p className="text-xs text-red-500 mb-2">{nssError}</p>}
          <div className="flex justify-end gap-2 mt-3">
            <button onClick={() => { setShowUnlockModal(false); setNssError(""); setNssInput(""); }} className="px-4 py-2 rounded-xl text-sm font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 transition">
              Annuler
            </button>
            <button onClick={handleUnlock} disabled={nssVerifying} className="px-4 py-2 rounded-xl text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-1">
              {nssVerifying && <Loader size={14} className="animate-spin" />}
              {nssVerifying ? "Vérification..." : "Déverrouiller"}
            </button>
          </div>
        </Modal>
      )}

      {saveError && (
        <div className={`rounded-xl px-4 py-3 text-sm font-medium flex items-center gap-2 ${darkMode ? "bg-red-900/30 text-red-300 border border-red-700/50" : "bg-red-50 text-red-700 border border-red-200"}`}>
          <AlertCircle size={14} /> {saveError}
          <button onClick={() => setSaveError(null)} className="ml-auto"><X size={14} /></button>
        </div>
      )}

      {/* 1. Consultation */}
      <div className={`rounded-2xl p-6 ${darkMode ? "bg-gray-800" : "bg-white shadow"}`}>
        <h3 className={`font-semibold mb-4 flex items-center gap-2 ${darkMode ? "text-white" : "text-gray-800"}`}>
          <Stethoscope size={20} className="text-blue-500" /> Consultation
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Date de la dernière consultation" field="date_derniere_consultation" type="date" />
          <Field label="Nom du gynécologue" field="nom_gynecologue" placeholder="Dr. Dupont..." />
        </div>
        <div className={`mt-6 pt-4 border-t ${darkMode ? "border-gray-700" : "border-gray-100"}`}>
          <h4 className={`text-sm font-medium mb-3 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Dernier Frottis</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Date" field="dernier_frottis_date" type="date" />
            <Field label="Résultat (optionnel)" field="dernier_frottis_resultat" placeholder="Normal, Anormal..." />
          </div>
        </div>
        <div className={`mt-4 pt-4 border-t ${darkMode ? "border-gray-700" : "border-gray-100"}`}>
          <h4 className={`text-sm font-medium mb-3 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Dernière Mammographie</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Date" field="derniere_mammographie_date" type="date" />
            <Field label="Résultat (optionnel)" field="derniere_mammographie_resultat" placeholder="BI-RADS 1, Normal..." />
          </div>
        </div>
      </div>

      {/* 2. Contraception */}
      <div className={`rounded-2xl p-6 ${darkMode ? "bg-gray-800" : "bg-white shadow"}`}>
        <h3 className={`font-semibold mb-4 flex items-center gap-2 ${darkMode ? "text-white" : "text-gray-800"}`}>
          <Shield size={20} className="text-purple-500" /> Contraception
        </h3>
        <Field label="Méthode contraceptive utilisée" field="contraception" options={CONTRACEPTION_OPTIONS} />
      </div>

      {/* 3. Historique obstétrical */}
      <div className={`rounded-2xl p-6 ${darkMode ? "bg-gray-800" : "bg-white shadow"}`}>
        <div className="flex items-center justify-between mb-6">
          <h3 className={`font-semibold flex items-center gap-2 ${darkMode ? "text-white" : "text-gray-800"}`}>
            <Baby size={20} className="text-pink-500" /> Historique obstétrical
          </h3>
          <button disabled={!canEdit} onClick={() => {
            if (!canEdit) return;
            const newG = { id: Date.now(), date_debut: "", type_debut: "DDR", dpa: "", nb_enfants: 1, issue: "", type_accouchement: "", date_accouchement: "", date_perte: "", commentaires: "" };
            handleGrossessesChange([newG, ...data.grossesses]);
          }} className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-all ${!canEdit ? "opacity-50 cursor-not-allowed" : ""} ${darkMode ? "bg-gray-700 hover:bg-gray-600 text-white" : "bg-gray-100 hover:bg-gray-200 text-gray-700"}`}>
            <Plus size={16} /> Ajouter une grossesse
          </button>
        </div>
        <ObstetricTimeline grossesses={data.grossesses || []} onUpdate={handleGrossessesChange} darkMode={darkMode} readOnly={!canEdit} />
      </div>

      {/* 4. Visites prénatales (uniquement si grossesse en cours) */}
      {(data.grossesses || []).some((g) => g.issue === "Grossesse en cours") && (
        <div className={`rounded-2xl p-6 ${darkMode ? "bg-gray-800" : "bg-white shadow"}`}>
          <h3 className={`font-semibold mb-6 flex items-center gap-2 ${darkMode ? "text-white" : "text-gray-800"}`}>
            <Stethoscope size={20} className="text-teal-500" /> Visites prénatales
          </h3>
          <PrenatalVisitsTimeline visites={data.visites_prenatales || []} onUpdate={handleVisitesChange} grossesses={data.grossesses || []} darkMode={darkMode} readOnly={!canEdit} />
        </div>
      )}

      {/* 5. Cycles menstruels */}
      <div className={`rounded-2xl p-6 ${darkMode ? "bg-gray-800" : "bg-white shadow"}`}>
        <h3 className={`font-semibold mb-4 flex items-center gap-2 ${darkMode ? "text-white" : "text-gray-800"}`}>
          <CalendarDays size={20} className="text-rose-500" /> Cycles menstruels
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Régularité des cycles" field="cycles_regulite" options={["Réguliers", "Irréguliers", "Absents", "Sous contraception", "Je ne sais pas"]} />
          <div className="mb-4">
            <label className={`text-xs font-medium mb-1.5 block ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Durée moyenne du cycle</label>
            <div className="relative">
              <input type="number" min="0" value={data.cycles_duree_cycle || ""} onChange={(e) => handleChange("cycles_duree_cycle", e.target.value)} disabled={!canEdit} placeholder="28" className={`w-full border rounded-xl px-3 py-2.5 pr-14 text-sm outline-none focus:border-blue-400 ${!canEdit ? "opacity-60 cursor-not-allowed" : ""} ${darkMode ? "bg-gray-700 border-gray-600 text-white placeholder:text-gray-500" : "border-gray-200 text-gray-800 placeholder:text-gray-400"}`} />
              <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs ${darkMode ? "text-gray-500" : "text-gray-400"}`}>jours</span>
            </div>
          </div>
          <div className="mb-4">
            <label className={`text-xs font-medium mb-1.5 block ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Durée moyenne des règles</label>
            <div className="relative">
              <input type="number" min="0" value={data.cycles_duree_regles || ""} onChange={(e) => handleChange("cycles_duree_regles", e.target.value)} disabled={!canEdit} placeholder="5" className={`w-full border rounded-xl px-3 py-2.5 pr-14 text-sm outline-none focus:border-blue-400 ${!canEdit ? "opacity-60 cursor-not-allowed" : ""} ${darkMode ? "bg-gray-700 border-gray-600 text-white placeholder:text-gray-500" : "border-gray-200 text-gray-800 placeholder:text-gray-400"}`} />
              <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs ${darkMode ? "text-gray-500" : "text-gray-400"}`}>jours</span>
            </div>
          </div>
          <Field label="Flux menstruel" field="cycles_flux" options={["Léger", "Normal", "Abondant", "Très abondant"]} />
          <Field label="Douleurs pendant les règles" field="cycles_douleurs" options={["Aucune", "Légères", "Modérées", "Importantes"]} />
          <Field label="Date des dernières règles" field="cycles_date_dernieres_regles" type="date" />
        </div>
      </div>

      {/* 6. Ménopause */}
      <div className={`rounded-2xl p-6 ${darkMode ? "bg-gray-800" : "bg-white shadow"}`}>
        <h3 className={`font-semibold mb-4 flex items-center gap-2 ${darkMode ? "text-white" : "text-gray-800"}`}>
          <Heart size={20} className="text-amber-500" /> Ménopause
        </h3>
        <Field label="Avez-vous atteint la ménopause ?" field="menopause_statut" options={["Non", "Périménopause", "Oui"]} />
        <p className={`text-[11px] mt-1 mb-4 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
          Sélectionnez "Oui" uniquement si confirmé par un professionnel de santé.
        </p>
        {data.menopause_statut === "Oui" && (
          <div className={`p-4 rounded-xl border mt-2 ${darkMode ? "bg-gray-700/40 border-gray-600" : "bg-gray-50 border-gray-200"}`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="mb-4 md:mb-0">
                <label className={`text-xs font-medium mb-1.5 block ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Âge au moment de la ménopause (optionnel)</label>
                <input type="number" min="0" value={data.menopause_age || ""} onChange={(e) => handleChange("menopause_age", e.target.value)} disabled={!canEdit} placeholder="51" className={`w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400 ${!canEdit ? "opacity-60 cursor-not-allowed" : ""} ${darkMode ? "bg-gray-700 border-gray-600 text-white placeholder:text-gray-500" : "border-gray-200 text-gray-800 placeholder:text-gray-400"}`} />
              </div>
              <div className="mb-4 md:mb-0">
                <label className={`text-xs font-medium mb-1.5 block ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Année de la ménopause (optionnel)</label>
                <input type="number" min="1900" max="2099" value={data.menopause_annee || ""} onChange={(e) => handleChange("menopause_annee", e.target.value)} disabled={!canEdit} placeholder="2025" className={`w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400 ${!canEdit ? "opacity-60 cursor-not-allowed" : ""} ${darkMode ? "bg-gray-700 border-gray-600 text-white placeholder:text-gray-500" : "border-gray-200 text-gray-800 placeholder:text-gray-400"}`} />
              </div>
            </div>
            <Field label="Traitement hormonal (THM) ?" field="menopause_thm" options={["Oui", "Non"]} />
            {data.menopause_thm === "Oui" && (
              <div className="mt-2 space-y-4">
                <Field label="Nom du traitement (optionnel)" field="menopause_thm_nom" placeholder="Thérapie combinée..." />
                <div className="mb-4">
                  <label className={`text-xs font-medium mb-1.5 block ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Commentaires (optionnel)</label>
                  <textarea value={data.menopause_thm_commentaires || ""} onChange={(e) => handleChange("menopause_thm_commentaires", e.target.value)} disabled={!canEdit} placeholder="Précisions..." rows={2} className={`w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400 resize-none ${!canEdit ? "opacity-60 cursor-not-allowed" : ""} ${darkMode ? "bg-gray-700 border-gray-600 text-white placeholder:text-gray-500" : "border-gray-200 text-gray-800 placeholder:text-gray-400"}`} />
                </div>
              </div>
            )}
          </div>
        )}
        {data.menopause_statut === "Périménopause" && (
          <div className={`p-4 rounded-xl border mt-2 ${darkMode ? "bg-amber-900/10 border-amber-800/30" : "bg-amber-50 border-amber-200"}`}>
            <p className={`text-xs mb-4 ${darkMode ? "text-amber-300" : "text-amber-700"}`}>
              La périménopause correspond à la période de transition précédant la ménopause.
            </p>
            <label className={`text-xs font-medium mb-2 block ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Symptômes présents</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {["Bouffées de chaleur", "Sueurs nocturnes", "Troubles du sommeil", "Sécheresse vaginale", "Sautes d'humeur", "Cycles irréguliers"].map((sym) => {
                const checked = (data.menopause_peri_symptomes || []).includes(sym);
                return (
                  <label key={sym} className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer text-sm transition ${!canEdit ? "opacity-60" : ""} ${checked ? (darkMode ? "bg-amber-900/30 text-amber-200" : "bg-amber-100 text-amber-800") : (darkMode ? "bg-gray-700/50 text-gray-300 hover:bg-gray-700" : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200")}`}>
                    <input type="checkbox" checked={checked} disabled={!canEdit} onChange={() => { const current = data.menopause_peri_symptomes || []; handleChange("menopause_peri_symptomes", checked ? current.filter((s) => s !== sym) : [...current, sym]); }} className="accent-amber-500" />
                    {sym}
                  </label>
                );
              })}
            </div>
            <div className="mt-3">
              <label className={`text-xs font-medium mb-1.5 block ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Autre symptôme (optionnel)</label>
              <input type="text" value={data.menopause_peri_autre || ""} onChange={(e) => handleChange("menopause_peri_autre", e.target.value)} disabled={!canEdit} placeholder="Décrivez..." className={`w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400 ${!canEdit ? "opacity-60 cursor-not-allowed" : ""} ${darkMode ? "bg-gray-700 border-gray-600 text-white placeholder:text-gray-500" : "border-gray-200 text-gray-800 placeholder:text-gray-400"}`} />
            </div>
          </div>
        )}
      </div>

      {/* Observations */}
      <div className={`rounded-2xl p-6 ${darkMode ? "bg-gray-800" : "bg-white shadow"}`}>
        <h3 className={`font-semibold mb-4 flex items-center gap-2 ${darkMode ? "text-white" : "text-gray-800"}`}>
          <ClipboardList size={20} className="text-gray-500" /> Observations
        </h3>
        <textarea value={data.observations || ""} onChange={(e) => handleChange("observations", e.target.value)} disabled={!canEdit} rows={4} placeholder="Notes, observations cliniques, pistes de suivi..."
          className={`w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400 resize-none ${!canEdit ? "opacity-60 cursor-not-allowed" : ""} ${darkMode ? "bg-gray-700 border-gray-600 text-white placeholder:text-gray-500" : "border-gray-200 text-gray-800 placeholder:text-gray-400"}`} />
      </div>

      {saving && (
        <div className={`fixed bottom-6 right-6 rounded-xl px-4 py-2 text-xs flex items-center gap-2 shadow-lg z-50 ${darkMode ? "bg-blue-900/90 text-blue-200 backdrop-blur" : "bg-blue-50 text-blue-600"}`}>
          <Loader size={12} className="animate-spin" /> Sauvegarde en cours...
        </div>
      )}
    </div>
  );
}
