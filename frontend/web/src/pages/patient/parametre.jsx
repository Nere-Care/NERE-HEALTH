import { useState } from 'react';
import { 
  User, Lock, Eye, EyeOff, Shield, 
  Smartphone, LogOut, Users, FileText, ChevronRight, 
  Activity, Heart, AlertCircle, History, CheckCircle2
} from 'lucide-react';

// Menu : Uniquement l'essentiel
const sections = ["Profil", "Sécurité", "Informations légales"];

export default function Parametres({ darkMode }) {
  const [section, setSection] = useState("Profil");
  const [showPassword, setShowPassword] = useState(false);
  
  // État pour la restriction du dossier médical
  const [accessType, setAccessType] = useState("standard"); // "standard" ou "restreint"

  return (
    <div className={`p-4 min-h-screen ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
      <h1 className="text-lg font-bold text-blue-600 mb-6">Paramètres du compte</h1>

      <div className="flex flex-col md:flex-row gap-6">
        
        {/* Menu gauche */}
        <div className="w-full md:w-64 flex-shrink-0 flex flex-col gap-4">
          <div className={`rounded-2xl shadow overflow-hidden ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            {sections.map((s, index) => {
              const icons = [User, Lock, FileText];
              const Icon = icons[index];

              return (
                <button
                  key={s}
                  onClick={() => setSection(s)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-all
                    ${index !== sections.length - 1 ? (darkMode ? "border-b border-gray-700" : "border-b border-gray-50") : ""}
                    ${section === s
                      ? (darkMode ? "bg-gray-700 text-blue-400 font-semibold border-r-2 border-blue-500" : "bg-blue-50 text-blue-600 font-semibold border-r-2 border-blue-500")
                      : (darkMode ? "text-gray-300 hover:bg-gray-700" : "text-gray-500 hover:bg-gray-50")
                    }`}
                >
                  <Icon size={16} />
                  {s}
                </button>
              );
            })}

          </div>

          <button className={`flex items-center gap-3 px-5 py-3 rounded-2xl text-sm font-semibold transition-all border
            ${darkMode 
              ? "bg-gray-800 border-red-900/30 text-red-400 hover:bg-red-950/20" 
              : "bg-white border-red-100 text-red-500 hover:bg-red-50"}`}>
            <LogOut size={16} />
            Déconnexion
          </button>
        </div>

        {/* CONTENT */}
        <div className="flex-1 space-y-6">

          {/* PROFIL - Informations augmentées */}
          {section === "Profil" && (
            <div className="flex flex-col gap-6">
              <div className={`rounded-2xl shadow p-6 flex flex-col gap-5 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
                <h2 className={`text-sm font-bold border-b pb-3 flex items-center gap-2 ${darkMode ? "text-gray-200 border-gray-700" : "text-gray-700"}`}>
                  <User size={16} /> Informations personnelles
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { label: "Prénom", value: "Jean" },
                    { label: "Nom", value: "Dupont" },
                    { label: "Email", value: "jean.dupont@email.com" },
                    { label: "Téléphone", value: "+237 691 234 567" },
                    { label: "Date de naissance", value: "15/06/1990" },
                    { label: "Ville", value: "Douala" },
                  ].map((field) => (
                    <div key={field.label}>
                      <label className="text-xs text-gray-400 mb-1 block">{field.label}</label>
                      <input defaultValue={field.value} className={`w-full border rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400 ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "border-gray-200 text-gray-800"}`} />
                    </div>
                  ))}
                </div>

                <h3 className={`text-xs font-bold uppercase mt-4 ${darkMode ? "text-blue-400" : "text-blue-600"}`}>Données médicales clés</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { label: "Groupe Sanguin", value: "O+", icon: Heart },
                    { label: "Allergies", value: "Aucune", icon: AlertCircle },
                    { label: "Urgence", value: "Mme Dupont (Épouse)", icon: Activity },
                  ].map((item) => (
                    <div key={item.label} className={`p-3 rounded-xl border ${darkMode ? "border-gray-700 bg-gray-900/30" : "border-gray-100 bg-gray-50"}`}>
                      <label className="text-[10px] text-gray-400 uppercase block mb-1">{item.label}</label>
                      <div className="flex items-center gap-2">
                        <item.icon size={14} className="text-blue-500" />
                        <span className={`text-sm font-medium ${darkMode ? "text-gray-200" : "text-gray-700"}`}>{item.value}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mes Proches */}
              <div className={`rounded-2xl shadow p-6 flex flex-col gap-4 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
                <div className="flex items-center justify-between">
                  <h2 className={`text-sm font-bold ${darkMode ? "text-gray-200" : "text-gray-700"}`}>Mes proches</h2>
                  <button className="text-xs text-blue-500 font-semibold">+ Ajouter un proche</button>
                </div>
                <div className={`flex items-center justify-between p-3 rounded-xl border ${darkMode ? "border-gray-700 bg-gray-900/50" : "border-gray-100 bg-gray-50"}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-500 flex items-center justify-center font-bold text-xs">MD</div>
                    <div>
                      <p className={`text-sm font-medium ${darkMode ? "text-white" : "text-gray-700"}`}>Marie Dupont</p>
                      <p className="text-xs text-gray-400">Prendre RDV pour ce proche</p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-gray-400" />
                </div>
              </div>
            </div>
          )}

          {/* SECURITE */}
          {section === "Sécurité" && (
            <div className={`rounded-2xl shadow p-6 flex flex-col gap-6 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
              <h2 className={`text-sm font-bold border-b pb-3 ${darkMode ? "text-gray-200 border-gray-700" : "text-gray-700"}`}>Sécurité</h2>
              
              <div className="flex flex-col gap-4">
                {["Mot de passe actuel", "Nouveau mot de passe"].map((label) => (
                  <div key={label}>
                    <label className="text-xs text-gray-400 mb-1 block">{label}</label>
                    <div className="relative">
                      <input type={showPassword ? "text" : "password"} className={`w-full border rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400 ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "border-gray-200"}`} />
                      <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-2.5 text-gray-400">
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-3">
                <h3 className={`text-xs font-bold uppercase flex items-center gap-2 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  <History size={14} /> Appareils connectés
                </h3>
                <div className={`p-3 rounded-xl border ${darkMode ? "border-gray-700 bg-gray-900/30" : "border-gray-100 bg-gray-50"}`}>
                  <div className="flex justify-between items-center text-xs">
                    <span className={darkMode ? "text-gray-200" : "text-gray-700"}>iPhone 15 - Douala, CM</span>
                    <span className="text-green-500 font-bold">Actif</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* INFORMATIONS LÉGALES & ACCÈS MÉDICAUX */}
          {section === "Informations légales" && (
            <div className="flex flex-col gap-6">
              
              {/* GESTION DES ACCÈS AU DOSSIER MÉDICAL */}
              <div className={`rounded-2xl shadow p-6 flex flex-col gap-5 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
                <h2 className={`text-sm font-bold border-b pb-3 flex items-center gap-2 ${darkMode ? "text-gray-200 border-gray-700" : "text-gray-700"}`}>
                  <Shield size={16} className="text-blue-500" /> Accès au dossier médical
                </h2>

                <div className="flex flex-col gap-4">
                  {/* Option Par Défaut */}
                  <div 
                    onClick={() => setAccessType("standard")}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${accessType === "standard" 
                      ? "border-blue-500 bg-blue-50/30" 
                      : (darkMode ? "border-gray-700 bg-gray-900/20" : "border-gray-100 bg-gray-50")}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className={`text-sm font-bold ${darkMode ? "text-white" : "text-gray-700"}`}>Tout professionnel habilité</p>
                      {accessType === "standard" && <CheckCircle2 size={18} className="text-blue-500" />}
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      Par défaut, tout professionnel de santé intervenant dans votre suivi peut consulter vos informations pour garantir la continuité des soins.
                    </p>
                  </div>

                  {/* Option Restreinte */}
                  <div 
                    onClick={() => setAccessType("restreint")}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${accessType === "restreint" 
                      ? "border-blue-500 bg-blue-50/30" 
                      : (darkMode ? "border-gray-700 bg-gray-900/20" : "border-gray-100 bg-gray-50")}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className={`text-sm font-bold ${darkMode ? "text-white" : "text-gray-700"}`}>Accès restreint et spécifique</p>
                      {accessType === "restreint" && <CheckCircle2 size={18} className="text-blue-500" />}
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      Restreindre l'accès à votre dossier uniquement aux professionnels que vous avez explicitement autorisés manuellement.
                    </p>
                    
                    {accessType === "restreint" && (
                      <button className="mt-3 text-xs text-blue-500 font-bold underline">
                        Gérer la liste des professionnels autorisés
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Mes Préférences (Ancien contenu Confidentialité) */}
              <div className={`rounded-2xl shadow p-6 flex flex-col gap-4 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
                <h2 className={`text-sm font-bold border-b pb-3 ${darkMode ? "text-gray-200 border-gray-700" : "text-gray-700"}`}>
                  Mes préférences
                </h2>
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className={`text-sm font-medium ${darkMode ? "text-gray-200" : "text-gray-700"}`}>Partage de données anonymes</p>
                    <p className="text-xs text-gray-400">Aider à l'amélioration du service</p>
                  </div>
                  <div className="w-10 h-5 bg-blue-500 rounded-full relative"><div className="w-4 h-4 bg-white rounded-full absolute right-0.5 top-0.5" /></div>
                </div>
              </div>

              {/* Documents Légaux */}
              <div className={`rounded-2xl shadow p-6 flex flex-col gap-3 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
                <h2 className={`text-sm font-bold border-b pb-3 ${darkMode ? "text-gray-200 border-gray-700" : "text-gray-700"}`}>Informations légales</h2>
                {["CGU", "Mentions Légales", "Politique de données"].map((doc) => (
                  <button key={doc} className="flex items-center justify-between text-sm text-gray-400 hover:text-blue-500 py-1 transition-colors">
                    {doc} <ChevronRight size={14} />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}