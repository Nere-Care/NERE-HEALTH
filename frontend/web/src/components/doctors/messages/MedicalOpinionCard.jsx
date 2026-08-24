import { useState, useEffect } from "react";
import {
  ClipboardList, ExternalLink, X, Loader, FolderOpen, Send,
  Heart, Activity, User, Syringe, Pill, AlertTriangle,
  FileText, Clipboard, Download, Baby, CalendarDays,
  CheckCircle, DollarSign, Lock, CreditCard, Share2,
  Wallet, Smartphone, Phone,
} from "lucide-react";
import { get, post, API_BASE_URL } from "../../../services/apiClient";
import { getUserTimezone } from "../../../utils/timezone";

const STATUT_COLORS = {
  en_attente: "bg-yellow-100 text-yellow-700",
  acceptee: "bg-green-100 text-green-700",
  refusee: "bg-red-100 text-red-700",
  annulee: "bg-gray-100 text-gray-500",
  en_attente_paiement: "bg-amber-100 text-amber-800 border border-amber-200",
  en_attente_paiement_patient: "bg-purple-100 text-purple-800 border border-purple-200",
  cloturee: "bg-blue-100 text-blue-800 border border-blue-200",
};

const STATUT_LABELS = {
  en_attente: "En attente",
  acceptee: "Acceptée",
  refusee: "Refusée",
  annulee: "Annulée",
  en_attente_paiement: "Facture émise (Attente)",
  en_attente_paiement_patient: "Attente paiement patient",
  cloturee: "Clôturée",
};

function parseMessage(msg) {
  if (!msg) return {};
  const result = {};
  const lines = msg.split("\n\n").filter(Boolean);
  for (const line of lines) {
    const m = line.match(/^Urgence:\s*(.+)$/);
    if (m) { result.urgence = m[1].trim(); continue; }
    const c = line.match(/^Contexte:\s*(.+)$/);
    if (c) { result.contexte = c[1].trim(); continue; }
    const q = line.match(/^Question:\s*(.+)$/);
    if (q) { result.question = q[1].trim(); continue; }
    const e = line.match(/^Examens:\s*(.+)$/);
    if (e) { result.examens = e[1].trim(); continue; }
  }
  return result;
}

function parseJSON(raw) {
  if (!raw) return null;
  if (typeof raw === "object") return raw;
  try { return JSON.parse(raw); } catch { return null; }
}

// ─── Tag / card rendering ─────────────────────────────────────────────────────
const TAG_COLORS = {
  blue: "bg-blue-100 text-blue-700 border border-blue-200",
  red: "bg-red-100 text-red-700 border border-red-200",
  green: "bg-green-100 text-green-700 border border-green-200",
  orange: "bg-orange-100 text-orange-700 border border-orange-200",
  purple: "bg-purple-100 text-purple-700 border border-purple-200",
  teal: "bg-teal-100 text-teal-700 border border-teal-200",
  gray: "bg-gray-100 text-gray-600 border border-gray-200",
};

const SEVERITY_COLORS = {
  legere: "bg-yellow-100 text-yellow-700",
  moderee: "bg-orange-100 text-orange-700",
  severe: "bg-red-100 text-red-700",
  critique: "bg-red-200 text-red-900 font-bold",
};

/** Renders one item: string → simple tag, object → mini card */
function SmartItem({ item, color, darkMode }) {
  if (typeof item !== "object" || item === null) {
    const cls = darkMode
      ? "bg-gray-700 text-gray-200 border border-gray-600"
      : TAG_COLORS[color] || TAG_COLORS.blue;
    return (
      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${cls}`}>
        {String(item)}
      </span>
    );
  }

  // Object: extract key fields intelligently
  const label = item.nom || item.name || item.libelle || item.titre || item.label || null;
  const type = item.type || item.categorie || null;
  const sev = item.severite || item.severity || null;
  const dose = item.dose || item.dosage || null;
  const freq = item.frequence || item.frequency || null;
  const annee = item.annee || item.date || item.year || null;

  // Known fields consumed above; collect remaining extras
  const knownKeys = new Set(["nom", "name", "libelle", "titre", "label", "type", "categorie", "severite", "severity", "dose", "dosage", "frequence", "frequency", "annee", "date", "year"]);
  const extras = Object.entries(item).filter(([k]) => !knownKeys.has(k));

  const cardBg = darkMode ? "bg-gray-700 border border-gray-600" : "bg-white border border-gray-200 shadow-sm";

  return (
    <div className={`rounded-xl px-3 py-2 text-xs ${cardBg}`}>
      <p className={`font-semibold mb-1 ${darkMode ? "text-white" : "text-gray-800"}`}>
        {label || Object.values(item)[0] || "—"}
      </p>
      <div className="flex flex-wrap gap-1">
        {type && (
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${darkMode ? "bg-gray-600 text-gray-300" : "bg-gray-100 text-gray-500"}`}>
            {type}
          </span>
        )}
        {sev && (
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${SEVERITY_COLORS[sev?.toLowerCase()] || "bg-gray-100 text-gray-600"}`}>
            {sev}
          </span>
        )}
        {dose && (
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${darkMode ? "bg-gray-600 text-gray-300" : "bg-blue-50 text-blue-600"}`}>
            {dose}
          </span>
        )}
        {freq && (
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${darkMode ? "bg-gray-600 text-gray-300" : "bg-indigo-50 text-indigo-600"}`}>
            {freq}
          </span>
        )}
        {annee && (
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${darkMode ? "bg-gray-600 text-gray-300" : "bg-gray-100 text-gray-500"}`}>
            {annee}
          </span>
        )}
        {extras.map(([k, v]) => (
          <span key={k} className={`px-1.5 py-0.5 rounded-full text-[10px] ${darkMode ? "bg-gray-600 text-gray-300" : "bg-gray-100 text-gray-500"}`}>
            {k}: {Array.isArray(v) ? v.join(", ") : String(v)}
          </span>
        ))}
      </div>
    </div>
  );
}

function TagList({ items, color = "blue", darkMode }) {
  if (!items || items.length === 0)
    return <p className="text-xs text-gray-400 italic mt-1">Aucun élément renseigné</p>;

  // Determine layout: if any item is an object → card grid, else flex-wrap tags
  const hasObjects = items.some(i => typeof i === "object" && i !== null);

  return (
    <div className={`mt-1.5 ${hasObjects ? "grid grid-cols-1 sm:grid-cols-2 gap-2" : "flex flex-wrap gap-1.5"}`}>
      {items.map((item, i) => (
        <SmartItem key={i} item={item} color={color} darkMode={darkMode} />
      ))}
    </div>
  );
}


// ─── Section block ───────────────────────────────────────────────────────────
function DossierSection({ icon: Icon, title, iconColor, children, darkMode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-1.5">
        <Icon size={14} className={iconColor} />
        <p className={`text-[10px] font-bold uppercase tracking-widest ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
          {title}
        </p>
      </div>
      {children}
    </div>
  );
}

function resolveDocUrl(url) {
  if (!url) return '#';
  if (url.startsWith('data:') || url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
}

// ─── Dossier Medical Modal ───────────────────────────────────────────────────
function DossierMedicalModal({ dossierId, patientId, darkMode, onClose }) {
  const [dossier, setDossier] = useState(null);
  const [patient, setPatient] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        let fetchedDossier = null;
        if (dossierId) {
          fetchedDossier = await get(`/api/dossiers_medicaux/${dossierId}`);
        } else if (patientId) {
          const list = await get(`/api/dossiers_medicaux`, { patient_id: patientId });
          if (list?.length > 0) fetchedDossier = list[0];
        }
        if (!cancelled) setDossier(fetchedDossier);

        const effPatId = fetchedDossier?.patient_id || patientId;
        if (effPatId) {
          try {
            const p = await get(`/api/patients/${effPatId}`);
            if (!cancelled) setPatient(p);
          } catch {}

          try {
            const docs = await get(`/api/documents_medicaux`, { patient_id: effPatId });
            if (!cancelled) setDocuments(Array.isArray(docs) ? docs : []);
          } catch {
            if (!cancelled) setDocuments([]);
          }
        }
      } catch (e) {
        if (!cancelled) setError(e.message || "Erreur de chargement");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [dossierId, patientId]);

  const asList = (raw) => {
    const p = parseJSON(raw);
    if (!p) return [];
    if (Array.isArray(p)) return p.filter(Boolean);
    if (typeof p === "object") return Object.values(p).flat().filter(Boolean);
    return [];
  };

  const asDict = (raw) => {
    const p = parseJSON(raw);
    if (!p || typeof p !== "object" || Array.isArray(p)) return null;
    return p;
  };

  const bloodGroup = dossier?.groupe_sanguin || patient?.groupe_sanguin || "Inconnu";
  const hasBio = true;
  const sections = [
    { key: "antecedents_familiaux", icon: User, title: "Antécédents familiaux", color: "text-purple-500", tag: "purple" },
    { key: "antecedents_personnels", icon: Clipboard, title: "Antécédents personnels", color: "text-blue-500", tag: "blue" },
    { key: "antecedents_chirurgicaux", icon: FileText, title: "Antécédents chirurgicaux", color: "text-orange-500", tag: "orange" },
    { key: "antecedents_allergiques", icon: AlertTriangle, title: "Allergies", color: "text-red-500", tag: "red" },
    { key: "traitements_chroniques", icon: Pill, title: "Traitements chroniques", color: "text-green-500", tag: "green" },
    { key: "vaccinations", icon: Syringe, title: "Vaccinations", color: "text-teal-500", tag: "teal" },
  ];

  const gynecoData = asDict(dossier?.antecedents_gyneco);

  const hasAnyData = dossier && !dossier.acces_restricted && (
    hasBio ||
    sections.some(s => asList(dossier[s.key]).length > 0) ||
    asDict(dossier?.habitudes_vie) ||
    gynecoData ||
    documents.length > 0
  );

  return (
    <>
      <div
        className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div
          className={`w-full max-w-3xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col ${darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"
            }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className={`flex items-center justify-between px-5 py-4 border-b ${darkMode ? "border-gray-700 bg-gray-900/60" : "border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50"
            }`}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <FolderOpen size={18} className="text-blue-500" />
              </div>
              <div>
                <h2 className="font-bold text-base">Dossier médical du patient</h2>
                {dossier?.numero_dossier && (
                  <p className="text-xs text-gray-400 mt-0.5">N° {dossier.numero_dossier}</p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
            {loading && (
              <div className="flex items-center justify-center py-20">
                <Loader size={28} className="animate-spin text-blue-500" />
              </div>
            )}

            {error && (
              <div className={`p-4 rounded-xl ${darkMode ? "bg-red-900/20 border border-red-800" : "bg-red-50 border border-red-200"}`}>
                <p className={`text-sm font-medium ${darkMode ? "text-red-400" : "text-red-600"}`}>{error}</p>
              </div>
            )}

            {!loading && !error && !dossier && (
              <div className="py-20 text-center text-gray-400">
                <FolderOpen size={40} className="mx-auto mb-3 opacity-20" />
                <p className="text-sm">Dossier médical introuvable</p>
              </div>
            )}

            {dossier?.acces_restricted && (
              <div className={`p-4 rounded-xl ${darkMode ? "bg-orange-900/20 border border-orange-800" : "bg-orange-50 border border-orange-200"}`}>
                <p className={`text-sm font-medium ${darkMode ? "text-orange-400" : "text-orange-600"}`}>
                  🔒 Accès restreint — le patient n'a pas autorisé l'accès à son dossier médical.
                </p>
              </div>
            )}

            {!loading && !error && dossier && !dossier.acces_restricted && (
              <>
                {/* Biométrie & Groupe Sanguin */}
                <div>
                  <DossierSection icon={Activity} title="Biométrie & constantes" iconColor="text-blue-500" darkMode={darkMode}>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-2">
                      <div className={`p-3 rounded-xl text-center ${
                        bloodGroup && bloodGroup !== "Inconnu"
                          ? darkMode ? "bg-red-900/30 border border-red-800" : "bg-red-50 border border-red-100"
                          : darkMode ? "bg-gray-700" : "bg-gray-50 border border-gray-200"
                      }`}>
                        <p className="text-[10px] text-gray-400 mb-1">Groupe Sanguin</p>
                        <p className={`text-xl font-bold ${
                          bloodGroup && bloodGroup !== "Inconnu"
                            ? darkMode ? "text-red-400" : "text-red-700"
                            : darkMode ? "text-gray-400" : "text-gray-500"
                        }`}>{bloodGroup}</p>
                      </div>
                      {dossier.taille_cm && (
                        <div className={`p-3 rounded-xl text-center ${darkMode ? "bg-gray-700" : "bg-blue-50 border border-blue-100"}`}>
                          <p className="text-[10px] text-gray-400 mb-1">Taille</p>
                          <p className={`text-xl font-bold ${darkMode ? "text-white" : "text-blue-700"}`}>{dossier.taille_cm}</p>
                          <p className="text-[10px] text-gray-400">cm</p>
                        </div>
                      )}
                      {dossier.poids_kg && (
                        <div className={`p-3 rounded-xl text-center ${darkMode ? "bg-gray-700" : "bg-blue-50 border border-blue-100"}`}>
                          <p className="text-[10px] text-gray-400 mb-1">Poids</p>
                          <p className={`text-xl font-bold ${darkMode ? "text-white" : "text-blue-700"}`}>{dossier.poids_kg}</p>
                          <p className="text-[10px] text-gray-400">kg</p>
                        </div>
                      )}
                      {dossier.imc && (
                        <div className={`p-3 rounded-xl text-center ${darkMode ? "bg-gray-700" : "bg-indigo-50 border border-indigo-100"}`}>
                          <p className="text-[10px] text-gray-400 mb-1">IMC</p>
                          <p className={`text-xl font-bold ${darkMode ? "text-white" : "text-indigo-700"}`}>{dossier.imc}</p>
                          <p className="text-[10px] text-gray-400">kg/m²</p>
                        </div>
                      )}
                      {dossier.tension_arterielle && (
                        <div className={`p-3 rounded-xl text-center ${darkMode ? "bg-gray-700" : "bg-red-50 border border-red-100"}`}>
                          <p className="text-[10px] text-gray-400 mb-1">Tension</p>
                          <p className={`text-base font-bold ${darkMode ? "text-red-300" : "text-red-700"}`}>{dossier.tension_arterielle}</p>
                          <p className="text-[10px] text-gray-400">mmHg</p>
                        </div>
                      )}
                    </div>
                  </DossierSection>
                  <div className={`mt-4 border-b ${darkMode ? "border-gray-700" : "border-gray-100"}`} />
                </div>


                {/* List sections */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {sections.map(({ key, icon, title, color, tag }) => {
                    const items = asList(dossier[key]);
                    if (items.length === 0) return null;
                    return (
                      <DossierSection key={key} icon={icon} title={title} iconColor={color} darkMode={darkMode}>
                        <TagList items={items} color={tag} darkMode={darkMode} />
                      </DossierSection>
                    );
                  })}
                </div>

                {/* Section Gynécologique & Obstétrique */}
                {gynecoData && (
                  <>
                    <div className={`border-b ${darkMode ? "border-gray-700" : "border-gray-100"}`} />
                    <DossierSection icon={Baby} title="Gynécologie & Obstétrique" iconColor="text-pink-500" darkMode={darkMode}>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                        {gynecoData.contraception && (
                          <div className={`p-2.5 rounded-xl text-xs ${darkMode ? "bg-gray-700" : "bg-pink-50/60 border border-pink-100"}`}>
                            <p className="text-gray-400 text-[10px]">Contraception</p>
                            <p className="font-semibold">{gynecoData.contraception}</p>
                          </div>
                        )}
                        {(gynecoData.cycles_regulite || gynecoData.cycles_reguliers) && (
                          <div className={`p-2.5 rounded-xl text-xs ${darkMode ? "bg-gray-700" : "bg-pink-50/60 border border-pink-100"}`}>
                            <p className="text-gray-400 text-[10px]">Cycles</p>
                            <p className="font-semibold">
                              {gynecoData.cycles_regulite || (gynecoData.cycles_reguliers === "Oui" ? "Réguliers" : "Irréguliers")}
                              {gynecoData.cycles_duree_cycle ? ` (${gynecoData.cycles_duree_cycle} jours)` : ""}
                            </p>
                          </div>
                        )}
                        {gynecoData.cycles_date_dernieres_regles && (
                          <div className={`p-2.5 rounded-xl text-xs ${darkMode ? "bg-gray-700" : "bg-pink-50/60 border border-pink-100"}`}>
                            <p className="text-gray-400 text-[10px]">Date dernières règles</p>
                            <p className="font-semibold">{gynecoData.cycles_date_dernieres_regles}</p>
                          </div>
                        )}
                        {gynecoData.menopause_statut && (
                          <div className={`p-2.5 rounded-xl text-xs ${darkMode ? "bg-gray-700" : "bg-pink-50/60 border border-pink-100"}`}>
                            <p className="text-gray-400 text-[10px]">Ménopause</p>
                            <p className="font-semibold">{gynecoData.menopause_statut} {gynecoData.menopause_age ? `(${gynecoData.menopause_age} ans)` : ""}</p>
                          </div>
                        )}
                        {gynecoData.dernier_frottis_date && (
                          <div className={`p-2.5 rounded-xl text-xs ${darkMode ? "bg-gray-700" : "bg-purple-50/60 border border-purple-100"}`}>
                            <p className="text-gray-400 text-[10px]">Dernier frottis</p>
                            <p className="font-semibold">{gynecoData.dernier_frottis_date} {gynecoData.dernier_frottis_resultat ? `- ${gynecoData.dernier_frottis_resultat}` : ""}</p>
                          </div>
                        )}
                        {gynecoData.derniere_mammographie_date && (
                          <div className={`p-2.5 rounded-xl text-xs ${darkMode ? "bg-gray-700" : "bg-purple-50/60 border border-purple-100"}`}>
                            <p className="text-gray-400 text-[10px]">Dernière mammographie</p>
                            <p className="font-semibold">{gynecoData.derniere_mammographie_date} {gynecoData.derniere_mammographie_resultat ? `- ${gynecoData.derniere_mammographie_resultat}` : ""}</p>
                          </div>
                        )}
                      </div>

                      {/* Grossesses */}
                      {Array.isArray(gynecoData.grossesses) && gynecoData.grossesses.length > 0 && (
                        <div className="mt-3">
                          <p className={`text-xs font-semibold mb-1.5 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                            Historique des grossesses ({gynecoData.grossesses.length})
                          </p>
                          <div className="space-y-1.5">
                            {gynecoData.grossesses.map((g, idx) => (
                              <div key={idx} className={`p-2.5 rounded-xl text-xs flex items-center justify-between ${darkMode ? "bg-gray-700" : "bg-gray-50 border border-gray-100"}`}>
                                <div>
                                  <span className="font-bold">{g.annee || g.date || `Grossesse #${idx + 1}`}</span>
                                  <span className="text-gray-400 ml-2">
                                    {g.issue || g.terme || g.type_accouchement || ""}
                                  </span>
                                </div>
                                {g.poids_naissance && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-100 text-blue-700 font-medium">
                                    {g.poids_naissance} kg
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {gynecoData.observations && (
                        <p className={`text-xs italic mt-2 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                          Obs: {gynecoData.observations}
                        </p>
                      )}
                    </DossierSection>
                  </>
                )}

                {/* Habitudes de vie */}
                {asDict(dossier.habitudes_vie) && (
                  <>
                    <div className={`border-b ${darkMode ? "border-gray-700" : "border-gray-100"}`} />
                    <DossierSection icon={Heart} title="Habitudes de vie" iconColor="text-pink-500" darkMode={darkMode}>
                      <div className="grid grid-cols-2 gap-2 mt-1.5">
                        {Object.entries(asDict(dossier.habitudes_vie)).map(([k, v]) => (
                          <div key={k} className={`flex justify-between items-center p-2.5 rounded-xl text-xs ${darkMode ? "bg-gray-700" : "bg-gray-50 border border-gray-100"
                            }`}>
                            <span className={`capitalize ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{k}</span>
                            <span className={`font-semibold ${darkMode ? "text-white" : "text-gray-800"}`}>
                              {Array.isArray(v) ? v.join(", ") : String(v)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </DossierSection>
                  </>
                )}

                {/* Documents Médicaux uploadés */}
                {documents.length > 0 && (
                  <>
                    <div className={`border-b ${darkMode ? "border-gray-700" : "border-gray-100"}`} />
                    <DossierSection icon={FileText} title={`Documents médicaux joints (${documents.length})`} iconColor="text-indigo-500" darkMode={darkMode}>
                      <div className="space-y-2 mt-2">
                        {documents.map((doc) => (
                          <div
                            key={doc.id}
                            className={`p-3 rounded-xl flex items-center justify-between gap-3 text-xs ${
                              darkMode ? "bg-gray-700 border border-gray-600" : "bg-gray-50 border border-gray-200"
                            }`}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 mb-0.5">
                                <FileText size={14} className="text-indigo-500 flex-shrink-0" />
                                <p className="font-semibold truncate">{doc.nom_fichier_original || "Document médical"}</p>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                                  darkMode ? "bg-gray-600 text-indigo-300" : "bg-indigo-50 text-indigo-700 border border-indigo-100"
                                }`}>
                                  {doc.type_document || "autre"}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 text-[10px] text-gray-400">
                                {doc.date_document && (
                                  <span>Date: {new Date(doc.date_document).toLocaleDateString("fr-FR")}</span>
                                )}
                                {doc.laboratoire_nom && (
                                  <span>Labo/Structure: {doc.laboratoire_nom}</span>
                                )}
                              </div>
                            </div>
                            <button
                              onClick={() => setPreviewDoc(doc)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 text-xs font-semibold transition flex-shrink-0"
                            >
                              <Download size={13} />
                              Consulter
                            </button>
                          </div>
                        ))}
                      </div>
                    </DossierSection>
                  </>
                )}

                {/* Empty dossier */}
                {!hasAnyData && (
                  <div className="py-16 text-center text-gray-400">
                    <FolderOpen size={40} className="mx-auto mb-3 opacity-20" />
                    <p className="text-sm">Aucune donnée médicale renseignée dans ce dossier</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Document Preview Modal Overlay ── */}
      {previewDoc && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setPreviewDoc(null)}>
          <div className={`relative max-w-4xl w-full max-h-[90vh] rounded-2xl overflow-hidden flex flex-col shadow-2xl ${darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"}`} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-700/50">
              <div className="min-w-0 pr-4">
                <p className="font-semibold text-sm truncate">{previewDoc.nom_fichier_original || "Document médical"}</p>
                <p className="text-xs text-gray-400">{previewDoc.type_document || "Autre"}</p>
              </div>
              <button onClick={() => setPreviewDoc(null)} className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition flex-shrink-0">
                <X size={20} />
              </button>
            </div>
            <div className="p-4 flex-1 overflow-auto flex items-center justify-center bg-black/10 min-h-[350px]">
              {previewDoc.mime_type?.startsWith('image/') || previewDoc.url_stockage?.startsWith('data:image/') ? (
                <img src={resolveDocUrl(previewDoc.url_stockage)} alt={previewDoc.nom_fichier_original} className="max-w-full max-h-[72vh] rounded-lg object-contain" />
              ) : previewDoc.mime_type === 'application/pdf' || previewDoc.url_stockage?.startsWith('data:application/pdf') ? (
                <iframe src={resolveDocUrl(previewDoc.url_stockage)} className="w-full h-[72vh] rounded-lg" title="Aperçu PDF" />
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <FileText size={48} className="mx-auto mb-3 opacity-40" />
                  <p className="text-sm font-medium">Aperçu direct non pris en charge pour ce format</p>
                  <a
                    href={resolveDocUrl(previewDoc.url_stockage)}
                    download={previewDoc.nom_fichier_original || "document"}
                    className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition"
                  >
                    <Download size={14} /> Télécharger le document
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── AvisDetailModal (simplified — no redundant fields from the card) ─────────
function AvisDetailModal({ darkMode, avis, onClose }) {
  if (!avis) return null;
  const parsed = parseMessage(avis.message);
  const hasContent = parsed.contexte || parsed.question || parsed.examens || avis.reponse;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-2xl max-h-[85vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col ${darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"
          }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-5 py-4 border-b ${darkMode ? "border-gray-700" : "border-gray-200"
          }`}>
          <div className="flex items-center gap-3">
            <ClipboardList size={20} className="text-blue-500" />
            <h2 className="font-bold text-base">Détails de la demande d'avis</h2>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {!hasContent && (
            <p className="text-sm text-gray-400 text-center py-10">
              Aucun détail complémentaire disponible
            </p>
          )}

          {parsed.contexte && (
            <Section title="Contexte clinique" darkMode={darkMode}>
              {parsed.contexte}
            </Section>
          )}
          {parsed.question && (
            <Section title="Question posée" darkMode={darkMode} highlight>
              {parsed.question}
            </Section>
          )}
          {parsed.examens && (
            <Section title="Examens réalisés" darkMode={darkMode}>
              {parsed.examens}
            </Section>
          )}
          {avis.reponse && (
            <div className={`p-4 rounded-xl ${darkMode ? "bg-green-900/20 border border-green-800" : "bg-green-50 border border-green-200"
              }`}>
              <p className={`text-xs font-bold uppercase mb-2 ${darkMode ? "text-green-400" : "text-green-600"}`}>
                Réponse du confrère
              </p>
              <p className={`text-sm leading-relaxed ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                {avis.reponse}
              </p>
            </div>
          )}

          <p className={`text-xs pt-2 border-t ${darkMode ? "text-gray-500 border-gray-700" : "text-gray-400 border-gray-100"}`}>
            Demande envoyée le {new Date(avis.created_at).toLocaleDateString("fr-FR", {
              day: "2-digit", month: "long", year: "numeric",
              hour: "2-digit", minute: "2-digit",
              timeZone: getUserTimezone(),
            })}
          </p>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children, darkMode, highlight }) {
  return (
    <div>
      <p className={`text-xs font-bold uppercase mb-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
        {title}
      </p>
      <p className={`text-sm leading-relaxed break-words ${highlight ? "font-semibold" : ""} ${darkMode ? "text-gray-300" : "text-gray-700"
        }`}>
        {children}
      </p>
    </div>
  );
}

function ClotureModal({ demandeId, conversation, darkMode, onClose, onSuccess }) {
  const [payant, setPayant] = useState(false);
  const [montant, setMontant] = useState("");
  const [compteRendu, setCompteRendu] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!compteRendu.trim()) {
      setError("Veuillez saisir votre compte-rendu / recommandation médicale.");
      return;
    }
    const m = payant ? parseFloat(montant || 0) : 0;
    if (payant && (isNaN(m) || m <= 0)) {
      setError("Veuillez indiquer un montant valide en FCFA.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await post(`/api/demandes-avis/${demandeId}/cloturer`, {
        montant: m,
        compte_rendu: compteRendu.trim(),
      });
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || "Erreur lors de la clôture");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className={`w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden ${darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"}`} onClick={e => e.stopPropagation()}>
        <div className={`flex items-center justify-between px-5 py-4 border-b ${darkMode ? "border-gray-700 bg-gray-900/60" : "border-gray-100 bg-blue-50/50"}`}>
          <div className="flex items-center gap-2.5">
            <CheckCircle className="text-blue-500" size={20} />
            <h3 className="font-bold text-base">Clôturer l'avis médical</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className={`p-3 rounded-xl text-xs font-medium ${darkMode ? "bg-red-900/30 text-red-300 border border-red-800" : "bg-red-50 text-red-700 border border-red-200"}`}>
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
              Compte-rendu & Recommandations médicales *
            </label>
            <textarea
              rows={4}
              value={compteRendu}
              onChange={(e) => setCompteRendu(e.target.value)}
              placeholder="Rédigez votre avis spécialisé, diagnostic, conseils et conduite à tenir..."
              className={`w-full p-3 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-50 border-gray-200 text-gray-900"
              }`}
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
              Option de facturation
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => { setPayant(false); setMontant(""); }}
                className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition ${
                  !payant
                    ? darkMode ? "bg-blue-600/20 border-blue-500 text-blue-400" : "bg-blue-50 border-blue-300 text-blue-700"
                    : darkMode ? "bg-gray-700 border-gray-600 text-gray-400" : "bg-gray-50 border-gray-200 text-gray-600"
                }`}
              >
                <span>🆓 Avis Gratuit</span>
                <span className="text-[10px] font-normal opacity-80">Confraternel (0 FCFA)</span>
              </button>

              <button
                type="button"
                onClick={() => setPayant(true)}
                className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition ${
                  payant
                    ? darkMode ? "bg-blue-600/20 border-blue-500 text-blue-400" : "bg-blue-50 border-blue-300 text-blue-700"
                    : darkMode ? "bg-gray-700 border-gray-600 text-gray-400" : "bg-gray-50 border-gray-200 text-gray-600"
                }`}
              >
                <span>💳 Avis Facturé</span>
                <span className="text-[10px] font-normal opacity-80">Honoraires télé-expertise</span>
              </button>
            </div>
          </div>

          {payant && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1 text-gray-400">
                  Montant des honoraires (FCFA) *
                </label>
                <input
                  type="number"
                  min="500"
                  max={conversation.demande_caution_montant || 5000}
                  step="500"
                  value={montant}
                  onChange={(e) => setMontant(e.target.value)}
                  placeholder="Ex: 5000"
                  className={`w-full p-3 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-50 border-gray-200 text-gray-900"
                  }`}
                />
              </div>

              {/* Realtime Escrow Breakdown */}
              {parseFloat(montant || 0) > 0 && (
                <div className={`p-3 rounded-xl text-xs space-y-1.5 ${darkMode ? "bg-gray-750 border border-gray-600" : "bg-blue-50/60 border border-blue-100"}`}>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Caution séquestrée par la plateforme :</span>
                    <span className="font-semibold">{Math.round(conversation.demande_caution_montant || 5000)} FCFA</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Frais de service Nere Health (10%) :</span>
                    <span className="font-semibold text-orange-500">-{Math.round(parseFloat(montant || 0) * 0.10)} FCFA</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Vos honoraires nets crédités :</span>
                    <span className="font-bold text-green-600 dark:text-green-400">+{Math.round(parseFloat(montant || 0) * 0.90)} FCFA</span>
                  </div>
                  {Math.round((conversation.demande_caution_montant || 5000) - parseFloat(montant || 0)) > 0 && (
                    <div className="flex justify-between pt-1 border-t border-gray-200 dark:border-gray-600">
                      <span className="text-gray-400">Reliquat remboursé au payeur :</span>
                      <span className="font-semibold text-blue-600 dark:text-blue-400">
                        {Math.round((conversation.demande_caution_montant || 5000) - parseFloat(montant || 0))} FCFA
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition ${darkMode ? "hover:bg-gray-700 text-gray-300" : "hover:bg-gray-100 text-gray-600"}`}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition flex items-center gap-2"
            >
              {submitting ? <Loader size={14} className="animate-spin" /> : <CheckCircle size={14} />}
              Clôturer l'avis
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── DemandeAvisPaymentModal ────────────────────────────────────────────────
const PAIEMENT_METHODS = [
  {
    id: "portefeuille_nere",
    label: "Portefeuille Nere",
    subLabel: "Débit instantané de votre solde",
    icon: Wallet,
    iconColor: "text-blue-500",
    needsPhone: false,
  },
  {
    id: "orange_money",
    label: "Orange Money",
    subLabel: "Paiement via Orange Money",
    iconEmoji: "\u{1F7E0}",
    iconColor: "text-orange-500",
    needsPhone: true,
    phonePlaceholder: "Ex: 6 90 00 00 00",
  },
  {
    id: "mtn_momo",
    label: "MTN MoMo",
    subLabel: "Paiement via MTN Mobile Money",
    iconEmoji: "\u{1F7E1}",
    iconColor: "text-yellow-500",
    needsPhone: true,
    phonePlaceholder: "Ex: 6 70 00 00 00",
  },
  {
    id: "carte_visa",
    label: "Visa / Mastercard",
    subLabel: "Paiement sécurisé par carte bancaire",
    icon: CreditCard,
    iconColor: "text-purple-500",
    needsCard: true,
  },
];

function DemandeAvisPaymentModal({ demandeId, montant, darkMode, onClose, onSuccess }) {
  const [selectedMethod, setSelectedMethod] = useState("portefeuille_nere");
  const [telephone, setTelephone] = useState("");
  const [carteNumero, setCarteNumero] = useState("");
  const [carteExpiry, setCarteExpiry] = useState("");
  const [carteCVC, setCarteCVC] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selected = PAIEMENT_METHODS.find((m) => m.id === selectedMethod);

  const handlePay = async () => {
    if (selected?.needsPhone && !telephone.trim()) {
      setError("Veuillez saisir votre numéro de téléphone");
      return;
    }
    if (selected?.needsCard) {
      if (!carteNumero.trim() || carteNumero.replace(/\s/g, "").length < 16) {
        setError("Veuillez saisir un numéro de carte valide");
        return;
      }
      if (!carteExpiry.trim() || !/^\d{2}\/\d{2}$/.test(carteExpiry.trim())) {
        setError("Veuillez saisir une date d'expiration valide (MM/AA)");
        return;
      }
      if (!carteCVC.trim() || carteCVC.trim().length < 3) {
        setError("Veuillez saisir le CVC");
        return;
      }
    }
    setLoading(true);
    setError("");
    try {
      await post(`/api/demandes-avis/${demandeId}/payer-par-medecin`, {
        methode: selectedMethod,
        telephone: telephone || null,
        carte_numero: selected?.needsCard ? carteNumero.replace(/\s/g, "") : null,
        carte_expiry: selected?.needsCard ? carteExpiry : null,
        carte_cvc: selected?.needsCard ? carteCVC : null,
        derniers_4_chiffres: selected?.needsCard ? carteNumero.replace(/\s/g, "").slice(-4) : null,
      });
      onSuccess();
    } catch (err) {
      setError(err.message || "Erreur lors du paiement");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-3" onClick={onClose}>
      <div
        className={`w-full max-w-md rounded-2xl p-5 space-y-4 animate-fadeIn ${darkMode ? "bg-gray-900 text-white" : "bg-white text-black"}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center">
          <div>
            <h2 className="font-semibold text-sm sm:text-base">Paiement de la facture</h2>
            <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
              {Number(montant || 0).toLocaleString()} FCFA
            </p>
          </div>
          <button onClick={onClose} className={`p-2 rounded-lg ${darkMode ? "hover:bg-gray-800" : "hover:bg-gray-100"}`}>
            <X size={18} />
          </button>
        </div>

        <div className="space-y-2">
          <p className={`text-xs font-semibold uppercase tracking-wide ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            Mode de paiement
          </p>
          {PAIEMENT_METHODS.map((method) => {
            const isSelected = selectedMethod === method.id;
            const Icon = method.icon;
            return (
              <button
                key={method.id}
                onClick={() => { setSelectedMethod(method.id); setError(""); }}
                className={`w-full p-3 rounded-xl border text-left transition flex items-center gap-3 ${
                  isSelected
                    ? darkMode
                      ? "border-blue-500 bg-blue-500/10"
                      : "border-blue-500 bg-blue-50"
                    : darkMode
                    ? "border-gray-700 bg-gray-800 hover:border-gray-600"
                    : "border-gray-200 hover:border-gray-300 bg-white"
                }`}
              >
                <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                  isSelected ? "bg-blue-500/20" : darkMode ? "bg-gray-700" : "bg-gray-100"
                }`}>
                  {Icon ? <Icon size={18} className={isSelected ? "text-blue-500" : method.iconColor} /> : (
                    <span className="text-lg">{method.iconEmoji}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${darkMode ? "text-white" : "text-gray-800"}`}>{method.label}</p>
                  <p className={`text-[11px] ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{method.subLabel}</p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  isSelected ? "border-blue-500" : darkMode ? "border-gray-600" : "border-gray-300"
                }`}>
                  {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />}
                </div>
              </button>
            );
          })}
        </div>

        {selected?.needsPhone && (
          <div>
            <label className={`text-xs font-medium mb-1 block ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
              Numéro de téléphone
            </label>
            <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
              <Phone size={16} className="text-gray-400 flex-shrink-0" />
              <input
                type="tel"
                value={telephone}
                onChange={(e) => setTelephone(e.target.value)}
                placeholder={selected.phonePlaceholder}
                maxLength={12}
                className={`flex-1 bg-transparent outline-none text-sm ${darkMode ? "text-white placeholder-gray-500" : "text-gray-800 placeholder-gray-400"}`}
              />
            </div>
          </div>
        )}

        {selected?.needsCard && (
          <div className="space-y-3">
            <div>
              <label className={`text-xs font-medium mb-1 block ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                Numéro de carte
              </label>
              <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
                <CreditCard size={16} className="text-gray-400 flex-shrink-0" />
                <input
                  type="text"
                  value={carteNumero}
                  onChange={(e) => {
                    const v = e.target.value.replace(/[^\d]/g, "").slice(0, 16);
                    setCarteNumero(v.replace(/(.{4})/g, "$1 ").trim());
                  }}
                  placeholder="1234 5678 9012 3456"
                  maxLength={19}
                  className={`flex-1 bg-transparent outline-none text-sm tracking-wider ${darkMode ? "text-white placeholder-gray-500" : "text-gray-800 placeholder-gray-400"}`}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={`text-xs font-medium mb-1 block ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  Expiration
                </label>
                <input
                  type="text"
                  value={carteExpiry}
                  onChange={(e) => {
                    let v = e.target.value.replace(/[^\d]/g, "").slice(0, 4);
                    if (v.length >= 3) v = v.slice(0, 2) + "/" + v.slice(2);
                    setCarteExpiry(v);
                  }}
                  placeholder="MM/AA"
                  maxLength={5}
                  className={`w-full px-3 py-2.5 rounded-xl border text-sm ${darkMode ? "bg-gray-800 border-gray-700 text-white placeholder-gray-500" : "bg-white border-gray-200 text-gray-800 placeholder-gray-400"}`}
                />
              </div>
              <div>
                <label className={`text-xs font-medium mb-1 block ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  CVC
                </label>
                <input
                  type="text"
                  value={carteCVC}
                  onChange={(e) => setCarteCVC(e.target.value.replace(/[^\d]/g, "").slice(0, 4))}
                  placeholder="123"
                  maxLength={4}
                  className={`w-full px-3 py-2.5 rounded-xl border text-sm ${darkMode ? "bg-gray-800 border-gray-700 text-white placeholder-gray-500" : "bg-white border-gray-200 text-gray-800 placeholder-gray-400"}`}
                />
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
        )}

        <button
          onClick={handlePay}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold bg-green-600 text-white hover:bg-green-700 transition disabled:opacity-50"
        >
          {loading ? <Loader size={16} className="animate-spin" /> : <Lock size={16} />}
          Payer {Number(montant || 0).toLocaleString()} FCFA
        </button>
      </div>
    </div>
  );
}

// ─── Main exported card ──────────────────────────────────────────────────────
export default function MedicalOpinionCard({ conversation, darkMode, currentUserId, onSendDossierRequest }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [dossierModalOpen, setDossierModalOpen] = useState(false);
  const [clotureModalOpen, setClotureModalOpen] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [avisDetail, setAvisDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  if (!conversation?.demande_avis_id) return null;

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: getUserTimezone(),
    });

  const handleClickCard = async () => {
    if (avisDetail) { setModalOpen(true); return; }
    setLoading(true);
    setModalOpen(true);
    try {
      const data = await get(`/api/demandes-avis/${conversation.demande_avis_id}`);
      setAvisDetail(data);
    } catch {
      setModalOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const isAccepted = conversation.demande_statut === "acceptee";
  const isAccepteur = conversation.demande_medecin_accepteur_id === currentUserId || conversation.demande_medecin_cible_id === currentUserId;
  const isDemandeur = conversation.demande_medecin_demandeur_id === currentUserId;
  const hasDossierOnDemande = !!(conversation.demande_dossier_medical_id || conversation.demande_patient_id);
  const [requestingDossier, setRequestingDossier] = useState(false);

  return (
    <>
      <div
        className={`flex-shrink-0 mx-4 mt-3 rounded-xl border overflow-hidden ${darkMode
            ? "bg-gray-850 border-gray-700"
            : "bg-blue-50/80 border-blue-100"
          }`}
      >
        {/* ── Card clickable summary ── */}
        <div
          onClick={handleClickCard}
          className={`p-4 cursor-pointer transition hover:shadow-md ${darkMode ? "hover:border-blue-600" : "hover:bg-blue-50"
            }`}
        >
          <div className="flex items-center gap-2 mb-3">
            <ClipboardList size={16} className="text-blue-500" />
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">
              Avis médical
            </p>
            {conversation.demande_medecin_demandeur_id && (
              <span className={`text-[10px] px-1.5 py-0 rounded-full font-medium ${conversation.demande_medecin_demandeur_id === currentUserId
                  ? "bg-orange-100 text-orange-700"
                  : "bg-blue-100 text-blue-700"
                }`}>
                {conversation.demande_medecin_demandeur_id === currentUserId ? "Envoyée" : "Reçue"}
              </span>
            )}
            <ExternalLink size={12} className="ml-auto text-gray-400" />
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            {conversation.demande_patient_nom && (
              <>
                <p className={`font-medium text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Patient</p>
                <p className={`text-xs ${darkMode ? "text-white" : "text-gray-800"}`}>{conversation.demande_patient_nom}</p>
              </>
            )}
            {conversation.other_medecin_nom && (
              <>
                <p className={`font-medium text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Médecin</p>
                <p className={`text-xs ${darkMode ? "text-white" : "text-gray-800"}`}>Dr. {conversation.other_medecin_nom}</p>
              </>
            )}
            {conversation.demande_motif && (
              <>
                <p className={`font-medium text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Motif</p>
                <p className={`text-xs ${darkMode ? "text-white" : "text-gray-800"}`}>{conversation.demande_motif}</p>
              </>
            )}
            {conversation.demande_specialite && (
              <>
                <p className={`font-medium text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Spécialité</p>
                <p className={`text-xs ${darkMode ? "text-white" : "text-gray-800"}`}>{conversation.demande_specialite}</p>
              </>
            )}
            <>
              <p className={`font-medium text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Date</p>
              <p className={`text-xs ${darkMode ? "text-white" : "text-gray-800"}`}>{formatDate(conversation.created_at)}</p>
            </>
            {conversation.demande_statut && (
              <>
                <p className={`font-medium text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Statut</p>
                <span className={`inline-block w-fit px-2 py-0.5 rounded-full text-xs font-medium ${STATUT_COLORS[conversation.demande_statut] || STATUT_COLORS.en_attente
                  }`}>
                  {STATUT_LABELS[conversation.demande_statut] || conversation.demande_statut}
                </span>
              </>
            )}
          </div>
        </div>

        {/* ── Dossier médical & Actions de clôture/facturation ── */}
        <div className={`px-4 pb-3 pt-2 border-t space-y-2 ${darkMode ? "border-gray-700" : "border-blue-100"}`}>
          {/* Action Clôture pour le médecin expert (Accepteur) */}
          {isAccepteur && (conversation.demande_statut === "acceptee" || conversation.demande_statut === "en_cours") && (
            <button
              onClick={(e) => { e.stopPropagation(); setClotureModalOpen(true); }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition shadow-sm"
            >
              <CheckCircle size={14} />
              Clôturer & Rendre l'avis médical
            </button>
          )}

          {/* Action Paiement / Transfert pour le médecin demandeur */}
          {isDemandeur && conversation.demande_statut === "en_attente_paiement" && (
            <div className={`p-3 rounded-xl space-y-2 ${darkMode ? "bg-amber-900/30 border border-amber-800" : "bg-amber-50 border border-amber-200"}`}>
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 font-semibold text-xs">
                <DollarSign size={14} />
                <span>Facture reçue : {Math.round(conversation.demande_montant_facture || 0)} FCFA</span>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                L'expert a rédigé son avis. Choisissez le mode de règlement pour débloquer les conclusions.
              </p>
              <div className="flex gap-2 pt-1">
                <button
                  disabled={actionLoading}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowPayModal(true);
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-green-600 hover:bg-green-700 text-white transition"
                >
                  <CreditCard size={12} />
                  Payer la facture
                </button>

                <button
                  disabled={actionLoading}
                  onClick={async (e) => {
                    e.stopPropagation();
                    setActionLoading(true);
                    try {
                      await post(`/api/demandes-avis/${conversation.demande_avis_id}/transferer-au-patient`);
                      window.location.reload();
                    } catch (err) {
                      alert(err.message || "Erreur lors du transfert");
                    } finally { setActionLoading(false); }
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white transition"
                >
                  <Share2 size={12} />
                  Transférer au patient
                </button>
              </div>
            </div>
          )}

          {conversation.demande_statut === "en_attente_paiement_patient" && (
            <div className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${darkMode ? "bg-purple-900/30 text-purple-300 border border-purple-800" : "bg-purple-50 text-purple-700 border border-purple-200"}`}>
              <Share2 size={14} />
              <span>Facture transmise au patient pour règlement.</span>
            </div>
          )}

          {conversation.demande_statut === "cloturee" && (
            <div className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${darkMode ? "bg-blue-900/30 text-blue-300 border border-blue-800" : "bg-blue-50 text-blue-700 border border-blue-200"}`}>
              <Lock size={14} />
              <span className="font-semibold">Cet avis médical est clôturé (Lecture seule).</span>
            </div>
          )}

          {/* Dossier médical button */}
          {hasDossierOnDemande && (isAccepted || isDemandeur || isAccepteur) && (
            <button
              onClick={(e) => { e.stopPropagation(); setDossierModalOpen(true); }}
              className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition ${darkMode
                  ? "bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20"
                  : "bg-white text-blue-600 hover:bg-blue-50 border border-blue-200 shadow-sm"
                }`}
            >
              <FolderOpen size={14} />
              Consulter le dossier médical du patient
            </button>
          )}
        </div>
      </div>

      {/* ── AvisDetailModal ── */}
      {modalOpen && (
        loading && !avisDetail ? (
          <div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center"
            onClick={() => setModalOpen(false)}
          >
            <div
              className={`p-6 rounded-2xl flex flex-col items-center gap-3 ${darkMode ? "bg-gray-800" : "bg-white"}`}
              onClick={(e) => e.stopPropagation()}
            >
              <Loader className="animate-spin text-blue-500" size={24} />
              <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Chargement…</p>
            </div>
          </div>
        ) : (
          <AvisDetailModal
            darkMode={darkMode}
            avis={avisDetail}
            onClose={() => setModalOpen(false)}
          />
        )
      )}

      {/* ── ClotureModal (z-[70]) ── */}
      {clotureModalOpen && (
        <ClotureModal
          demandeId={conversation.demande_avis_id}
          conversation={conversation}
          darkMode={darkMode}
          onClose={() => setClotureModalOpen(false)}
          onSuccess={() => window.location.reload()}
        />
      )}

      {/* ── DossierMedicalModal (separate, z-[60]) ── */}
      {dossierModalOpen && (
        <DossierMedicalModal
          dossierId={conversation.demande_dossier_medical_id}
          patientId={conversation.demande_patient_id}
          darkMode={darkMode}
          onClose={() => setDossierModalOpen(false)}
        />
      )}

      {/* ── PaymentModal ── */}
      {showPayModal && (
        <DemandeAvisPaymentModal
          demandeId={conversation.demande_avis_id}
          montant={conversation.demande_montant_facture}
          darkMode={darkMode}
          onClose={() => setShowPayModal(false)}
          onSuccess={() => window.location.reload()}
        />
      )}
    </>
  );
}
