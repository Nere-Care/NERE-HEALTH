import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, Lock, Eye, EyeOff, Shield, 
  LogOut, Heart, AlertCircle, Activity, 
  ChevronRight, CheckCircle2, Save, Loader
} from 'lucide-react';
import { fetchProfilComplet, changePassword } from '../../services/userService';

const sections = ["Profil", "Sécurité", "Confidentialité"];

export default function Parametres({ darkMode }) {
  const navigate = useNavigate();
  const [section, setSection] = useState("Profil");
  const [showPassword, setShowPassword] = useState(false);
  const [accessType, setAccessType] = useState("standard");
  
  const [profil, setProfil] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState(null);
  
  // États pour les formulaires
  const [formData, setFormData] = useState({});
  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordMessage, setPasswordMessage] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const charger = async () => {
      try {
        setLoading(true);
        const data = await fetchProfilComplet();
        setProfil(data);
        setFormData({
          prenom: data.prenom || "",
          nom: data.nom || "",
          email: data.email || "",
          telephone: data.telephone || "",
          ville: data.ville || "",
          date_naissance: data.date_naissance || "",
          groupe_sanguin: data.groupe_sanguin || "",
        });
      } catch (err) {
        setErreur(err.message);
      } finally {
        setLoading(false);
      }
    };
    charger();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const handleChangePassword = async () => {
    setPasswordMessage(null);
    
    if (!passwordData.oldPassword || !passwordData.newPassword) {
      setPasswordMessage({ type: "error", text: "Veuillez remplir tous les champs" });
      return;
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordMessage({ type: "error", text: "Les mots de passe ne correspondent pas" });
      return;
    }
    
    try {
      setSaving(true);
      await changePassword(passwordData.oldPassword, passwordData.newPassword);
      setPasswordMessage({ type: "success", text: "Mot de passe modifié avec succès" });
      setPasswordData({ oldPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setPasswordMessage({ type: "error", text: err.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={`p-6 min-h-screen flex items-center justify-center ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
        <Loader className="animate-spin text-blue-500" size={32} />
      </div>
    );
  }

  if (erreur || !profil) {
    return (
      <div className={`p-6 min-h-screen flex items-center justify-center ${darkMode ? "bg-gray-900 text-white" : "bg-gray-50"}`}>
        <p className="text-red-500">{erreur || "Profil introuvable"}</p>
      </div>
    );
  }

  const isPatient = profil.role === "patient";
  const isMedecin = profil.role === "medecin";

  return (
    <div className={`p-4 min-h-screen ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
      <h1 className="text-xl sm:text-2xl font-bold text-[#3b82f6] mb-6">Paramètres du compte</h1>

      <div className="flex flex-col md:flex-row gap-6">
        
        {/* Menu gauche */}
        <div className="w-full md:w-64 flex-shrink-0 flex flex-col gap-4">
          <div className={`rounded-2xl shadow overflow-hidden ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            {sections.map((s, index) => {
              const icons = [User, Lock, Shield];
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

          <button 
            onClick={handleLogout}
            className={`flex items-center gap-3 px-5 py-3 rounded-2xl text-sm font-semibold transition-all border
              ${darkMode 
                ? "bg-gray-800 border-red-900/30 text-red-400 hover:bg-red-950/20" 
                : "bg-white border-red-100 text-red-500 hover:bg-red-50"}`}
          >
            <LogOut size={16} />
            Déconnexion
          </button>
        </div>

        {/* CONTENT */}
        <div className="flex-1 space-y-6">

          {/* PROFIL */}
          {section === "Profil" && (
            <div className="flex flex-col gap-6">
              <div className={`rounded-2xl shadow p-6 flex flex-col gap-5 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
                <h2 className={`text-sm font-bold border-b pb-3 flex items-center gap-2 ${darkMode ? "text-gray-200 border-gray-700" : "text-gray-700"}`}>
                  <User size={16} /> Informations personnelles
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Prénom</label>
                    <input 
                      value={formData.prenom}
                      onChange={(e) => setFormData({...formData, prenom: e.target.value})}
                      className={`w-full border rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400 ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "border-gray-200 text-gray-800"}`} 
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Nom</label>
                    <input 
                      value={formData.nom}
                      onChange={(e) => setFormData({...formData, nom: e.target.value})}
                      className={`w-full border rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400 ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "border-gray-200 text-gray-800"}`} 
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Email</label>
                    <input 
                      value={formData.email}
                      disabled
                      className={`w-full border rounded-xl px-3 py-2 text-sm outline-none ${darkMode ? "bg-gray-700 border-gray-600 text-gray-400" : "border-gray-200 text-gray-500 bg-gray-50"}`} 
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Téléphone</label>
                    <input 
                      value={formData.telephone}
                      onChange={(e) => setFormData({...formData, telephone: e.target.value})}
                      className={`w-full border rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400 ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "border-gray-200 text-gray-800"}`} 
                    />
                  </div>
                  
                  {isPatient && (
                    <>
                      <div>
                        <label className="text-xs text-gray-400 mb-1 block">Date de naissance</label>
                        <input 
                          type="date"
                          value={formData.date_naissance}
                          onChange={(e) => setFormData({...formData, date_naissance: e.target.value})}
                          className={`w-full border rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400 ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "border-gray-200 text-gray-800"}`} 
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 mb-1 block">Ville</label>
                        <input 
                          value={formData.ville}
                          onChange={(e) => setFormData({...formData, ville: e.target.value})}
                          className={`w-full border rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400 ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "border-gray-200 text-gray-800"}`} 
                        />
                      </div>
                    </>
                  )}
                  
                  {isMedecin && (
                    <>
                      <div>
                        <label className="text-xs text-gray-400 mb-1 block">Numéro d'ordre</label>
                        <input 
                          value={profil.numero_ordre || ""}
                          disabled
                          className={`w-full border rounded-xl px-3 py-2 text-sm outline-none ${darkMode ? "bg-gray-700 border-gray-600 text-gray-400" : "border-gray-200 text-gray-500 bg-gray-50"}`} 
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 mb-1 block">Statut vérification</label>
                        <input 
                          value={profil.statut_verification === "verifie" ? "Vérifié" : "En attente"}
                          disabled
                          className={`w-full border rounded-xl px-3 py-2 text-sm outline-none ${darkMode ? "bg-gray-700 border-gray-600 text-gray-400" : "border-gray-200 text-gray-500 bg-gray-50"}`} 
                        />
                      </div>
                    </>
                  )}
                </div>

                {/* Données médicales clés (patient uniquement) */}
                {isPatient && (
                  <>
                    <h3 className={`text-xs font-bold uppercase mt-4 ${darkMode ? "text-blue-400" : "text-blue-600"}`}>Données médicales clés</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className={`p-3 rounded-xl border ${darkMode ? "border-gray-700 bg-gray-900/30" : "border-gray-100 bg-gray-50"}`}>
                        <label className="text-[10px] text-gray-400 uppercase block mb-1">Groupe Sanguin</label>
                        <div className="flex items-center gap-2">
                          <Heart size={14} className="text-blue-500" />
                          <span className={`text-sm font-medium ${darkMode ? "text-gray-200" : "text-gray-700"}`}>
                            {profil.groupe_sanguin || "Non renseigné"}
                          </span>
                        </div>
                      </div>
                      <div className={`p-3 rounded-xl border ${darkMode ? "border-gray-700 bg-gray-900/30" : "border-gray-100 bg-gray-50"}`}>
                        <label className="text-[10px] text-gray-400 uppercase block mb-1">Allergies</label>
                        <div className="flex items-center gap-2">
                          <AlertCircle size={14} className="text-blue-500" />
                          <span className={`text-sm font-medium ${darkMode ? "text-gray-200" : "text-gray-700"}`}>
                            {profil.allergies?.length > 0 ? `${profil.allergies.length} allergie(s)` : "Aucune"}
                          </span>
                        </div>
                      </div>
                      <div className={`p-3 rounded-xl border ${darkMode ? "border-gray-700 bg-gray-900/30" : "border-gray-100 bg-gray-50"}`}>
                        <label className="text-[10px] text-gray-400 uppercase block mb-1">Contact urgence</label>
                        <div className="flex items-center gap-2">
                          <Activity size={14} className="text-blue-500" />
                          <span className={`text-sm font-medium ${darkMode ? "text-gray-200" : "text-gray-700"}`}>
                            {profil.contact_urgence_nom || "Non renseigné"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Infos médecin */}
                {isMedecin && (
                  <>
                    <h3 className={`text-xs font-bold uppercase mt-4 ${darkMode ? "text-blue-400" : "text-blue-600"}`}>Informations professionnelles</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className={`p-3 rounded-xl border ${darkMode ? "border-gray-700 bg-gray-900/30" : "border-gray-100 bg-gray-50"}`}>
                        <label className="text-[10px] text-gray-400 uppercase block mb-1">Expérience</label>
                        <div className="flex items-center gap-2">
                          <User size={14} className="text-blue-500" />
                          <span className={`text-sm font-medium ${darkMode ? "text-gray-200" : "text-gray-700"}`}>
                            {profil.annees_experience || 0} an(s)
                          </span>
                        </div>
                      </div>
                      <div className={`p-3 rounded-xl border ${darkMode ? "border-gray-700 bg-gray-900/30" : "border-gray-100 bg-gray-50"}`}>
                        <label className="text-[10px] text-gray-400 uppercase block mb-1">Structure</label>
                        <div className="flex items-center gap-2">
                          <Activity size={14} className="text-blue-500" />
                          <span className={`text-sm font-medium ${darkMode ? "text-gray-200" : "text-gray-700"}`}>
                            {profil.structure_nom || "Non affilié"}
                          </span>
                        </div>
                      </div>
                      <div className={`p-3 rounded-xl border ${darkMode ? "border-gray-700 bg-gray-900/30" : "border-gray-100 bg-gray-50"}`}>
                        <label className="text-[10px] text-gray-400 uppercase block mb-1">Note moyenne</label>
                        <div className="flex items-center gap-2">
                          <Heart size={14} className="text-blue-500" />
                          <span className={`text-sm font-medium ${darkMode ? "text-gray-200" : "text-gray-700"}`}>
                            {profil.note_moyenne || 0}/5 ({profil.nombre_avis || 0} avis)
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {profil.specialites?.length > 0 && (
                      <div className="mt-4">
                        <label className="text-xs text-gray-400 mb-2 block">Spécialités</label>
                        <div className="flex flex-wrap gap-2">
                          {profil.specialites.map((spec) => (
                            <span key={spec.id} className={`px-3 py-1 rounded-full text-xs ${darkMode ? "bg-blue-900/30 text-blue-400" : "bg-blue-50 text-blue-600"}`}>
                              {spec.libelle}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* SECURITE */}
          {section === "Sécurité" && (
            <div className={`rounded-2xl shadow p-6 flex flex-col gap-6 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
              <h2 className={`text-sm font-bold border-b pb-3 ${darkMode ? "text-gray-200 border-gray-700" : "text-gray-700"}`}>Sécurité</h2>
              
              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Mot de passe actuel</label>
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"} 
                      value={passwordData.oldPassword}
                      onChange={(e) => setPasswordData({...passwordData, oldPassword: e.target.value})}
                      className={`w-full border rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400 ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "border-gray-200"}`} 
                    />
                    <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-2.5 text-gray-400">
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Nouveau mot de passe</label>
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"} 
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                      className={`w-full border rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400 ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "border-gray-200"}`} 
                    />
                  </div>
                </div>
                
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Confirmer le nouveau mot de passe</label>
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                    className={`w-full border rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400 ${darkMode ? "bg-gray-700 border-gray-600 text-white" : "border-gray-200"}`} 
                  />
                </div>
                
                {passwordMessage && (
                  <div className={`p-3 rounded-xl text-sm ${
                    passwordMessage.type === "success" 
                      ? "bg-green-100 text-green-700" 
                      : "bg-red-100 text-red-700"
                  }`}>
                    {passwordMessage.text}
                  </div>
                )}
                
                <button
                  onClick={handleChangePassword}
                  disabled={saving}
                  className="flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-50"
                >
                  {saving ? <Loader className="animate-spin" size={16} /> : <Save size={16} />}
                  {saving ? "Modification..." : "Modifier le mot de passe"}
                </button>
              </div>
            </div>
          )}

          {/* CONFIDENTIALITE */}
          {section === "Confidentialité" && (
            <div className="flex flex-col gap-6">
              <div className={`rounded-2xl shadow p-6 flex flex-col gap-5 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
                <h2 className={`text-sm font-bold border-b pb-3 flex items-center gap-2 ${darkMode ? "text-gray-200 border-gray-700" : "text-gray-700"}`}>
                  <Shield size={16} className="text-blue-500" /> Accès au dossier médical
                </h2>

                <div className="flex flex-col gap-4">
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