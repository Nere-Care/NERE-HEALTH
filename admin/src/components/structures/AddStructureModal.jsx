import { useState } from "react";
import { X, Building2, MapPin, Phone, Mail, UserCircle, Users, Briefcase, ChevronDown, Clock } from "lucide-react";

const OPTIONS = {
  services: [
    "Consultation générale", "Urgences", "Hospitalisation", "Chirurgie",
    "Maternité", "Pédiatrie", "Cardiologie", "Radiologie",
    "Laboratoire", "Réanimation", "Ophtalmologie", "Dermatologie",
    "Orthopédie", "Psychiatrie", "Kinésithérapie", "Nutrition",
  ],
  equipements: [
    "Scanner", "IRM", "Mammographie", "Échographe",
    "Radiographie numérique", "Salle d'opération", "Laboratoire d'analyses",
    "Défibrillateur", "Ventilateur", "Monitorage cardiaque",
    "Appareil d'anesthésie", "Endoscopie", "Électrocardiogramme",
  ],
  langues: [
    "Français", "Anglais", "Allemand", "Arabe",
    "Espagnol", "Portugais", "Chinois", "Italien",
    "Bassa", "Duala", "Bamiléké", "Fang",
    "Ewondo", "Haoussa", "Peul",
  ],
  assurances: [
    "CNPS", "MUNISANTÉ", "AMTA Assurance", "Sanlam Assurance",
    "Activa Assurance", "NSIA Assurance", "Prudential",
    "Allianz Cameroun", "AXA Cameroun", "Sunu Assurance",
  ],
};

function MultiSelect({ label, icon: Icon, options, selected, onChange, darkMode }) {
  const [open, setOpen] = useState(false);

  const toggle = (opt) => {
    const next = selected.includes(opt)
      ? selected.filter((s) => s !== opt)
      : [...selected, opt];
    onChange(next);
  };

  return (
    <div className="relative">
      <label className="text-sm font-medium flex items-center gap-2 mb-1">
        <Icon size={14} className="text-gray-400" /> {label}
      </label>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between p-3 rounded-xl border bg-transparent outline-none focus:ring-2 focus:ring-blue-500 transition ${
          darkMode ? "border-slate-700" : "border-gray-300"
        }`}
      >
        <span className={selected.length === 0 ? "text-gray-400 text-sm" : "text-sm"}>
          {selected.length === 0
            ? "Sélectionner..."
            : `${selected.length} sélectionné(s)`}
        </span>
        <ChevronDown size={16} className={`transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className={`absolute z-10 mt-1 w-full max-h-48 overflow-y-auto rounded-xl border shadow-lg ${
          darkMode ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"
        }`}>
          {options.map((opt) => (
            <label
              key={opt}
              className={`flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:${
                darkMode ? "bg-slate-700" : "bg-gray-100"
              }`}
            >
              <input
                type="checkbox"
                checked={selected.includes(opt)}
                onChange={() => toggle(opt)}
                className="accent-blue-600"
              />
              {opt}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

const JOURS = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];

export default function AddStructureModal({ darkMode, formData, setFormData, isSubmitting, onSubmit, onClose, editingId }) {
  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleMultiChange = (field) => (value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const horaires = formData.horaires || {};
  const setHoraire = (jour, value) => {
    setFormData(prev => ({ ...prev, horaires: { ...prev.horaires, [jour]: value } }));
  };

  const inputClass = `w-full mt-1.5 p-3 rounded-xl border bg-transparent outline-none focus:ring-2 focus:ring-blue-500 transition ${
    darkMode ? "border-slate-700" : "border-gray-300"
  }`;

  const isEdit = !!editingId;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className={`w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden ${
        darkMode ? "bg-slate-900 text-white" : "bg-white text-gray-900"
      }`}>

        {/* Gradient Header Bar */}
        <div className="h-1.5 bg-gradient-to-r from-blue-500 via-cyan-500 to-indigo-500" />

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b dark:border-slate-700">
          <div>
            <h2 className="text-xl font-bold">{isEdit ? "Modifier la structure" : "Ajouter une structure"}</h2>
            <p className="text-sm text-gray-400 mt-0.5">Informations principales de l'établissement</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-800 transition">
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <div className="p-5 space-y-4 max-h-[65vh] overflow-y-auto">

          <div>
            <label className="text-sm font-medium flex items-center gap-2">
              <Building2 size={14} className="text-gray-400" /> Nom de la structure *
            </label>
            <input name="name" value={formData.name} onChange={handleChange}
              placeholder="Ex: Hôpital Général" className={inputClass} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium flex items-center gap-2">
                <Briefcase size={14} className="text-gray-400" /> Type *
              </label>
              <select name="type" value={formData.type} onChange={handleChange} className={inputClass}>
                <option value="">Sélectionner</option>
                <option value="Hôpital public">Hôpital public</option>
                <option value="Clinique privée">Clinique privée</option>
                <option value="CHU">CHU</option>
                <option value="Centre de santé">Centre de santé</option>
                <option value="Laboratoire">Laboratoire</option>
                <option value="Pharmacie">Pharmacie</option>
                <option value="Centre de radiologie">Centre de radiologie</option>
                <option value="Centre de dialyse">Centre de dialyse</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium flex items-center gap-2">
                <MapPin size={14} className="text-gray-400" /> Ville *
              </label>
              <input name="city" value={formData.city} onChange={handleChange}
                placeholder="Douala" className={inputClass} />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium flex items-center gap-2">
              <MapPin size={14} className="text-gray-400" /> Adresse complète
            </label>
            <input name="address" value={formData.address} onChange={handleChange}
              placeholder="Akwa, Douala" className={inputClass} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium flex items-center gap-2">
                <Phone size={14} className="text-gray-400" /> Téléphone
              </label>
              <input type="tel" name="phone" value={formData.phone} onChange={handleChange}
                placeholder="6XX XXX XXX" maxLength={9} pattern="6[0-9]{8}" className={inputClass} />
            </div>
            <div>
              <label className="text-sm font-medium flex items-center gap-2">
                <Mail size={14} className="text-gray-400" /> Email
              </label>
              <input type="email" name="email" value={formData.email} onChange={handleChange}
                placeholder="contact@hopital.cm" className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium flex items-center gap-2">
                <UserCircle size={14} className="text-gray-400" /> Responsable
              </label>
              <input name="manager" value={formData.manager} onChange={handleChange}
                placeholder="Dr. Ndzi" className={inputClass} />
            </div>
            <div>
              <label className="text-sm font-medium flex items-center gap-2">
                <Users size={14} className="text-gray-400" /> Nombre de professionnels
              </label>
              <input type="number" name="professionals" value={formData.professionals} onChange={handleChange}
                placeholder="120" min="0" className={inputClass} />
            </div>
          </div>

          <hr className="border-t dark:border-slate-700" />

          <MultiSelect
            label="Services proposés"
            icon={Briefcase}
            options={OPTIONS.services}
            selected={formData.services || []}
            onChange={handleMultiChange("services")}
            darkMode={darkMode}
          />

          <MultiSelect
            label="Équipements"
            icon={Building2}
            options={OPTIONS.equipements}
            selected={formData.equipements || []}
            onChange={handleMultiChange("equipements")}
            darkMode={darkMode}
          />

          <MultiSelect
            label="Langues parlées"
            icon={Users}
            options={OPTIONS.langues}
            selected={formData.langues || []}
            onChange={handleMultiChange("langues")}
            darkMode={darkMode}
          />

          <div>
            <label className="text-sm font-medium flex items-center gap-2 mb-2">
              <Clock size={14} className="text-gray-400" /> Horaires d'ouverture
            </label>
            <div className={`rounded-xl border divide-y ${darkMode ? "border-slate-700 divide-slate-700" : "border-gray-300 divide-gray-200"}`}>
              {JOURS.map(jour => {
                const val = horaires[jour] || "";
                const isOpen = val !== "fermé" && val !== "";
                return (
                  <div key={jour} className={`flex items-center gap-3 px-3 py-2 ${darkMode ? "text-gray-300" : ""}`}>
                    <span className="text-sm font-medium w-24 capitalize">{jour}</span>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input type="checkbox" checked={isOpen}
                        onChange={() => setHoraire(jour, isOpen ? "fermé" : "08:00-18:00")}
                        className="accent-blue-600" />
                      <span className="text-xs">{isOpen ? "Ouvert" : "Fermé"}</span>
                    </label>
                    {isOpen && (
                      <div className="flex items-center gap-1.5 ml-auto">
                        <input type="time" value={val.split("-")[0] || "08:00"}
                          onChange={e => setHoraire(jour, `${e.target.value}-${val.split("-")[1] || "18:00"}`)}
                          className={`text-xs border rounded-lg px-2 py-1 ${darkMode ? "bg-slate-800 border-slate-700" : "border-gray-300"}`} />
                        <span className="text-xs text-gray-400">à</span>
                        <input type="time" value={val.split("-")[1] || "18:00"}
                          onChange={e => setHoraire(jour, `${val.split("-")[0] || "08:00"}-${e.target.value}`)}
                          className={`text-xs border rounded-lg px-2 py-1 ${darkMode ? "bg-slate-800 border-slate-700" : "border-gray-300"}`} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <MultiSelect
            label="Assurances acceptées"
            icon={Briefcase}
            options={OPTIONS.assurances}
            selected={formData.assurances || []}
            onChange={handleMultiChange("assurances")}
            darkMode={darkMode}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-5 border-t dark:border-slate-700">
          <button onClick={onClose} disabled={isSubmitting}
            className={`flex-1 py-3 rounded-xl border font-medium transition ${
              darkMode ? "border-gray-600 hover:bg-gray-800" : "border-gray-300 hover:bg-gray-100"
            } ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}>
            Annuler
          </button>
          <button onClick={onSubmit} disabled={isSubmitting}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium hover:from-blue-700 hover:to-indigo-700 transition shadow-lg disabled:opacity-50 flex items-center justify-center gap-2">
            {isSubmitting ? (
              <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> {isEdit ? "Modification..." : "Ajout..."}</>
            ) : (isEdit ? "Modifier" : "Ajouter")}
          </button>
        </div>
      </div>
    </div>
  );
}