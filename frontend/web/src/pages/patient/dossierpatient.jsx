import { useState, useEffect } from 'react';
import {
  Phone, Mail, MapPin, Droplet, Weight, Ruler,
  Plus, Search, Download, Eye, Upload, X, Save, AlertCircle
} from 'lucide-react';
import {
  fetchPatientProfil,
  fetchDocumentsMedicaux,
  updatePatientProfil
} from '../../services/patientService';

const ONGLETS = [
  "Informations personnelles",
  "Documents Médicaux",
  "Antécédents",
  "Habitudes de vie",
  "Vaccins",
  "Examens",
  "Suivi gynécologique",
];

// Toast simple réutilisable
function Toast({ message, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className="fixed top-4 right-4 z-[200] bg-red-500 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 text-sm">
      <AlertCircle size={16} />
      {message}
    </div>
  );
}

// Modal réutilisable
function Modal({ darkMode, titre, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`rounded-2xl p-6 max-w-md w-full ${darkMode ? "bg-gray-800" : "bg-white"}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-lg font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>{titre}</h3>
          <button onClick={onClose}><X size={20} className="text-gray-400" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function BoutonActions({ darkMode, onAnnuler, onSauver, labelSauver = "Ajouter" }) {
  return (
    <div className="flex gap-3 mt-6">
      <button
        onClick={onAnnuler}
        className={`flex-1 py-2 rounded-lg border ${darkMode ? "border-gray-600 text-gray-300" : "border-gray-300 text-gray-700"}`}
      >
        Annuler
      </button>
      <button
        onClick={onSauver}
        className="flex-1 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 flex items-center justify-center gap-2"
      >
        <Save size={16} /> {labelSauver}
      </button>
    </div>
  );
}

function InformationsPersonnelles({ darkMode, profil, onRefresh, onErreur }) {
  const [showModal, setShowModal] = useState(false);
  const [newAllergie, setNewAllergie] = useState('');

  const handleAddAllergie = async () => {
    if (!newAllergie.trim()) return;
    try {
      await updatePatientProfil({ allergies: [...(profil.allergies || []), newAllergie.trim()] });
      setNewAllergie('');
      setShowModal(false);
      onRefresh();
    } catch (err) {
      onErreur(err.message);
    }
  };

  const initiales = `${profil.prenom?.[0] || ''}${profil.nom?.[0] || ''}`.toUpperCase();

  return (
    <>
      <div className="flex flex-col gap-6">

        <div className={`rounded-2xl shadow p-6 flex items-center gap-6 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
          <div className={`w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold text-blue-500
            ${darkMode ? "bg-gray-600" : "bg-blue-100"}`}>{initiales}</div>
          <div>
            <h2 className={`text-xl font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>
              {profil.prenom} {profil.nom}
            </h2>
            <p className="text-sm text-gray-400">Patient • ID : #{profil.numero_patient?.slice(-5) || '00000'}</p>
            <span className="mt-2 inline-block bg-green-100 text-green-600 text-xs px-3 py-1 rounded-full font-semibold capitalize">
              {profil.statut || 'Actif'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className={`rounded-2xl shadow p-5 flex flex-col gap-4 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            <h3 className={`text-sm font-bold border-b pb-2 ${darkMode ? "text-gray-200 border-gray-700" : "text-gray-700"}`}>
              Coordonnées
            </h3>
            {[
              { icon: Phone, label: "Téléphone", value: profil.telephone || "Non renseigné", bg: "bg-blue-50", color: "text-blue-500" },
              { icon: Mail, label: "Email", value: profil.email || "Non renseigné", bg: "bg-blue-50", color: "text-blue-500" },
              { icon: MapPin, label: "Adresse", value: [profil.ville, profil.pays].filter(Boolean).join(', ') || "Non renseigné", bg: "bg-blue-50", color: "text-blue-500" },
            ].map(({ icon: Icon, label, value, bg, color }) => (
              <div key={label} className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${darkMode ? "bg-gray-700" : bg}`}>
                  <Icon size={16} className={color} />
                </div>
                <div>
                  <p className="text-xs text-gray-400">{label}</p>
                  <p className={`text-sm font-semibold ${darkMode ? "text-gray-200" : "text-gray-700"}`}>{value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className={`rounded-2xl shadow p-5 flex flex-col gap-4 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            <h3 className={`text-sm font-bold border-b pb-2 ${darkMode ? "text-gray-200 border-gray-700" : "text-gray-700"}`}>
              Informations médicales
            </h3>
            {[
              { icon: Droplet, label: "Groupe sanguin", value: profil.groupe_sanguin || "Non renseigné", bg: "bg-red-50", color: "text-red-500" },
              { icon: Weight, label: "Poids", value: profil.poids_kg ? `${profil.poids_kg} kg` : "Non renseigné", bg: "bg-green-50", color: "text-green-500" },
              { icon: Ruler, label: "Taille", value: profil.taille_cm ? `${profil.taille_cm} cm` : "Non renseigné", bg: "bg-purple-50", color: "text-purple-500" },
            ].map(({ icon: Icon, label, value, bg, color }) => (
              <div key={label} className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${darkMode ? "bg-gray-700" : bg}`}>
                  <Icon size={16} className={color} />
                </div>
                <div>
                  <p className="text-xs text-gray-400">{label}</p>
                  <p className={`text-sm font-semibold ${darkMode ? "text-gray-200" : "text-gray-700"}`}>{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={`rounded-2xl shadow p-5 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
          <h3 className={`text-sm font-bold border-b pb-2 mb-4 ${darkMode ? "text-gray-200 border-gray-700" : "text-gray-700"}`}>
            Informations personnelles
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { label: "Date de naissance", value: profil.date_naissance ? new Date(profil.date_naissance).toLocaleDateString('fr-FR') : "Non renseigné" },
              { label: "Age", value: profil.age ? `${profil.age} ans` : "Non renseigné" },
              { label: "Sexe", value: profil.sexe || "Non renseigné" },
              { label: "Contact urgence", value: profil.contact_urgence_nom ? `${profil.contact_urgence_nom} (${profil.contact_urgence_lien || 'Proche'})` : "Non renseigné" },
              { label: "Tel urgence", value: profil.contact_urgence_tel || "Non renseigné" },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-xs text-gray-400">{label}</p>
                <p className={`text-sm font-semibold ${darkMode ? "text-gray-200" : "text-gray-700"}`}>{value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className={`rounded-2xl shadow p-5 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`text-sm font-bold ${darkMode ? "text-gray-200" : "text-gray-700"}`}>Allergies</h3>
            <button onClick={() => setShowModal(true)} className="text-xs text-blue-500 hover:underline flex items-center gap-1">
              <Plus size={12} /> Ajouter
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {profil.allergies?.length > 0
              ? profil.allergies.map((a, i) => (
                  <span key={i} className="px-3 py-1 bg-red-100 text-red-600 text-xs rounded-full font-medium">{a}</span>
                ))
              : <p className="text-sm text-gray-400">Aucune allergie renseignee</p>
            }
          </div>
        </div>
      </div>

      {showModal && (
        <Modal darkMode={darkMode} titre="Ajouter une allergie" onClose={() => setShowModal(false)}>
          <input
            type="text"
            value={newAllergie}
            onChange={(e) => setNewAllergie(e.target.value)}
            placeholder="Ex: Penicilline, Arachides..."
            className={`w-full px-3 py-2 rounded-lg border mb-4 ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"}`}
          />
          <BoutonActions darkMode={darkMode} onAnnuler={() => setShowModal(false)} onSauver={handleAddAllergie} />
        </Modal>
      )}
    </>
  );
}

function DocumentsMedicaux({ darkMode, documents }) {
  const [recherche, setRecherche] = useState('');

  const formatTaille = (octets) => {
    if (!octets) return "N/A";
    if (octets < 1024) return `${octets} B`;
    if (octets < 1024 * 1024) return `${(octets / 1024).toFixed(1)} KB`;
    return `${(octets / (1024 * 1024)).toFixed(1)} MB`;
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
          <input
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Rechercher un document..."
            className={`outline-none text-sm w-full ${darkMode ? "bg-gray-800 text-white placeholder-gray-500" : ""}`}
          />
        </div>
        <button className="flex items-center gap-2 bg-blue-500 text-white text-sm px-4 py-2 rounded-xl hover:bg-blue-600">
          <Upload size={16} /> Ajouter
        </button>
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
                      <span className={`font-medium ${darkMode ? "text-gray-200" : "text-gray-700"}`}>
                        {doc.nom_fichier_original}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold
                      ${doc.mime_type?.includes('pdf') ? "bg-red-50 text-red-500" : "bg-blue-50 text-blue-500"}`}>
                      {doc.type_document}
                    </span>
                  </td>
                  <td className={`px-5 py-4 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                    {doc.date_document ? new Date(doc.date_document).toLocaleDateString('fr-FR') : 'N/A'}
                  </td>
                  <td className={`px-5 py-4 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                    {formatTaille(doc.taille_octets)}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => window.open(doc.url_stockage, '_blank')}
                        className={`p-1.5 rounded-lg ${darkMode ? "bg-gray-600 text-gray-300 hover:bg-gray-500" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                        <Eye size={14} />
                      </button>
                      <button
                        onClick={() => {
                          const a = document.createElement('a');
                          a.href = doc.url_stockage;
                          a.download = doc.nom_fichier_original;
                          a.click();
                        }}
                        className={`p-1.5 rounded-lg ${darkMode ? "bg-blue-900 text-blue-400 hover:bg-blue-800" : "bg-blue-50 text-blue-500 hover:bg-blue-100"}`}>
                        <Download size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="px-5 py-12 text-center text-gray-400">
                  Aucun document medical
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Antecedents({ darkMode, profil, onRefresh, onErreur }) {
  const [showModal, setShowModal] = useState(false);
  const [sectionActive, setSectionActive] = useState('');
  const [newValue, setNewValue] = useState('');

  const parseListe = (texte) => {
    if (!texte) return [];
    if (Array.isArray(texte)) return texte;
    return texte.split('\n').filter(l => l.trim());
  };

  const FIELD_MAP = {
    'Antecedents medicaux': 'antecedents_personnels',
    'Antecedents familiaux': 'antecedents_familiaux',
    'Operations chirurgicales': 'antecedents_chirurgicaux',
  };

  const handleSave = async () => {
    if (!newValue.trim()) return;
    try {
      const field = FIELD_MAP[sectionActive];
      const currentList = parseListe(profil[field]);
      await updatePatientProfil({ [field]: [...currentList, newValue.trim()].join('\n') });
      setNewValue('');
      setShowModal(false);
      onRefresh();
    } catch (err) {
      onErreur(err.message);
    }
  };

  const sections = [
    { titre: "Antecedents medicaux", items: parseListe(profil.antecedents_personnels) },
    { titre: "Antecedents familiaux", items: parseListe(profil.antecedents_familiaux) },
    { titre: "Operations chirurgicales", items: parseListe(profil.antecedents_chirurgicaux) },
    { titre: "Traitements reguliers", items: profil.traitements_chroniques || [] },
  ];

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sections.map((section) => (
          <div key={section.titre} className={`rounded-2xl shadow p-5 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className={`text-sm font-bold ${darkMode ? "text-gray-200" : "text-gray-700"}`}>{section.titre}</h3>
              {section.titre !== "Traitements reguliers" && (
                <button
                  onClick={() => { setSectionActive(section.titre); setShowModal(true); }}
                  className="text-xs text-blue-500 hover:underline flex items-center gap-1">
                  <Plus size={12} /> Ajouter
                </button>
              )}
            </div>
            <div className="flex flex-col gap-2">
              {section.items.length > 0 ? (
                section.items.map((item, i) => (
                  <div key={i} className={`flex items-center gap-2 p-2 rounded-lg ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                    <p className={`text-xs ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                      {typeof item === 'string' ? item : item.nom || item.description || JSON.stringify(item)}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-400">Aucun antecedent renseigne</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <Modal darkMode={darkMode} titre={`Ajouter a ${sectionActive}`} onClose={() => setShowModal(false)}>
          <textarea
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            placeholder="Description..."
            rows={3}
            className={`w-full px-3 py-2 rounded-lg border mb-4 ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"}`}
          />
          <BoutonActions darkMode={darkMode} onAnnuler={() => setShowModal(false)} onSauver={handleSave} />
        </Modal>
      )}
    </>
  );
}

function HabitudesDeVie({ darkMode, profil, onRefresh, onErreur }) {
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({});

  const habitudes = profil?.habitudes_vie || {};

  const openModal = () => {
    setFormData({
      tabac: habitudes.tabac || "",
      alcool: habitudes.alcool || "",
      chicha: habitudes.chicha || "",
      activite_physique: habitudes.activite_physique || "",
      alimentation: habitudes.alimentation || "",
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      await updatePatientProfil({ habitudes_vie: formData });
      setShowModal(false);
      onRefresh();
    } catch (err) {
      onErreur(err.message);
    }
  };

  const items = [
    { label: "Tabac", key: "tabac" },
    { label: "Alcool", key: "alcool" },
    { label: "Chicha", key: "chicha" },
    { label: "Activite physique", key: "activite_physique" },
    { label: "Alimentation", key: "alimentation" },
  ];

  return (
    <>
      <div className={`rounded-2xl shadow p-5 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-sm font-bold ${darkMode ? "text-gray-200" : "text-gray-700"}`}>Habitudes de vie</h3>
          <button onClick={openModal} className="text-xs text-blue-500 hover:underline flex items-center gap-1">
            <Plus size={12} /> Modifier
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {items.map(({ label, key }) => (
            <div key={label} className={`p-3 rounded-xl ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
              <p className="text-xs text-gray-400 mb-1">{label}</p>
              <p className={`text-sm font-bold ${darkMode ? "text-gray-200" : "text-gray-700"}`}>
                {habitudes[key] || "Non renseigne"}
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
                <input
                  type="text"
                  value={formData[key] || ""}
                  onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg border ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"}`}
                  placeholder="Ex: Non, Occasionnel, 3x/semaine..."
                />
              </div>
            ))}
          </div>
          <BoutonActions darkMode={darkMode} onAnnuler={() => setShowModal(false)} onSauver={handleSave} labelSauver="Sauvegarder" />
        </Modal>
      )}
    </>
  );
}

function Vaccins({ darkMode, profil, onRefresh, onErreur }) {
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ nom: "", date: "", prochain_rappel: "", statut: "Valide" });

  const vaccins = profil.vaccinations || [];

  const handleSave = async () => {
    if (!formData.nom.trim()) return;
    try {
      await updatePatientProfil({ vaccinations: [...vaccins, formData] });
      setFormData({ nom: "", date: "", prochain_rappel: "", statut: "Valide" });
      setShowModal(false);
      onRefresh();
    } catch (err) {
      onErreur(err.message);
    }
  };

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
              <tr>
                <td colSpan="4" className="px-5 py-12 text-center text-gray-400">Aucun vaccin renseigne</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <Modal darkMode={darkMode} titre="Ajouter un vaccin" onClose={() => setShowModal(false)}>
          <div className="space-y-4">
            {[
              { label: "Nom du vaccin", key: "nom", type: "text", placeholder: "Ex: COVID-19, Hepatite B..." },
              { label: "Date de vaccination", key: "date", type: "date" },
              { label: "Prochain rappel", key: "prochain_rappel", type: "date" },
            ].map(({ label, key, type, placeholder }) => (
              <div key={key}>
                <label className={`text-sm font-medium mb-1 block ${darkMode ? "text-gray-300" : "text-gray-700"}`}>{label}</label>
                <input
                  type={type}
                  value={formData[key]}
                  onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                  placeholder={placeholder}
                  className={`w-full px-3 py-2 rounded-lg border ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"}`}
                />
              </div>
            ))}
            <div>
              <label className={`text-sm font-medium mb-1 block ${darkMode ? "text-gray-300" : "text-gray-700"}`}>Statut</label>
              <select
                value={formData.statut}
                onChange={(e) => setFormData({ ...formData, statut: e.target.value })}
                className={`w-full px-3 py-2 rounded-lg border ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"}`}
              >
                <option value="Valide">Valide</option>
                <option value="Complet">Complet</option>
                <option value="A renouveler">A renouveler</option>
              </select>
            </div>
          </div>
          <BoutonActions darkMode={darkMode} onAnnuler={() => setShowModal(false)} onSauver={handleSave} />
        </Modal>
      )}
    </>
  );
}

export default function Dossiers({ darkMode }) {
  const [ongletActif, setOngletActif] = useState(0);
  const [profil, setProfil] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [toast, setToast] = useState(null);

  const charger = async () => {
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
  };

  useEffect(() => { charger(); }, []);

  const afficherErreur = (msg) => setToast(msg);

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

  const props = { darkMode, profil, onRefresh: charger, onErreur: afficherErreur };

  const composants = [
    <InformationsPersonnelles {...props} />,
    <DocumentsMedicaux darkMode={darkMode} documents={documents} />,
    <Antecedents {...props} />,
    <HabitudesDeVie {...props} />,
    <Vaccins {...props} />,
    <div className={`rounded-2xl shadow p-6 ${darkMode ? "bg-gray-800 text-gray-300" : "bg-white text-gray-500"}`}>Examens — a completer</div>,
    <div className={`rounded-2xl shadow p-6 ${darkMode ? "bg-gray-800 text-gray-300" : "bg-white text-gray-500"}`}>Suivi gynecologique — a completer</div>,
  ];

  return (
    <div className={`p-6 min-h-screen ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-blue-500">Ma Sante</h1>
        <p className={`text-sm mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
          Votre dossier medical complet
        </p>
      </div>

      <div className="flex gap-2 flex-wrap mb-6">
        {ONGLETS.map((onglet, index) => (
          <button
            key={index}
            onClick={() => setOngletActif(index)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all
              ${ongletActif === index
                ? "bg-blue-600 text-white"
                : darkMode
                  ? "bg-gray-800 text-gray-300 border border-gray-600 hover:bg-gray-700"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
              }`}
          >
            {onglet}
          </button>
        ))}
      </div>

      {composants[ongletActif]}
    </div>
  );
}