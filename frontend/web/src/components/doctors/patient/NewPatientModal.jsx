import { useState } from "react";
import { UserPlus, CheckCircle, Copy } from "lucide-react";
import { post } from "../../../services/apiClient";
import Modal from "../../common/Modal";
import { validatePhone, phoneError } from "../../../utils/validatePhone";

export default function NewPatientModal({ darkMode, onClose, onCreated }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [created, setCreated] = useState(null);

  const [form, setForm] = useState({
    email: "",
    prenom: "",
    nom: "",
    telephone: "",
    nss: "",
    date_naissance: "",
    sexe: "",
    adresse: "",
    ville: "",
  });

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setError(null);
    if (!form.email.trim()) { setError("L'email est requis"); return; }
    if (!form.prenom.trim()) { setError("Le prénom est requis"); return; }
    if (!form.nom.trim()) { setError("Le nom est requis"); return; }
    if (form.telephone.trim() && !validatePhone(form.telephone)) { setError(phoneError()); return; }

    setLoading(true);
    try {
      const payload = {
        email: form.email.trim(),
        prenom: form.prenom.trim(),
        nom: form.nom.trim(),
        telephone: form.telephone.trim() || null,
        nss: form.nss.trim() || null,
        date_naissance: form.date_naissance || null,
        sexe: form.sexe || null,
        adresse: form.adresse.trim() || null,
        ville: form.ville.trim() || null,
      };
      const result = await post("/api/patients/create-by-doctor", payload);
      setCreated(result);
    } catch (err) {
      setError(err.message || "Erreur lors de la création");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).catch(() => {});
  };

  if (created) {
    return (
      <Modal open={true} onClose={() => {}} title="" darkMode={darkMode} size="max-w-md">
        <div className="text-center">
          <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-3" />
          <h2 className="font-semibold text-xl mb-1">Patient créé</h2>
          <p className={`text-sm mb-6 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            {created.prenom} {created.nom} a été ajouté(e).
          </p>

          <div className={`rounded-xl p-4 text-left space-y-3 mb-6 ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
            <div>
              <span className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Email</span>
              <div className="flex items-center justify-between">
                <span className="text-sm font-mono">{created.email}</span>
                <button onClick={() => navigator.clipboard.writeText(created.email)} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded">
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div>
              <span className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Code patient</span>
              <div className="flex items-center justify-between">
                <span className="text-sm font-mono font-bold">{created.code_patient}</span>
                <button onClick={() => navigator.clipboard.writeText(created.code_patient)} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded">
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div>
              <span className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Mot de passe</span>
              <div className="flex items-center justify-between">
                <span className="text-sm font-mono font-bold text-blue-600">{created.mot_de_passe}</span>
                <button onClick={() => navigator.clipboard.writeText(created.mot_de_passe)} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded">
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          <p className={`text-xs mb-4 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
            Transmettez ces identifiants au patient pour qu'il puisse se connecter.
          </p>

          <button
            onClick={() => { onCreated?.(); onClose(); }}
            className="w-full bg-blue-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition"
          >
            Fermer
          </button>
        </div>
      </Modal>
    );
  }

  const inputClass = `w-full border rounded-xl px-3 py-2.5 text-sm outline-none transition ${
    darkMode
      ? "bg-gray-700 border-gray-600 text-white focus:border-blue-500"
      : "border-gray-300 text-gray-800 focus:border-blue-400"
  }`;

  const labelClass = `text-xs mb-1 block ${darkMode ? "text-gray-400" : "text-gray-500"}`;

  return (
    <Modal open={true} onClose={onClose} title={<><UserPlus className="w-5 h-5 text-blue-500" /> Nouveau patient</>} darkMode={darkMode} size="max-w-lg">
      <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Prénom *</label>
              <input type="text" value={form.prenom} onChange={(e) => handleChange("prenom", e.target.value)} placeholder="Jean" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Nom *</label>
              <input type="text" value={form.nom} onChange={(e) => handleChange("nom", e.target.value)} placeholder="Dupont" className={inputClass} />
            </div>
          </div>

          <div>
            <label className={labelClass}>Email *</label>
            <input type="email" value={form.email} onChange={(e) => handleChange("email", e.target.value)} placeholder="jean.dupont@email.com" className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>Téléphone</label>
            <input type="tel" value={form.telephone} onChange={(e) => handleChange("telephone", e.target.value)} placeholder="6XX XXX XXX" maxLength={9} pattern="6[0-9]{8}" className={inputClass} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>NSS</label>
              <input type="text" value={form.nss} onChange={(e) => handleChange("nss", e.target.value)} placeholder="Généré si vide" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Date de naissance</label>
              <input type="date" value={form.date_naissance} onChange={(e) => handleChange("date_naissance", e.target.value)} className={inputClass} />
            </div>
          </div>

          <div>
            <label className={labelClass}>Sexe</label>
            <select value={form.sexe} onChange={(e) => handleChange("sexe", e.target.value)} className={inputClass}>
              <option value="">Sélectionner...</option>
              <option value="M">Masculin</option>
              <option value="F">Féminin</option>
              <option value="Autre">Autre</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Adresse</label>
            <input type="text" value={form.adresse} onChange={(e) => handleChange("adresse", e.target.value)} placeholder="Quartier, rue..." className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>Ville</label>
            <input type="text" value={form.ville} onChange={(e) => handleChange("ville", e.target.value)} placeholder="Douala" className={inputClass} />
          </div>

          {error && (
            <p className="text-xs text-red-500 flex items-center gap-1">
              <X size={12} /> {error}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-4">
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${darkMode ? "text-gray-300 hover:bg-gray-700" : "text-gray-600 hover:bg-gray-100"}`}
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50"
          >
            <UserPlus className="w-4 h-4" />
            {loading ? "Création..." : "Créer le patient"}
          </button>
        </div>
    </Modal>
  );
}
