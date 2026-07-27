import { useState, useEffect, useRef } from "react";
import {
  X, Save, User, Stethoscope, Clock,
  CreditCard, Video, CheckCircle, AlertCircle, Phone, Camera, Trash2
} from "lucide-react";
import { fetchMonProfil, updateMonProfil, uploadMedecinPhoto, supprimerMedecinPhoto } from "../../../services/medecinService";


const DEVISES = ["XAF", "EUR", "USD", "GBP"];

function FieldError({ message }) {
  if (!message) return null;
  return (
    <p className="flex items-center gap-1 text-xs text-red-500 mt-1">
      <AlertCircle size={11} className="flex-shrink-0" />
      {message}
    </p>
  );
}

export default function ProfilMedecinModal({ open, onClose, darkMode }) {
  const [profil, setProfil] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [succes, setSucces] = useState(false);
  const [erreurs, setErreurs] = useState({});
  const [serverError, setServerError] = useState(null);
  
  // ✅ État pour l'upload de photo
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    biographie: "",
    tarif_consultation: "",
    devise: "XAF",
    langues_parlees: "",
    teleconsultation_active: false,
    disponible_maintenant: true,
    annees_experience: "",
    telephone_pro: "",
  });

  useEffect(() => {
    if (!open) return;
    const charger = async () => {
      try {
        setLoading(true);
        setServerError(null);
        setSucces(false);
        setErreurs({});
        setPhotoFile(null);
        
        const data = await fetchMonProfil();
        setProfil(data);
        setForm({
          biographie: data.biographie || "",
          tarif_consultation: data.tarif_consultation || "",
          devise: data.devise || "XAF",
          langues_parlees: Array.isArray(data.langues_parlees)
            ? data.langues_parlees.join(", ")
            : data.langues_parlees || "",
          teleconsultation_active: data.teleconsultation_active ?? false,
          disponible_maintenant: data.disponible_maintenant ?? true,
          annees_experience: data.annees_experience || "",
          telephone_pro: data.telephone || "",
        });
        
        // ✅ Définir la prévisualisation de la photo existante
        if (data.photo_url) {
          setPhotoPreview(data.photo_url);
        } else {
          setPhotoPreview(null);
        }
      } catch (err) {
        setServerError(err.message);
      } finally {
        setLoading(false);
      }
    };
    charger();
  }, [open]);

  // ✅ Gestion de la sélection de fichier
  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validation côté client
    const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
    const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    if (file.size > MAX_SIZE) {
      setErreurs((prev) => ({ ...prev, photo: "Image trop volumineuse (max 5 MB)" }));
      return;
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      setErreurs((prev) => ({ ...prev, photo: "Format non supporté (JPG, PNG ou WEBP)" }));
      return;
    }

    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    setErreurs((prev) => {
      const newErrs = { ...prev };
      delete newErrs.photo;
      return newErrs;
    });
  };

  // ✅ Supprimer la photo
  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const valider = () => {
    const errs = {};
    if (!form.biographie.trim()) {
      errs.biographie = "La description est obligatoire.";
    } else if (form.biographie.trim().length < 20) {
      errs.biographie = "Minimum 20 caractères.";
    } else if (form.biographie.length > 1000) {
      errs.biographie = "Maximum 1000 caractères.";
    }
    if (form.tarif_consultation === "" || form.tarif_consultation === null) {
      errs.tarif_consultation = "Le tarif est obligatoire.";
    } else if (Number(form.tarif_consultation) < 0) {
      errs.tarif_consultation = "Le tarif ne peut pas être négatif.";
    } else if (Number(form.tarif_consultation) > 1000000) {
      errs.tarif_consultation = "Tarif trop élevé.";
    }
    if (form.annees_experience !== "" && (Number(form.annees_experience) < 0 || Number(form.annees_experience) > 60)) {
      errs.annees_experience = "Valeur invalide (0–60 ans).";
    }
    if (form.telephone_pro && !/^\+?[0-9\s\-]{8,}$/.test(form.telephone_pro.trim())) {
      errs.telephone_pro = "Numéro de téléphone invalide.";
    }
    setErreurs(errs);
    return Object.keys(errs).length === 0;
  };

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (erreurs[key]) setErreurs((prev) => ({ ...prev, [key]: null }));
  };

  const handleSave = async () => {
  if (!valider()) return;
  try {
    setSaving(true);
    setServerError(null);

    const langues = form.langues_parlees
      .split(",")
      .map((l) => l.trim())
      .filter(Boolean);

    const payload = {
      biographie: form.biographie.trim(),
      tarif_consultation: Number(form.tarif_consultation),
      devise: form.devise,
      langues_parlees: langues,
      teleconsultation_active: form.teleconsultation_active,
      disponible_maintenant: form.disponible_maintenant,
      annees_experience: form.annees_experience !== "" ? Number(form.annees_experience) : undefined,
      telephone_pro: form.telephone_pro.trim() || undefined,
    };

    // 1. Sauvegarder les infos texte
    await updateMonProfil(payload);

    // 2. Gerer la photo separement
    if (photoFile) {
      // Nouvelle photo choisie
      await uploadMedecinPhoto(photoFile);
    } else if (!photoPreview && profil?.photo_url) {
      // Photo existante supprimee par l'utilisateur
      await supprimerMedecinPhoto();
    }

    setSucces(true);
    setTimeout(() => {
      setSucces(false);
      onClose();
    }, 1500);
  } catch (err) {
    setServerError(err.message);
  } finally {
    setSaving(false);
  }
};

  if (!open) return null;

  const inputClass = `w-full px-4 py-2.5 rounded-xl border outline-none text-sm transition
    ${darkMode
      ? "bg-gray-800 border-gray-600 text-white placeholder-gray-500"
      : "bg-white border-gray-300 placeholder-gray-400"}`;

  // Initiales pour l'avatar par défaut
  const initiales = profil 
    ? `${(profil.prenom?.[0] || '').toUpperCase()}${(profil.nom?.[0] || '').toUpperCase()}` 
    : "?";

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className={`w-full max-w-2xl max-h-[92vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden
        ${darkMode ? "bg-gray-900 text-white" : "bg-white text-gray-800"}`}>

        {/* Header */}
        <div className={`sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b flex-shrink-0
          ${darkMode ? "bg-gray-900 border-gray-700" : "bg-white border-gray-100"}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <User size={20} className="text-blue-600" />
            </div>
            <div>
              <h2 className="font-bold text-lg">Mon profil professionnel</h2>
              {profil && (
                <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  Dr. {profil.prenom} {profil.nom}
                  {profil.specialites?.[0] ? ` • ${profil.specialites[0]}` : ""}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition ${darkMode ? "hover:bg-gray-800" : "hover:bg-gray-100"}`}
          >
            <X size={20} />
          </button>
        </div>

        {/* Corps */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

          {loading && (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {succes && (
            <div className="flex items-center justify-center gap-2 py-6 text-green-500 font-semibold">
              <CheckCircle size={22} />
              Profil mis à jour avec succès !
            </div>
          )}

          {serverError && (
            <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm
              ${darkMode ? "bg-red-900/30 text-red-300" : "bg-red-50 text-red-600"}`}>
              <AlertCircle size={16} className="flex-shrink-0" />
              {serverError}
            </div>
          )}

          {!loading && !succes && (
            <>
              {/* ✅ UPLOAD PHOTO DE PROFIL */}
              <div className={`p-5 rounded-xl border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-200"}`}>
                <label className={`flex items-center gap-2 text-sm font-semibold mb-4
                  ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  <Camera size={14} />
                  Photo de profil
                </label>
                
                <div className="flex items-center gap-4">
                  {/* Avatar / Preview */}
                  <div className="relative">
                    {photoPreview ? (
                      <img
                        src={photoPreview}
                        alt="Photo de profil"
                        className="w-24 h-24 rounded-full object-cover border-4 border-blue-500"
                      />
                    ) : (
                      <div className={`w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold
                        ${darkMode ? "bg-gray-700 text-blue-400" : "bg-blue-100 text-blue-600"}`}>
                        {initiales}
                      </div>
                    )}
                    
                    {/* Bouton pour changer la photo */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute -bottom-1 -right-1 w-8 h-8 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg transition"
                      title="Changer la photo"
                    >
                      <Camera size={14} />
                    </button>
                    
                    {/* Bouton pour supprimer (si photo existe) */}
                    {photoPreview && (
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg transition"
                        title="Supprimer la photo"
                      >
                        <Trash2 size={10} />
                      </button>
                    )}
                  </div>
                  
                  {/* Instructions */}
                  <div className="flex-1">
                    <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                      Ajoutez une photo professionnelle pour inspirer confiance à vos patients.
                    </p>
                    <p className={`text-xs mt-1 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
                      JPG, PNG ou WEBP • Max 5 MB
                    </p>
                    <div className="flex gap-2 mt-3">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded-lg font-medium transition"
                      >
                        Choisir un fichier
                      </button>
                      {photoFile && (
                        <span className={`text-xs flex items-center ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                          {photoFile.name} ({(photoFile.size / 1024).toFixed(1)} KB)
                        </span>
                      )}
                    </div>
                    <FieldError message={erreurs.photo} />
                  </div>
                </div>
                
                {/* Input file caché */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePhotoSelect}
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  className="hidden"
                />
              </div>

              {/* Infos de base — lecture seule */}
              {profil && (
                <div className={`p-4 rounded-xl ${darkMode ? "bg-gray-800" : "bg-gray-50"}`}>
                  <p className={`text-xs font-semibold uppercase mb-3 tracking-wide
                    ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                    Informations du compte
                  </p>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-gray-400">Nom complet</p>
                      <p className={`font-medium ${darkMode ? "text-white" : "text-gray-800"}`}>
                        Dr. {profil.prenom} {profil.nom}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Email</p>
                      <p className={`font-medium truncate ${darkMode ? "text-white" : "text-gray-800"}`}>
                        {profil.email}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Spécialité</p>
                      <p className={`font-medium ${darkMode ? "text-white" : "text-gray-800"}`}>
                        {profil.specialites?.[0] || "Non renseigné"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Structure</p>
                      <p className={`font-medium ${darkMode ? "text-white" : "text-gray-800"}`}>
                        {profil.lieu_exercice || "Non renseigné"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Note moyenne</p>
                      <p className={`font-medium ${darkMode ? "text-white" : "text-gray-800"}`}>
                        {profil.note_moyenne ? `${profil.note_moyenne.toFixed(1)} / 5` : "Pas encore noté"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Numéro d'ordre</p>
                      <p className={`font-medium ${darkMode ? "text-white" : "text-gray-800"}`}>
                        {profil.numero_ordre || "Non renseigné"}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Description */}
              <div>
                <label className={`flex items-center gap-2 text-sm font-semibold mb-2
                  ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  <Stethoscope size={14} />
                  Description professionnelle *
                </label>
                <textarea
                  value={form.biographie}
                  onChange={(e) => updateField("biographie", e.target.value)}
                  rows={4}
                  placeholder="Décrivez votre parcours, vos domaines d'expertise et votre approche médicale..."
                  className={`${inputClass} resize-none`}
                />
                <div className="flex items-center justify-between mt-1">
                  <FieldError message={erreurs.biographie} />
                  <span className={`text-xs ml-auto
                    ${form.biographie.length > 900 ? "text-orange-500" : "text-gray-400"}`}>
                    {form.biographie.length}/1000
                  </span>
                </div>
              </div>

              {/* Tarif + Devise */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`flex items-center gap-2 text-sm font-semibold mb-2
                    ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    <CreditCard size={14} />
                    Tarif de consultation *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.tarif_consultation}
                    onChange={(e) => updateField("tarif_consultation", e.target.value)}
                    placeholder="Ex: 5000"
                    className={inputClass}
                  />
                  <FieldError message={erreurs.tarif_consultation} />
                </div>

                <div>
                  <label className={`text-sm font-semibold mb-2 block
                    ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    Devise
                  </label>
                  <select
                    value={form.devise}
                    onChange={(e) => updateField("devise", e.target.value)}
                    className={inputClass}
                  >
                    {DEVISES.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Expérience + Téléphone */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`flex items-center gap-2 text-sm font-semibold mb-2
                    ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    <Clock size={14} />
                    Années d'expérience
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="60"
                    value={form.annees_experience}
                    onChange={(e) => updateField("annees_experience", e.target.value)}
                    placeholder="Ex: 7"
                    className={inputClass}
                  />
                  <FieldError message={erreurs.annees_experience} />
                </div>

                <div>
                  <label className={`flex items-center gap-2 text-sm font-semibold mb-2
                    ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    <Phone size={14} />
                    Téléphone professionnel
                  </label>
                  <input
                    type="tel"
                    value={form.telephone_pro}
                    onChange={(e) => updateField("telephone_pro", e.target.value)}
                    placeholder="+237 6XX XXX XXX"
                    className={inputClass}
                  />
                  <FieldError message={erreurs.telephone_pro} />
                </div>
              </div>

              {/* Langues */}
              <div>
                <label className={`text-sm font-semibold mb-2 block
                  ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  Langues parlées
                  <span className={`text-xs font-normal ml-2 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
                    (séparées par des virgules)
                  </span>
                </label>
                <input
                  type="text"
                  value={form.langues_parlees}
                  onChange={(e) => updateField("langues_parlees", e.target.value)}
                  placeholder="Ex: Français, Anglais, Ewondo"
                  className={inputClass}
                />
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className={`flex items-center justify-between p-4 rounded-xl border
                  ${darkMode ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-200"}`}>
                  <div className="flex items-center gap-2">
                    <Video size={18} className={form.teleconsultation_active ? "text-blue-500" : "text-gray-400"} />
                    <div>
                      <p className="text-sm font-semibold">Téléconsultation</p>
                      <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                        Accepter les consultations vidéo
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => updateField("teleconsultation_active", !form.teleconsultation_active)}
                    className={`w-12 h-6 rounded-full relative transition-all duration-300 flex-shrink-0
                      ${form.teleconsultation_active ? "bg-blue-500" : darkMode ? "bg-gray-600" : "bg-gray-300"}`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 shadow transition-all duration-300
                      ${form.teleconsultation_active ? "right-0.5" : "left-0.5"}`} />
                  </button>
                </div>

                <div className={`flex items-center justify-between p-4 rounded-xl border
                  ${darkMode ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-200"}`}>
                  <div className="flex items-center gap-2">
                    <CheckCircle size={18} className={form.disponible_maintenant ? "text-green-500" : "text-gray-400"} />
                    <div>
                      <p className="text-sm font-semibold">Disponible</p>
                      <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                        Visible dans l'annuaire
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => updateField("disponible_maintenant", !form.disponible_maintenant)}
                    className={`w-12 h-6 rounded-full relative transition-all duration-300 flex-shrink-0
                      ${form.disponible_maintenant ? "bg-green-500" : darkMode ? "bg-gray-600" : "bg-gray-300"}`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 shadow transition-all duration-300
                      ${form.disponible_maintenant ? "right-0.5" : "left-0.5"}`} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!loading && !succes && (
          <div className={`sticky bottom-0 flex gap-3 px-6 py-4 border-t flex-shrink-0
            ${darkMode ? "bg-gray-900 border-gray-700" : "bg-white border-gray-100"}`}>
            <button
              onClick={onClose}
              className={`flex-1 py-3 rounded-xl font-semibold text-sm transition
                ${darkMode ? "bg-gray-800 text-gray-300 hover:bg-gray-700" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
            >
              Annuler
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-3 rounded-xl font-semibold text-sm bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              <Save size={16} />
              {saving ? "Sauvegarde..." : "Sauvegarder"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}