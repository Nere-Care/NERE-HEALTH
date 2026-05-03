import React, { useState } from 'react';
import { useLanguage } from '../../LanguageContext';
import { 
  Building2, MapPin, Phone, Mail, Globe, 
  Clock, Camera, Save, ShieldCheck, Activity 
} from 'lucide-react';

export default function ProfilStructure({ darkMode }) {
  const { langue } = useLanguage();
  
  // État pour simuler les données de la structure
  const [formData, setFormData] = useState({
    nom: "Hôpital Central",
    type: "Hôpital",
    email: "contact@structure.com",
    telephone: "+237 600 000 000",
    adresse: "Quartier Lac, Yaoundé",
    siteWeb: "www.ma-structure.cm",
    description: "Structure de référence offrant des soins multidisciplinaires et un plateau technique de pointe.",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const t = {
    fr: {
      titre: "Profil de la Structure",
      sousTitre: "Gérez les informations publiques et les paramètres de votre établissement",
      infoGen: "Informations Générales",
      type: "Type de structure",
      nom: "Nom de l'établissement",
      description: "Description / Bio",
      contact: "Coordonnées de contact",
      localisation: "Localisation",
      horaires: "Horaires d'ouverture",
      sauvegarder: "Enregistrer les modifications",
      statut: "Structure Vérifiée"
    },
    en: {
      titre: "Healthcare Profile",
      sousTitre: "Manage public information and facility settings",
      infoGen: "General Information",
      type: "Facility Type",
      nom: "Facility Name",
      description: "Description / Bio",
      contact: "Contact Details",
      localisation: "Location",
      horaires: "Opening Hours",
      sauvegarder: "Save Changes",
      statut: "Verified Facility"
    }
  };

  const content = langue === 'fr' ? t.fr : t.en;

  return (
    <div className={`p-4 min-h-screen ${darkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-800"}`}>
      
      {/* Header avec action de sauvegarde */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{content.titre}</h1>
          <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{content.sousTitre}</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition-all shadow-lg text-sm">
          <Save size={18} />
          {content.sauvegarder}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Colonne de Gauche : Photo et Statut */}
        <div className="flex flex-col gap-6">
          <div className={`rounded-2xl shadow p-6 text-center ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            <div className="relative w-32 h-32 mx-auto mb-4">
              <div className="w-full h-full rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 border-4 border-blue-50">
                <Building2 size={48} />
              </div>
              <button className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-lg border border-gray-100 text-blue-600 hover:text-blue-700">
                <Camera size={16} />
              </button>
            </div>
            <h2 className="font-bold text-lg">{formData.nom}</h2>
            <div className="flex items-center justify-center gap-1 mt-1 text-green-500 text-xs font-semibold uppercase tracking-wider">
              <ShieldCheck size={14} />
              {content.statut}
            </div>
          </div>

          {/* Horaires d'ouverture */}
          <div className={`rounded-2xl shadow p-6 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <Clock size={18} className="text-blue-500" />
              {content.horaires}
            </h3>
            {['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'].map((jour) => (
              <div key={jour} className="flex justify-between py-2 border-b border-gray-100 last:border-0 text-sm">
                <span className={darkMode ? "text-gray-400" : "text-gray-600"}>{jour}</span>
                <span className="font-medium">08:00 - 18:00</span>
              </div>
            ))}
          </div>
        </div>

        {/* Colonne de Droite : Formulaire d'édition */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className={`rounded-2xl shadow p-6 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            <h3 className="font-bold mb-6 text-lg border-b pb-2 border-gray-100">{content.infoGen}</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-500 uppercase">{content.nom}</label>
                <input 
                  type="text" name="nom" value={formData.nom} onChange={handleChange}
                  className={`w-full p-3 rounded-xl border ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-50 border-gray-200 text-gray-800"}`}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-500 uppercase">{content.type}</label>
                <select 
                  name="type" value={formData.type} onChange={handleChange}
                  className={`w-full p-3 rounded-xl border ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-50 border-gray-200 text-gray-800"}`}
                >
                  <option>Hôpital</option>
                  <option>Clinique</option>
                  <option>Laboratoire</option>
                  <option>Pharmacie</option>
                </select>
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="text-xs font-semibold text-gray-500 uppercase">{content.description}</label>
                <textarea 
                  name="description" rows="3" value={formData.description} onChange={handleChange}
                  className={`w-full p-3 rounded-xl border ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-50 border-gray-200 text-gray-800"}`}
                ></textarea>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-500 uppercase">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
                  <input 
                    type="email" name="email" value={formData.email} onChange={handleChange}
                    className={`w-full pl-10 p-3 rounded-xl border ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-50 border-gray-200 text-gray-800"}`}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-500 uppercase">{langue === 'fr' ? 'Téléphone' : 'Phone'}</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 text-gray-400" size={18} />
                  <input 
                    type="text" name="telephone" value={formData.telephone} onChange={handleChange}
                    className={`w-full pl-10 p-3 rounded-xl border ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-50 border-gray-200 text-gray-800"}`}
                  />
                </div>
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="text-xs font-semibold text-gray-500 uppercase">{content.localisation}</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 text-gray-400" size={18} />
                  <input 
                    type="text" name="adresse" value={formData.adresse} onChange={handleChange}
                    className={`w-full pl-10 p-3 rounded-xl border ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-50 border-gray-200 text-gray-800"}`}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}