import { useState, useEffect, useCallback } from 'react';
import {
  Phone, Mail, MapPin, Droplet, Weight, Ruler,
  Plus, Search, Download, Eye, Upload, X, Save,
  AlertCircle, CheckCircle, Edit3
} from 'lucide-react';
import {
  fetchPatientProfil,
  fetchDocumentsMedicaux,
  updatePatientProfil,
  updateDossierPatient,
  uploaderDocument,
} from '../../services/patientService';

const ONGLETS = [
  "Informations personnelles",
  "Documents Médicaux",
  "Antécédents",
  "Habitudes de vie",
  "Vaccins",
];

const TYPES_DOCUMENTS = [
  { value: "resultat_labo",             label: "Résultat de labo" },
  { value: "imagerie_radio",            label: "Radiographie" },
  { value: "imagerie_echographie",      label: "Échographie" },
  { value: "imagerie_scanner",          label: "Scanner" },
  { value: "imagerie_irm",              label: "IRM" },
  { value: "compte_rendu_consultation", label: "Compte-rendu" },
  { value: "ordonnance_scannee",        label: "Ordonnance scannée" },
  { value: "certificat_medical",        label: "Certificat médical" },
  { value: "carnet_vaccination",        label: "Carnet de vaccination" },
];

function Toast({ message, type = "error", onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className={`fixed top-4 right-4 z-[200] px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 text-sm text-white
      ${type === "success" ? "bg-green-500" : "bg-red-500"}`}>
      {type === "success" ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
      {message}
    </div>
  );
}

function Modal({ darkMode, titre, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto
        ${darkMode ? "bg-gray-800" : "bg-white"}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-lg font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>{titre}</h3>
          <button onClick={onClose}><X size={20} className="text-gray-400" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function BoutonActions({ darkMode, onAnnuler, onSauver, labelSauver = "Sauvegarder", saving = false }) {
  return (
    <div className="flex gap-3 mt-6">
      <button onClick={onAnnuler}
        className={`flex-1 py-2 rounded-lg border ${darkMode ? "border-gray-600 text-gray-300" : "border-gray-300 text-gray-700"}`}>
        Annuler
      </button>
      <button onClick={onSauver} disabled={saving}
        className="flex-1 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 flex items-center justify-center gap-2">
        {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
        <Save size={16} /> {saving ? "Sauvegarde..." : labelSauver}
      </button>
    </div>
  );
}

// ── INFORMATIONS PERSONNELLES ─────────────────────────────────────────────
function InformationsPersonnelles({ darkMode, profil, onRefresh, onToast }) {
  const [showModal, setShowModal] = useState(false);
  const [editField, setEditField] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({});

  const openEdit = (field, currentValues = {}) => {
    setEditField(field);
    setFormData(currentValues);
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await updatePatientProfil(formData);
      onToast("Informations mises à jour avec succès", "success");
      setShowModal(false);
      onRefresh();
    } catch (err) {
      onToast(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const initiales = `${profil.prenom?.[0] || ''}${profil.nom?.[0] || ''}`.toUpperCase();

  const inputClass = `w-full px-3 py-2 rounded-lg border text-sm outline-none
    ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"}`;

  const renderModalContent = () => {
    switch (editField) {
      case "coordonnees":
        return (
          <>
            <div className="space-y-3">
              <div>
                <label className={`text-xs font-medium mb-1 block ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Téléphone</label>
                <input className={inputClass} value={formData.telephone || ""} onChange={(e) => setFormData({ ...formData, telephone: e.target.value })} placeholder="+237 6XX XXX XXX" />
              </div>
              <div>
                <label className={`text-xs font-medium mb-1 block ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Ville</label>
                <input className={inputClass} value={formData.ville || ""} onChange={(e) => setFormData({ ...formData, ville: e.target.value })} placeholder="Ex: Douala" />
              </div>
            </div>
            <BoutonActions darkMode={darkMode} onAnnuler={() => setShowModal(false)} onSauver={handleSave} saving={saving} />
          </>
        );
      case "medical":
        return (
          <>
            <div className="space-y-3">
              <div>
                <label className={`text-xs font-medium mb-1 block ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Groupe sanguin</label>
                <select className={inputClass} value={formData.groupe_sanguin || ""} onChange={(e) => setFormData({ ...formData, groupe_sanguin: e.target.value })}>
                  <option value="">Non renseigné</option>
                  {["A+","A-","B+","B-","AB+","AB-","O+","O-"].map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className={`text-xs font-medium mb-1 block ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Poids (kg)</label>
                <input type="number" className={inputClass} value={formData.poids_kg || ""} onChange={(e) => setFormData({ ...formData, poids_kg: parseFloat(e.target.value) || null })} placeholder="Ex: 65" />
              </div>
              <div>
                <label className={`text-xs font-medium mb-1 block ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Taille (cm)</label>
                <input type="number" className={inputClass} value={formData.taille_cm || ""} onChange={(e) => setFormData({ ...formData, taille_cm: parseFloat(e.target.value) || null })} placeholder="Ex: 170" />
              </div>
              <div>
                <label className={`text-xs font-medium mb-1 block ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Sexe</label>
                <select className={inputClass} value={formData.sexe || ""} onChange={(e) => setFormData({ ...formData, sexe: e.target.value })}>
                  <option value="">Non renseigné</option>
                  <option value="M">Masculin</option>
                  <option value="F">Féminin</option>
                </select>
              </div>
              <div>
                <label className={`text-xs font-medium mb-1 block ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Date de naissance</label>
                <input type="date" className={inputClass} value={formData.date_naissance || ""} onChange={(e) => setFormData({ ...formData, date_naissance: e.target.value })} />
              </div>
            </div>
            <BoutonActions darkMode={darkMode} onAnnuler={() => setShowModal(false)} onSauver={handleSave} saving={saving} />
          </>
        );
      case "urgence":
        return (
          <>
            <div className="space-y-3">
              <div>
                <label className={`text-xs font-medium mb-1 block ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Nom du contact</label>
                <input className={inputClass} value={formData.contact_urgence_nom || ""} onChange={(e) => setFormData({ ...formData, contact_urgence_nom: e.target.value })} placeholder="Ex: Jean Dupont" />
              </div>
              <div>
                <label className={`text-xs font-medium mb-1 block ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Téléphone</label>
                <input className={inputClass} value={formData.contact_urgence_tel || ""} onChange={(e) => setFormData({ ...formData, contact_urgence_tel: e.target.value })} placeholder="+237 6XX XXX XXX" />
              </div>
              <div>
                <label className={`text-xs font-medium mb-1 block ${darkMode ? "text-gray-300" : "text-gray-600"}`}>Lien (Père, Mère, Époux...)</label>
                <input className={inputClass} value={formData.contact_urgence_lien || ""} onChange={(e) => setFormData({ ...formData, contact_urgence_lien: e.target.value })} placeholder="Ex: Mère" />
              </div>
            </div>
            <BoutonActions darkMode={darkMode} onAnnuler={() => setShowModal(false)} onSauver={handleSave} saving={saving} />
          </>
        );
      case "allergie":
        return (
          <>
            <input
              className={inputClass}
              placeholder="Ex: Pénicilline, Arachides..."
              value={formData.nouvelleAllergie || ""}
              onChange={(e) => setFormData({ ...formData, nouvelleAllergie: e.target.value })}
            />
            <BoutonActions darkMode={darkMode} onAnnuler={() => setShowModal(false)} onSauver={async () => {
              if (!formData.nouvelleAllergie?.trim()) return;
              const allergies = [...(profil.allergies || []), formData.nouvelleAllergie.trim()];
              try {
                setSaving(true);
                await updatePatientProfil({ allergies });
                onToast("Allergie ajoutée", "success");
                setShowModal(false);
                onRefresh();
              } catch (err) { onToast(err.message, "error"); }
              finally { setSaving(false); }
            }} saving={saving} />
          </>
        );
      default: return null;
    }
  };

  return (
    <>
      <div className="flex flex-col gap-6">

        {/* Carte identité */}
        <div className={`rounded-2xl shadow p-6 flex items-center gap-6 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
          <div className={`w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold text-blue-500
            ${darkMode ? "bg-gray-600" : "bg-blue-100"}`}>{initiales}</div>
          <div>
            <h2 className={`text-xl font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>{profil.prenom} {profil.nom}</h2>
            <p className="text-sm text-gray-400">Patient • {profil.numero_patient}</p>
            <span className="mt-2 inline-block bg-green-100 text-green-600 text-xs px-3 py-1 rounded-full font-semibold">Actif</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Coordonnées */}
          <div className={`rounded-2xl shadow p-5 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className={`text-sm font-bold ${darkMode ? "text-gray-200" : "text-gray-700"}`}>Coordonnées</h3>
              <button onClick={() => openEdit("coordonnees", { telephone: profil.telephone, ville: profil.ville })}
                className="text-xs text-blue-500 hover:underline flex items-center gap-1">
                <Edit3 size={12} /> Modifier
              </button>
            </div>
            {[
              { icon: Phone,  label: "Téléphone", value: profil.telephone || "Non renseigné" },
              { icon: Mail,   label: "Email",     value: profil.email || "Non renseigné" },
              { icon: MapPin, label: "Ville",     value: profil.ville || "Non renseigné" },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-3 mb-3">
                <div className={`p-2 rounded-lg ${darkMode ? "bg-gray-700" : "bg-blue-50"}`}>
                  <Icon size={16} className="text-blue-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">{label}</p>
                  <p className={`text-sm font-semibold ${darkMode ? "text-gray-200" : "text-gray-700"}`}>{value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Informations médicales */}
          <div className={`rounded-2xl shadow p-5 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className={`text-sm font-bold ${darkMode ? "text-gray-200" : "text-gray-700"}`}>Informations médicales</h3>
              <button onClick={() => openEdit("medical", {
                groupe_sanguin: profil.groupe_sanguin,
                poids_kg: profil.poids_kg,
                taille_cm: profil.taille_cm,
                sexe: profil.sexe,
                date_naissance: profil.date_naissance,
              })} className="text-xs text-blue-500 hover:underline flex items-center gap-1">
                <Edit3 size={12} /> Modifier
              </button>
            </div>
            {[
              { icon: Droplet, label: "Groupe sanguin", value: profil.groupe_sanguin || "Non renseigné" },
              { icon: Weight,  label: "Poids",          value: profil.poids_kg ? `${profil.poids_kg} kg` : "Non renseigné" },
              { icon: Ruler,   label: "Taille",         value: profil.taille_cm ? `${profil.taille_cm} cm` : "Non renseigné" },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-3 mb-3">
                <div className={`p-2 rounded-lg ${darkMode ? "bg-gray-700" : "bg-red-50"}`}>
                  <Icon size={16} className="text-red-500" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">{label}</p>
                  <p className={`text-sm font-semibold ${darkMode ? "text-gray-200" : "text-gray-700"}`}>{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Infos personnelles */}
        <div className={`rounded-2xl shadow p-5 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
          <h3 className={`text-sm font-bold border-b pb-2 mb-4 ${darkMode ? "text-gray-200 border-gray-700" : "text-gray-700"}`}>
            Informations personnelles
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { label: "Date de naissance", value: profil.date_naissance ? new Date(profil.date_naissance).toLocaleDateString('fr-FR') : "Non renseigné" },
              { label: "Age",               value: profil.age ? `${profil.age} ans` : "Non renseigné" },
              { label: "Sexe",              value: profil.sexe === "M" ? "Masculin" : profil.sexe === "F" ? "Féminin" : "Non renseigné" },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-xs text-gray-400">{label}</p>
                <p className={`text-sm font-semibold ${darkMode ? "text-gray-200" : "text-gray-700"}`}>{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Contact urgence */}
        <div className={`rounded-2xl shadow p-5 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className={`text-sm font-bold ${darkMode ? "text-gray-200" : "text-gray-700"}`}>Contact d'urgence</h3>
            <button onClick={() => openEdit("urgence", {
              contact_urgence_nom: profil.contact_urgence_nom,
              contact_urgence_tel: profil.contact_urgence_tel,
              contact_urgence_lien: profil.contact_urgence_lien,
            })} className="text-xs text-blue-500 hover:underline flex items-center gap-1">
              <Edit3 size={12} /> Modifier
            </button>
          </div>
          {profil.contact_urgence_nom ? (
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-gray-400">Nom</p>
                <p className={`font-semibold ${darkMode ? "text-gray-200" : "text-gray-700"}`}>{profil.contact_urgence_nom}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Téléphone</p>
                <p className={`font-semibold ${darkMode ? "text-gray-200" : "text-gray-700"}`}>{profil.contact_urgence_tel || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Lien</p>
                <p className={`font-semibold ${darkMode ? "text-gray-200" : "text-gray-700"}`}>{profil.contact_urgence_lien || "N/A"}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400">Aucun contact d'urgence renseigné</p>
          )}
        </div>

        {/* Allergies */}
        <div className={`rounded-2xl shadow p-5 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className={`text-sm font-bold ${darkMode ? "text-gray-200" : "text-gray-700"}`}>Allergies</h3>
            <button onClick={() => openEdit("allergie", {})} className="text-xs text-blue-500 hover:underline flex items-center gap-1">
              <Plus size={12} /> Ajouter
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {profil.allergies?.length > 0 ? (
              profil.allergies.map((a, i) => (
                <div key={i} className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-600 text-xs rounded-full font-medium">
                  {a}
                  <button onClick={async () => {
                    const nouvelles = profil.allergies.filter((_, idx) => idx !== i);
                    try {
                      await updatePatientProfil({ allergies: nouvelles });
                      onToast("Allergie supprimée", "success");
                      onRefresh();
                    } catch (err) { onToast(err.message, "error"); }
                  }}>
                    <X size={10} className="ml-1 hover:text-red-800" />
                  </button>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-400">Aucune allergie renseignée</p>
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <Modal darkMode={darkMode} titre={
          editField === "coordonnees" ? "Modifier les coordonnées" :
          editField === "medical" ? "Informations médicales" :
          editField === "urgence" ? "Contact d'urgence" :
          "Ajouter une allergie"
        } onClose={() => setShowModal(false)}>
          {renderModalContent()}
        </Modal>
      )}
    </>
  );
}

// ── DOCUMENTS MÉDICAUX ────────────────────────────────────────────────────
function DocumentsMedicaux({ darkMode, documents, onRefresh, onToast }) {
  const [recherche, setRecherche] = useState('');
  const [typeSelectionne, setTypeSelectionne] = useState("resultat_labo");
  const [uploading, setUploading] = useState(false);

  const formatTaille = (octets) => {
    if (!octets) return "N/A";
    if (octets < 1024) return `${octets} B`;
    if (octets < 1024 * 1024) return `${(octets / 1024).toFixed(1)} KB`;
    return `${(octets / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleUpload = async (e) => {
    const fichier = e.target.files?.[0];
    if (!fichier) return;

    const typesAcceptes = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];
    if (!typesAcceptes.includes(fichier.type)) {
      onToast("Seuls les fichiers PDF, JPG et PNG sont acceptés.", "error");
      return;
    }
    if (fichier.size > 10 * 1024 * 1024) {
      onToast("Le fichier ne doit pas dépasser 10 MB.", "error");
      return;
    }

    try {
      setUploading(true);
      await uploaderDocument(fichier, typeSelectionne);
      onToast("Document ajouté avec succès", "success");
      onRefresh();
    } catch (err) {
      onToast(err.message, "error");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const docsFiltres = documents.filter(d =>
    d.nom_fichier_original?.toLowerCase().includes(recherche.toLowerCase()) ||
    d.type_document?.toLowerCase().includes(recherche.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className={`flex items-center gap-2 border rounded-xl px-4 py-2 flex-1
          ${darkMode ? "bg-gray-800 border-gray-600" : "bg-white border-gray-200"}`}>
          <Search size={16} className="text-gray-400" />
          <input value={recherche} onChange={(e) => setRecherche(e.target.value)}
            placeholder="Rechercher un document..."
            className={`outline-none text-sm w-full ${darkMode ? "bg-gray-800 text-white placeholder-gray-500" : ""}`} />
        </div>

        <select
          value={typeSelectionne}
          onChange={(e) => setTypeSelectionne(e.target.value)}
          className={`text-sm px-3 py-2 rounded-xl border outline-none
            ${darkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-200"}`}
        >
          {TYPES_DOCUMENTS.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>

        <label className={`flex items-center gap-2 text-sm px-4 py-2 rounded-xl cursor-pointer transition
          ${uploading ? "opacity-50 cursor-not-allowed" : ""}
          bg-blue-500 text-white hover:bg-blue-600`}>
          <Upload size={16} />
          {uploading ? "Upload..." : "Ajouter"}
          <input type="file" hidden accept=".pdf,.jpg,.jpeg,.png" disabled={uploading} onChange={handleUpload} />
        </label>
      </div>

      <div className={`rounded-2xl shadow overflow-hidden ${darkMode ? "bg-gray-800" : "bg-white"}`}>
        <table className="w-full text-sm">
          <thead className={darkMode ? "bg-gray-700" : "bg-gray-50"}>
            <tr>
              {["Document", "Type", "Date", "Taille", "Actions"].map((h) => (
                <th key={h} className={`text-left px-5 py-3 text-xs font-semibold ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {docsFiltres.length > 0 ? (
              docsFiltres.map((doc) => (
                <tr key={doc.id} className={`border-t ${darkMode ? "border-gray-700 hover:bg-gray-700" : "border-gray-50 hover:bg-gray-50"}`}>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold
                        ${doc.mime_type?.includes('pdf') ? "bg-red-100 text-red-500" : "bg-blue-100 text-blue-500"}`}>
                        {doc.mime_type?.includes('pdf') ? "PDF" : "IMG"}
                      </div>
                      <span className={`font-medium text-xs truncate max-w-[150px] ${darkMode ? "text-gray-200" : "text-gray-700"}`}>
                        {doc.nom_fichier_original}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-500">
                      {TYPES_DOCUMENTS.find(t => t.value === doc.type_document)?.label || doc.type_document}
                    </span>
                  </td>
                  <td className={`px-5 py-4 text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                    {doc.date_document ? new Date(doc.date_document).toLocaleDateString('fr-FR') : 'N/A'}
                  </td>
                  <td className={`px-5 py-4 text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                    {formatTaille(doc.taille_octets)}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2">
                      <button onClick={() => window.open(doc.url_stockage, '_blank')}
                        className={`p-1.5 rounded-lg ${darkMode ? "bg-gray-600 text-gray-300" : "bg-gray-100 text-gray-600"}`}>
                        <Eye size={14} />
                      </button>
                      <button onClick={() => {
                        const a = document.createElement('a');
                        a.href = doc.url_stockage;
                        a.download = doc.nom_fichier_original;
                        a.click();
                      }} className={`p-1.5 rounded-lg ${darkMode ? "bg-blue-900 text-blue-400" : "bg-blue-50 text-blue-500"}`}>
                        <Download size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="px-5 py-12 text-center text-gray-400 text-sm">
                  Aucun document médical
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── ANTÉCÉDENTS ───────────────────────────────────────────────────────────
function Antecedents({ darkMode, profil, onRefresh, onToast }) {
  const [showModal, setShowModal] = useState(false);
  const [sectionActive, setSectionActive] = useState('');
  const [newValue, setNewValue] = useState('');
  const [saving, setSaving] = useState(false);

  const SECTIONS = [
    { titre: "Antécédents médicaux",     field: "antecedents_personnels" },
    { titre: "Antécédents familiaux",    field: "antecedents_familiaux" },
    { titre: "Opérations chirurgicales", field: "antecedents_chirurgicaux" },
  ];

  const parseListe = (texte) => {
    if (!texte) return [];
    if (Array.isArray(texte)) return texte;
    return texte.split('\n').filter(l => l.trim());
  };

  const handleSave = async () => {
    if (!newValue.trim()) return;
    const section = SECTIONS.find(s => s.titre === sectionActive);
    if (!section) return;
    try {
      setSaving(true);
      const currentList = parseListe(profil[section.field]);
      await updateDossierPatient({
        [section.field]: [...currentList, newValue.trim()].join('\n')
      });
      onToast("Antécédent ajouté", "success");
      setNewValue('');
      setShowModal(false);
      onRefresh();
    } catch (err) {
      onToast(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {SECTIONS.map((section) => {
          const items = parseListe(profil[section.field]);
          return (
            <div key={section.titre} className={`rounded-2xl shadow p-5 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className={`text-sm font-bold ${darkMode ? "text-gray-200" : "text-gray-700"}`}>{section.titre}</h3>
                <button onClick={() => { setSectionActive(section.titre); setNewValue(''); setShowModal(true); }}
                  className="text-xs text-blue-500 hover:underline flex items-center gap-1">
                  <Plus size={12} /> Ajouter
                </button>
              </div>
              <div className="flex flex-col gap-2">
                {items.length > 0 ? items.map((item, i) => (
                  <div key={i} className={`flex items-center gap-2 p-2 rounded-lg ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                    <p className={`text-xs ${darkMode ? "text-gray-300" : "text-gray-600"}`}>{item}</p>
                  </div>
                )) : (
                  <p className="text-xs text-gray-400">Aucun antécédent renseigné</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <Modal darkMode={darkMode} titre={`Ajouter — ${sectionActive}`} onClose={() => setShowModal(false)}>
          <textarea value={newValue} onChange={(e) => setNewValue(e.target.value)}
            placeholder="Description..." rows={3}
            className={`w-full px-3 py-2 rounded-lg border text-sm outline-none resize-none
              ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"}`} />
          <BoutonActions darkMode={darkMode} onAnnuler={() => setShowModal(false)} onSauver={handleSave} saving={saving} />
        </Modal>
      )}
    </>
  );
}

// ── HABITUDES DE VIE ──────────────────────────────────────────────────────
function HabitudesDeVie({ darkMode, profil, onRefresh, onToast }) {
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);

  const habitudes = profil?.habitudes_vie || {};
  const items = [
    { label: "Tabac",            key: "tabac" },
    { label: "Alcool",           key: "alcool" },
    { label: "Activité physique",key: "activite_physique" },
    { label: "Alimentation",     key: "alimentation" },
    { label: "Sommeil",          key: "sommeil" },
  ];

  const openModal = () => {
    setFormData({ tabac: habitudes.tabac || "", alcool: habitudes.alcool || "",
      activite_physique: habitudes.activite_physique || "",
      alimentation: habitudes.alimentation || "", sommeil: habitudes.sommeil || "" });
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateDossierPatient({ habitudes_vie: formData });
      onToast("Habitudes mises à jour", "success");
      setShowModal(false);
      onRefresh();
    } catch (err) {
      onToast(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const inputClass = `w-full px-3 py-2 rounded-lg border text-sm outline-none
    ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"}`;

  return (
    <>
      <div className={`rounded-2xl shadow p-5 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-sm font-bold ${darkMode ? "text-gray-200" : "text-gray-700"}`}>Habitudes de vie</h3>
          <button onClick={openModal} className="text-xs text-blue-500 hover:underline flex items-center gap-1">
            <Edit3 size={12} /> Modifier
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {items.map(({ label, key }) => (
            <div key={key} className={`p-3 rounded-xl ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
              <p className="text-xs text-gray-400 mb-1">{label}</p>
              <p className={`text-sm font-bold ${darkMode ? "text-gray-200" : "text-gray-700"}`}>
                {habitudes[key] || "Non renseigné"}
              </p>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <Modal darkMode={darkMode} titre="Habitudes de vie" onClose={() => setShowModal(false)}>
          <div className="space-y-4">
            {items.map(({ label, key }) => (
              <div key={key}>
                <label className={`text-sm font-medium mb-1 block ${darkMode ? "text-gray-300" : "text-gray-700"}`}>{label}</label>
                <input type="text" value={formData[key] || ""} onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                  className={inputClass} placeholder="Ex: Non, Occasionnel, 3x/semaine..." />
              </div>
            ))}
          </div>
          <BoutonActions darkMode={darkMode} onAnnuler={() => setShowModal(false)} onSauver={handleSave} saving={saving} />
        </Modal>
      )}
    </>
  );
}

// ── VACCINS ───────────────────────────────────────────────────────────────
function Vaccins({ darkMode, profil, onRefresh, onToast }) {
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ nom: "", date: "", prochain_rappel: "", statut: "Valide" });
  const [saving, setSaving] = useState(false);

  const vaccins = profil.vaccinations || [];

  const handleSave = async () => {
    if (!formData.nom.trim()) {
      onToast("Le nom du vaccin est obligatoire.", "error");
      return;
    }
    try {
      setSaving(true);
      await updateDossierPatient({ vaccinations: [...vaccins, formData] });
      onToast("Vaccin ajouté", "success");
      setFormData({ nom: "", date: "", prochain_rappel: "", statut: "Valide" });
      setShowModal(false);
      onRefresh();
    } catch (err) {
      onToast(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const inputClass = `w-full px-3 py-2 rounded-lg border text-sm outline-none
    ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"}`;

  return (
    <>
      <div className={`rounded-2xl shadow overflow-hidden ${darkMode ? "bg-gray-800" : "bg-white"}`}>
        <div className={`flex items-center justify-between px-5 py-4 border-b ${darkMode ? "border-gray-700" : "border-gray-100"}`}>
          <h3 className={`font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>Carnet de vaccination</h3>
          <button onClick={() => setShowModal(true)} className="flex items-center gap-1 text-xs text-blue-500 hover:underline">
            <Plus size={12} /> Ajouter
          </button>
        </div>
        <table className="w-full text-sm">
          <thead className={darkMode ? "bg-gray-700" : "bg-gray-50"}>
            <tr>
              {["Vaccin", "Date", "Prochain rappel", "Statut"].map((h) => (
                <th key={h} className={`text-left px-5 py-3 text-xs font-semibold ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {vaccins.length > 0 ? (
              vaccins.map((v, i) => (
                <tr key={i} className={`border-t ${darkMode ? "border-gray-700" : "border-gray-50"}`}>
                  <td className={`px-5 py-3 font-medium ${darkMode ? "text-white" : "text-gray-800"}`}>{v.nom || v.vaccin}</td>
                  <td className={`px-5 py-3 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                    {v.date ? new Date(v.date).toLocaleDateString('fr-FR') : 'N/A'}
                  </td>
                  <td className={`px-5 py-3 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                    {v.prochain_rappel ? new Date(v.prochain_rappel).toLocaleDateString('fr-FR') : 'N/A'}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-semibold
                      ${v.statut === "Valide" || v.statut === "Complet" ? "bg-green-100 text-green-600" : "bg-orange-100 text-orange-500"}`}>
                      {v.statut || 'N/A'}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="4" className="px-5 py-12 text-center text-sm text-gray-400">Aucun vaccin renseigné</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <Modal darkMode={darkMode} titre="Ajouter un vaccin" onClose={() => setShowModal(false)}>
          <div className="space-y-4">
            <div>
              <label className={`text-sm font-medium mb-1 block ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Nom du vaccin *</label>
              <input type="text" value={formData.nom} onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                placeholder="Ex: COVID-19, Hépatite B..." className={inputClass} />
            </div>
            <div>
              <label className={`text-sm font-medium mb-1 block ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Date de vaccination</label>
              <input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className={`text-sm font-medium mb-1 block ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Prochain rappel</label>
              <input type="date" value={formData.prochain_rappel} onChange={(e) => setFormData({ ...formData, prochain_rappel: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className={`text-sm font-medium mb-1 block ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Statut</label>
              <select value={formData.statut} onChange={(e) => setFormData({ ...formData, statut: e.target.value })} className={inputClass}>
                <option value="Valide">Valide</option>
                <option value="Complet">Complet</option>
                <option value="A renouveler">A renouveler</option>
              </select>
            </div>
          </div>
          <BoutonActions darkMode={darkMode} onAnnuler={() => setShowModal(false)} onSauver={handleSave} saving={saving} />
        </Modal>
      )}
    </>
  );
}

// ── COMPOSANT PRINCIPAL ───────────────────────────────────────────────────
export default function Dossiers({ darkMode }) {
  const [ongletActif, setOngletActif] = useState(0);
  const [profil, setProfil] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [toast, setToast] = useState(null);

  const charger = useCallback(async () => {
    try {
      setLoading(true);
      setErreur(null);
      const [profilData, docsData] = await Promise.all([
        fetchPatientProfil(),
        fetchDocumentsMedicaux(),
      ]);
      setProfil(profilData);
      setDocuments(docsData ?? []);
    } catch (err) {
      setErreur(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { charger(); }, [charger]);

  const afficherToast = (message, type = "error") => setToast({ message, type });

  if (loading) return (
    <div className={`p-6 min-h-screen flex items-center justify-center ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
      <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (erreur || !profil) return (
    <div className={`p-6 min-h-screen flex items-center justify-center ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
      <div className={`flex items-center gap-3 px-5 py-4 rounded-2xl ${darkMode ? "bg-red-900/30 text-red-300" : "bg-red-50 text-red-600"}`}>
        <AlertCircle size={18} />
        <span className="text-sm">{erreur || "Profil introuvable"}</span>
      </div>
    </div>
  );

  const props = { darkMode, profil, onRefresh: charger, onToast: afficherToast };

  const composants = [
    <InformationsPersonnelles {...props} />,
    <DocumentsMedicaux darkMode={darkMode} documents={documents} onRefresh={charger} onToast={afficherToast} />,
    <Antecedents {...props} />,
    <HabitudesDeVie {...props} />,
    <Vaccins {...props} />,
  ];

  return (
    <div className={`p-6 min-h-screen ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-blue-500">Ma Santé</h1>
        <p className={`text-sm mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
          Votre dossier médical complet
        </p>
      </div>

      <div className="flex gap-2 flex-wrap mb-6">
        {ONGLETS.map((onglet, index) => (
          <button key={index} onClick={() => setOngletActif(index)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all
              ${ongletActif === index
                ? "bg-blue-600 text-white"
                : darkMode
                  ? "bg-gray-800 text-gray-300 border border-gray-600 hover:bg-gray-700"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
              }`}>
            {onglet}
          </button>
        ))}
      </div>

      {composants[ongletActif]}
    </div>
  );
}