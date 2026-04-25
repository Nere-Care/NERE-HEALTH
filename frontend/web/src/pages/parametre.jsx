import { useState } from 'react';
import { User, Lock, Bell, Eye, EyeOff, Shield, Smartphone, Globe } from 'lucide-react';

const sections = ["Profil", "Sécurité", "Notifications", "Confidentialité", "Langue"];

export default function Parametres() {
  const [section, setSection] = useState("Profil");
  const [showPassword, setShowPassword] = useState(false);
  const [notifs, setNotifs] = useState({
    rdv: true, messages: true, resultats: true, paiements: false, newsletter: false
  });

  return (
    <div className="p-4">

      {/* Titre */}
      <h1 className="text-lg font-bold text-blue-600 mb-6">Paramètres</h1>

      <div className="flex gap-6">

        {/* Menu gauche */}
        <div className="w-52 flex-shrink-0">
          <div className="bg-white rounded-2xl shadow overflow-hidden">
            {sections.map((s, index) => {
              const icons = [User, Lock, Bell, Shield, Globe];
              const Icon = icons[index];
              return (
                <button
                  key={s}
                  onClick={() => setSection(s)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-all
                    ${index !== sections.length - 1 ? "border-b border-gray-50" : ""}
                    ${section === s
                      ? "bg-blue-50 text-blue-600 font-semibold border-r-2 border-blue-500"
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
            <div className="bg-white rounded-2xl shadow p-6 flex flex-col gap-5">
              <h2 className="text-sm font-bold text-gray-700 border-b pb-3">Informations du profil</h2>

              {/* Photo */}
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center text-3xl font-bold text-blue-500">
                  J
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-700">Jean Dupont</p>
                  <p className="text-xs text-gray-400 mb-2">Patient • ID #00123</p>
                  <button className="text-xs bg-blue-50 text-blue-500 px-3 py-1.5 rounded-lg hover:bg-blue-100">
                    Changer la photo
                  </button>
                </div>
              </div>

              {/* Formulaire */}
              <div className="grid grid-cols-2 gap-4">
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
                    <input
                      defaultValue={field.value}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400"
                    />
                  </div>
                ))}
              </div>

              <button className="bg-blue-500 text-white text-sm px-6 py-2 rounded-xl hover:bg-blue-600 self-end">
                Sauvegarder
              </button>
            </div>
          )}

          {/* SÉCURITÉ */}
          {section === "Sécurité" && (
            <div className="bg-white rounded-2xl shadow p-6 flex flex-col gap-5">
              <h2 className="text-sm font-bold text-gray-700 border-b pb-3">Sécurité du compte</h2>

              <div className="flex flex-col gap-4">
                {["Mot de passe actuel", "Nouveau mot de passe", "Confirmer le mot de passe"].map((label) => (
                  <div key={label}>
                    <label className="text-xs text-gray-400 mb-1 block">{label}</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400 pr-10"
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

              {/* Double authentification */}
              <div className="bg-blue-50 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Smartphone size={18} className="text-blue-500" />
                  <div>
                    <p className="text-sm font-semibold text-gray-700">Double authentification</p>
                    <p className="text-xs text-gray-400">Sécurisez votre compte avec un code SMS</p>
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

          {/* NOTIFICATIONS */}
          {section === "Notifications" && (
            <div className="bg-white rounded-2xl shadow p-6 flex flex-col gap-4">
              <h2 className="text-sm font-bold text-gray-700 border-b pb-3">Préférences de notifications</h2>

              {[
                { key: "rdv", label: "Rappels de rendez-vous", desc: "Recevoir des rappels avant vos consultations" },
                { key: "messages", label: "Nouveaux messages", desc: "Être notifié des messages de vos médecins" },
                { key: "resultats", label: "Résultats d'examens", desc: "Être informé quand vos résultats sont disponibles" },
                { key: "paiements", label: "Confirmations de paiement", desc: "Recevoir les reçus de paiement" },
                { key: "newsletter", label: "Newsletter santé", desc: "Recevoir des conseils santé hebdomadaires" },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-700">{item.label}</p>
                    <p className="text-xs text-gray-400">{item.desc}</p>
                  </div>
                  <button
                    onClick={() => setNotifs({ ...notifs, [item.key]: !notifs[item.key] })}
                    className={`w-10 h-5 rounded-full relative transition-all ${notifs[item.key] ? "bg-blue-500" : "bg-gray-200"}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all ${notifs[item.key] ? "right-0.5" : "left-0.5"}`} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* CONFIDENTIALITÉ */}
          {section === "Confidentialité" && (
            <div className="bg-white rounded-2xl shadow p-6 flex flex-col gap-4">
              <h2 className="text-sm font-bold text-gray-700 border-b pb-3">Confidentialité</h2>

              {[
                { label: "Partage de données médicales", desc: "Autoriser le partage de vos données avec vos médecins" },
                { label: "Visibilité du profil", desc: "Rendre votre profil visible aux professionnels de santé" },
                { label: "Historique des consultations", desc: "Conserver l'historique de vos consultations" },
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-700">{item.label}</p>
                    <p className="text-xs text-gray-400">{item.desc}</p>
                  </div>
                  <button className="w-10 h-5 bg-blue-500 rounded-full relative">
                    <div className="w-4 h-4 bg-white rounded-full absolute right-0.5 top-0.5" />
                  </button>
                </div>
              ))}

              <button className="mt-4 w-full border border-red-200 text-red-500 text-sm py-2 rounded-xl hover:bg-red-50">
                Supprimer mon compte
              </button>
            </div>
          )}

          {/* LANGUE */}
          {section === "Langue" && (
            <div className="bg-white rounded-2xl shadow p-6 flex flex-col gap-4">
              <h2 className="text-sm font-bold text-gray-700 border-b pb-3">Langue et région</h2>

              {["Français", "English", "العربية"].map((langue) => (
                <button
                  key={langue}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all
                    ${langue === "Français"
                      ? "border-blue-400 bg-blue-50 text-blue-600"
                      : "border-gray-200 text-gray-500 hover:bg-gray-50"
                    }`}
                >
                  <span className="text-sm font-medium">{langue}</span>
                  {langue === "Français" && (
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