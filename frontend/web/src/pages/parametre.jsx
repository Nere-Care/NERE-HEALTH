import { useState } from 'react';
import { User, Lock, Bell, Eye, EyeOff, Shield, Smartphone, Globe } from 'lucide-react';
import { useLanguage } from '../LanguageContext';

const sections = ["Profil", "Sécurité", "Notifications", "Confidentialité", "Langue"];

export default function Parametres({ darkMode }) {
  const { t } = useLanguage();
  const [section, setSection] = useState("Profil");
  const [showPassword, setShowPassword] = useState(false);
  const [notifs, setNotifs] = useState({
    rdv: true, messages: true, resultats: true, paiements: false, newsletter: false
  });

  return (
    <div className={`p-4 min-h-screen ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>

      <h1 className="text-lg font-bold text-blue-600 mb-6">{t.parametres}</h1>

      <div className="flex flex-col md:flex-row gap-6">

        {/* Menu gauche */}
        <div className="w-full md:w-52 flex-shrink-0">
          <div className={`rounded-2xl shadow overflow-hidden ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            {sections.map((s, index) => {
              const icons = [User, Lock, Bell, Shield, Globe];
              const Icon = icons[index];
              return (
                <button
                  key={s}
                  onClick={() => setSection(s)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-all
                    ${index !== sections.length - 1
                      ? darkMode ? "border-b border-gray-700" : "border-b border-gray-50"
                      : ""}
                    ${section === s
                      ? darkMode
                        ? "bg-gray-700 text-blue-400 font-semibold border-r-2 border-blue-500"
                        : "bg-blue-50 text-blue-600 font-semibold border-r-2 border-blue-500"
                      : darkMode
                        ? "text-gray-300 hover:bg-gray-700"
                        : "text-gray-500 hover:bg-gray-50"
                    }`}
                >
                  <Icon size={16} />
                  {s}
                </button>
              );
            })}
          </div>
        </div>

        {/* Contenu */}
        <div className="flex-1">

          {/* PROFIL */}
          {section === "Profil" && (
            <div className={`rounded-2xl shadow p-6 flex flex-col gap-5 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
              <h2 className={`text-sm font-bold border-b pb-3 ${darkMode ? "text-gray-200 border-gray-700" : "text-gray-700"}`}>
                {t.profil}
              </h2>

              <div className="flex items-center gap-4">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold text-blue-500
                  ${darkMode ? "bg-gray-600" : "bg-blue-100"}`}>
                  J
                </div>
                <div>
                  <p className={`text-sm font-semibold ${darkMode ? "text-white" : "text-gray-700"}`}>
                    Jean Dupont
                  </p>
                  <p className="text-xs text-gray-400 mb-2">Patient • ID #00123</p>
                  <button className={`text-xs px-3 py-1.5 rounded-lg
                    ${darkMode ? "bg-gray-600 text-blue-400 hover:bg-gray-500" : "bg-blue-50 text-blue-500 hover:bg-blue-100"}`}>
                    {t.changerPhoto}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { label: "Prénom", value: "Jean" },
                  { label: "Nom", value: "Dupont" },
                  { label: t.email, value: "jean.dupont@email.com" },
                  { label: t.telephone, value: "+237 691 234 567" },
                  { label: t.dateNaissance, value: "15/06/1990" },
                  { label: "Ville", value: "Douala" },
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

              <button className="bg-blue-500 text-white text-sm px-6 py-2 rounded-xl hover:bg-blue-600 self-end">
                {t.sauvegarder}
              </button>
            </div>
          )}

          {/* SÉCURITÉ */}
          {section === "Sécurité" && (
            <div className={`rounded-2xl shadow p-6 flex flex-col gap-5 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
              <h2 className={`text-sm font-bold border-b pb-3 ${darkMode ? "text-gray-200 border-gray-700" : "text-gray-700"}`}>
                {t.securite}
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
                    <p className="text-xs text-gray-400">Sécurisez votre compte avec un code SMS</p>
                  </div>
                </div>
                <div className="w-10 h-5 bg-blue-500 rounded-full relative cursor-pointer">
                  <div className="w-4 h-4 bg-white rounded-full absolute right-0.5 top-0.5" />
                </div>
              </div>

              <button className="bg-blue-500 text-white text-sm px-6 py-2 rounded-xl hover:bg-blue-600 self-end">
                {t.mettreAJour}
              </button>
            </div>
          )}

          {/* NOTIFICATIONS */}
          {section === "Notifications" && (
            <div className={`rounded-2xl shadow p-6 flex flex-col gap-4 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
              <h2 className={`text-sm font-bold border-b pb-3 ${darkMode ? "text-gray-200 border-gray-700" : "text-gray-700"}`}>
                {t.notifications}
              </h2>

              {[
                { key: "rdv", label: "Rappels de rendez-vous", desc: "Recevoir des rappels avant vos consultations" },
                { key: "messages", label: "Nouveaux messages", desc: "Être notifié des messages de vos médecins" },
                { key: "resultats", label: "Résultats d'examens", desc: "Être informé quand vos résultats sont disponibles" },
                { key: "paiements", label: "Confirmations de paiement", desc: "Recevoir les reçus de paiement" },
                { key: "newsletter", label: "Newsletter santé", desc: "Recevoir des conseils santé hebdomadaires" },
              ].map((item) => (
                <div key={item.key} className={`flex items-center justify-between py-2 border-b last:border-0
                  ${darkMode ? "border-gray-700" : "border-gray-50"}`}>
                  <div>
                    <p className={`text-sm font-medium ${darkMode ? "text-gray-200" : "text-gray-700"}`}>
                      {item.label}
                    </p>
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

          {/* CONFIDENTIALITÉ */}
          {section === "Confidentialité" && (
            <div className={`rounded-2xl shadow p-6 flex flex-col gap-4 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
              <h2 className={`text-sm font-bold border-b pb-3 ${darkMode ? "text-gray-200 border-gray-700" : "text-gray-700"}`}>
                {t.confidentialite}
              </h2>

              {[
                { label: "Partage de données médicales", desc: "Autoriser le partage de vos données avec vos médecins" },
                { label: "Visibilité du profil", desc: "Rendre votre profil visible aux professionnels de santé" },
                { label: "Historique des consultations", desc: "Conserver l'historique de vos consultations" },
              ].map((item, index) => (
                <div key={index} className={`flex items-center justify-between py-3 border-b last:border-0
                  ${darkMode ? "border-gray-700" : "border-gray-50"}`}>
                  <div>
                    <p className={`text-sm font-medium ${darkMode ? "text-gray-200" : "text-gray-700"}`}>
                      {item.label}
                    </p>
                    <p className="text-xs text-gray-400">{item.desc}</p>
                  </div>
                  <button className="w-10 h-5 bg-blue-500 rounded-full relative">
                    <div className="w-4 h-4 bg-white rounded-full absolute right-0.5 top-0.5" />
                  </button>
                </div>
              ))}

              <button className={`mt-4 w-full border text-red-500 text-sm py-2 rounded-xl
                ${darkMode ? "border-red-800 hover:bg-red-900" : "border-red-200 hover:bg-red-50"}`}>
                Supprimer mon compte
              </button>
            </div>
          )}

          {/* LANGUE */}
          {section === "Langue" && (
            <div className={`rounded-2xl shadow p-6 flex flex-col gap-4 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
              <h2 className={`text-sm font-bold border-b pb-3 ${darkMode ? "text-gray-200 border-gray-700" : "text-gray-700"}`}>
                {t.langue}
              </h2>

              {["Français", "English"].map((lang) => (
                <button
                  key={lang}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all
                    ${lang === "Français"
                      ? "border-blue-400 bg-blue-50 text-blue-600"
                      : darkMode
                        ? "border-gray-600 text-gray-300 hover:bg-gray-700"
                        : "border-gray-200 text-gray-500 hover:bg-gray-50"
                    }`}
                >
                  <span className="text-sm font-medium">{lang}</span>
                  {lang === "Français" && (
                    <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}