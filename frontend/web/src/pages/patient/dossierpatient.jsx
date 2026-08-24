import { useState, useEffect, useRef } from "react";
import { get, post, API_BASE_URL } from "../../services/apiClient";
import { getStoredUser } from "../../services/auth";
import { Loader, FileText, Upload, Plus, X, Save, CheckCircle, Trash2, Download, Eye, Pencil, Lock, Calendar, Building, Tag, ArrowLeft, AlertCircle, Stethoscope, Shield, Baby, Activity, CalendarDays, ChevronDown, ChevronUp, Heart, Scissors } from "lucide-react";
import { put, del } from "../../services/apiClient";
import MedicamentSearch from "../../components/MedicamentSearch";
import { getUserTimezone } from "../../utils/timezone";
import { DOC_TYPES as TYPES_DOCUMENTS, TYPE_COLORS } from "../../constants/medicalOptions";
import ObstetricTimeline from "../../components/common/ObstetricTimeline";

function resolveDocUrl(url) {
  if (!url) return '';
  if (url.startsWith('data:') || url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${API_BASE_URL}${url}`;
}

function genererChecksum(base64) {
  let hash = 0;
  for (let i = 0; i < base64.length; i++) {
    const chr = base64.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

const ongletsBase = [
  "Documents Médicaux", "Antécédents", "Allergies", "Traitements", "Opérations", "Vaccinations", "Habitudes de vie"
];

export default function DossierPatient({ darkMode }) {
  const user = getStoredUser();
  const [onglet, setOnglet] = useState(0);
  const [patient, setPatient] = useState(null);
  const [dossier, setDossier] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const uid = user?.id;
        if (!uid) return;
        const [p, d] = await Promise.allSettled([
          get(`/api/patients/${uid}`),
          get('/api/dossiers_medicaux', { limit: 1 }),
        ]);
        if (p.status === 'fulfilled') setPatient(p.value);
        if (d.status === 'fulfilled' && d.value?.length > 0) setDossier(d.value[0]);
      } catch (err) {
        console.error('Dossier load error:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user?.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="animate-spin text-blue-500" size={32} />
      </div>
    );
  }

  const onglets = patient?.sexe === "F"
    ? [...ongletsBase, "Suivi gynécologique"]
    : ongletsBase;

  return (
    <div className={`min-h-screen p-3 md:p-6 ${darkMode ? "bg-gray-900 text-white" : "bg-gray-50"}`}>
      <h1 className={`text-2xl font-bold mb-4 ${darkMode ? "text-white" : "text-gray-800"}`}>Mon Dossier Médical</h1>
      <div className="flex gap-2 flex-wrap mb-6">
        {onglets.map((label, i) => (
          <button key={i} onClick={() => setOnglet(i)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${onglet === i ? "bg-blue-600 text-white" : darkMode ? "bg-gray-800 text-gray-300" : "bg-white text-gray-600 border"}`}>
            {label}
          </button>
        ))}
      </div>
      {onglet === 0 && <DocumentsSection darkMode={darkMode} patientId={user?.id} />}
      {onglet === 1 && <Antecedents dossier={dossier} patientId={user?.id} onDossierUpdate={setDossier} darkMode={darkMode} />}
      {onglet === 2 && <Allergies dossier={dossier} patientId={user?.id} onDossierUpdate={setDossier} darkMode={darkMode} />}
      {onglet === 3 && <Traitements dossier={dossier} patientId={user?.id} onDossierUpdate={setDossier} darkMode={darkMode} />}
      {onglet === 4 && <Operations dossier={dossier} patientId={user?.id} onDossierUpdate={setDossier} darkMode={darkMode} />}
      {onglet === 5 && <Vaccinations dossier={dossier} patientId={user?.id} onDossierUpdate={setDossier} darkMode={darkMode} />}
      {onglet === 6 && <Habitudes dossier={dossier} patientId={user?.id} onDossierUpdate={setDossier} darkMode={darkMode} />}
      {onglet === 7 && <SuiviGyneco dossier={dossier} patientId={user?.id} onDossierUpdate={setDossier} darkMode={darkMode} />}
    </div>
  );
}

function DocumentsSection({ darkMode, patientId }) {
  const fileInputRef = useRef(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [error, setError] = useState(null);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [editDoc, setEditDoc] = useState(null);
  const [deleteDoc, setDeleteDoc] = useState(null);

  const [form, setForm] = useState({
    nom_fichier_original: '',
    type_document: '',
    laboratoire_nom: '',
    adresse_structure: '',
    date_document: '',
    description: '',
    fichier: null,
  });

  useEffect(() => {
    loadDocs();
  }, [patientId]);

  const loadDocs = async () => {
    setLoading(true);
    try {
      const data = await get('/api/documents_medicaux');
      setDocuments(data || []);
    } catch (err) {
      console.error('Load docs error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setForm(prev => ({ ...prev, fichier: file }));
  };

  const handleSubmit = async () => {
    setError(null);
    if (!form.nom_fichier_original.trim()) { setError("Veuillez donner un nom au document"); return; }
    if (!form.type_document) { setError("Veuillez choisir un type de document"); return; }
    if (!form.fichier) { setError("Veuillez sélectionner un fichier"); return; }

    setUploading(true);
    try {
      const reader = new FileReader();
      const base64 = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(form.fichier);
      });

      const b64content = base64.split(',')[1];
      const checksum = genererChecksum(b64content);

      await post('/api/documents_medicaux', {
        patient_id: patientId,
        type_document: form.type_document,
        nom_fichier_original: form.nom_fichier_original,
        nom_fichier_stockage: form.fichier.name,
        url_stockage: base64,
        checksum_sha256: checksum,
        taille_octets: form.fichier.size,
        mime_type: form.fichier.type,
        est_chiffre: false,
        visible_patient: true,
        description: form.description || null,
        date_document: form.date_document || null,
        laboratoire_nom: form.laboratoire_nom || null,
        adresse_structure: form.adresse_structure || null,
      });

      setForm({ nom_fichier_original: '', type_document: '', laboratoire_nom: '', adresse_structure: '', date_document: '', description: '', fichier: null });
      if (fileInputRef.current) fileInputRef.current.value = '';
      setShowForm(false);
      setUploaded(true);
      setTimeout(() => setUploaded(false), 3000);
      loadDocs();
    } catch (err) {
      setError(err.message || 'Erreur lors de l\'upload');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await del(`/api/documents_medicaux/${id}`);
      loadDocs();
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const handleSaveEdit = async () => {
    if (!editDoc) return;
    try {
      await put(`/api/documents_medicaux/${editDoc.id}`, {
        patient_id: editDoc.patient_id,
        type_document: editDoc.type_document,
        nom_fichier_original: editDoc.nom_fichier_original,
        nom_fichier_stockage: editDoc.nom_fichier_stockage,
        url_stockage: editDoc.url_stockage,
        checksum_sha256: editDoc.checksum_sha256,
        taille_octets: editDoc.taille_octets,
        mime_type: editDoc.mime_type,
        est_chiffre: editDoc.est_chiffre,
        visible_patient: editDoc.visible_patient,
        description: editDoc.description || null,
        date_document: editDoc.date_document || null,
        laboratoire_nom: editDoc.laboratoire_nom || null,
        adresse_structure: editDoc.adresse_structure || null,
      });
      setEditDoc(null);
      loadDocs();
    } catch (err) {
      console.error('Edit error:', err);
    }
  };

  return (
    <div>
      <div className={`rounded-2xl p-6 ${darkMode ? "bg-gray-800" : "bg-white shadow"}`}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold flex items-center gap-2"><FileText size={16} className="text-blue-500" /> Documents médicaux</h3>
          <button onClick={() => { setShowForm(!showForm); setError(null); }}
            className="flex items-center gap-1.5 text-xs font-semibold bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition">
            <Plus size={14} /> Ajouter un document
          </button>
        </div>

        <div className={`mb-4 flex items-start gap-2 text-xs p-3 rounded-xl ${darkMode ? "bg-blue-900/20 text-blue-300" : "bg-blue-50 text-blue-600"}`}>
          <Lock size={14} className="mt-0.5 flex-shrink-0" />
          <span>Seul vous pouvez accéder et gérer les documents stockés ici. Vos données sont confidentielles et protégées.</span>
        </div>

        {showForm && (
          <div className={`mb-6 p-5 rounded-2xl border ${darkMode ? "bg-gray-700 border-gray-600" : "bg-gray-50 border-gray-200"}`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Nom du document *</label>
                <input type="text" value={form.nom_fichier_original}
                  onChange={(e) => setForm(p => ({ ...p, nom_fichier_original: e.target.value }))}
                  placeholder="Ex: Bilan sanguin janvier"
                  className={`w-full border rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400 ${darkMode ? "bg-gray-600 border-gray-500 text-white" : "border-gray-200 text-gray-800"}`} />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Type de document *</label>
                <select value={form.type_document}
                  onChange={(e) => setForm(p => ({ ...p, type_document: e.target.value }))}
                  className={`w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400 ${darkMode ? "bg-gray-600 border-gray-500 text-white" : "border-gray-200 text-gray-800"}`}>
                  <option value="">Sélectionner...</option>
                  {TYPES_DOCUMENTS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Structure / Laboratoire</label>
                <input type="text" value={form.laboratoire_nom}
                  onChange={(e) => setForm(p => ({ ...p, laboratoire_nom: e.target.value }))}
                  placeholder="Nom de la structure"
                  className={`w-full border rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400 ${darkMode ? "bg-gray-600 border-gray-500 text-white" : "border-gray-200 text-gray-800"}`} />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Adresse de la structure</label>
                <input type="text" value={form.adresse_structure}
                  onChange={(e) => setForm(p => ({ ...p, adresse_structure: e.target.value }))}
                  placeholder="Adresse complète"
                  className={`w-full border rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400 ${darkMode ? "bg-gray-600 border-gray-500 text-white" : "border-gray-200 text-gray-800"}`} />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Date du document</label>
                <input type="date" value={form.date_document}
                  onChange={(e) => setForm(p => ({ ...p, date_document: e.target.value }))}
                  className={`w-full border rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400 ${darkMode ? "bg-gray-600 border-gray-500 text-white" : "border-gray-200 text-gray-800"}`} />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-gray-400 mb-1 block">Description (optionnelle)</label>
                <textarea value={form.description}
                  onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))}
                  rows={2} placeholder="Informations complémentaires..."
                  className={`w-full border rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400 ${darkMode ? "bg-gray-600 border-gray-500 text-white placeholder-gray-400" : "border-gray-200 text-gray-800"}`} />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-gray-400 mb-1 block">Fichier *</label>
                <input ref={fileInputRef} type="file" onChange={handleFileChange}
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  className={`w-full text-sm ${darkMode ? "text-gray-300" : "text-gray-600"} file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100`} />
                {form.fichier && (
                  <p className="text-xs text-gray-400 mt-1">{form.fichier.name} ({(form.fichier.size / 1024).toFixed(1)} Ko)</p>
                )}
              </div>
            </div>
            {error && <p className="text-xs text-red-500 mb-3 flex items-center gap-1"><X size={12} /> {error}</p>}
            <div className="flex items-center gap-3">
              <button onClick={handleSubmit} disabled={uploading}
                className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-all ${uploading ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 text-white"}`}>
                {uploading ? <Loader size={16} className="animate-spin" /> : <Upload size={16} />}
                Uploader
              </button>
              <button onClick={() => setShowForm(false)}
                className="text-xs text-gray-400 hover:text-gray-600 transition">Annuler</button>
            </div>
          </div>
        )}

        {uploaded && (
          <div className="mb-4 flex items-center gap-2 text-green-500 text-sm font-medium">
            <CheckCircle size={16} /> Document ajouté avec succès
          </div>
        )}

        {loading ? (
          <Loader className="animate-spin mx-auto text-blue-500" size={24} />
        ) : documents.length === 0 ? (
          <div className={`text-center py-10 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
            <FileText size={40} className="mx-auto mb-2 opacity-40" />
            <p className="text-sm font-medium">Aucun document médical</p>
            <p className="text-xs mt-1">Cliquez sur "Ajouter un document" pour en uploader un.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={`border-b ${darkMode ? "border-gray-700 text-gray-400" : "border-gray-200 text-gray-500"}`}>
                  <th className="text-left py-3 px-2 font-medium">Nom</th>
                  <th className="text-left py-3 px-2 font-medium">Type</th>
                  <th className="text-left py-3 px-2 font-medium hidden md:table-cell">Structure</th>
                  <th className="text-left py-3 px-2 font-medium hidden lg:table-cell">Adresse</th>
                  <th className="text-left py-3 px-2 font-medium hidden sm:table-cell">Date</th>
                  <th className="text-right py-3 px-2 font-medium">Fichier</th>
                  <th className="text-right py-3 px-2 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {documents.map(doc => {
                  const typeInfo = TYPES_DOCUMENTS.find(t => t.value === doc.type_document);
                  const colorClass = TYPE_COLORS[doc.type_document] || "bg-gray-100 text-gray-600";
                  const isFromDoctor = Boolean(doc.medecin_uploadeur_id || doc.prescripteur_nom);
                  const structName = doc.laboratoire_nom || (isFromDoctor ? (doc.prescripteur_nom ? `Cabinet ${doc.prescripteur_nom}` : 'Cabinet Médical') : '-');
                  const structAddr = doc.adresse_structure || (isFromDoctor ? 'Consultation Médicale' : '-');

                  return (
                    <tr key={doc.id} className={`border-b ${darkMode ? "border-gray-700/50 hover:bg-gray-700/30" : "border-gray-100 hover:bg-gray-50"}`}>
                      <td className="py-3 px-2">
                        <p className={`font-medium ${darkMode ? "text-white" : "text-gray-800"}`}>{doc.nom_fichier_original}</p>
                        {doc.description && <p className={`text-xs mt-0.5 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>{doc.description}</p>}
                        {isFromDoctor && (
                          <span className="inline-block text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium mt-1">
                            Reçu du médecin {doc.prescripteur_nom ? `(${doc.prescripteur_nom})` : ''}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-2">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${colorClass}`}>
                          {typeInfo?.label || doc.type_document}
                        </span>
                      </td>
                      <td className="py-3 px-2 hidden md:table-cell">
                        <span className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                          {structName}
                        </span>
                      </td>
                      <td className="py-3 px-2 hidden lg:table-cell">
                        <span className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                          {structAddr}
                        </span>
                      </td>
                      <td className="py-3 px-2 hidden sm:table-cell">
                        <span className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                          {doc.date_document ? new Date(doc.date_document).toLocaleDateString('fr-FR', { timeZone: getUserTimezone() }) : '-'}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          {!isFromDoctor && (
                            <button onClick={() => setEditDoc({ ...doc, date_document: doc.date_document ? doc.date_document.split('T')[0] : '' })}
                              className="text-amber-500 hover:text-amber-600 transition" title="Modifier">
                              <Pencil size={14} />
                            </button>
                          )}
                          <button onClick={() => setPreviewDoc(doc)}
                            className="text-blue-500 hover:text-blue-600 transition" title="Aperçu">
                            <Eye size={14} />
                          </button>
                          <a href={resolveDocUrl(doc.url_stockage)} download={doc.nom_fichier_original}
                            className="inline-flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600" title="Télécharger">
                            <Download size={12} /> {doc.taille_octets ? `${(doc.taille_octets / 1024).toFixed(0)} Ko` : ''}
                          </a>
                          {!isFromDoctor && (
                            <button onClick={() => setDeleteDoc(doc)}
                              className="text-gray-400 hover:text-red-500 transition" title="Supprimer">
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setPreviewDoc(null)}>
          <div className={`relative max-w-3xl w-full max-h-[90vh] rounded-2xl overflow-hidden ${darkMode ? "bg-gray-800" : "bg-white"}`} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-700/50">
              <div>
                <p className={`font-semibold text-sm ${darkMode ? "text-white" : "text-gray-800"}`}>{previewDoc.nom_fichier_original}</p>
                <p className="text-xs text-gray-400">{TYPES_DOCUMENTS.find(t => t.value === previewDoc.type_document)?.label || previewDoc.type_document}{previewDoc.date_document ? ` — ${new Date(previewDoc.date_document).toLocaleDateString('fr-FR', { timeZone: getUserTimezone() })}` : ''}</p>
              </div>
              <button onClick={() => setPreviewDoc(null)} className="text-gray-400 hover:text-white transition"><X size={20} /></button>
            </div>
            <div className="p-4 max-h-[calc(90vh-70px)] overflow-auto flex items-start justify-center bg-gray-900/10">
              {previewDoc.mime_type?.startsWith('image/') ? (
                <img src={resolveDocUrl(previewDoc.url_stockage)} alt={previewDoc.nom_fichier_original} className="max-w-full max-h-[70vh] rounded-lg object-contain" />
              ) : previewDoc.mime_type === 'application/pdf' ? (
                <embed src={resolveDocUrl(previewDoc.url_stockage)} type="application/pdf" className="w-full h-[70vh] rounded-lg" />
              ) : (
                <div className="text-center py-16 text-gray-400">
                  <FileText size={48} className="mx-auto mb-3 opacity-40" />
                  <p className="text-sm font-medium">Aperçu non disponible</p>
                  <p className="text-xs mt-1">Ce type de fichier ne peut pas être affiché.</p>
                  <a href={resolveDocUrl(previewDoc.url_stockage)} download={previewDoc.nom_fichier_original}
                    className="mt-4 inline-flex items-center gap-2 text-sm text-blue-500 hover:text-blue-600 font-medium">
                    <Download size={14} /> Télécharger
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {editDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setEditDoc(null)}>
          <div className={`relative max-w-lg w-full rounded-2xl overflow-hidden ${darkMode ? "bg-gray-800" : "bg-white"}`} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-700/50">
              <p className={`font-semibold text-sm ${darkMode ? "text-white" : "text-gray-800"}`}>Modifier le document</p>
              <button onClick={() => setEditDoc(null)} className="text-gray-400 hover:text-white transition"><X size={20} /></button>
            </div>
            <div className="p-5 grid grid-cols-1 gap-4">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Nom du document</label>
                <input type="text" value={editDoc.nom_fichier_original}
                  onChange={(e) => setEditDoc(p => ({ ...p, nom_fichier_original: e.target.value }))}
                  className={`w-full border rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400 ${darkMode ? "bg-gray-600 border-gray-500 text-white" : "border-gray-200 text-gray-800"}`} />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Type de document</label>
                <select value={editDoc.type_document}
                  onChange={(e) => setEditDoc(p => ({ ...p, type_document: e.target.value }))}
                  className={`w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400 ${darkMode ? "bg-gray-600 border-gray-500 text-white" : "border-gray-200 text-gray-800"}`}>
                  {TYPES_DOCUMENTS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Structure / Laboratoire</label>
                <input type="text" value={editDoc.laboratoire_nom || ''}
                  onChange={(e) => setEditDoc(p => ({ ...p, laboratoire_nom: e.target.value }))}
                  className={`w-full border rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400 ${darkMode ? "bg-gray-600 border-gray-500 text-white" : "border-gray-200 text-gray-800"}`} />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Adresse de la structure</label>
                <input type="text" value={editDoc.adresse_structure || ''}
                  onChange={(e) => setEditDoc(p => ({ ...p, adresse_structure: e.target.value }))}
                  className={`w-full border rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400 ${darkMode ? "bg-gray-600 border-gray-500 text-white" : "border-gray-200 text-gray-800"}`} />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Date du document</label>
                <input type="date" value={editDoc.date_document || ''}
                  onChange={(e) => setEditDoc(p => ({ ...p, date_document: e.target.value }))}
                  className={`w-full border rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400 ${darkMode ? "bg-gray-600 border-gray-500 text-white" : "border-gray-200 text-gray-800"}`} />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Description</label>
                <textarea value={editDoc.description || ''}
                  onChange={(e) => setEditDoc(p => ({ ...p, description: e.target.value }))}
                  rows={2}
                  className={`w-full border rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400 ${darkMode ? "bg-gray-600 border-gray-500 text-white" : "border-gray-200 text-gray-800"}`} />
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button onClick={handleSaveEdit}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white transition">
                  <Save size={16} /> Enregistrer
                </button>
                <button onClick={() => setEditDoc(null)}
                  className="text-xs text-gray-400 hover:text-gray-600 transition">Annuler</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setDeleteDoc(null)}>
          <div className={`relative max-w-sm w-full rounded-2xl p-6 ${darkMode ? "bg-gray-800" : "bg-white"}`} onClick={e => e.stopPropagation()}>
            <div className="text-center mb-5">
              <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-3">
                <Trash2 size={24} className="text-red-500" />
              </div>
              <p className={`font-semibold text-sm ${darkMode ? "text-white" : "text-gray-800"}`}>Supprimer le document</p>
              <p className={`text-xs mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                Êtes-vous sûr de vouloir supprimer <strong>"{deleteDoc.nom_fichier_original}"</strong> ? Cette action est irréversible.
              </p>
            </div>
            <div className="flex items-center gap-3 justify-center">
              <button onClick={() => setDeleteDoc(null)}
                className="px-4 py-2 rounded-xl text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition">
                Annuler
              </button>
              <button onClick={() => { handleDelete(deleteDoc.id); setDeleteDoc(null); }}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition flex items-center gap-2">
                <Trash2 size={14} /> Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SectionEditable({ title, value, onChange, darkMode }) {
  const [edit, setEdit] = useState(false);
  const [val, setVal] = useState(value || '');

  useEffect(() => { setVal(value || ''); }, [value]);

  return (
    <div className={`rounded-2xl p-4 ${darkMode ? "bg-gray-800" : "bg-white shadow"}`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold">{title}</h3>
        <button onClick={() => { if (edit) onChange(val); setEdit(!edit); }}
          className="text-xs text-blue-500 hover:underline">
          {edit ? 'Sauvegarder' : 'Modifier'}
        </button>
      </div>
      {edit ? (
        <textarea value={val} onChange={(e) => setVal(e.target.value)} rows={3}
          className={`w-full border rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400 ${darkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : "border-gray-200 text-gray-800"}`} />
      ) : (
        <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>{val || 'Aucune information'}</p>
      )}
    </div>
  );
}

const ANTECEDENTS_LISTE = [
  "Hypertension artérielle",
  "Insuffisance rénale",
  "Accident vasculaire",
  "Maladie coronarienne",
  "Hypercholestérolémie",
  "Cancer colorectal",
  "Cancer du poumon",
  "Cancer du sein",
  "Diabète sucré",
  "Hyperthyroïdie",
  "Hypothyroïdie",
  "Asthme",
  "Insuffisance cardiaque",
  "Maladie d'Alzheimer",
  "Maladie de Parkinson",
  "Maladie de Crohn",
  "Sclérose en plaques",
  "Lupus érythémateux disséminé",
  "Polyarthrite rhumatoïde",
  "Anémie falciforme",
  "Fibrose kystique",
  "Hémophilie",
  "Mucoviscidose",
  "Thalassémie",
  "Drépanocytose",
  "Trouble bipolaire",
  "Trouble anxieux",
  "Trouble dépréssif",
  "Épilepsie",
  "Sclérose latérale amyotrophique",
  "Glaucome",
  "Cataracte",
  "Astigmatisme",
  "Myopie",
  "Hypermétropie",
  "Strabisme",
  "DMLA",
  "Amblyopie",
  "Daltonisme",
  "Autisme",
  "TDAH",
  "Syndrome de Down",
  "Syndrome de Rett",
  "Syndrome de Williams",
];

const ETAT_OPTIONS = [
  { value: "en_cours", label: "En cours", color: "bg-amber-100 text-amber-600" },
  { value: "en_remission", label: "En rémission", color: "bg-blue-100 text-blue-600" },
  { value: "termine", label: "Terminé", color: "bg-green-100 text-green-600" },
];

const MEMBRES_LISTE = [
  "Père", "Mère", "Frère", "Soeur",
  "Grand-père maternel", "Grand-père paternel",
  "Grand-mère maternelle", "Grand-mère paternelle",
  "Fils", "Fille", "Oncle", "Tante", "Cousin", "Cousine",
];

const VACCINS_LISTE = [
  { nom: "BCG", maladie: "Tuberculose" },
  { nom: "VPO (Vaccin Polio Oral)", maladie: "Poliomyélite" },
  { nom: "VPI (Vaccin Polio Injectable)", maladie: "Poliomyélite" },
  { nom: "DTC", maladie: "Diphtérie, Tétanos, Coqueluche" },
  { nom: "Pentaxim", maladie: "Diphtérie, Tétanos, Coqueluche, Polio, Hib" },
  { nom: "Hexaxim", maladie: "Diphtérie, Tétanos, Coqueluche, Polio, Hib, Hépatite B" },
  { nom: "Repevax", maladie: "Diphtérie, Tétanos, Coqueluche, Polio" },
  { nom: "Dultavax", maladie: "Diphtérie, Tétanos, Polio" },
  { nom: "Hib", maladie: "Infections à Haemophilus influenzae type b" },
  { nom: "Hépatite B (Euvax, Engerix B, Shanvac)", maladie: "Hépatite B" },
  { nom: "Avaxim", maladie: "Hépatite A" },
  { nom: "VAR (Vaccin Anti-Rougeoleux)", maladie: "Rougeole" },
  { nom: "ROR (Priorix, M-M-R VaxPro)", maladie: "Rougeole, Oreillons, Rubéole" },
  { nom: "VAA (Stamaril)", maladie: "Fièvre jaune" },
  { nom: "Menactra", maladie: "Méningites à méningocoques A, C, W, Y" },
  { nom: "Pneumo 13 (Prevenar 13)", maladie: "Infections à pneumocoque" },
  { nom: "Pneumovax 23", maladie: "Infections à pneumocoque" },
  { nom: "Rotarix", maladie: "Gastro-entérite à rotavirus" },
  { nom: "Verorab", maladie: "Rage" },
  { nom: "Typhim Vi", maladie: "Fièvre typhoïde" },
  { nom: "Vaxigrip", maladie: "Grippe" },
  { nom: "Shingrix", maladie: "Zona" },
  { nom: "Gardasil 9", maladie: "Papillomavirus humain (HPV)" },
  { nom: "Dukoral", maladie: "Choléra" },
  { nom: "Shanchol", maladie: "Choléra" },
  { nom: "Euvichol-Plus", maladie: "Choléra" },
  { nom: "Comirnaty (Pfizer-BioNTech)", maladie: "COVID-19" },
  { nom: "Spikevax (Moderna)", maladie: "COVID-19" },
  { nom: "Vaxzevria (AstraZeneca)", maladie: "COVID-19" },
  { nom: "Janssen", maladie: "COVID-19" },
  { nom: "Nuvaxovid (Novavax)", maladie: "COVID-19" },
  { nom: "RTS,S/AS01 (Mosquirix)", maladie: "Paludisme" },
  { nom: "R21/Matrix-M", maladie: "Paludisme" },
  { nom: "Vitamine A", maladie: "Prévention de la carence en vitamine A" },
];

function Antecedents({ dossier, patientId, onDossierUpdate, darkMode }) {
  const [type, setType] = useState("personnel");
  const [vue, setVue] = useState("home");
  const [personnels, setPersonnels] = useState([]);
  const [familiaux, setFamiliaux] = useState([]);
  const [detailItem, setDetailItem] = useState(null);
  const [detailDate, setDetailDate] = useState("");
  const [detailEtat, setDetailEtat] = useState("");
  const [detailMembres, setDetailMembres] = useState([]);
  const [detailAge, setDetailAge] = useState("");
  const [editIndex, setEditIndex] = useState(null);
  const [deleteIndex, setDeleteIndex] = useState(null);
  const [saving, setSaving] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [recherche, setRecherche] = useState("");
  const [montrerQuestionInitPerso, setMontrerQuestionInitPerso] = useState(() => sessionStorage.getItem('showQuestionPerso') === 'true');
  const [montrerQuestionInitFam, setMontrerQuestionInitFam] = useState(() => sessionStorage.getItem('showQuestionFam') === 'true');
  const dossierRef = useRef(null);

  const liste = type === "personnel" ? personnels : familiaux;
  const setListe = type === "personnel" ? setPersonnels : setFamiliaux;
  const champBdd = type === "personnel" ? "antecedents_personnels" : "antecedents_familiaux";

  useEffect(() => {
    let p = [], f = [];
    if (dossier?.antecedents_personnels) {
      try { const x = JSON.parse(dossier.antecedents_personnels); if (Array.isArray(x)) p = x; } catch (e) { console.error('Parse personnels error:', e); }
    }
    if (dossier?.antecedents_familiaux) {
      try { const x = JSON.parse(dossier.antecedents_familiaux); if (Array.isArray(x)) f = x; } catch (e) { console.error('Parse familiaux error:', e); }
    }
    dossierRef.current = dossier;
    setPersonnels(p);
    setFamiliaux(f);
  }, [dossier]);

  const [saveError, setSaveError] = useState(null);

  const saveToDossier = async (p, f) => {
    setSaving(true);
    setSaveError(null);
    const body = { antecedents_personnels: JSON.stringify(p), antecedents_familiaux: JSON.stringify(f) };
    try {
      const d = dossierRef.current ?? dossier;
      if (d?.id) {
        const updated = await put(`/api/dossiers_medicaux/${d.id}`, body);
        dossierRef.current = updated;
        onDossierUpdate(updated);
      } else {
        const created = await post('/api/dossiers_medicaux', { patient_id: patientId, ...body });
        dossierRef.current = created;
        onDossierUpdate(created);
      }
    } catch (err) {
      console.error('Save antecedents error:', err);
      setSaveError("Erreur de sauvegarde. Veuillez réessayer.");
    } finally {
      setSaving(false);
    }
  };

  const toggleMembre = (nom) => {
    setDetailMembres(prev => {
      const exists = prev.find(m => m.nom === nom);
      if (exists) return prev.filter(m => m.nom !== nom);
      return [...prev, { nom, age: "" }];
    });
  };

  const handleAjouter = (nom) => {
    setEditIndex(null);
    setDetailItem(nom);
    setDetailDate("");
    setDetailEtat("");
    setDetailMembres([]);
    setDetailAge("");
    setVue("detail");
  };

  const handleEdit = (t, index) => {
    const src = t === "personnel" ? personnels : familiaux;
    const a = src[index];
    setType(t);
    setEditIndex(index);
    setDetailItem(a.nom);
    setDetailDate(a.date_diagnostic || "");
    setDetailEtat(a.etat || "");
    const membres = Array.isArray(a.membres)
      ? a.membres.map(m => typeof m === "string" ? { nom: m, age: "" } : m)
      : [];
    setDetailMembres(membres);
    setDetailAge("");
    setVue("detail");
  };

  const handleConfirmDetail = () => {
    if (type === "personnel" && (!detailDate || !detailEtat)) return;
    if (type === "familial" && detailMembres.length === 0) return;
    const dest = type === "personnel" ? personnels : familiaux;
    const setDest = type === "personnel" ? setPersonnels : setFamiliaux;
    const newItem = type === "personnel"
      ? { nom: detailItem, date_diagnostic: detailDate, etat: detailEtat }
      : { nom: detailItem, membres: detailMembres };
    const newList = editIndex !== null
      ? dest.map((a, i) => i === editIndex ? newItem : a)
      : [...dest, newItem];
    const p = type === "personnel" ? newList : personnels;
    const f = type === "personnel" ? familiaux : newList;
    setDest(newList);
    setVue("home");
    saveToDossier(p, f);
  };

  if (vue === "home") {
    return (
      <div className="space-y-6">
        {saveError && (
          <div className={`rounded-xl px-4 py-3 text-sm font-medium flex items-center gap-2 ${darkMode ? "bg-red-900/30 text-red-300 border border-red-700/50" : "bg-red-50 text-red-700 border border-red-200"}`}>
            <AlertCircle size={14} /> {saveError}
            <button onClick={() => setSaveError(null)} className="ml-auto"><X size={14} /></button>
          </div>
        )}
        {saving && (
          <div className={`rounded-xl px-4 py-2 text-xs flex items-center gap-2 ${darkMode ? "bg-blue-900/20 text-blue-300" : "bg-blue-50 text-blue-600"}`}>
            <Loader size={12} className="animate-spin" /> Sauvegarde en cours...
          </div>
        )}
        <div className={`rounded-2xl p-6 ${darkMode ? "bg-gray-800" : "bg-white shadow"}`}>
          <h3 className={`font-semibold mb-3 ${darkMode ? "text-white" : "text-gray-800"}`}>Antécédents médicaux</h3>
          {personnels.length === 0 && (!dossier?.id || montrerQuestionInitPerso) ? (
            <div>
              <p className={`text-sm mb-4 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                Avez-vous des antécédents médicaux ? Garder une trace de vos problèmes de santé de longue durée améliore votre suivi médical.
              </p>
              <div className="flex flex-wrap gap-3">
                <button onClick={() => { setType("personnel"); setVue("liste"); }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition">
                  <Plus size={14} /> Ajouter un antécédent médical
                </button>
                <button onClick={() => { sessionStorage.removeItem('showQuestionPerso'); setPersonnels([]); setMontrerQuestionInitPerso(false); saveToDossier([], familiaux); }}
                  disabled={saving}
                  className={`text-xs font-medium px-4 py-2 rounded-xl transition ${darkMode ? "text-gray-400 hover:text-gray-200 hover:bg-gray-700" : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"} ${saving ? "opacity-60 cursor-wait" : ""}`}>
                  {saving ? "Sauvegarde..." : "Je n'ai pas d'antécédents"}
                </button>
              </div>
            </div>
          ) : personnels.length === 0 ? (
            <div className={`rounded-xl border p-4 ${darkMode ? "border-amber-700/40 bg-amber-900/15" : "border-amber-300 bg-amber-50"}`}>
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 ${darkMode ? "text-amber-400" : "text-amber-500"}`}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-medium mb-1 ${darkMode ? "text-amber-200" : "text-amber-800"}`}>
                    Vous avez indiqué que vous n'avez pas d'antécédents médicaux
                  </p>
                  <p className={`text-xs mb-3 ${darkMode ? "text-amber-300/70" : "text-amber-600"}`}>
                    Si cela a changé, veuillez en ajouter un.
                  </p>
                  <div className="flex flex-wrap items-center gap-3">
                    <button onClick={() => { setType("personnel"); setVue("liste"); }}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition">
                      <Plus size={14} /> Ajouter un antécédent médical
                    </button>
                    <button onClick={() => { sessionStorage.setItem('showQuestionPerso', 'true'); setMontrerQuestionInitPerso(true); }}
                      className={`text-xs font-medium px-4 py-2 rounded-xl transition ${darkMode ? "text-amber-300 hover:text-amber-200 hover:bg-amber-900/30" : "text-amber-700 hover:text-amber-800 hover:bg-amber-100"}`}>
                      Changer d'avis
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <p className={`text-xs mb-3 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{personnels.length} antécédent(s)</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                {personnels.map((a, i) => {
                  const etatInfo = ETAT_OPTIONS.find(e => e.value === a.etat);
                  const sel = selectedIdx?.type === "personnel" && selectedIdx?.index === i;
                  return (
                    <div key={i}
                      onClick={() => setSelectedIdx(sel ? null : { type: "personnel", index: i })}
                      className={`rounded-xl px-3 py-2.5 border cursor-pointer transition ${darkMode ? "bg-gray-700/50 border-gray-600" : "bg-gray-50 border-gray-200"} ${sel ? "ring-2 ring-blue-400" : ""}`}>
                      <div className="flex items-start justify-between">
                        <p className={`font-medium text-xs ${darkMode ? "text-white" : "text-gray-800"}`}>{a.nom}</p>
                        {sel && (
                          <div className="flex items-center gap-1 flex-shrink-0 ml-1">
                            <button onClick={(e) => { e.stopPropagation(); handleEdit("personnel", i); }}
                              className="text-gray-400 hover:text-blue-500 transition" title="Modifier"><Pencil size={11} /></button>
                            <button onClick={(e) => { e.stopPropagation(); setDeleteIndex({ type: "personnel", index: i }); }}
                              className="text-gray-400 hover:text-red-500 transition" title="Supprimer"><X size={12} /></button>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="flex items-center gap-1 text-[11px] text-gray-400">
                           <Calendar size={10} /> {a.date_diagnostic ? new Date(a.date_diagnostic).toLocaleDateString('fr-FR', { timeZone: getUserTimezone() }) : '-'}
                        </span>
                        {etatInfo && <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-medium ${etatInfo.color}`}>{etatInfo.label}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
              <button onClick={() => { setType("personnel"); setVue("liste"); }}
                className="text-xs text-blue-500 hover:underline">+ Ajouter</button>
            </div>
          )}
        </div>

        <div className={`rounded-2xl p-6 ${darkMode ? "bg-gray-800" : "bg-white shadow"}`}>
          <h3 className={`font-semibold mb-3 ${darkMode ? "text-white" : "text-gray-800"}`}>Antécédents familiaux</h3>
          {familiaux.length === 0 && (!dossier?.id || montrerQuestionInitFam) ? (
            <div>
              <p className={`text-sm mb-4 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                Avez-vous des antécédents familiaux ? L'historique de votre famille vous aide à détecter ou prévenir l'apparition de maladies. Cela peut inclure le diabète, l'asthme, ou un cancer.
              </p>
              <div className="flex flex-wrap gap-3">
                <button onClick={() => { setType("familial"); setVue("liste"); }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition">
                  <Plus size={14} /> Ajouter un antécédent familial
                </button>
                <button onClick={() => { sessionStorage.removeItem('showQuestionFam'); setFamiliaux([]); setMontrerQuestionInitFam(false); saveToDossier(personnels, []); }}
                  disabled={saving}
                  className={`text-xs font-medium px-4 py-2 rounded-xl transition ${darkMode ? "text-gray-400 hover:text-gray-200 hover:bg-gray-700" : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"} ${saving ? "opacity-60 cursor-wait" : ""}`}>
                  {saving ? "Sauvegarde..." : "Je n'ai pas d'antécédents"}
                </button>
              </div>
            </div>
          ) : familiaux.length === 0 ? (
            <div className={`rounded-xl border p-4 ${darkMode ? "border-amber-700/40 bg-amber-900/15" : "border-amber-300 bg-amber-50"}`}>
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 ${darkMode ? "text-amber-400" : "text-amber-500"}`}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-medium mb-1 ${darkMode ? "text-amber-200" : "text-amber-800"}`}>
                    Vous avez indiqué que vous n'avez pas d'antécédents familiaux
                  </p>
                  <p className={`text-xs mb-3 ${darkMode ? "text-amber-300/70" : "text-amber-600"}`}>
                    Si cela a changé, veuillez en ajouter un.
                  </p>
                  <div className="flex flex-wrap items-center gap-3">
                    <button onClick={() => { setType("familial"); setVue("liste"); }}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition">
                      <Plus size={14} /> Ajouter un antécédent familial
                    </button>
                    <button onClick={() => { sessionStorage.setItem('showQuestionFam', 'true'); setMontrerQuestionInitFam(true); }}
                      className={`text-xs font-medium px-4 py-2 rounded-xl transition ${darkMode ? "text-amber-300 hover:text-amber-200 hover:bg-amber-900/30" : "text-amber-700 hover:text-amber-800 hover:bg-amber-100"}`}>
                      Changer d'avis
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <p className={`text-xs mb-3 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{familiaux.length} antécédent(s)</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                {familiaux.map((a, i) => {
                  const sel = selectedIdx?.type === "familial" && selectedIdx?.index === i;
                  return (
                    <div key={i}
                      onClick={() => setSelectedIdx(sel ? null : { type: "familial", index: i })}
                      className={`rounded-xl px-3 py-2.5 border cursor-pointer transition ${darkMode ? "bg-gray-700/50 border-gray-600" : "bg-gray-50 border-gray-200"} ${sel ? "ring-2 ring-blue-400" : ""}`}>
                      <div className="flex items-start justify-between">
                        <p className={`font-medium text-xs ${darkMode ? "text-white" : "text-gray-800"}`}>{a.nom}</p>
                        {sel && (
                          <div className="flex items-center gap-1 flex-shrink-0 ml-1">
                            <button onClick={(e) => { e.stopPropagation(); handleEdit("familial", i); }}
                              className="text-gray-400 hover:text-blue-500 transition" title="Modifier"><Pencil size={11} /></button>
                            <button onClick={(e) => { e.stopPropagation(); setDeleteIndex({ type: "familial", index: i }); }}
                              className="text-gray-400 hover:text-red-500 transition" title="Supprimer"><X size={12} /></button>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-1 mt-1">
                        <span className="text-[11px] text-gray-400">
                          {a.membres?.map(m => typeof m === "string" ? m : `${m.nom}${m.age ? ` (${m.age} ans)` : ""}`).join(", ") || ""}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <button onClick={() => { setType("familial"); setVue("liste"); }}
                className="text-xs text-blue-500 hover:underline">+ Ajouter</button>
            </div>
          )}
        </div>
        <ConfirmDelete deleteIndex={deleteIndex} setDeleteIndex={setDeleteIndex}
          personnels={personnels} familiaux={familiaux}
          setPersonnels={setPersonnels} setFamiliaux={setFamiliaux}
          saveToDossier={saveToDossier} darkMode={darkMode} />
      </div>
    );
  }

  if (vue === "liste") {
    const dejaAjoutes = liste.map(a => a.nom);
    const titre = type === "personnel" ? "Choisissez un antécédent médical" : "Choisissez un antécédent familial";
    const sousTitre = type === "personnel"
      ? "Sélectionnez un antécédent pour ajouter la date de diagnostic et l'état actuel."
      : "Sélectionnez un antécédent familial, puis choisissez les membres concernés.";
    const filtres = ANTECEDENTS_LISTE.filter(item =>
      item.toLowerCase().includes(recherche.toLowerCase())
    );
    return (
      <div className={`rounded-2xl p-6 ${darkMode ? "bg-gray-800" : "bg-white shadow"}`}>
        <button onClick={() => setVue("home")}
          className="flex items-center gap-2 text-blue-500 text-sm font-medium mb-4 hover:underline">
          <ArrowLeft size={16} /> Retour
        </button>
        <h3 className={`font-semibold mb-1 ${darkMode ? "text-white" : "text-gray-800"}`}>{titre}</h3>
        <p className={`text-xs mb-3 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{sousTitre}</p>
        <div className="relative mb-4">
          <input type="text" value={recherche} onChange={(e) => setRecherche(e.target.value)}
            placeholder="Rechercher un antécédent..."
            className={`w-full border rounded-xl pl-3 pr-3 py-2 text-sm outline-none focus:border-blue-400 ${darkMode ? "bg-gray-700 border-gray-600 text-white placeholder:text-gray-400" : "border-gray-200 text-gray-800 placeholder:text-gray-400"}`} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
          {filtres.map(item => {
            const deja = dejaAjoutes.includes(item);
            return (
              <button key={item}
                disabled={deja}
                onClick={() => handleAjouter(item)}
                className={`text-left px-4 py-3 rounded-xl text-sm font-medium transition-all border ${deja
                  ? darkMode ? "bg-gray-700/30 border-gray-700 text-gray-500 cursor-not-allowed" : "bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed"
                  : darkMode ? "bg-gray-700 border-gray-600 text-gray-300 hover:border-blue-500 hover:text-blue-300" : "bg-white border-gray-200 text-gray-600 hover:border-blue-400 hover:text-blue-600"
                  }`}>
                {deja ? <span className="flex items-center gap-2"><CheckCircle size={14} className="text-green-400" /> {item} (déjà ajouté)</span> : item}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (vue === "detail") {
    return (
      <div className={`rounded-2xl p-6 ${darkMode ? "bg-gray-800" : "bg-white shadow"}`}>
        <button onClick={() => editIndex !== null ? setVue("home") : setVue("liste")}
          className="flex items-center gap-2 text-blue-500 text-sm font-medium mb-4 hover:underline">
          <ArrowLeft size={16} /> Retour
        </button>
        <h3 className={`font-semibold mb-4 ${darkMode ? "text-white" : "text-gray-800"}`}>
          {editIndex !== null ? `Modifier : ${detailItem}` : detailItem}
        </h3>

        {type === "personnel" && (
          <>
            <div className="mb-5">
              <label className={`text-xs font-medium mb-1.5 block ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                Quand avez-vous été diagnostiqué ?
              </label>
              <div className="relative">
                <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="date" value={detailDate}
                  onChange={(e) => setDetailDate(e.target.value)}
                  className={`w-full border rounded-xl pl-10 pr-3 py-2.5 text-sm outline-none focus:border-blue-400 ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "border-gray-200 text-gray-800"}`} />
              </div>
            </div>
            <div className="mb-6">
              <label className={`text-xs font-medium mb-1.5 block ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                Quel est l'état actuel ?
              </label>
              <div className="flex flex-wrap gap-2">
                {ETAT_OPTIONS.map(opt => (
                  <button key={opt.value}
                    onClick={() => setDetailEtat(opt.value)}
                    className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all border ${detailEtat === opt.value
                      ? darkMode ? "bg-blue-600/20 border-blue-500 text-blue-300" : "bg-blue-50 border-blue-400 text-blue-700"
                      : darkMode ? "bg-gray-700 border-gray-600 text-gray-300 hover:border-gray-500" : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {type === "familial" && (
          <>
            <div className="mb-5">
              <label className={`text-xs font-medium mb-1.5 block ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                Quels membres de votre famille sont concernés ?
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
                {MEMBRES_LISTE.map(m => {
                  const actif = detailMembres.find(x => x.nom === m);
                  return (
                    <button key={m}
                      onClick={() => toggleMembre(m)}
                      className={`px-3 py-2 rounded-xl text-xs font-medium transition-all border ${actif
                        ? darkMode ? "bg-blue-600/20 border-blue-500 text-blue-300" : "bg-blue-50 border-blue-400 text-blue-700"
                        : darkMode ? "bg-gray-700 border-gray-600 text-gray-300 hover:border-gray-500" : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                        }`}>
                      {actif && <CheckCircle size={12} className="inline mr-1" />}{m}
                    </button>
                  );
                })}
              </div>
              {detailMembres.length > 0 && (
                <div className="space-y-2">
                  <p className={`text-xs font-medium ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                    Âge du diagnostic <span className="text-gray-400">(optionnel)</span>
                  </p>
                  {detailMembres.map((m, i) => (
                    <div key={m.nom} className="flex items-center gap-2">
                      <span className={`text-xs w-28 font-medium ${darkMode ? "text-gray-300" : "text-gray-600"}`}>{m.nom}</span>
                      <input type="number" min="0" max="120" value={m.age}
                        onChange={(e) => setDetailMembres(prev => prev.map((x, j) => j === i ? { ...x, age: e.target.value } : x))}
                        placeholder="Âge"
                        className={`flex-1 border rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400 ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "border-gray-200 text-gray-800"}`} />
                      <span className="text-xs text-gray-400">ans</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <button onClick={handleConfirmDetail}
            disabled={type === "personnel" ? (!detailDate || !detailEtat) : (detailMembres.length === 0)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${(type === "personnel" && (!detailDate || !detailEtat)) || (type === "familial" && detailMembres.length === 0)
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-700"
              }`}>
            {editIndex !== null ? <Save size={16} /> : <Plus size={16} />} {editIndex !== null ? "Enregistrer" : "Ajouter"}
          </button>
        </div>
      </div>
    );
  }

  return null;
}

function ConfirmDelete({ deleteIndex, setDeleteIndex, personnels, familiaux, setPersonnels, setFamiliaux, saveToDossier, darkMode }) {
  if (deleteIndex === null) return null;
  const lst = deleteIndex.type === "personnel" ? personnels : familiaux;
  const setLst = deleteIndex.type === "personnel" ? setPersonnels : setFamiliaux;
  const item = lst[deleteIndex.index];
  const handleDelete = () => {
    const newLst = lst.filter((_, i) => i !== deleteIndex.index);
    setLst(newLst);
    setDeleteIndex(null);
    const newP = deleteIndex.type === "personnel" ? newLst : personnels;
    const newF = deleteIndex.type === "personnel" ? familiaux : newLst;
    saveToDossier(newP, newF);
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setDeleteIndex(null)}>
      <div className={`relative max-w-sm w-full rounded-2xl p-6 ${darkMode ? "bg-gray-800" : "bg-white"}`} onClick={e => e.stopPropagation()}>
        <div className="text-center mb-5">
          <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-3">
            <Trash2 size={24} className="text-red-500" />
          </div>
          <p className={`font-semibold text-sm ${darkMode ? "text-white" : "text-gray-800"}`}>Supprimer l'antécédent</p>
          <p className={`text-xs mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            Êtes-vous sûr de vouloir supprimer <strong>"{item?.nom}"</strong> ? Cette action est irréversible.
          </p>
        </div>
        <div className="flex items-center gap-3 justify-center">
          <button onClick={() => setDeleteIndex(null)}
            className="px-4 py-2 rounded-xl text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition">
            Annuler
          </button>
          <button onClick={handleDelete}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition flex items-center gap-2">
            <Trash2 size={14} /> Supprimer
          </button>
        </div>
      </div>
    </div>
  );
}

function Vaccinations({ dossier, patientId, onDossierUpdate, darkMode }) {
  const [vaccinations, setVaccinations] = useState(dossier?.vaccinations || []);
  const [vue, setVue] = useState("home");
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [editIndex, setEditIndex] = useState(null);
  const [deleteIndex, setDeleteIndex] = useState(null);
  const [detailItem, setDetailItem] = useState(null);
  const [detailMaladie, setDetailMaladie] = useState("");
  const [detailDate, setDetailDate] = useState("");
  const [detailLot, setDetailLot] = useState("");
  const [detailDose, setDetailDose] = useState("");
  const [detailCentre, setDetailCentre] = useState("");
  const [detailRappel, setDetailRappel] = useState("");
  const [recherche, setRecherche] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [montrerQuestionInit, setMontrerQuestionInit] = useState(() => sessionStorage.getItem('showQuestionVaccins') === 'true');
  const dossierRef = useRef(dossier);

  useEffect(() => {
    dossierRef.current = dossier;
    setVaccinations(dossier?.vaccinations || []);
  }, [dossier]);

  const saveVaccinations = async (newList) => {
    setSaving(true);
    setSaveError(null);
    try {
      const d = dossierRef.current;
      if (d?.id) {
        const updated = await put(`/api/dossiers_medicaux/${d.id}`, { vaccinations: newList });
        dossierRef.current = updated;
        onDossierUpdate(updated);
      }
    } catch (err) {
      console.error('Save vaccinations error:', err);
      setSaveError("Erreur de sauvegarde. Veuillez réessayer.");
    } finally {
      setSaving(false);
    }
  };

  const handleAjouter = (nom) => {
    setEditIndex(null);
    setDetailItem(nom);
    const vaccineInfo = VACCINS_LISTE.find(v => v.nom === nom);
    setDetailMaladie(vaccineInfo?.maladie || "");
    setDetailDate("");
    setDetailLot("");
    setDetailDose("");
    setDetailCentre("");
    setDetailRappel("");
    setVue("detail");
  };

  const handleEdit = (index) => {
    const v = vaccinations[index];
    setEditIndex(index);
    setDetailItem(v.nom || v.vaccin || "");
    setDetailMaladie(v.maladie || "");
    setDetailDate(v.date || v.date_admin || "");
    setDetailLot(v.numero_lot || v.lot || "");
    setDetailDose(v.dose || "");
    setDetailCentre(v.centre || v.lieu || "");
    setDetailRappel(v.date_rappel || v.rappel || "");
    setVue("detail");
  };

  const handleConfirmDetail = () => {
    if (!detailDate) return;
    const newItem = {
      nom: detailItem,
      maladie: detailMaladie || undefined,
      date: detailDate,
      numero_lot: detailLot || undefined,
      dose: detailDose || undefined,
      centre: detailCentre || undefined,
      date_rappel: detailRappel || undefined,
    };
    const newList = editIndex !== null
      ? vaccinations.map((v, i) => i === editIndex ? newItem : v)
      : [...vaccinations, newItem];
    setVaccinations(newList);
    setVue("home");
    saveVaccinations(newList);
  };

  const handleDelete = (index) => {
    const newList = vaccinations.filter((_, i) => i !== index);
    setVaccinations(newList);
    setDeleteIndex(null);
    saveVaccinations(newList);
  };

  const dejaAjoutes = vaccinations.map(v => v.nom || v.vaccin);

  if (vue === "home") {
    return (
      <div className="space-y-6">
        <div className={`rounded-2xl p-6 ${darkMode ? "bg-gray-800" : "bg-white shadow"}`}>
          {saveError && (
            <div className={`rounded-xl px-4 py-3 text-sm font-medium flex items-center gap-2 mb-4 ${darkMode ? "bg-red-900/30 text-red-300 border border-red-700/50" : "bg-red-50 text-red-700 border border-red-200"}`}>
              <AlertCircle size={14} /> {saveError}
              <button onClick={() => setSaveError(null)} className="ml-auto"><X size={14} /></button>
            </div>
          )}
          <h3 className={`font-semibold mb-3 ${darkMode ? "text-white" : "text-gray-800"}`}>Vaccinations</h3>
          {vaccinations.length === 0 && (!dossier?.id || montrerQuestionInit) ? (
            <div>
              <p className={`text-sm mb-2 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                Avez-vous reçu des vaccins ?
              </p>
              <p className={`text-xs mb-4 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
                L'historique de vos vaccins est essentiel pour assurer un bon suivi de votre protection. Nous vous recommandons d'ouvrir votre carnet de santé afin de compléter cette section.
              </p>
              <div className="flex flex-wrap gap-3">
                <button onClick={() => { setVue("liste"); }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition">
                  <Plus size={14} /> Ajouter un vaccin
                </button>
                <button onClick={() => { sessionStorage.removeItem('showQuestionVaccins'); setVaccinations([]); setMontrerQuestionInit(false); saveVaccinations([]); }}
                  disabled={saving}
                  className={`text-xs font-medium px-4 py-2 rounded-xl transition ${darkMode ? "text-gray-400 hover:text-gray-200 hover:bg-gray-700" : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"} ${saving ? "opacity-60 cursor-wait" : ""}`}>
                  {saving ? "Sauvegarde..." : "Je n'ai pas été vacciné"}
                </button>
              </div>
            </div>
          ) : vaccinations.length === 0 ? (
            <div className={`rounded-xl border p-4 ${darkMode ? "border-amber-700/40 bg-amber-900/15" : "border-amber-300 bg-amber-50"}`}>
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 ${darkMode ? "text-amber-400" : "text-amber-500"}`}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-medium mb-1 ${darkMode ? "text-amber-200" : "text-amber-800"}`}>
                    Vous avez indiqué que vous n'avez pas été vacciné
                  </p>
                  <p className={`text-xs mb-3 ${darkMode ? "text-amber-300/70" : "text-amber-600"}`}>
                    Si cela a changé, veuillez en ajouter un.
                  </p>
                  <div className="flex flex-wrap items-center gap-3">
                    <button onClick={() => { setVue("liste"); }}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition">
                      <Plus size={14} /> Ajouter un vaccin
                    </button>
                    <button onClick={() => { sessionStorage.setItem('showQuestionVaccins', 'true'); setMontrerQuestionInit(true); }}
                      className={`text-xs font-medium px-4 py-2 rounded-xl transition ${darkMode ? "text-amber-300 hover:text-amber-200 hover:bg-amber-900/30" : "text-amber-700 hover:text-amber-800 hover:bg-amber-100"}`}>
                      Changer d'avis
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <p className={`text-xs mb-3 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{vaccinations.length} vaccin(s) enregistré(s)</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                {vaccinations.map((v, i) => {
                  const sel = selectedIdx === i;
                  return (
                    <div key={i}
                      onClick={() => setSelectedIdx(sel ? null : i)}
                      className={`rounded-xl px-3 py-2.5 border cursor-pointer transition ${darkMode ? "bg-gray-700/50 border-gray-600" : "bg-gray-50 border-gray-200"} ${sel ? "ring-2 ring-blue-400" : ""}`}>
                      <div className="flex items-start justify-between">
                        <p className={`font-medium text-xs ${darkMode ? "text-white" : "text-gray-800"}`}>{v.nom || v.vaccin}</p>
                        {sel && (
                          <div className="flex items-center gap-1 flex-shrink-0 ml-1">
                            <button onClick={(e) => { e.stopPropagation(); handleEdit(i); }}
                              className="text-gray-400 hover:text-blue-500 transition" title="Modifier"><Pencil size={11} /></button>
                            <button onClick={(e) => { e.stopPropagation(); setDeleteIndex(i); }}
                              className="text-gray-400 hover:text-red-500 transition" title="Supprimer"><X size={12} /></button>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="flex items-center gap-1 text-[11px] text-gray-400">
                          <Calendar size={10} /> {v.date ? new Date(v.date).toLocaleDateString('fr-FR', { timeZone: getUserTimezone() }) : '-'}
                        </span>
                        {v.maladie && <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-medium ${darkMode ? "bg-blue-900/40 text-blue-300" : "bg-blue-50 text-blue-600"}`}>{v.maladie}</span>}
                        {v.dose && <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-medium ${darkMode ? "bg-gray-600 text-gray-300" : "bg-gray-200 text-gray-600"}`}>{v.dose}</span>}
                      </div>
                      {sel && (
                        <div className={`mt-2 pt-2 border-t space-y-1 text-[11px] ${darkMode ? "border-gray-600 text-gray-400" : "border-gray-200 text-gray-500"}`}>
                          {v.numero_lot && <p><span className="font-medium">Lot :</span> {v.numero_lot}</p>}
                          {v.centre && <p><span className="font-medium">Centre :</span> {v.centre}</p>}
                          {v.date_rappel && <p><span className="font-medium">Rappel :</span> {new Date(v.date_rappel).toLocaleDateString('fr-FR', { timeZone: getUserTimezone() })}</p>}
                          {!v.numero_lot && !v.centre && !v.date_rappel && (
                            <p className="italic">Aucune information complémentaire</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <button onClick={() => { setVue("liste"); }}
                className="text-xs text-blue-500 hover:underline">+ Ajouter</button>
            </div>
          )}
        </div>
        {deleteIndex !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setDeleteIndex(null)}>
            <div className={`relative max-w-sm w-full rounded-2xl p-6 ${darkMode ? "bg-gray-800" : "bg-white"}`} onClick={e => e.stopPropagation()}>
              <div className="text-center mb-5">
                <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-3">
                  <Trash2 size={24} className="text-red-500" />
                </div>
                <p className={`font-semibold text-sm ${darkMode ? "text-white" : "text-gray-800"}`}>Supprimer le vaccin</p>
                <p className={`text-xs mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  Êtes-vous sûr de vouloir supprimer <strong>"{vaccinations[deleteIndex]?.nom || vaccinations[deleteIndex]?.vaccin}"</strong> ?
                </p>
              </div>
              <div className="flex items-center gap-3 justify-center">
                <button onClick={() => setDeleteIndex(null)}
                  className="px-4 py-2 rounded-xl text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition">
                  Annuler
                </button>
                <button onClick={() => handleDelete(deleteIndex)}
                  className="px-4 py-2 rounded-xl text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition flex items-center gap-2">
                  <Trash2 size={14} /> Supprimer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (vue === "liste") {
    const filtres = VACCINS_LISTE.filter(item =>
      item.nom.toLowerCase().includes(recherche.toLowerCase()) ||
      item.maladie.toLowerCase().includes(recherche.toLowerCase())
    );
    return (
      <div className={`rounded-2xl p-6 ${darkMode ? "bg-gray-800" : "bg-white shadow"}`}>
        <button onClick={() => setVue("home")}
          className="flex items-center gap-2 text-blue-500 text-sm font-medium mb-4 hover:underline">
          <ArrowLeft size={16} /> Retour
        </button>
        <h3 className={`font-semibold mb-1 ${darkMode ? "text-white" : "text-gray-800"}`}>Choisissez un vaccin</h3>
        <p className={`text-xs mb-3 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Sélectionnez un vaccin, puis renseignez la date d'administration et les informations complémentaires.</p>
        <div className="relative mb-4">
          <input type="text" value={recherche} onChange={(e) => setRecherche(e.target.value)}
            placeholder="Rechercher un vaccin ou une maladie..."
            className={`w-full border rounded-xl pl-3 pr-3 py-2 text-sm outline-none focus:border-blue-400 ${darkMode ? "bg-gray-700 border-gray-600 text-white placeholder:text-gray-400" : "border-gray-200 text-gray-800 placeholder:text-gray-400"}`} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
          {filtres.map(item => {
            const deja = dejaAjoutes.includes(item.nom);
            return (
              <button key={item.nom}
                disabled={deja}
                onClick={() => handleAjouter(item.nom)}
                className={`text-left px-4 py-3 rounded-xl text-sm transition-all border ${deja
                  ? darkMode ? "bg-gray-700/30 border-gray-700 text-gray-500 cursor-not-allowed" : "bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed"
                  : darkMode ? "bg-gray-700 border-gray-600 text-gray-300 hover:border-blue-500 hover:text-blue-300" : "bg-white border-gray-200 text-gray-600 hover:border-blue-400 hover:text-blue-600"
                  }`}>
                {deja ? (
                  <span className="flex items-center gap-2"><CheckCircle size={14} className="text-green-400" /> {item.nom} (déjà ajouté)</span>
                ) : (
                  <span>
                    <span className="font-medium">{item.nom}</span>
                    <span className={`block text-[11px] mt-0.5 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>{item.maladie}</span>
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (vue === "detail") {
    return (
      <div className={`rounded-2xl p-6 ${darkMode ? "bg-gray-800" : "bg-white shadow"}`}>
        <button onClick={() => editIndex !== null ? setVue("home") : setVue("liste")}
          className="flex items-center gap-2 text-blue-500 text-sm font-medium mb-4 hover:underline">
          <ArrowLeft size={16} /> Retour
        </button>
        <h3 className={`font-semibold mb-1 ${darkMode ? "text-white" : "text-gray-800"}`}>
          {editIndex !== null ? `Modifier : ${detailItem}` : detailItem}
        </h3>
        {detailMaladie && <p className={`text-xs mb-4 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Protection contre : {detailMaladie}</p>}

        <div className="mb-5">
          <label className={`text-xs font-medium mb-1.5 block ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
            Date d'administration <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="date" value={detailDate}
              onChange={(e) => setDetailDate(e.target.value)}
              className={`w-full border rounded-xl pl-10 pr-3 py-2.5 text-sm outline-none focus:border-blue-400 ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "border-gray-200 text-gray-800"}`} />
          </div>
        </div>

        <div className="mb-5">
          <label className={`text-xs font-medium mb-1.5 block ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
            Dose
          </label>
          <input type="text" value={detailDose}
            onChange={(e) => setDetailDose(e.target.value)}
            placeholder="ex: 1ère dose, 2ème dose, rappel..."
            className={`w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400 ${darkMode ? "bg-gray-700 border-gray-600 text-white placeholder:text-gray-500" : "border-gray-200 text-gray-800 placeholder:text-gray-400"}`} />
        </div>

        <div className="mb-5">
          <label className={`text-xs font-medium mb-1.5 block ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
            Numéro de lot
          </label>
          <input type="text" value={detailLot}
            onChange={(e) => setDetailLot(e.target.value)}
            placeholder="ex: ABV1234"
            className={`w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400 ${darkMode ? "bg-gray-700 border-gray-600 text-white placeholder:text-gray-500" : "border-gray-200 text-gray-800 placeholder:text-gray-400"}`} />
        </div>

        <div className="mb-5">
          <label className={`text-xs font-medium mb-1.5 block ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
            Centre / Lieu de vaccination
          </label>
          <input type="text" value={detailCentre}
            onChange={(e) => setDetailCentre(e.target.value)}
            placeholder="ex: Hôpital Central, Centre de santé..."
            className={`w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400 ${darkMode ? "bg-gray-700 border-gray-600 text-white placeholder:text-gray-500" : "border-gray-200 text-gray-800 placeholder:text-gray-400"}`} />
        </div>

        <div className="mb-6">
          <label className={`text-xs font-medium mb-1.5 block ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
            Date de rappel
          </label>
          <div className="relative">
            <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="date" value={detailRappel}
              onChange={(e) => setDetailRappel(e.target.value)}
              className={`w-full border rounded-xl pl-10 pr-3 py-2.5 text-sm outline-none focus:border-blue-400 ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "border-gray-200 text-gray-800"}`} />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <button onClick={handleConfirmDetail}
            disabled={!detailDate}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${!detailDate
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-700"
              }`}>
            {editIndex !== null ? <><Save size={16} /> Enregistrer</> : <><Plus size={16} /> Ajouter</>}
          </button>
        </div>
      </div>
    );
  }

  return null;
}

const HABITUDES_PREDEFINIES = [
  {
    key: "tabac",
    label: "Tabac / Cigarettes",
    options: ["Jamais", "Ancien consommateur", "Oui, parfois", "Oui, tous les jours"],
  },
  {
    key: "nicotine",
    label: "Nicotine (patchs, gommes...)",
    options: ["Jamais", "Ancien consommateur", "Oui, parfois", "Oui, tous les jours"],
  },
  {
    key: "chicha",
    label: "Chicha",
    options: ["Jamais", "Ancien consommateur", "Oui, parfois", "Oui, tous les jours"],
  },
  {
    key: "vapoteuse",
    label: "Vapoteuse",
    options: ["Jamais", "Ancien consommateur", "Oui, parfois", "Oui, tous les jours"],
  },
  {
    key: "alcool",
    label: "Alcool",
    options: [
      "Jamais",
      "Moins d'une fois par semaine",
      "1 à 2 fois par semaine",
      "3 à 4 fois par semaine",
      "5 fois ou plus par semaine",
    ],
  },
  {
    key: "activite_physique",
    label: "Activités physiques",
    options: [
      "Jamais",
      "Moins d'une fois par semaine",
      "1 à 2 fois par semaine",
      "3 à 4 fois par semaine",
      "5 fois ou plus par semaine",
    ],
  },
];

const ALLERGIES_LISTE = [
  { nom: "Arachides", type: "Alimentaire" },
  { nom: "Noix / Fruits à coque", type: "Alimentaire" },
  { nom: "Lait", type: "Alimentaire" },
  { nom: "Œufs", type: "Alimentaire" },
  { nom: "Poisson", type: "Alimentaire" },
  { nom: "Crustacés", type: "Alimentaire" },
  { nom: "Soja", type: "Alimentaire" },
  { nom: "Blé / Gluten", type: "Alimentaire" },
  { nom: "Sésame", type: "Alimentaire" },
  { nom: "Fruits de mer", type: "Alimentaire" },
  { nom: "Pénicilline", type: "Médicamenteuse" },
  { nom: "Aspirine", type: "Médicamenteuse" },
  { nom: "Ibuprofène", type: "Médicamenteuse" },
  { nom: "Latex", type: "Autre" },
  { nom: "Iode", type: "Médicamenteuse" },
  { nom: "Pollen", type: "Autre" },
  { nom: "Acariens", type: "Autre" },
  { nom: "Poils d'animaux", type: "Autre" },
  { nom: "Insectes (piqûres)", type: "Autre" },
  { nom: "Champignons / Moisissures", type: "Autre" },
  { nom: "Poussière", type: "Autre" },
  { nom: "Parfum", type: "Autre" },
  { nom: "Métaux (nickel, cobalt...)", type: "Autre" },
  { nom: "Sulfites", type: "Alimentaire" },
];

const SEVERITE_OPTIONS = [
  { value: "legere", label: "Légère", color: "bg-green-100 text-green-600" },
  { value: "moderee", label: "Modérée", color: "bg-amber-100 text-amber-600" },
  { value: "grave", label: "Grave", color: "bg-red-100 text-red-600" },
];

const OPERATIONS_LISTE = [
  "Appendicectomie", "Cholecystectomie", "Césarienne",
  "Hernie inguinale", "Amygdalectomie", "Arthroscopie",
  "Cataracte", "Fracture (ostéosynthèse)", "Cœlioscopie",
  "Hystérectomie", "Prothèse articulaire", "Transplantation",
  "Stent coronaire", "Ablation (arythmie)", "Laparotomie",
];

const ALLERGIE_REACTIONS = [
  "Éruption cutanée", "Démangeaisons", "Œdème", "Difficulté respiratoire",
  "Nausée / Vomissement", "Choc anaphylactique", "Rhinite", "Autre",
];

const FREQUENCE_OPTIONS = [
  "1 fois par jour", "2 fois par jour", "3 fois par jour",
  "1 fois par semaine", "Au besoin", "Autre",
];

const CONTRACEPTION_OPTIONS = [
  "Pilule contraceptive (combinée ou progestative)",
  "Patch contraceptif",
  "Anneau vaginal",
  "Implant contraceptif",
  "Injection contraceptive",
  "Dispositif intra-utérin (DIU)",
  "Stérilet (DIU) au cuivre (sans hormones)",
  "Stérilet (DIU) hormonal (au lévonorgestrel)",
  "Préservatif masculin",
  "Préservatif féminin (interne)",
  "Diaphragme",
  "Cape cervicale",
  "Éponge contraceptive",
  "Spermicides (gel, crème, ovules, mousse)",
  "Méthode des jours fixes (calendrier)",
  "Méthode de la température basale",
  "Méthode de la glaire cervicale (Billings)",
  "Méthode symptothermique",
  "Retrait (coït interrompu)",
  "Méthode de l'allaitement maternel (MAMA/LAM)",
  "Pilule du lendemain",
  "Pilule jusqu'à 5 jours après le rapport",
  "Ligature des trompes",
  "Vasectomie",
  "Aucune",
];

function Allergies({ dossier, patientId, onDossierUpdate, darkMode }) {
  const [items, setItems] = useState([]);
  const [vue, setVue] = useState("home");
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [editIndex, setEditIndex] = useState(null);
  const [deleteIndex, setDeleteIndex] = useState(null);
  const [detailNom, setDetailNom] = useState("");
  const [detailType, setDetailType] = useState("");
  const [detailSeverite, setDetailSeverite] = useState("");
  const [detailReaction, setDetailReaction] = useState("");
  const [detailDate, setDetailDate] = useState("");
  const [recherche, setRecherche] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [montrerQuestionInit, setMontrerQuestionInit] = useState(() => sessionStorage.getItem('showQuestionAllergies') === 'true');
  const dossierRef = useRef(dossier);

  useEffect(() => {
    dossierRef.current = dossier;
    if (dossier?.antecedents_allergiques) {
      try { const x = JSON.parse(dossier.antecedents_allergiques); if (Array.isArray(x)) { setItems(x); return; } } catch (e) {}
    }
    setItems([]);
  }, [dossier]);

  const saveItems = async (newList) => {
    setSaving(true); setSaveError(null);
    try {
      const d = dossierRef.current;
      if (d?.id) {
        const updated = await put(`/api/dossiers_medicaux/${d.id}`, { antecedents_allergiques: JSON.stringify(newList) });
        dossierRef.current = updated; onDossierUpdate(updated);
      }
    } catch (err) { console.error(err); setSaveError("Erreur de sauvegarde."); } finally { setSaving(false); }
  };

  const handleAjouter = (nom, type) => {
    setEditIndex(null); setDetailNom(nom); setDetailType(type || "");
    setDetailSeverite(""); setDetailReaction(""); setDetailDate(""); setVue("detail");
  };
  const handleEdit = (i) => {
    const a = items[i]; setEditIndex(i); setDetailNom(a.nom); setDetailType(a.type || "");
    setDetailSeverite(a.severite || ""); setDetailReaction(a.reaction || ""); setDetailDate(a.date_decouverte || ""); setVue("detail");
  };
  const handleConfirmDetail = () => {
    if (!detailSeverite) return;
    const newItem = { nom: detailNom, type: detailType, severite: detailSeverite, reaction: detailReaction || undefined, date_decouverte: detailDate || undefined };
    const newList = editIndex !== null ? items.map((a, i) => i === editIndex ? newItem : a) : [...items, newItem];
    setItems(newList); setVue("home"); saveItems(newList);
  };
  const handleDelete = (i) => { const newList = items.filter((_, idx) => idx !== i); setItems(newList); setDeleteIndex(null); saveItems(newList); };

  if (vue === "home") {
    return (
      <div className="space-y-6">
        <div className={`rounded-2xl p-6 ${darkMode ? "bg-gray-800" : "bg-white shadow"}`}>
          {saveError && <div className={`rounded-xl px-4 py-3 text-sm font-medium flex items-center gap-2 mb-4 ${darkMode ? "bg-red-900/30 text-red-300 border border-red-700/50" : "bg-red-50 text-red-700 border border-red-200"}`}><AlertCircle size={14} /> {saveError}<button onClick={() => setSaveError(null)} className="ml-auto"><X size={14} /></button></div>}
          <h3 className={`font-semibold mb-3 ${darkMode ? "text-white" : "text-gray-800"}`}>Allergies</h3>
          {items.length === 0 && (!dossier?.id || montrerQuestionInit) ? (
            <div>
              <p className={`text-sm mb-4 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Avez-vous des allergies connues ? Connaître vos allergies est essentiel pour éviter les réactions indésirables.</p>
              <div className="flex flex-wrap gap-3">
                <button onClick={() => setVue("liste")} className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition"><Plus size={14} /> Ajouter une allergie</button>
                <button onClick={() => { sessionStorage.removeItem('showQuestionAllergies'); setItems([]); setMontrerQuestionInit(false); saveItems([]); }} disabled={saving} className={`text-xs font-medium px-4 py-2 rounded-xl transition ${darkMode ? "text-gray-400 hover:text-gray-200 hover:bg-gray-700" : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"}`}>{saving ? "Sauvegarde..." : "Je n'ai pas d'allergies"}</button>
              </div>
            </div>
          ) : items.length === 0 ? (
            <div className={`rounded-xl border p-4 ${darkMode ? "border-amber-700/40 bg-amber-900/15" : "border-amber-300 bg-amber-50"}`}>
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 ${darkMode ? "text-amber-400" : "text-amber-500"}`}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg></div>
                <div className="flex-1">
                  <p className={`text-sm font-medium mb-1 ${darkMode ? "text-amber-200" : "text-amber-800"}`}>Vous avez indiqué ne pas avoir d'allergies</p>
                  <p className={`text-xs mb-3 ${darkMode ? "text-amber-300/70" : "text-amber-600"}`}>Si cela a changé, veuillez en ajouter.</p>
                  <div className="flex flex-wrap items-center gap-3">
                    <button onClick={() => setVue("liste")} className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition"><Plus size={14} /> Ajouter une allergie</button>
                    <button onClick={() => { sessionStorage.setItem('showQuestionAllergies', 'true'); setMontrerQuestionInit(true); }} className={`text-xs font-medium px-4 py-2 rounded-xl transition ${darkMode ? "text-amber-300 hover:text-amber-200 hover:bg-amber-900/30" : "text-amber-700 hover:text-amber-800 hover:bg-amber-100"}`}>Changer d'avis</button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <p className={`text-xs mb-3 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{items.length} allergie(s)</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                {items.map((a, i) => {
                  const sel = selectedIdx === i;
                  const sev = SEVERITE_OPTIONS.find(s => s.value === a.severite);
                  return (
                    <div key={i} onClick={() => setSelectedIdx(sel ? null : i)} className={`rounded-xl px-3 py-2.5 border cursor-pointer transition ${darkMode ? "bg-gray-700/50 border-gray-600" : "bg-gray-50 border-gray-200"} ${sel ? "ring-2 ring-blue-400" : ""}`}>
                      <div className="flex items-start justify-between">
                        <p className={`font-medium text-xs ${darkMode ? "text-white" : "text-gray-800"}`}>{a.nom}</p>
                        {sel && <div className="flex items-center gap-1 flex-shrink-0 ml-1"><button onClick={(e) => { e.stopPropagation(); handleEdit(i); }} className="text-gray-400 hover:text-blue-500 transition" title="Modifier"><Pencil size={11} /></button><button onClick={(e) => { e.stopPropagation(); setDeleteIndex(i); }} className="text-gray-400 hover:text-red-500 transition" title="Supprimer"><X size={12} /></button></div>}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        {a.type && <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-medium ${darkMode ? "bg-gray-600 text-gray-300" : "bg-gray-200 text-gray-600"}`}>{a.type}</span>}
                        {sev && <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-medium ${sev.color}`}>{sev.label}</span>}
                        {a.reaction && <span className="text-[11px] text-gray-400">{a.reaction}</span>}
                      </div>
                      {sel && a.date_decouverte && <p className={`text-[11px] mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Découverte : {new Date(a.date_decouverte).toLocaleDateString('fr-FR', { timeZone: getUserTimezone() })}</p>}
                    </div>
                  );
                })}
              </div>
              <button onClick={() => setVue("liste")} className="text-xs text-blue-500 hover:underline">+ Ajouter</button>
            </div>
          )}
        </div>
        {deleteIndex !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setDeleteIndex(null)}>
            <div className={`relative max-w-sm w-full rounded-2xl p-6 ${darkMode ? "bg-gray-800" : "bg-white"}`} onClick={e => e.stopPropagation()}>
              <div className="text-center mb-5"><div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-3"><Trash2 size={24} className="text-red-500" /></div><p className={`font-semibold text-sm ${darkMode ? "text-white" : "text-gray-800"}`}>Supprimer l'allergie</p><p className={`text-xs mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Supprimer <strong>"{items[deleteIndex]?.nom}"</strong> ?</p></div>
              <div className="flex items-center gap-3 justify-center">
                <button onClick={() => setDeleteIndex(null)} className="px-4 py-2 rounded-xl text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition">Annuler</button>
                <button onClick={() => handleDelete(deleteIndex)} className="px-4 py-2 rounded-xl text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition flex items-center gap-2"><Trash2 size={14} /> Supprimer</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (vue === "liste") {
    const filtres = ALLERGIES_LISTE.filter(item => item.nom.toLowerCase().includes(recherche.toLowerCase()) || item.type.toLowerCase().includes(recherche.toLowerCase()));
    const dejaAjoutes = items.map(a => a.nom);
    return (
      <div className={`rounded-2xl p-6 ${darkMode ? "bg-gray-800" : "bg-white shadow"}`}>
        <button onClick={() => setVue("home")} className="flex items-center gap-2 text-blue-500 text-sm font-medium mb-4 hover:underline"><ArrowLeft size={16} /> Retour</button>
        <h3 className={`font-semibold mb-1 ${darkMode ? "text-white" : "text-gray-800"}`}>Choisissez une allergie</h3>
        <p className={`text-xs mb-3 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Sélectionnez une allergie, puis renseignez la sévérité et la réaction.</p>
        <input type="text" value={recherche} onChange={(e) => setRecherche(e.target.value)} placeholder="Rechercher une allergie..."
          className={`w-full border rounded-xl pl-3 pr-3 py-2 text-sm outline-none focus:border-blue-400 mb-4 ${darkMode ? "bg-gray-700 border-gray-600 text-white placeholder:text-gray-400" : "border-gray-200 text-gray-800 placeholder:text-gray-400"}`} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
          {filtres.map(item => {
            const deja = dejaAjoutes.includes(item.nom);
            return (
              <button key={item.nom} disabled={deja} onClick={() => handleAjouter(item.nom, item.type)}
                className={`text-left px-4 py-3 rounded-xl text-sm transition-all border ${deja ? darkMode ? "bg-gray-700/30 border-gray-700 text-gray-500 cursor-not-allowed" : "bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed" : darkMode ? "bg-gray-700 border-gray-600 text-gray-300 hover:border-blue-500 hover:text-blue-300" : "bg-white border-gray-200 text-gray-600 hover:border-blue-400 hover:text-blue-600"}`}>
                {deja ? <span className="flex items-center gap-2"><CheckCircle size={14} className="text-green-400" /> {item.nom} (déjà ajouté)</span> : <span><span className="font-medium">{item.nom}</span><span className={`block text-[11px] mt-0.5 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>{item.type}</span></span>}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (vue === "detail") {
    return (
      <div className={`rounded-2xl p-6 ${darkMode ? "bg-gray-800" : "bg-white shadow"}`}>
        <button onClick={() => editIndex !== null ? setVue("home") : setVue("liste")} className="flex items-center gap-2 text-blue-500 text-sm font-medium mb-4 hover:underline"><ArrowLeft size={16} /> Retour</button>
        <h3 className={`font-semibold mb-4 ${darkMode ? "text-white" : "text-gray-800"}`}>{editIndex !== null ? `Modifier : ${detailNom}` : detailNom}</h3>
        {detailType && <p className={`text-xs mb-3 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Type : {detailType}</p>}
        <div className="mb-5">
          <label className={`text-xs font-medium mb-1.5 block ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Sévérité <span className="text-red-400">*</span></label>
          <div className="flex flex-wrap gap-2">
            {SEVERITE_OPTIONS.map(opt => (
              <button key={opt.value} onClick={() => setDetailSeverite(opt.value)} className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all border ${detailSeverite === opt.value ? darkMode ? "bg-blue-600/20 border-blue-500 text-blue-300" : "bg-blue-50 border-blue-400 text-blue-700" : darkMode ? "bg-gray-700 border-gray-600 text-gray-300 hover:border-gray-500" : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"}`}>{opt.label}</button>
            ))}
          </div>
        </div>
        <div className="mb-5">
          <label className={`text-xs font-medium mb-1.5 block ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Réaction</label>
          <select value={detailReaction} onChange={(e) => setDetailReaction(e.target.value)} className={`w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400 ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "border-gray-200 text-gray-800"}`}>
            <option value="">Sélectionner...</option>
            {ALLERGIE_REACTIONS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div className="mb-6">
          <label className={`text-xs font-medium mb-1.5 block ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Date de découverte</label>
          <div className="relative"><Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input type="date" value={detailDate} onChange={(e) => setDetailDate(e.target.value)} className={`w-full border rounded-xl pl-10 pr-3 py-2.5 text-sm outline-none focus:border-blue-400 ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "border-gray-200 text-gray-800"}`} /></div>
        </div>
        <button onClick={handleConfirmDetail} disabled={!detailSeverite} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${!detailSeverite ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-blue-600 text-white hover:bg-blue-700"}`}>{editIndex !== null ? <><Save size={16} /> Enregistrer</> : <><Plus size={16} /> Ajouter</>}</button>
      </div>
    );
  }
  return null;
}

function Traitements({ dossier, patientId, onDossierUpdate, darkMode }) {
  const [items, setItems] = useState([]);
  const [vue, setVue] = useState("home");
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [editIndex, setEditIndex] = useState(null);
  const [deleteIndex, setDeleteIndex] = useState(null);
  const [detailNom, setDetailNom] = useState("");
  const [detailDose, setDetailDose] = useState("");
  const [detailFrequence, setDetailFrequence] = useState("");
  const [detailDateDebut, setDetailDateDebut] = useState("");
  const [detailPrescripteur, setDetailPrescripteur] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [montrerQuestionInit, setMontrerQuestionInit] = useState(() => sessionStorage.getItem('showQuestionTraitements') === 'true');
  const dossierRef = useRef(dossier);

  useEffect(() => {
    dossierRef.current = dossier;
    const raw = dossier?.traitements_chroniques;
    if (Array.isArray(raw)) { setItems(raw); return; }
    if (typeof raw === 'string') { try { const x = JSON.parse(raw); if (Array.isArray(x)) { setItems(x); return; } } catch(e) {} }
    setItems([]);
  }, [dossier]);

  const saveItems = async (newList) => {
    setSaving(true); setSaveError(null);
    try {
      const d = dossierRef.current;
      if (d?.id) {
        const updated = await put(`/api/dossiers_medicaux/${d.id}`, { traitements_chroniques: newList });
        dossierRef.current = updated; onDossierUpdate(updated);
      }
    } catch (err) { console.error(err); setSaveError("Erreur de sauvegarde."); } finally { setSaving(false); }
  };

  const handleAjouter = (nom, dose) => {
    setEditIndex(null); setDetailNom(nom); setDetailDose(dose || ""); setDetailFrequence(""); setDetailDateDebut(""); setDetailPrescripteur(""); setVue("detail");
  };
  const handleEdit = (i) => {
    const t = items[i]; setEditIndex(i); setDetailNom(t.nom); setDetailDose(t.dose || ""); setDetailFrequence(t.frequence || ""); setDetailDateDebut(t.date_debut || ""); setDetailPrescripteur(t.prescripteur || ""); setVue("detail");
  };
  const handleConfirmDetail = () => {
    if (!detailNom) return;
    const newItem = { nom: detailNom, dose: detailDose || undefined, frequence: detailFrequence || undefined, date_debut: detailDateDebut || undefined, prescripteur: detailPrescripteur || undefined };
    const newList = editIndex !== null ? items.map((t, i) => i === editIndex ? newItem : t) : [...items, newItem];
    setItems(newList); setVue("home"); saveItems(newList);
  };
  const handleDelete = (i) => { const newList = items.filter((_, idx) => idx !== i); setItems(newList); setDeleteIndex(null); saveItems(newList); };

  if (vue === "home") {
    return (
      <div className="space-y-6">
        <div className={`rounded-2xl p-6 ${darkMode ? "bg-gray-800" : "bg-white shadow"}`}>
          {saveError && <div className={`rounded-xl px-4 py-3 text-sm font-medium flex items-center gap-2 mb-4 ${darkMode ? "bg-red-900/30 text-red-300 border border-red-700/50" : "bg-red-50 text-red-700 border border-red-200"}`}><AlertCircle size={14} /> {saveError}<button onClick={() => setSaveError(null)} className="ml-auto"><X size={14} /></button></div>}
          <h3 className={`font-semibold mb-3 ${darkMode ? "text-white" : "text-gray-800"}`}>Traitements réguliers</h3>
          {items.length === 0 && (!dossier?.id || montrerQuestionInit) ? (
            <div>
              <p className={`text-sm mb-4 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Suivez-vous un traitement régulier ? Indiquez vos médicaments pour assurer un bon suivi médical.</p>
              <div className="flex flex-wrap gap-3">
                <button onClick={() => setVue("liste")} className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition"><Plus size={14} /> Ajouter un traitement</button>
                <button onClick={() => { sessionStorage.removeItem('showQuestionTraitements'); setItems([]); setMontrerQuestionInit(false); saveItems([]); }} disabled={saving} className={`text-xs font-medium px-4 py-2 rounded-xl transition ${darkMode ? "text-gray-400 hover:text-gray-200 hover:bg-gray-700" : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"}`}>{saving ? "Sauvegarde..." : "Je ne suis sous aucun traitement"}</button>
              </div>
            </div>
          ) : items.length === 0 ? (
            <div className={`rounded-xl border p-4 ${darkMode ? "border-amber-700/40 bg-amber-900/15" : "border-amber-300 bg-amber-50"}`}>
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 ${darkMode ? "text-amber-400" : "text-amber-500"}`}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg></div>
                <div className="flex-1">
                  <p className={`text-sm font-medium mb-1 ${darkMode ? "text-amber-200" : "text-amber-800"}`}>Vous avez indiqué ne suivre aucun traitement</p>
                  <p className={`text-xs mb-3 ${darkMode ? "text-amber-300/70" : "text-amber-600"}`}>Si cela a changé, veuillez en ajouter.</p>
                  <div className="flex flex-wrap items-center gap-3">
                    <button onClick={() => setVue("liste")} className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition"><Plus size={14} /> Ajouter un traitement</button>
                    <button onClick={() => { sessionStorage.setItem('showQuestionTraitements', 'true'); setMontrerQuestionInit(true); }} className={`text-xs font-medium px-4 py-2 rounded-xl transition ${darkMode ? "text-amber-300 hover:text-amber-200 hover:bg-amber-900/30" : "text-amber-700 hover:text-amber-800 hover:bg-amber-100"}`}>Changer d'avis</button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <p className={`text-xs mb-3 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{items.length} traitement(s)</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                {items.map((t, i) => {
                  const sel = selectedIdx === i;
                  return (
                    <div key={i} onClick={() => setSelectedIdx(sel ? null : i)} className={`rounded-xl px-3 py-2.5 border cursor-pointer transition ${darkMode ? "bg-gray-700/50 border-gray-600" : "bg-gray-50 border-gray-200"} ${sel ? "ring-2 ring-blue-400" : ""}`}>
                      <div className="flex items-start justify-between">
                        <p className={`font-medium text-xs ${darkMode ? "text-white" : "text-gray-800"}`}>{t.nom}</p>
                        {sel && <div className="flex items-center gap-1 flex-shrink-0 ml-1"><button onClick={(e) => { e.stopPropagation(); handleEdit(i); }} className="text-gray-400 hover:text-blue-500 transition" title="Modifier"><Pencil size={11} /></button><button onClick={(e) => { e.stopPropagation(); setDeleteIndex(i); }} className="text-gray-400 hover:text-red-500 transition" title="Supprimer"><X size={12} /></button></div>}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        {t.dose && <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-medium ${darkMode ? "bg-gray-600 text-gray-300" : "bg-gray-200 text-gray-600"}`}>{t.dose}</span>}
                        {t.frequence && <span className="text-[11px] text-gray-400">{t.frequence}</span>}
                      </div>
                      {sel && <div className={`mt-2 pt-2 border-t space-y-1 text-[11px] ${darkMode ? "border-gray-600 text-gray-400" : "border-gray-200 text-gray-500"}`}>
                        {t.prescripteur && <p><span className="font-medium">Prescrit par :</span> {t.prescripteur}</p>}
                        {t.date_debut && <p><span className="font-medium">Depuis :</span> {new Date(t.date_debut).toLocaleDateString('fr-FR', { timeZone: getUserTimezone() })}</p>}
                      </div>}
                    </div>
                  );
                })}
              </div>
              <button onClick={() => setVue("liste")} className="text-xs text-blue-500 hover:underline">+ Ajouter</button>
            </div>
          )}
        </div>
        {deleteIndex !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setDeleteIndex(null)}>
            <div className={`relative max-w-sm w-full rounded-2xl p-6 ${darkMode ? "bg-gray-800" : "bg-white"}`} onClick={e => e.stopPropagation()}>
              <div className="text-center mb-5"><div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-3"><Trash2 size={24} className="text-red-500" /></div><p className={`font-semibold text-sm ${darkMode ? "text-white" : "text-gray-800"}`}>Supprimer le traitement</p><p className={`text-xs mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Supprimer <strong>"{items[deleteIndex]?.nom}"</strong> ?</p></div>
              <div className="flex items-center gap-3 justify-center">
                <button onClick={() => setDeleteIndex(null)} className="px-4 py-2 rounded-xl text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition">Annuler</button>
                <button onClick={() => handleDelete(deleteIndex)} className="px-4 py-2 rounded-xl text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition flex items-center gap-2"><Trash2 size={14} /> Supprimer</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (vue === "liste") {
    return (
      <div className={`rounded-2xl p-6 ${darkMode ? "bg-gray-800" : "bg-white shadow"}`}>
        <button onClick={() => setVue("home")} className="flex items-center gap-2 text-blue-500 text-sm font-medium mb-4 hover:underline"><ArrowLeft size={16} /> Retour</button>
        <h3 className={`font-semibold mb-1 ${darkMode ? "text-white" : "text-gray-800"}`}>Choisissez un traitement</h3>
        <p className={`text-xs mb-3 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Recherchez dans la base de médicaments ou tapez un nom personnalisé.</p>
        <MedicamentSearch
          darkMode={darkMode}
          allowCustom
          placeholder="Rechercher un médicament..."
          onSelect={(med) => {
            handleAjouter(med.nom_commercial, med.dosage);
          }}
        />
      </div>
    );
  }

  if (vue === "detail") {
    return (
      <div className={`rounded-2xl p-6 ${darkMode ? "bg-gray-800" : "bg-white shadow"}`}>
        <button onClick={() => editIndex !== null ? setVue("home") : setVue("liste")} className="flex items-center gap-2 text-blue-500 text-sm font-medium mb-4 hover:underline"><ArrowLeft size={16} /> Retour</button>
        <h3 className={`font-semibold mb-4 ${darkMode ? "text-white" : "text-gray-800"}`}>{editIndex !== null ? `Modifier : ${detailNom}` : detailNom}</h3>
        <div className="mb-5">
          <label className={`text-xs font-medium mb-1.5 block ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Dose</label>
          <input type="text" value={detailDose} onChange={(e) => setDetailDose(e.target.value)} placeholder="ex: 500mg, 10 gouttes..."
            className={`w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400 ${darkMode ? "bg-gray-700 border-gray-600 text-white placeholder:text-gray-500" : "border-gray-200 text-gray-800 placeholder:text-gray-400"}`} />
        </div>
        <div className="mb-5">
          <label className={`text-xs font-medium mb-1.5 block ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Fréquence</label>
          <select value={detailFrequence} onChange={(e) => setDetailFrequence(e.target.value)} className={`w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400 ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "border-gray-200 text-gray-800"}`}>
            <option value="">Sélectionner...</option>
            {FREQUENCE_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
        <div className="mb-5">
          <label className={`text-xs font-medium mb-1.5 block ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Date de début</label>
          <div className="relative"><Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input type="date" value={detailDateDebut} onChange={(e) => setDetailDateDebut(e.target.value)} className={`w-full border rounded-xl pl-10 pr-3 py-2.5 text-sm outline-none focus:border-blue-400 ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "border-gray-200 text-gray-800"}`} /></div>
        </div>
        <div className="mb-6">
          <label className={`text-xs font-medium mb-1.5 block ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Médecin prescripteur</label>
          <input type="text" value={detailPrescripteur} onChange={(e) => setDetailPrescripteur(e.target.value)} placeholder="Nom du médecin..."
            className={`w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400 ${darkMode ? "bg-gray-700 border-gray-600 text-white placeholder:text-gray-500" : "border-gray-200 text-gray-800 placeholder:text-gray-400"}`} />
        </div>
        <button onClick={handleConfirmDetail} disabled={!detailNom} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${!detailNom ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-blue-600 text-white hover:bg-blue-700"}`}>{editIndex !== null ? <><Save size={16} /> Enregistrer</> : <><Plus size={16} /> Ajouter</>}</button>
      </div>
    );
  }
  return null;
}

function Operations({ dossier, patientId, onDossierUpdate, darkMode }) {
  const [items, setItems] = useState([]);
  const [vue, setVue] = useState("home");
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [editIndex, setEditIndex] = useState(null);
  const [deleteIndex, setDeleteIndex] = useState(null);
  const [detailNom, setDetailNom] = useState("");
  const [detailDate, setDetailDate] = useState("");
  const [detailChirurgien, setDetailChirurgien] = useState("");
  const [detailHopital, setDetailHopital] = useState("");
  const [detailComplications, setDetailComplications] = useState("");
  const [recherche, setRecherche] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [montrerQuestionInit, setMontrerQuestionInit] = useState(() => sessionStorage.getItem('showQuestionOperations') === 'true');
  const dossierRef = useRef(dossier);

  useEffect(() => {
    dossierRef.current = dossier;
    if (dossier?.antecedents_chirurgicaux) {
      try { const x = JSON.parse(dossier.antecedents_chirurgicaux); if (Array.isArray(x)) { setItems(x); return; } } catch (e) {}
    }
    setItems([]);
  }, [dossier]);

  const saveItems = async (newList) => {
    setSaving(true); setSaveError(null);
    try {
      const d = dossierRef.current;
      if (d?.id) {
        const updated = await put(`/api/dossiers_medicaux/${d.id}`, { antecedents_chirurgicaux: JSON.stringify(newList) });
        dossierRef.current = updated; onDossierUpdate(updated);
      }
    } catch (err) { console.error(err); setSaveError("Erreur de sauvegarde."); } finally { setSaving(false); }
  };

  const handleAjouter = (nom) => {
    setEditIndex(null); setDetailNom(nom); setDetailDate(""); setDetailChirurgien(""); setDetailHopital(""); setDetailComplications(""); setVue("detail");
  };
  const handleEdit = (i) => {
    const o = items[i]; setEditIndex(i); setDetailNom(o.nom); setDetailDate(o.date || ""); setDetailChirurgien(o.chirurgien || ""); setDetailHopital(o.hopital || ""); setDetailComplications(o.complications || ""); setVue("detail");
  };
  const handleConfirmDetail = () => {
    if (!detailNom) return;
    const newItem = { nom: detailNom, date: detailDate || undefined, chirurgien: detailChirurgien || undefined, hopital: detailHopital || undefined, complications: detailComplications || undefined };
    const newList = editIndex !== null ? items.map((o, i) => i === editIndex ? newItem : o) : [...items, newItem];
    setItems(newList); setVue("home"); saveItems(newList);
  };
  const handleDelete = (i) => { const newList = items.filter((_, idx) => idx !== i); setItems(newList); setDeleteIndex(null); saveItems(newList); };

  if (vue === "home") {
    return (
      <div className="space-y-6">
        <div className={`rounded-2xl p-6 ${darkMode ? "bg-gray-800" : "bg-white shadow"}`}>
          {saveError && <div className={`rounded-xl px-4 py-3 text-sm font-medium flex items-center gap-2 mb-4 ${darkMode ? "bg-red-900/30 text-red-300 border border-red-700/50" : "bg-red-50 text-red-700 border border-red-200"}`}><AlertCircle size={14} /> {saveError}<button onClick={() => setSaveError(null)} className="ml-auto"><X size={14} /></button></div>}
          <h3 className={`font-semibold mb-3 ${darkMode ? "text-white" : "text-gray-800"}`}>Opérations chirurgicales</h3>
          {items.length === 0 && (!dossier?.id || montrerQuestionInit) ? (
            <div>
              <p className={`text-sm mb-4 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Avez-vous subi des opérations chirurgicales ? Ces informations aident vos médecins à mieux vous suivre.</p>
              <div className="flex flex-wrap gap-3">
                <button onClick={() => setVue("liste")} className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition"><Plus size={14} /> Ajouter une opération</button>
                <button onClick={() => { sessionStorage.removeItem('showQuestionOperations'); setItems([]); setMontrerQuestionInit(false); saveItems([]); }} disabled={saving} className={`text-xs font-medium px-4 py-2 rounded-xl transition ${darkMode ? "text-gray-400 hover:text-gray-200 hover:bg-gray-700" : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"}`}>{saving ? "Sauvegarde..." : "Aucune opération"}</button>
              </div>
            </div>
          ) : items.length === 0 ? (
            <div className={`rounded-xl border p-4 ${darkMode ? "border-amber-700/40 bg-amber-900/15" : "border-amber-300 bg-amber-50"}`}>
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 ${darkMode ? "text-amber-400" : "text-amber-500"}`}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg></div>
                <div className="flex-1">
                  <p className={`text-sm font-medium mb-1 ${darkMode ? "text-amber-200" : "text-amber-800"}`}>Vous avez indiqué n'avoir subi aucune opération</p>
                  <div className="flex flex-wrap items-center gap-3">
                    <button onClick={() => setVue("liste")} className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition"><Plus size={14} /> Ajouter une opération</button>
                    <button onClick={() => { sessionStorage.setItem('showQuestionOperations', 'true'); setMontrerQuestionInit(true); }} className={`text-xs font-medium px-4 py-2 rounded-xl transition ${darkMode ? "text-amber-300 hover:text-amber-200 hover:bg-amber-900/30" : "text-amber-700 hover:text-amber-800 hover:bg-amber-100"}`}>Changer d'avis</button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <p className={`text-xs mb-3 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{items.length} opération(s)</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                {items.map((o, i) => {
                  const sel = selectedIdx === i;
                  return (
                    <div key={i} onClick={() => setSelectedIdx(sel ? null : i)} className={`rounded-xl px-3 py-2.5 border cursor-pointer transition ${darkMode ? "bg-gray-700/50 border-gray-600" : "bg-gray-50 border-gray-200"} ${sel ? "ring-2 ring-blue-400" : ""}`}>
                      <div className="flex items-start justify-between">
                        <p className={`font-medium text-xs ${darkMode ? "text-white" : "text-gray-800"}`}>{o.nom}</p>
                        {sel && <div className="flex items-center gap-1 flex-shrink-0 ml-1"><button onClick={(e) => { e.stopPropagation(); handleEdit(i); }} className="text-gray-400 hover:text-blue-500 transition" title="Modifier"><Pencil size={11} /></button><button onClick={(e) => { e.stopPropagation(); setDeleteIndex(i); }} className="text-gray-400 hover:text-red-500 transition" title="Supprimer"><X size={12} /></button></div>}
                      </div>
                      {o.date && <span className="flex items-center gap-1 text-[11px] text-gray-400 mt-1"><Calendar size={10} /> {new Date(o.date).toLocaleDateString('fr-FR', { timeZone: getUserTimezone() })}</span>}
                      {sel && <div className={`mt-2 pt-2 border-t space-y-1 text-[11px] ${darkMode ? "border-gray-600 text-gray-400" : "border-gray-200 text-gray-500"}`}>
                        {o.chirurgien && <p><span className="font-medium">Chirurgien :</span> {o.chirurgien}</p>}
                        {o.hopital && <p><span className="font-medium">Hôpital :</span> {o.hopital}</p>}
                        {o.complications && <p><span className="font-medium">Complications :</span> {o.complications}</p>}
                        {!o.chirurgien && !o.hopital && !o.complications && <p className="italic">Aucune information complémentaire</p>}
                      </div>}
                    </div>
                  );
                })}
              </div>
              <button onClick={() => setVue("liste")} className="text-xs text-blue-500 hover:underline">+ Ajouter</button>
            </div>
          )}
        </div>
        {deleteIndex !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setDeleteIndex(null)}>
            <div className={`relative max-w-sm w-full rounded-2xl p-6 ${darkMode ? "bg-gray-800" : "bg-white"}`} onClick={e => e.stopPropagation()}>
              <div className="text-center mb-5"><div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-3"><Trash2 size={24} className="text-red-500" /></div><p className={`font-semibold text-sm ${darkMode ? "text-white" : "text-gray-800"}`}>Supprimer l'opération</p><p className={`text-xs mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Supprimer <strong>"{items[deleteIndex]?.nom}"</strong> ?</p></div>
              <div className="flex items-center gap-3 justify-center">
                <button onClick={() => setDeleteIndex(null)} className="px-4 py-2 rounded-xl text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition">Annuler</button>
                <button onClick={() => handleDelete(deleteIndex)} className="px-4 py-2 rounded-xl text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition flex items-center gap-2"><Trash2 size={14} /> Supprimer</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (vue === "liste") {
    const filtres = OPERATIONS_LISTE.filter(item => item.toLowerCase().includes(recherche.toLowerCase()));
    const dejaAjoutes = items.map(o => o.nom);
    return (
      <div className={`rounded-2xl p-6 ${darkMode ? "bg-gray-800" : "bg-white shadow"}`}>
        <button onClick={() => setVue("home")} className="flex items-center gap-2 text-blue-500 text-sm font-medium mb-4 hover:underline"><ArrowLeft size={16} /> Retour</button>
        <h3 className={`font-semibold mb-1 ${darkMode ? "text-white" : "text-gray-800"}`}>Choisissez une opération</h3>
        <input type="text" value={recherche} onChange={(e) => setRecherche(e.target.value)} placeholder="Rechercher une opération..."
          className={`w-full border rounded-xl pl-3 pr-3 py-2 text-sm outline-none focus:border-blue-400 mb-4 ${darkMode ? "bg-gray-700 border-gray-600 text-white placeholder:text-gray-400" : "border-gray-200 text-gray-800 placeholder:text-gray-400"}`} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
          {filtres.map(item => {
            const deja = dejaAjoutes.includes(item);
            return (
              <button key={item} disabled={deja} onClick={() => handleAjouter(item)}
                className={`text-left px-4 py-3 rounded-xl text-sm font-medium transition-all border ${deja ? darkMode ? "bg-gray-700/30 border-gray-700 text-gray-500 cursor-not-allowed" : "bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed" : darkMode ? "bg-gray-700 border-gray-600 text-gray-300 hover:border-blue-500 hover:text-blue-300" : "bg-white border-gray-200 text-gray-600 hover:border-blue-400 hover:text-blue-600"}`}>
                {deja ? <span className="flex items-center gap-2"><CheckCircle size={14} className="text-green-400" /> {item} (déjà ajouté)</span> : item}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (vue === "detail") {
    return (
      <div className={`rounded-2xl p-6 ${darkMode ? "bg-gray-800" : "bg-white shadow"}`}>
        <button onClick={() => editIndex !== null ? setVue("home") : setVue("liste")} className="flex items-center gap-2 text-blue-500 text-sm font-medium mb-4 hover:underline"><ArrowLeft size={16} /> Retour</button>
        <h3 className={`font-semibold mb-4 ${darkMode ? "text-white" : "text-gray-800"}`}>{editIndex !== null ? `Modifier : ${detailNom}` : detailNom}</h3>
        <div className="mb-5">
          <label className={`text-xs font-medium mb-1.5 block ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Date de l'opération</label>
          <div className="relative"><Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input type="date" value={detailDate} onChange={(e) => setDetailDate(e.target.value)} className={`w-full border rounded-xl pl-10 pr-3 py-2.5 text-sm outline-none focus:border-blue-400 ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "border-gray-200 text-gray-800"}`} /></div>
        </div>
        <div className="mb-5">
          <label className={`text-xs font-medium mb-1.5 block ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Chirurgien</label>
          <input type="text" value={detailChirurgien} onChange={(e) => setDetailChirurgien(e.target.value)} placeholder="Nom du chirurgien..."
            className={`w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400 ${darkMode ? "bg-gray-700 border-gray-600 text-white placeholder:text-gray-500" : "border-gray-200 text-gray-800 placeholder:text-gray-400"}`} />
        </div>
        <div className="mb-5">
          <label className={`text-xs font-medium mb-1.5 block ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Hôpital / Centre</label>
          <input type="text" value={detailHopital} onChange={(e) => setDetailHopital(e.target.value)} placeholder="Nom de l'établissement..."
            className={`w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400 ${darkMode ? "bg-gray-700 border-gray-600 text-white placeholder:text-gray-500" : "border-gray-200 text-gray-800 placeholder:text-gray-400"}`} />
        </div>
        <div className="mb-6">
          <label className={`text-xs font-medium mb-1.5 block ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Complications</label>
          <input type="text" value={detailComplications} onChange={(e) => setDetailComplications(e.target.value)} placeholder="Si aucune, laisser vide..."
            className={`w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400 ${darkMode ? "bg-gray-700 border-gray-600 text-white placeholder:text-gray-500" : "border-gray-200 text-gray-800 placeholder:text-gray-400"}`} />
        </div>
        <button onClick={handleConfirmDetail} disabled={!detailNom} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${!detailNom ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-blue-600 text-white hover:bg-blue-700"}`}>{editIndex !== null ? <><Save size={16} /> Enregistrer</> : <><Plus size={16} /> Ajouter</>}</button>
      </div>
    );
  }
  return null;
}

function PrenatalVisitsSection({ visites, onUpdate, grossesses, darkMode, patientId }) {
  const [expandedId, setExpandedId] = useState(null);

  const grossesseEnCours = grossesses.find(g => g.issue === "Grossesse en cours");
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

  const DOC_TYPES = [
    { value: "imagerie_echographie", label: "Échographie" },
    { value: "resultat_labo", label: "Résultat d'analyse" },
    { value: "ordonnance_scannee", label: "Ordonnance" },
    { value: "compte_rendu_consultation", label: "Compte rendu" },
    { value: "imagerie_radio", label: "Radiographie" },
    { value: "certificat_medical", label: "Certificat médical" },
    { value: "autre", label: "Autre" },
  ];

  const InfoTip = ({ text }) => (
    <span className={`relative group inline-flex ml-1 cursor-help`}>
      <AlertCircle size={11} className={`${darkMode ? "text-gray-500" : "text-gray-400"} group-hover:text-blue-500 transition`} />
      <span className={`absolute bottom-full left-0 mb-1.5 w-56 p-2 rounded-lg text-[10px] leading-tight opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 ${darkMode ? "bg-gray-600 text-gray-200" : "bg-gray-800 text-white"} shadow-lg`}>
        {text}
      </span>
    </span>
  );

  const handleUpdate = (id, updates) => {
    const updated = visites.map(v => v.id === id ? { ...v, ...updates } : v);
    onUpdate(updated);
  };

  const handleDelete = (id) => {
    if (window.confirm("Supprimer cette visite prénatale ?")) {
      onUpdate(visites.filter(v => v.id !== id));
    }
  };

  const addVisit = (autoLabel) => {
    const newVisit = {
      id: Date.now(),
      numero: autoLabel || `VP${visites.length + 1}`,
      statut: "non_planifiee",
      date_prevue: "",
      date_reelle: "",
      lieu: "",
      praticien: "",
      age_gestationnel: "",
      ta_systolique: "",
      ta_diastolique: "",
      poids: "",
      hauteur_uterine: "",
      rcf: "",
      oeudemes: "",
      proteinurie: "",
      glycemie: "",
      groupe_sanguin_confirme: false,
      anticorps: "",
      rubeole: "",
      syphilis: "",
      hbs_ag: "",
      vih: "",
      toxoplasmose: "",
      echo_realisee: false,
      echo_date: "",
      echo_biometrie: "",
      echo_presentation: "",
      echo_liquide: "",
      traitement: "",
      prochaine_visite: "",
      observations: "",
      documents: [],
    };
    onUpdate([newVisit, ...visites]);
    setExpandedId(newVisit.id);
  };

  const handleFileUpload = async (visitId, file) => {
    if (!file) return;
    try {
      const reader = new FileReader();
      const base64 = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const visit = visites.find(v => v.id === visitId);
      const existingDocs = visit?.documents || [];
      const newDoc = {
        id: Date.now(),
        nom: file.name,
        type: "",
        url: base64,
        taille: file.size,
        mime: file.type,
      };
      handleUpdate(visitId, { documents: [...existingDocs, newDoc] });
    } catch (err) {
      console.error("File read error:", err);
    }
  };

  const handleDocType = (visitId, docId, type) => {
    const visit = visites.find(v => v.id === visitId);
    if (!visit) return;
    const updatedDocs = (visit.documents || []).map(d => d.id === docId ? { ...d, type } : d);
    handleUpdate(visitId, { documents: updatedDocs });
  };

  const handleRemoveDoc = (visitId, docId) => {
    const visit = visites.find(v => v.id === visitId);
    if (!visit) return;
    handleUpdate(visitId, { documents: (visit.documents || []).filter(d => d.id !== docId) });
  };

  const sortedVisites = [...visites].sort((a, b) => {
    const numA = parseInt((a.numero || "").replace(/\D/g, "")) || 0;
    const numB = parseInt((b.numero || "").replace(/\D/g, "")) || 0;
    return numA - numB;
  });

  return (
    <div className="relative">
      {/* Encart informatif médecin */}
      <div className={`mb-4 p-3 rounded-xl border flex items-start gap-3 text-xs ${darkMode ? "bg-blue-900/10 border-blue-800/30 text-blue-300" : "bg-blue-50 border-blue-200 text-blue-700"}`}>
        <Stethoscope size={16} className="flex-shrink-0 mt-0.5" />
        <p>Votre médecin peut également remplir ou compléter ces informations directement depuis son interface lorsqu'il accède à votre dossier patient.</p>
      </div>

      <div className={`absolute left-6 top-14 bottom-0 w-0.5 ${darkMode ? "bg-gray-700" : "bg-gray-200"}`} />

      <div className="space-y-4">
        {sortedVisites.map((v) => {
          const sc = statusColor[v.statut] || statusColor.non_planifiee;
          const isExpanded = expandedId === v.id;
          const weeksCalc = v.date_reelle ? calcWeeks(v.date_reelle) : (v.date_prevue ? calcWeeks(v.date_prevue) : v.age_gestationnel);

          return (
            <div key={v.id} className="relative flex gap-4">
              <div className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${sc.bg} ${sc.text} shadow-sm`}>
                <Stethoscope size={18} />
              </div>

              <div className={`flex-1 border rounded-2xl transition-all duration-300 overflow-hidden ${isExpanded ? 'shadow-md' : 'hover:shadow-sm'} ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
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
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(v.id); }} className={`p-1.5 rounded-lg transition-colors ${darkMode ? "hover:bg-gray-700 text-gray-400 hover:text-red-400" : "hover:bg-gray-100 text-gray-400 hover:text-red-500"}`}>
                      <Trash2 size={14} />
                    </button>
                    {isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-4 pt-0 border-t border-dashed animate-in fade-in slide-in-from-top-2 duration-200 space-y-5 mt-3">

                    {/* Général */}
                    <div className={`p-3 rounded-xl ${darkMode ? "bg-gray-700/50" : "bg-gray-50"}`}>
                      <h5 className={`text-[10px] uppercase tracking-wider font-bold mb-3 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Informations générales</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className={`text-xs mb-1 block ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Numéro de visite</label>
                          <input value={v.numero || ""} onChange={(e) => handleUpdate(v.id, { numero: e.target.value })} placeholder="VP1"
                            className={`w-full border rounded-lg px-3 py-2 text-sm outline-none ${darkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-200"}`} />
                        </div>
                        <div>
                          <label className={`text-xs mb-1 block ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Statut</label>
                          <select value={v.statut} onChange={(e) => handleUpdate(v.id, { statut: e.target.value })}
                            className={`w-full border rounded-lg px-3 py-2 text-sm outline-none ${darkMode ? "bg-gray-800 border-gray-600" : "bg-white border-gray-200"}`}>
                            <option value="non_planifiee">Non planifiée</option>
                            <option value="planifiee">Planifiée</option>
                            <option value="completee">Complétée</option>
                          </select>
                        </div>
                        <div>
                          <label className={`text-xs mb-1 flex items-center ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                            Date prévue <InfoTip text="Date à laquelle cette visite était initialement prévue selon le calendrier prénatal." />
                          </label>
                          <input type="date" value={v.date_prevue || ""} onChange={(e) => handleUpdate(v.id, { date_prevue: e.target.value })}
                            className={`w-full border rounded-lg px-3 py-2 text-sm outline-none ${darkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-200"}`} />
                        </div>
                        <div>
                          <label className={`text-xs mb-1 flex items-center ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                            Date réelle <InfoTip text="Date à laquelle la visite a effectivement eu lieu. Renseignez-la après la consultation." />
                          </label>
                          <input type="date" value={v.date_reelle || ""} onChange={(e) => handleUpdate(v.id, { date_reelle: e.target.value })}
                            className={`w-full border rounded-lg px-3 py-2 text-sm outline-none ${darkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-200"}`} />
                        </div>
                        <div>
                          <label className={`text-xs mb-1 block ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Lieu / Structure</label>
                          <input value={v.lieu || ""} onChange={(e) => handleUpdate(v.id, { lieu: e.target.value })} placeholder="Hôpital, clinique..."
                            className={`w-full border rounded-lg px-3 py-2 text-sm outline-none ${darkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-200"}`} />
                        </div>
                        <div>
                          <label className={`text-xs mb-1 block ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Praticien consulté</label>
                          <input value={v.praticien || ""} onChange={(e) => handleUpdate(v.id, { praticien: e.target.value })} placeholder="Dr. ..."
                            className={`w-full border rounded-lg px-3 py-2 text-sm outline-none ${darkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-200"}`} />
                        </div>
                        <div>
                          <label className={`text-xs mb-1 flex items-center ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                            Âge gestationnel (SA) <InfoTip text="Nombre de semaines d'aménorrhée (SA) au moment de la visite. Se calcule automatiquement depuis le début de grossesse si la date est renseignée." />
                          </label>
                          <input type="number" min="0" value={v.age_gestationnel || ""} onChange={(e) => handleUpdate(v.id, { age_gestationnel: e.target.value })} placeholder={dateDebut ? `~${calcWeeks(new Date().toISOString().split('T')[0]) || "?"} SA` : "Ex: 20"}
                            className={`w-full border rounded-lg px-3 py-2 text-sm outline-none ${darkMode ? "bg-gray-800 border-gray-600 text-white placeholder:text-gray-600" : "bg-white border-gray-200 placeholder:text-gray-400"}`} />
                        </div>
                      </div>
                    </div>

                    {/* Constantes */}
                    <div className={`p-3 rounded-xl ${darkMode ? "bg-gray-700/50" : "bg-gray-50"}`}>
                      <h5 className={`text-[10px] uppercase tracking-wider font-bold mb-3 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Constantes</h5>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className={`text-xs mb-1 flex items-center ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                              TA max <InfoTip text="Tension artérielle systolique (la plus élevée). Normal: < 14." />
                            </label>
                            <input type="number" value={v.ta_systolique || ""} onChange={(e) => handleUpdate(v.id, { ta_systolique: e.target.value })} placeholder="12"
                              className={`w-full border rounded-lg px-3 py-2 text-sm outline-none ${darkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-200"}`} />
                          </div>
                          <div>
                            <label className={`text-xs mb-1 flex items-center ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                              TA min <InfoTip text="Tension artérielle diastolique (la plus basse). Normal: < 9." />
                            </label>
                            <input type="number" value={v.ta_diastolique || ""} onChange={(e) => handleUpdate(v.id, { ta_diastolique: e.target.value })} placeholder="8"
                              className={`w-full border rounded-lg px-3 py-2 text-sm outline-none ${darkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-200"}`} />
                          </div>
                        </div>
                        <div>
                          <label className={`text-xs mb-1 flex items-center ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                            Poids (kg) <InfoTip text="Poids de la patiente au moment de la visite. Le gain de poids est suivi tout au long de la grossesse." />
                          </label>
                          <input type="number" step="0.1" value={v.poids || ""} onChange={(e) => handleUpdate(v.id, { poids: e.target.value })}
                            className={`w-full border rounded-lg px-3 py-2 text-sm outline-none ${darkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-200"}`} />
                        </div>
                        <div>
                          <label className={`text-xs mb-1 flex items-center ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                            Hauteur utérine (cm) <InfoTip text="Distance en cm du pubis au sommet de l'utérus. Permet d'estimer la croissance fœtale." />
                          </label>
                          <input type="number" step="0.5" value={v.hauteur_uterine || ""} onChange={(e) => handleUpdate(v.id, { hauteur_uterine: e.target.value })}
                            className={`w-full border rounded-lg px-3 py-2 text-sm outline-none ${darkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-200"}`} />
                        </div>
                        <div>
                          <label className={`text-xs mb-1 flex items-center ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                            RCF (bpm) <InfoTip text="Rythme cardiaque fœtal. Normal: 110–160 battements par minute." />
                          </label>
                          <input type="number" value={v.rcf || ""} onChange={(e) => handleUpdate(v.id, { rcf: e.target.value })} placeholder="140"
                            className={`w-full border rounded-lg px-3 py-2 text-sm outline-none ${darkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-200"}`} />
                        </div>
                        <div>
                          <label className={`text-xs mb-1 block ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Œdèmes</label>
                          <select value={v.oeudemes || ""} onChange={(e) => handleUpdate(v.id, { oeudemes: e.target.value })}
                            className={`w-full border rounded-lg px-3 py-2 text-sm outline-none ${darkMode ? "bg-gray-800 border-gray-600" : "bg-white border-gray-200"}`}>
                            <option value="">Non évalué</option>
                            <option value="Non">Non</option>
                            <option value="Légers">Légers</option>
                            <option value="Importants">Importants</option>
                          </select>
                        </div>
                        <div>
                          <label className={`text-xs mb-1 flex items-center ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                            Protéinurie <InfoTip text="Recherche de protéines dans les urines (bandelette). Peut révéler un risque de pré-éclampsie." />
                          </label>
                          <select value={v.proteinurie || ""} onChange={(e) => handleUpdate(v.id, { proteinurie: e.target.value })}
                            className={`w-full border rounded-lg px-3 py-2 text-sm outline-none ${darkMode ? "bg-gray-800 border-gray-600" : "bg-white border-gray-200"}`}>
                            <option value="">Non faite</option>
                            <option value="Négative">Négative</option>
                            <option value="Positive">Positive</option>
                          </select>
                        </div>
                        <div>
                          <label className={`text-xs mb-1 flex items-center ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                            Glycémie (g/L) <InfoTip text="Taux de sucre dans le sang. À jeun, normal: 0.70–1.10 g/L. Dépiste le diabète gestationnel." />
                          </label>
                          <input type="number" step="0.01" value={v.glycemie || ""} onChange={(e) => handleUpdate(v.id, { glycemie: e.target.value })} placeholder="0.85"
                            className={`w-full border rounded-lg px-3 py-2 text-sm outline-none ${darkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-200"}`} />
                        </div>
                      </div>
                    </div>

                    {/* Biologie */}
                    <div className={`p-3 rounded-xl ${darkMode ? "bg-gray-700/50" : "bg-gray-50"}`}>
                      <h5 className={`text-[10px] uppercase tracking-wider font-bold mb-3 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Biologie</h5>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        <label className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer text-sm ${v.groupe_sanguin_confirme ? (darkMode ? "bg-blue-900/30 text-blue-300" : "bg-blue-50 text-blue-700") : (darkMode ? "bg-gray-800 text-gray-300" : "bg-white text-gray-600 border border-gray-200")}`}>
                          <input type="checkbox" checked={v.groupe_sanguin_confirme || false} onChange={(e) => handleUpdate(v.id, { groupe_sanguin_confirme: e.target.checked })} className="accent-blue-500" />
                          Groupe sanguin confirmé
                        </label>
                        {[
                          { label: "Recherche d'anticorps", field: "anticorps", options: ["", "Faite", "Non faite", "Anormale"], tip: "Recherche d'anticorps irréguliers pouvant affecter le fœtus (incompatibilité Rhésus, etc.)." },
                          { label: "Rubéole (IgG)", field: "rubeole", options: ["", "Négative", "Positive", "Non faite"], tip: "Sérologie rubéole. Une infection pendant la grossesse peut être très grave pour le fœtus." },
                          { label: "Syphilis (VDRL)", field: "syphilis", options: ["", "Négative", "Positive", "Non faite"], tip: "Dépistage de la syphilis. Positive = infection en cours nécessitant un traitement." },
                          { label: "Hbs Ag (Hépatite B)", field: "hbs_ag", options: ["", "Négatif", "Positif", "Non fait"], tip: "Recherche du virus de l'hépatite B. Si positif, le bébé recevra un traitement à la naissance." },
                          { label: "VIH", field: "vih", options: ["", "Négatif", "Positif", "Non fait"], tip: "Dépistage du VIH. En cas de positivité, un traitement permet de réduire considérablement le risque de transmission au bébé." },
                          { label: "Toxoplasmose (IgG/IgM)", field: "toxoplasmose", options: ["", "Négative", "Positive", "Non faite"], tip: "Infection pouvant passer au fœtus. Les femmes non immunisées doivent éviter le contact avec les chats et la viande crue." },
                        ].map(({ label, field, options, tip }) => (
                          <div key={field}>
                            <label className={`text-xs mb-1 flex items-center ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                              {label} {tip && <InfoTip text={tip} />}
                            </label>
                            <select value={v[field] || ""} onChange={(e) => handleUpdate(v.id, { [field]: e.target.value })}
                              className={`w-full border rounded-lg px-3 py-2 text-sm outline-none ${darkMode ? "bg-gray-800 border-gray-600" : "bg-white border-gray-200"}`}>
                              {options.map(o => <option key={o} value={o}>{o || "Non fait"}</option>)}
                            </select>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Échographie */}
                    <div className={`p-3 rounded-xl ${darkMode ? "bg-gray-700/50" : "bg-gray-50"}`}>
                      <h5 className={`text-[10px] uppercase tracking-wider font-bold mb-3 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Échographie</h5>
                      <label className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer text-sm mb-3 ${v.echo_realisee ? (darkMode ? "bg-purple-900/30 text-purple-300" : "bg-purple-50 text-purple-700") : (darkMode ? "bg-gray-800 text-gray-300" : "bg-white text-gray-600 border border-gray-200")}`}>
                        <input type="checkbox" checked={v.echo_realisee || false} onChange={(e) => handleUpdate(v.id, { echo_realisee: e.target.checked })} className="accent-purple-500" />
                        Échographie réalisée lors de cette visite
                      </label>
                      {v.echo_realisee && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className={`text-xs mb-1 block ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Date de l'échographie</label>
                            <input type="date" value={v.echo_date || ""} onChange={(e) => handleUpdate(v.id, { echo_date: e.target.value })}
                              className={`w-full border rounded-lg px-3 py-2 text-sm outline-none ${darkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-200"}`} />
                          </div>
                          <div>
                            <label className={`text-xs mb-1 flex items-center ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                              Biométrie fœtale <InfoTip text="Poids estimé du fœtus, mesures (BIP, CF, PA). Ex: 'BIP 50mm, PA 2200g'." />
                            </label>
                            <input value={v.echo_biometrie || ""} onChange={(e) => handleUpdate(v.id, { echo_biometrie: e.target.value })} placeholder="Poids estimé, BIP, PA..."
                              className={`w-full border rounded-lg px-3 py-2 text-sm outline-none ${darkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-200"}`} />
                          </div>
                          <div>
                            <label className={`text-xs mb-1 flex items-center ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                              Présentation fœtale <InfoTip text="Position du bébé dans l'utérus. Céphalique (tête en bas) = normal pour l'accouchement." />
                            </label>
                            <select value={v.echo_presentation || ""} onChange={(e) => handleUpdate(v.id, { echo_presentation: e.target.value })}
                              className={`w-full border rounded-lg px-3 py-2 text-sm outline-none ${darkMode ? "bg-gray-800 border-gray-600" : "bg-white border-gray-200"}`}>
                              <option value="">Non précisé</option>
                              <option value="Céphalique">Céphalique</option>
                              <option value="Siège">Siège</option>
                              <option value="Transverse">Transverse</option>
                            </select>
                          </div>
                          <div>
                            <label className={`text-xs mb-1 flex items-center ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                              Liquide amniotique <InfoTip text="Quantité de liquide amniotique autour du fœtus. Oligoamnios = trop peu, Polyamnios = trop." />
                            </label>
                            <select value={v.echo_liquide || ""} onChange={(e) => handleUpdate(v.id, { echo_liquide: e.target.value })}
                              className={`w-full border rounded-lg px-3 py-2 text-sm outline-none ${darkMode ? "bg-gray-800 border-gray-600" : "bg-white border-gray-200"}`}>
                              <option value="">Non précisé</option>
                              <option value="Normal">Normal</option>
                              <option value="Oligoamnios">Oligoamnios (peu de liquide)</option>
                              <option value="Polyamnios">Polyamnios (trop de liquide)</option>
                            </select>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Prescription & Suivi */}
                    <div className={`p-3 rounded-xl ${darkMode ? "bg-gray-700/50" : "bg-gray-50"}`}>
                      <h5 className={`text-[10px] uppercase tracking-wider font-bold mb-3 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Prescription & Suivi</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className={`text-xs mb-1 block ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Traitement prescrit</label>
                          <textarea value={v.traitement || ""} onChange={(e) => handleUpdate(v.id, { traitement: e.target.value })} rows={2} placeholder="Acide folique, fer, antipaludéens..."
                            className={`w-full border rounded-lg px-3 py-2 text-sm outline-none resize-none ${darkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-200"}`} />
                        </div>
                        <div>
                          <label className={`text-xs mb-1 flex items-center ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                            Prochaine visite prévue <InfoTip text="Date de la prochaine visite prénatale recommandée par le médecin." />
                          </label>
                          <input type="date" value={v.prochaine_visite || ""} onChange={(e) => handleUpdate(v.id, { prochaine_visite: e.target.value })}
                            className={`w-full border rounded-lg px-3 py-2 text-sm outline-none ${darkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-200"}`} />
                        </div>
                        <div className="md:col-span-2">
                          <label className={`text-xs mb-1 block ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Observations</label>
                          <textarea value={v.observations || ""} onChange={(e) => handleUpdate(v.id, { observations: e.target.value })} rows={2} placeholder="Notes, remarques du médecin..."
                            className={`w-full border rounded-lg px-3 py-2 text-sm outline-none resize-none ${darkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-200"}`} />
                        </div>
                      </div>
                    </div>

                    {/* Documents joints */}
                    <div className={`p-3 rounded-xl ${darkMode ? "bg-gray-700/50" : "bg-gray-50"}`}>
                      <h5 className={`text-[10px] uppercase tracking-wider font-bold mb-3 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Documents joints</h5>
                      <div className="space-y-2">
                        {(v.documents || []).map((doc) => (
                          <div key={doc.id} className={`flex items-center gap-2 p-2 rounded-lg ${darkMode ? "bg-gray-800" : "bg-white border border-gray-200"}`}>
                            <FileText size={14} className="text-blue-500 flex-shrink-0" />
                            <span className={`text-sm flex-1 truncate ${darkMode ? "text-gray-300" : "text-gray-700"}`}>{doc.nom}</span>
                            <select value={doc.type || ""} onChange={(e) => handleDocType(v.id, doc.id, e.target.value)}
                              className={`text-[10px] border rounded px-1.5 py-1 outline-none max-w-[120px] ${darkMode ? "bg-gray-700 border-gray-600 text-gray-300" : "bg-gray-50 border-gray-200 text-gray-600"}`}>
                              <option value="">Type...</option>
                              {DOC_TYPES.map(dt => <option key={dt.value} value={dt.value}>{dt.label}</option>)}
                            </select>
                            {doc.url && (
                              <button onClick={() => { const w = window.open('', '_blank'); w.document.write(`<html><head><title>${doc.nom}</title><style>body{margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#f5f5f5;}img{max-width:100%;max-height:100vh;}embed{width:100%;height:100vh;}</style></head><body>${doc.mime?.includes('image') ? `<img src="${doc.url}" alt="${doc.nom}"/>` : `<embed src="${doc.url}" type="${doc.mime || 'application/pdf'}"/>`}</body></html>`); w.document.title = doc.nom; }}
                                className={`p-1 rounded transition ${darkMode ? "text-gray-400 hover:text-blue-400 hover:bg-gray-700" : "text-gray-400 hover:text-blue-600 hover:bg-gray-100"}`}>
                                <Eye size={14} />
                              </button>
                            )}
                            <button onClick={() => handleRemoveDoc(v.id, doc.id)} className="text-gray-400 hover:text-red-500 flex-shrink-0"><X size={14} /></button>
                          </div>
                        ))}
                      </div>
                      <label className={`mt-2 flex items-center gap-2 p-2 rounded-lg cursor-pointer text-sm transition ${darkMode ? "bg-gray-800 text-gray-400 hover:bg-gray-750" : "bg-white border border-dashed border-gray-300 text-gray-500 hover:border-blue-400"}`}>
                        <Upload size={14} />
                        <span>Ajouter un document (écho, résultats, ordonnance...)</span>
                        <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => { handleFileUpload(v.id, e.target.files?.[0]); e.target.value = ''; }} />
                      </label>
                    </div>

                  </div>
                )}
              </div>
            </div>
          );
        })}

        <button onClick={() => addVisit(`VP${visites.length + 1}`)}
          className={`ml-16 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${darkMode ? "bg-gray-700 hover:bg-gray-600 text-white" : "bg-gray-100 hover:bg-gray-200 text-gray-700"}`}>
          <Plus size={16} /> Ajouter une visite prénatale
        </button>
      </div>
    </div>
  );
}

function SuiviGyneco({ dossier, patientId, onDossierUpdate, darkMode }) {
  const [data, setData] = useState({ 
    date_derniere_consultation: "", 
    nom_gynecologue: "",
    dernier_frottis_date: "",
    dernier_frottis_resultat: "",
    derniere_mammographie_date: "",
    derniere_mammographie_resultat: "",
    contraception: "", 
    cycles_reguliers: "", 
    observations: "",
    grossesses: [],
    visites_prenatales: [],
    cycles_regulite: "",
    cycles_duree_cycle: "",
    cycles_duree_regles: "",
    cycles_flux: "",
    cycles_douleurs: "",
    cycles_date_dernieres_regles: "",
    menopause_statut: "",
    menopause_age: "",
    menopause_annee: "",
    menopause_thm: "",
    menopause_thm_nom: "",
    menopause_thm_commentaires: "",
    menopause_peri_symptomes: [],
    menopause_peri_autre: ""
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const dossierRef = useRef(dossier);

  useEffect(() => {
    dossierRef.current = dossier;
    if (dossier?.antecedents_gyneco) {
      try { 
        const x = JSON.parse(dossier.antecedents_gyneco); 
        if (typeof x === 'object' && x !== null) { 
          setData(prev => ({ ...prev, ...x })); 
          return; 
        } 
      } catch (e) {}
    }
  }, [dossier]);

  const handleChange = (field, value) => {
    const newData = { ...data, [field]: value };
    setData(newData);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setSaving(true); setSaveError(null);
      try {
        const d = dossierRef.current;
        if (d?.id) {
          const updated = await put(`/api/dossiers_medicaux/${d.id}`, { antecedents_gyneco: JSON.stringify(newData) });
          dossierRef.current = updated; onDossierUpdate(updated);
        }
      } catch (err) { console.error(err); setSaveError("Erreur de sauvegarde."); } finally { setSaving(false); }
    }, 1000);
  };

  const handleGrossessesChange = (newGrossesses) => {
    const newData = { ...data, grossesses: newGrossesses };
    setData(newData);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setSaving(true); setSaveError(null);
      try {
        const d = dossierRef.current;
        if (d?.id) {
          const updated = await put(`/api/dossiers_medicaux/${d.id}`, { antecedents_gyneco: JSON.stringify(newData) });
          dossierRef.current = updated; onDossierUpdate(updated);
        }
      } catch (err) { console.error(err); setSaveError("Erreur de sauvegarde."); } finally { setSaving(false); }
    }, 1000);
  };

  const handleVisitesChange = (newVisites) => {
    const newData = { ...data, visites_prenatales: newVisites };
    setData(newData);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setSaving(true); setSaveError(null);
      try {
        const d = dossierRef.current;
        if (d?.id) {
          const updated = await put(`/api/dossiers_medicaux/${d.id}`, { antecedents_gyneco: JSON.stringify(newData) });
          dossierRef.current = updated; onDossierUpdate(updated);
        }
      } catch (err) { console.error(err); setSaveError("Erreur de sauvegarde."); } finally { setSaving(false); }
    }, 1000);
  };

  const saveTimer = useRef(null);
  useEffect(() => () => { if (saveTimer.current) clearTimeout(saveTimer.current); }, []);

  const Field = ({ label, field, type = "text", placeholder = "", options = null }) => (
    <div className="mb-4">
      <label className={`text-xs font-medium mb-1.5 block ${darkMode ? "text-gray-300" : "text-gray-600"}`}>{label}</label>
      {options ? (
        <select value={data[field] || ""} onChange={(e) => handleChange(field, e.target.value)} className={`w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400 ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "border-gray-200 text-gray-800"}`}>
          <option value="">Sélectionner...</option>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : type === "date" ? (
        <div className="relative">
          <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="date" value={data[field] || ""} onChange={(e) => handleChange(field, e.target.value)} className={`w-full border rounded-xl pl-10 pr-3 py-2.5 text-sm outline-none focus:border-blue-400 ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "border-gray-200 text-gray-800"}`} />
        </div>
      ) : type === "number" ? (
        <input type="number" min="0" value={data[field] || ""} onChange={(e) => handleChange(field, e.target.value)} placeholder={placeholder}
          className={`w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400 ${darkMode ? "bg-gray-700 border-gray-600 text-white placeholder:text-gray-500" : "border-gray-200 text-gray-800 placeholder:text-gray-400"}`} />
      ) : (
        <input type="text" value={data[field] || ""} onChange={(e) => handleChange(field, e.target.value)} placeholder={placeholder}
          className={`w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400 ${darkMode ? "bg-gray-700 border-gray-600 text-white placeholder:text-gray-500" : "border-gray-200 text-gray-800 placeholder:text-gray-400"}`} />
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {saveError && (
        <div className={`rounded-xl px-4 py-3 text-sm font-medium flex items-center gap-2 ${darkMode ? "bg-red-900/30 text-red-300 border border-red-700/50" : "bg-red-50 text-red-700 border border-red-200"}`}>
          <AlertCircle size={14} /> {saveError}
          <button onClick={() => setSaveError(null)} className="ml-auto"><X size={14} /></button>
        </div>
      )}

      {/* 1. Carte Consultation */}
      <div className={`rounded-2xl p-6 ${darkMode ? "bg-gray-800" : "bg-white shadow"}`}>
        <h3 className={`font-semibold mb-4 flex items-center gap-2 ${darkMode ? "text-white" : "text-gray-800"}`}>
          <Stethoscope size={20} className="text-blue-500" />
          Consultation
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Date de la dernière consultation" field="date_derniere_consultation" type="date" />
          <Field label="Nom du gynécologue" field="nom_gynecologue" placeholder="Dr. Dupont..." />
        </div>
        
        <div className={`mt-6 pt-4 border-t ${darkMode ? "border-gray-700" : "border-gray-100"}`}>
          <h4 className={`text-sm font-medium mb-3 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Dernier Frottis</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Date du dernier frottis" field="dernier_frottis_date" type="date" />
            <Field label="Résultat (optionnel)" field="dernier_frottis_resultat" placeholder="Normal, Anormal..." />
          </div>
        </div>

        <div className={`mt-4 pt-4 border-t ${darkMode ? "border-gray-700" : "border-gray-100"}`}>
          <h4 className={`text-sm font-medium mb-3 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Dernière Mammographie</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Date de la mammographie" field="derniere_mammographie_date" type="date" />
            <Field label="Résultat (optionnel)" field="derniere_mammographie_resultat" placeholder="BI-RADS 1, Normal..." />
          </div>
        </div>
      </div>

      {/* 2. Carte Contraception */}
      <div className={`rounded-2xl p-6 ${darkMode ? "bg-gray-800" : "bg-white shadow"}`}>
        <h3 className={`font-semibold mb-4 flex items-center gap-2 ${darkMode ? "text-white" : "text-gray-800"}`}>
          <Shield size={20} className="text-purple-500" />
          Contraception
        </h3>
        <Field label="Méthode contraceptive utilisée" field="contraception" options={CONTRACEPTION_OPTIONS} />
      </div>

      {/* 3. Historique obstétrical */}
      <div className={`rounded-2xl p-6 ${darkMode ? "bg-gray-800" : "bg-white shadow"}`}>
        <div className="flex items-center justify-between mb-6">
          <h3 className={`font-semibold flex items-center gap-2 ${darkMode ? "text-white" : "text-gray-800"}`}>
            <Baby size={20} className="text-pink-500" />
            Historique obstétrical
          </h3>
          <button 
            onClick={() => {
              const newGrossesse = {
                id: Date.now(),
                date_debut: "",
                type_debut: "DDR", // DDR ou conception
                date_conception: "",
                dpa: "",
                nb_enfants: 1,
                issue: "",
                type_accouchement: "",
                date_accouchement: "",
                date_perte: "",
                commentaires: ""
              };
              handleGrossessesChange([newGrossesse, ...data.grossesses]);
            }}
            className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-all ${darkMode ? "bg-gray-700 hover:bg-gray-600 text-white" : "bg-gray-100 hover:bg-gray-200 text-gray-700"}`}
          >
            <Plus size={16} /> Ajouter une grossesse
          </button>
        </div>
        
        <ObstetricTimeline 
          grossesses={data.grossesses || []} 
          onUpdate={handleGrossessesChange} 
          darkMode={darkMode} 
        />
      </div>

      {/* 4. Visites prénatales (uniquement si grossesse en cours) */}
      {(data.grossesses || []).some(g => g.issue === "Grossesse en cours") && (
        <div className={`rounded-2xl p-6 ${darkMode ? "bg-gray-800" : "bg-white shadow"}`}>
          <div className="flex items-center justify-between mb-6">
            <h3 className={`font-semibold flex items-center gap-2 ${darkMode ? "text-white" : "text-gray-800"}`}>
              <Stethoscope size={20} className="text-teal-500" />
              Visites prénatales
            </h3>
          </div>
          <PrenatalVisitsSection 
            visites={data.visites_prenatales || []} 
            onUpdate={handleVisitesChange}
            grossesses={data.grossesses || []}
            darkMode={darkMode}
            patientId={patientId} 
          />
        </div>
      )}

      {/* 5. Cycles menstruels */}
      <div className={`rounded-2xl p-6 ${darkMode ? "bg-gray-800" : "bg-white shadow"}`}>
        <h3 className={`font-semibold mb-4 flex items-center gap-2 ${darkMode ? "text-white" : "text-gray-800"}`}>
          <CalendarDays size={20} className="text-rose-500" />
          Cycles menstruels
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Régularité des cycles" field="cycles_regulite" options={["Réguliers", "Irréguliers", "Absents", "Sous contraception", "Je ne sais pas"]} />
          <div className="mb-4">
            <label className={`text-xs font-medium mb-1.5 block ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Durée moyenne du cycle</label>
            <div className="relative">
              <input type="number" min="0" value={data.cycles_duree_cycle || ""} onChange={(e) => handleChange("cycles_duree_cycle", e.target.value)} placeholder="28"
                className={`w-full border rounded-xl px-3 py-2.5 pr-14 text-sm outline-none focus:border-blue-400 ${darkMode ? "bg-gray-700 border-gray-600 text-white placeholder:text-gray-500" : "border-gray-200 text-gray-800 placeholder:text-gray-400"}`} />
              <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs ${darkMode ? "text-gray-500" : "text-gray-400"}`}>jours</span>
            </div>
          </div>
          <div className="mb-4">
            <label className={`text-xs font-medium mb-1.5 block ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Durée moyenne des règles</label>
            <div className="relative">
              <input type="number" min="0" value={data.cycles_duree_regles || ""} onChange={(e) => handleChange("cycles_duree_regles", e.target.value)} placeholder="5"
                className={`w-full border rounded-xl px-3 py-2.5 pr-14 text-sm outline-none focus:border-blue-400 ${darkMode ? "bg-gray-700 border-gray-600 text-white placeholder:text-gray-500" : "border-gray-200 text-gray-800 placeholder:text-gray-400"}`} />
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
          <Heart size={20} className="text-amber-500" />
          Ménopause
        </h3>

        <Field label="Avez-vous atteint la ménopause ?" field="menopause_statut" options={["Non", "Périménopause", "Oui"]} />

        <p className={`text-[11px] mt-1 mb-4 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
          Sélectionnez "Oui" uniquement si la ménopause a été confirmée par un médecin ou un autre professionnel de santé.
        </p>

        {/* Si "Oui" */}
        {data.menopause_statut === "Oui" && (
          <div className={`p-4 rounded-xl border mt-2 ${darkMode ? "bg-gray-700/40 border-gray-600" : "bg-gray-50 border-gray-200"}`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="mb-4 md:mb-0">
                <label className={`text-xs font-medium mb-1.5 block ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Âge au moment de la ménopause (optionnel)</label>
                <input type="number" min="0" value={data.menopause_age || ""} onChange={(e) => handleChange("menopause_age", e.target.value)} placeholder="51"
                  className={`w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400 ${darkMode ? "bg-gray-700 border-gray-600 text-white placeholder:text-gray-500" : "border-gray-200 text-gray-800 placeholder:text-gray-400"}`} />
              </div>
              <div className="mb-4 md:mb-0">
                <label className={`text-xs font-medium mb-1.5 block ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Année de la ménopause (optionnel)</label>
                <input type="number" min="1900" max="2099" value={data.menopause_annee || ""} onChange={(e) => handleChange("menopause_annee", e.target.value)} placeholder="2025"
                  className={`w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400 ${darkMode ? "bg-gray-700 border-gray-600 text-white placeholder:text-gray-500" : "border-gray-200 text-gray-800 placeholder:text-gray-400"}`} />
              </div>
            </div>

            <Field label="Suivez-vous un traitement hormonal de la ménopause (THM) ?" field="menopause_thm" options={["Oui", "Non"]} />

            {data.menopause_thm === "Oui" && (
              <div className="mt-2 space-y-4">
                <Field label="Nom du traitement (optionnel)" field="menopause_thm_nom" placeholder="Thérapie combinée..." />
                <div className="mb-4">
                  <label className={`text-xs font-medium mb-1.5 block ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Commentaires (optionnel)</label>
                  <textarea value={data.menopause_thm_commentaires || ""} onChange={(e) => handleChange("menopause_thm_commentaires", e.target.value)} placeholder="Précisions sur le traitement..."
                    rows={2}
                    className={`w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400 resize-none ${darkMode ? "bg-gray-700 border-gray-600 text-white placeholder:text-gray-500" : "border-gray-200 text-gray-800 placeholder:text-gray-400"}`} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Si "Périménopause" */}
        {data.menopause_statut === "Périménopause" && (
          <div className={`p-4 rounded-xl border mt-2 ${darkMode ? "bg-amber-900/10 border-amber-800/30" : "bg-amber-50 border-amber-200"}`}>
            <p className={`text-xs mb-4 ${darkMode ? "text-amber-300" : "text-amber-700"}`}>
              La périménopause correspond à la période de transition précédant la ménopause, durant laquelle les cycles menstruels peuvent devenir irréguliers et certains symptômes peuvent apparaître.
            </p>
            <label className={`text-xs font-medium mb-2 block ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Symptômes présents</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {["Bouffées de chaleur", "Sueurs nocturnes", "Troubles du sommeil", "Sécheresse vaginale", "Sautes d'humeur", "Cycles irréguliers"].map((sym) => {
                const checked = (data.menopause_peri_symptomes || []).includes(sym);
                return (
                  <label key={sym} className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer text-sm transition ${checked ? (darkMode ? "bg-amber-900/30 text-amber-200" : "bg-amber-100 text-amber-800") : (darkMode ? "bg-gray-700/50 text-gray-300 hover:bg-gray-700" : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200")}`}>
                    <input type="checkbox" checked={checked} onChange={() => {
                      const current = data.menopause_peri_symptomes || [];
                      const updated = checked ? current.filter(s => s !== sym) : [...current, sym];
                      handleChange("menopause_peri_symptomes", updated);
                    }} className="accent-amber-500" />
                    {sym}
                  </label>
                );
              })}
            </div>
            <div className="mt-3">
              <label className={`text-xs font-medium mb-1.5 block ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Autre symptôme (optionnel)</label>
              <input type="text" value={data.menopause_peri_autre || ""} onChange={(e) => handleChange("menopause_peri_autre", e.target.value)} placeholder="Décrivez..."
                className={`w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400 ${darkMode ? "bg-gray-700 border-gray-600 text-white placeholder:text-gray-500" : "border-gray-200 text-gray-800 placeholder:text-gray-400"}`} />
            </div>
          </div>
        )}
      </div>

      {saving && (
        <div className={`fixed bottom-6 right-6 rounded-xl px-4 py-2 text-xs flex items-center gap-2 shadow-lg z-50 ${darkMode ? "bg-blue-900/90 text-blue-200 backdrop-blur" : "bg-blue-50 text-blue-600"}`}>
          <Loader size={12} className="animate-spin" /> Sauvegarde en cours...
        </div>
      )}
    </div>
  );
}

function Habitudes({ dossier, patientId, onDossierUpdate, darkMode }) {
  const habitudes = dossier?.habitudes_vie || {};
  const [items, setItems] = useState(() => {
    if (Object.keys(habitudes).length > 0) return Object.entries(habitudes);
    return HABITUDES_PREDEFINIES.map(h => [h.key, ""]);
  });
  const [newKey, setNewKey] = useState('');
  const [saving, setSaving] = useState(false);
  const dossierRef = useRef(dossier);
  const saveTimer = useRef(null);

  useEffect(() => {
    dossierRef.current = dossier;
    const h = dossier?.habitudes_vie || {};
    if (Object.keys(h).length > 0) {
      setItems(Object.entries(h));
    } else {
      setItems(HABITUDES_PREDEFINIES.map(hab => [hab.key, h[hab.key] || ""]));
    }
  }, [dossier]);

  useEffect(() => () => { if (saveTimer.current) clearTimeout(saveTimer.current); }, []);

  const saveHabitudes = async (newItems) => {
    setSaving(true);
    try {
      const d = dossierRef.current;
      if (d?.id) {
        const obj = Object.fromEntries(newItems.filter(([k]) => k.trim()));
        const updated = await put(`/api/dossiers_medicaux/${d.id}`, { habitudes_vie: obj });
        dossierRef.current = updated;
        onDossierUpdate(updated);
      }
    } catch (err) {
      console.error('Save habitudes error:', err);
    } finally {
      setSaving(false);
    }
  };

  const debouncedSave = (newItems) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveHabitudes(newItems), 1000);
  };

  const updateItem = (i, newVal) => {
    const newItems = [...items];
    newItems[i] = [items[i][0], newVal];
    setItems(newItems);
    debouncedSave(newItems);
  };

  const addItem = () => {
    if (newKey.trim()) {
      const newItems = [...items, [newKey.trim(), '']];
      setItems(newItems);
      setNewKey('');
      saveHabitudes(newItems);
    }
  };

  const removeItem = (i) => {
    const newItems = items.filter((_, idx) => idx !== i);
    setItems(newItems);
    saveHabitudes(newItems);
  };

  const getOptions = (key) => {
    const def = HABITUDES_PREDEFINIES.find(h => h.key === key);
    return def?.options || null;
  };

  const getLabel = (key) => {
    const def = HABITUDES_PREDEFINIES.find(h => h.key === key);
    return def?.label || key.replace(/_/g, ' ');
  };

  return (
    <div className={`rounded-2xl p-6 ${darkMode ? "bg-gray-800" : "bg-white shadow"}`}>
      <h3 className={`font-semibold mb-2 ${darkMode ? "text-white" : "text-gray-800"}`}>Habitudes de vie</h3>
      <p className={`text-xs mb-5 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
        Renseignez vos habitudes pour un meilleur suivi médical.
      </p>
      <div className="space-y-3 mb-5">
        {items.map(([key, val], i) => {
          const options = getOptions(key);
          return (
            <div key={`${key}-${i}`} className={`rounded-xl p-3 ${darkMode ? "bg-gray-700/50" : "bg-gray-50"}`}>
              <div className="flex items-center justify-between gap-2">
                <p className={`text-sm font-medium ${darkMode ? "text-gray-200" : "text-gray-700"}`}>{getLabel(key)}</p>
                <button onClick={() => removeItem(i)}
                  className="text-gray-400 hover:text-red-500 flex-shrink-0"><X size={14} /></button>
              </div>
              {options ? (
                <select
                  value={val}
                  onChange={(e) => updateItem(i, e.target.value)}
                  className={`w-full mt-2 border rounded-lg px-2 py-2 text-sm outline-none focus:border-blue-400 ${darkMode ? "bg-gray-600 border-gray-500 text-white" : "border-gray-200 text-gray-800"}`}>
                  <option value="">Sélectionner...</option>
                  {options.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : (
                <input value={val} onChange={(e) => updateItem(i, e.target.value)} placeholder="Votre réponse..."
                  className={`w-full mt-2 border rounded-lg px-2 py-2 text-sm outline-none focus:border-blue-400 ${darkMode ? "bg-gray-600 border-gray-500 text-white placeholder:text-gray-500" : "border-gray-200 text-gray-800 placeholder:text-gray-400"}`} />
              )}
            </div>
          );
        })}
      </div>
      <div className="flex gap-2">
        <input value={newKey} onChange={(e) => setNewKey(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') addItem(); }} placeholder="Ajouter une habitude personnalisée..."
          className={`flex-1 border rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400 ${darkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : "border-gray-200 text-gray-800"}`} />
        <button onClick={addItem}
          className="bg-blue-500 text-white px-3 py-2 rounded-xl hover:bg-blue-600"><Plus size={18} /></button>
      </div>
    </div>
  );
}
