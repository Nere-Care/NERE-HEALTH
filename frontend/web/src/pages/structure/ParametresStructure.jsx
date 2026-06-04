import { useState } from 'react';
import { Building2, Lock, Bell, Shield, Users, Eye, EyeOff, Smartphone } from 'lucide-react';

export default function ParametresStructure({ darkMode }) {
  const [section, setSection] = useState("Informations");
  const [showPassword, setShowPassword] = useState(false);
  const [notifs, setNotifs] = useState({
    rdv: true, messages: true, urgences: true, rapports: false, newsletter: false
  });

  const sections = [
    { icon: Building2, label: "Informations" },
    { icon: Users, label: "Personnel" },
    { icon: Bell, label: "Notifications" },
    { icon: Lock, label: "Sécurité" },
    { icon: Shield, label: "Confidentialité" },
  ];

  return (
    <div className={`p-4 min-h-screen ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>

      <h1 className="text-lg font-bold text-blue-600 mb-6">
        Paramètres
      </h1>

      <div className="flex flex-col md:flex-row gap-6">

        {/* Menu gauche */}
        <div className="w-full md:w-52 flex-shrink-0">
          <div className={`rounded-2xl shadow overflow-hidden ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            {sections.map((s, index) => {
              const Icon = s.icon;
              return (
                <button
                  key={s.label}
                  onClick={() => setSection(s.label)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-all
                    ${index !== sections.length - 1
                      ? darkMode ? "border-b border-gray-700" : "border-b border-gray-50"
                      : ""}
                    ${section === s.label
                      ? darkMode
                        ? "bg-gray-700 text-blue-400 font-semibold border-r-2 border-blue-500"
                        : "bg-blue-50 text-blue-600 font-semibold border-r-2 border-blue-500"
                      : darkMode
                        ? "text-gray-300 hover:bg-gray-700"
                        : "text-gray-500 hover:bg-gray-50"
                    }`}
                >
                  <Icon size={16} />
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Contenu */}
        <div className="flex-1">

          {/* INFORMATIONS */}
          {section === "Informations" && (
            <div className={`rounded-2xl shadow p-6 flex flex-col gap-5 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
              <h2 className={`text-sm font-bold border-b pb-3 ${darkMode ? "text-gray-200 border-gray-700" : "text-gray-700"}`}>
                Informations de la structure
              </h2>

              {/* Logo */}
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-2xl bg-blue-600 flex items-center justify-center text-3xl font-bold text-white">
                  H
                </div>
                <div>
                  <p className={`text-sm font-semibold ${darkMode ? "text-white" : "text-gray-700"}`}>
                    Hôpital Général de Yaoundé
                  </p>
                  <p className="text-xs text-gray-400 mb-2">Hôpital • Agréé</p>
                  <button className={`text-xs px-3 py-1.5 rounded-lg
                    ${darkMode ? "bg-gray-600 text-blue-400 hover:bg-gray-500" : "bg-blue-50 text-blue-500 hover:bg-blue-100"}`}>
                    Changer le logo
                  </button>
                </div>
              </div>

              {/* Formulaire */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { label: "Nom de la structure", value: "Hôpital Général de Yaoundé" },
                  { label: "Type", value: "Hôpital" },
                  { label: "Email", value: "contact@hopital-general.cm" },
                  { label: "Téléphone", value: "+237 658 648 394" },
                  { label: "Adresse", value: "Yaoundé, Cameroun" },
                  { label: "Capacité (lits)", value: "250" },
                ].map((field) => (
                  <div key={field.label}>
                    <label className="text-xs text-gray-400 mb-1 block">{field.label}</label>
                    <input
                      defaultValue={field.value}
                      className={`w-full border rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400
                        ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "border-gray-200 text-gray-800"}`}
                    />
                  </div>
                ))}
              </div>

              {/* Horaires */}
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Horaires d'ouverture</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { jour: "Lundi - Vendredi", horaire: "07:00 - 22:00" },
                    { jour: "Samedi", horaire: "08:00 - 18:00" },
                    { jour: "Dimanche", horaire: "09:00 - 15:00" },
                    { jour: "Urgences", horaire: "24h/24" },
                  ].map((h) => (
                    <div key={h.jour} className={`flex justify-between items-center p-3 rounded-xl
                      ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
                      <p className={`text-xs ${darkMode ? "text-gray-300" : "text-gray-600"}`}>{h.jour}</p>
                      <p className="text-xs font-semibold text-blue-500">{h.horaire}</p>
                    </div>
                  ))}
                </div>
              </div>

              <button className="bg-blue-500 text-white text-sm px-6 py-2 rounded-xl hover:bg-blue-600 self-end">
                Sauvegarder
              </button>
            </div>
          )}

          {/* PERSONNEL */}
          {section === "Personnel" && (
            <div className={`rounded-2xl shadow p-6 flex flex-col gap-5 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
              <div className="flex items-center justify-between border-b pb-3">
                <h2 className={`text-sm font-bold ${darkMode ? "text-gray-200 border-gray-700" : "text-gray-700"}`}>
                  Gestion du personnel
                </h2>
                <button className="bg-blue-500 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-blue-600">
                  + Ajouter
                </button>
              </div>

              <div className="flex flex-col gap-3">
                {[
                  { nom: "Dr. Ngassa Pierre", role: "Dentiste", statut: "Actif" },
                  { nom: "Dr. Kamdem Marie", role: "Cardiologue", statut: "Actif" },
                  { nom: "Inf. Bello Paul", role: "Infirmier", statut: "Congé" },
                  { nom: "Dr. Ngo Sophie", role: "Pédiatre", statut: "Actif" },
                ].map((p, index) => (
                  <div key={index} className={`flex items-center justify-between p-3 rounded-xl
                    ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                        {p.nom.charAt(0)}
                      </div>
                      <div>
                        <p className={`text-sm font-semibold ${darkMode ? "text-white" : "text-gray-800"}`}>{p.nom}</p>
                        <p className="text-xs text-gray-400">{p.role}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-semibold
                        ${p.statut === "Actif" ? "bg-green-100 text-green-600" : "bg-orange-100 text-orange-500"}`}>
                        {p.statut}
                      </span>
                      <button className="text-xs text-blue-500 hover:underline">
                        Modifier
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* NOTIFICATIONS */}
          {section === "Notifications" && (
            <div className={`rounded-2xl shadow p-6 flex flex-col gap-4 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
              <h2 className={`text-sm font-bold border-b pb-3 ${darkMode ? "text-gray-200 border-gray-700" : "text-gray-700"}`}>
                Préférences de notifications
              </h2>

              {[
                { key: "rdv", label: "Nouveaux rendez-vous", desc: "Être notifié des nouveaux rendez-vous" },
                { key: "messages", label: "Nouveaux messages", desc: "Recevoir les messages des patients" },
                { key: "urgences", label: "Urgences", desc: "Alertes pour les cas urgents" },
                { key: "rapports", label: "Rapports quotidiens", desc: "Recevoir le rapport d'activité quotidien" },
                { key: "newsletter", label: "Newsletter médicale", desc: "Actualités et formations médicales" },
              ].map((item) => (
                <div key={item.key} className={`flex items-center justify-between py-2 border-b last:border-0
                  ${darkMode ? "border-gray-700" : "border-gray-50"}`}>
                  <div>
                    <p className={`text-sm font-medium ${darkMode ? "text-gray-200" : "text-gray-700"}`}>{item.label}</p>
                    <p className="text-xs text-gray-400">{item.desc}</p>
                  </div>
                  <button
                    onClick={() => setNotifs({ ...notifs, [item.key]: !notifs[item.key] })}
                    className={`w-10 h-5 rounded-full relative transition-all ${notifs[item.key] ? "bg-blue-500" : "bg-gray-300"}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all
                      ${notifs[item.key] ? "right-0.5" : "left-0.5"}`} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* SÉCURITÉ */}
          {section === "Sécurité" && (
            <div className={`rounded-2xl shadow p-6 flex flex-col gap-5 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
              <h2 className={`text-sm font-bold border-b pb-3 ${darkMode ? "text-gray-200 border-gray-700" : "text-gray-700"}`}>
                Sécurité du compte
              </h2>

              <div className="flex flex-col gap-4">
                {["Mot de passe actuel", "Nouveau mot de passe", "Confirmer le mot de passe"].map((label) => (
                  <div key={label}>
                    <label className="text-xs text-gray-400 mb-1 block">{label}</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className={`w-full border rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400 pr-10
                          ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "border-gray-200"}`}
                      />
                      <button
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 text-gray-400"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className={`rounded-xl p-4 flex items-center justify-between
                ${darkMode ? "bg-gray-700" : "bg-blue-50"}`}>
                <div className="flex items-center gap-3">
                  <Smartphone size={18} className="text-blue-500" />
                  <div>
                    <p className={`text-sm font-semibold ${darkMode ? "text-white" : "text-gray-700"}`}>
                      Double authentification
                    </p>
                    <p className="text-xs text-gray-400">
                      Sécurisez votre compte avec un code SMS
                    </p>
                  </div>
                </div>
                <div className="w-10 h-5 bg-blue-500 rounded-full relative cursor-pointer">
                  <div className="w-4 h-4 bg-white rounded-full absolute right-0.5 top-0.5" />
                </div>
              </div>

              <button className="bg-blue-500 text-white text-sm px-6 py-2 rounded-xl hover:bg-blue-600 self-end">
                Mettre à jour
              </button>
            </div>
          )}

          {/* CONFIDENTIALITÉ */}
          {section === "Confidentialité" && (
            <div className={`rounded-2xl shadow p-6 flex flex-col gap-4 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
              <h2 className={`text-sm font-bold border-b pb-3 ${darkMode ? "text-gray-200 border-gray-700" : "text-gray-700"}`}>
                Confidentialité
              </h2>

              {[
                { label: "Partage de données patients", desc: "Autoriser le partage sécurisé des données" },
                { label: "Visibilité de la structure", desc: "Rendre votre structure visible aux patients" },
                { label: "Historique des activités", desc: "Conserver l'historique des activités" },
              ].map((item, index) => (
                <div key={index} className={`flex items-center justify-between py-3 border-b last:border-0
                  ${darkMode ? "border-gray-700" : "border-gray-50"}`}>
                  <div>
                    <p className={`text-sm font-medium ${darkMode ? "text-gray-200" : "text-gray-700"}`}>{item.label}</p>
                    <p className="text-xs text-gray-400">{item.desc}</p>
                  </div>
                  <button className="w-10 h-5 bg-blue-500 rounded-full relative">
                    <div className="w-4 h-4 bg-white rounded-full absolute right-0.5 top-0.5" />
                  </button>
                </div>
              ))}

              <button className={`mt-4 w-full border text-red-500 text-sm py-2 rounded-xl
                ${darkMode ? "border-red-800 hover:bg-red-900" : "border-red-200 hover:bg-red-50"}`}>
                Supprimer le compte
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}