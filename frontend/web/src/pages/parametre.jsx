import { useState } from "react";
import { User, Lock, Bell, Eye, EyeOff, Shield, Smartphone, Globe } from "lucide-react";

const sections = ["Profil", "Sécurité", "Notifications", "Confidentialité", "Langue"];

export default function Parametres({ darkMode }) {
  const [section, setSection] = useState("Profil");
  const [showPassword, setShowPassword] = useState(false);

  const [notifs, setNotifs] = useState({
    rdv: true,
    messages: true,
    resultats: true,
    paiements: false,
    newsletter: false,
  });

  return (
    <div className={`p-4 min-h-screen transition ${
      darkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"
    }`}>

      <h1 className="text-lg font-bold text-blue-500 mb-6">
        Paramètres
      </h1>

      <div className="flex flex-col md:flex-row gap-6">

        {/* MENU */}
        <div className="w-full md:w-52 flex-shrink-0">
          <div className={`rounded-2xl shadow overflow-hidden ${
            darkMode ? "bg-gray-800" : "bg-white"
          }`}>

            {sections.map((s, index) => {
              const icons = [User, Lock, Bell, Shield, Globe];
              const Icon = icons[index];

              return (
                <button
                  key={s}
                  onClick={() => setSection(s)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition
                    ${section === s
                      ? "bg-blue-500 text-white font-semibold"
                      : darkMode
                        ? "text-gray-300 hover:bg-gray-700"
                        : "text-gray-600 hover:bg-gray-100"
                    }
                    ${index !== sections.length - 1 ? "border-b border-gray-200/10" : ""}
                  `}
                >
                  <Icon size={16} />
                  {s}
                </button>
              );
            })}

          </div>
        </div>

        {/* CONTENT */}
        <div className="flex-1 space-y-6">

          {/* PROFIL */}
          {section === "Profil" && (
            <div className={`rounded-2xl shadow p-6 space-y-6 ${
              darkMode ? "bg-gray-800" : "bg-white"
            }`}>

              <h2 className="font-semibold border-b pb-3">
                Profil utilisateur
              </h2>

              <div className="flex items-center gap-4">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold ${
                  darkMode ? "bg-gray-700" : "bg-blue-100 text-blue-600"
                }`}>
                  J
                </div>

                <div>
                  <p className="font-semibold">Jean Dupont</p>
                  <p className="text-xs text-gray-400">Patient • ID #00123</p>
                  <button className="text-xs mt-2 px-3 py-1 rounded-lg bg-blue-500 text-white hover:bg-blue-600">
                    Changer photo
                  </button>
                </div>
              </div>

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
                    <label className="text-xs text-gray-400">
                      {field.label}
                    </label>
                    <input
                      defaultValue={field.value}
                      className={`w-full mt-1 px-3 py-2 rounded-lg border outline-none ${
                        darkMode
                          ? "bg-gray-700 border-gray-600 text-white"
                          : "bg-white border-gray-300"
                      }`}
                    />
                  </div>
                ))}
              </div>

              <button className="bg-blue-500 text-white px-5 py-2 rounded-xl hover:bg-blue-600">
                Sauvegarder
              </button>
            </div>
          )}

          {/* SECURITE */}
          {section === "Sécurité" && (
            <div className={`rounded-2xl shadow p-6 space-y-6 ${
              darkMode ? "bg-gray-800" : "bg-white"
            }`}>

              <h2 className="font-semibold border-b pb-3">
                Sécurité
              </h2>

              {["Mot de passe actuel", "Nouveau mot de passe", "Confirmer le mot de passe"].map((label) => (
                <div key={label}>
                  <label className="text-xs text-gray-400">{label}</label>

                  <div className="relative mt-1">
                    <input
                      type={showPassword ? "text" : "password"}
                      className={`w-full px-3 py-2 rounded-lg border outline-none pr-10 ${
                        darkMode
                          ? "bg-gray-700 border-gray-600 text-white"
                          : "bg-white border-gray-300"
                      }`}
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

              <div className={`p-4 rounded-xl flex justify-between items-center ${
                darkMode ? "bg-gray-700" : "bg-blue-50"
              }`}>

                <div className="flex items-center gap-3">
                  <Smartphone size={18} className="text-blue-500" />
                  <div>
                    <p className="font-semibold">Double authentification</p>
                    <p className="text-xs text-gray-400">
                      Sécurité renforcée par SMS
                    </p>
                  </div>
                </div>

                <div className="w-10 h-5 bg-blue-500 rounded-full relative">
                  <div className="w-4 h-4 bg-white rounded-full absolute right-0.5 top-0.5" />
                </div>

              </div>

              <button className="bg-blue-500 text-white px-5 py-2 rounded-xl hover:bg-blue-600">
                Mettre à jour
              </button>

            </div>
          )}

          {/* NOTIFICATIONS */}
          {section === "Notifications" && (
            <div className={`rounded-2xl shadow p-6 space-y-4 ${
              darkMode ? "bg-gray-800" : "bg-white"
            }`}>

              <h2 className="font-semibold border-b pb-3">
                Notifications
              </h2>

              {[
                { key: "rdv", label: "Rendez-vous" },
                { key: "messages", label: "Messages" },
                { key: "resultats", label: "Résultats" },
                { key: "paiements", label: "Paiements" },
                { key: "newsletter", label: "Newsletter" },
              ].map((item) => (
                <div key={item.key} className="flex justify-between items-center">
                  <p className="text-sm">{item.label}</p>

                  <button
                    onClick={() =>
                      setNotifs({ ...notifs, [item.key]: !notifs[item.key] })
                    }
                    className={`w-10 h-5 rounded-full relative ${
                      notifs[item.key] ? "bg-blue-500" : "bg-gray-400"
                    }`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all ${
                      notifs[item.key] ? "right-0.5" : "left-0.5"
                    }`} />
                  </button>
                </div>
              ))}

            </div>
          )}

          {/* CONFIDENTIALITE */}
          {section === "Confidentialité" && (
            <div className={`rounded-2xl shadow p-6 space-y-4 ${
              darkMode ? "bg-gray-800" : "bg-white"
            }`}>

              <h2 className="font-semibold border-b pb-3">
                Confidentialité
              </h2>

              {[
                "Partage des données",
                "Visibilité du profil",
                "Historique médical",
              ].map((item) => (
                <div key={item} className="flex justify-between items-center">
                  <p className="text-sm">{item}</p>
                  <div className="w-10 h-5 bg-blue-500 rounded-full relative">
                    <div className="w-4 h-4 bg-white rounded-full absolute right-0.5 top-0.5" />
                  </div>
                </div>
              ))}

            </div>
          )}

          {/* LANGUE */}
          {section === "Langue" && (
            <div className={`rounded-2xl shadow p-6 space-y-4 ${
              darkMode ? "bg-gray-800" : "bg-white"
            }`}>

              <h2 className="font-semibold border-b pb-3">
                Langue
              </h2>

              {["Français", "English"].map((lang) => (
                <button
                  key={lang}
                  className={`w-full flex justify-between items-center px-4 py-3 rounded-xl border ${
                    lang === "Français"
                      ? "bg-blue-500 text-white"
                      : darkMode
                        ? "border-gray-600 text-gray-300"
                        : "border-gray-300"
                  }`}
                >
                  {lang}
                </button>
              ))}

            </div>
          )}

        </div>
      </div>
    </div>
  );
}