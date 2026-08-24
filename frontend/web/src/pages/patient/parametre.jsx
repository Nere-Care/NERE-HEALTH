import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, Lock, Eye, EyeOff, Shield, 
  LogOut, Heart, AlertCircle, Activity, 
  ChevronRight, CheckCircle2, Save, Loader,
  QrCode, KeyRound, Check
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

  // ── États pour l'activation du 2FA ──────────────────────────────────────
  const [qrCode, setQrCode] = useState(null);
  const [secretManuel, setSecretManuel] = useState(null);
  const [codeVerif, setCodeVerif] = useState("");
  const [succes2FA, setSucces2FA] = useState(false);
  const [loading2FA, setLoading2FA] = useState(false);
  const [erreur2FA, setErreur2FA] = useState(null);

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

        // Si le 2FA est déjà actif sur le compte de l'utilisateur
        if (data.totp_actif) {
          setSucces2FA(true);
        }
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

  // ── Handlers 2FA ──────────────────────────────────────────────────────────
  const lancerActivation2FA = async () => {
    try {
      setLoading2FA(true);
      setErreur2FA(null);
      const token = localStorage.getItem("token");
      const { setup2FA } = await import("../../services/authService");
      const data = await setup2FA(token);
      setQrCode(data.qr_code);
      setSecretManuel(data.secret_manuel);
    } catch (err) {
      setErreur2FA(err.message || "Impossible de générer la clé 2FA.");
    } finally {
      setLoading2FA(false);
    }
  };

  const confirmerActivation = async () => {
    try {
      setLoading2FA(true);
      setErreur2FA(null);
      const token = localStorage.getItem("token");
      const { activer2FA } = await import("../../services/authService");
      await activer2FA(token, codeVerif);
      setSucces2FA(true);
    } catch (err) {
      setErreur2FA(err.message || "Code invalide. Veuillez reessayer.");
    } finally {
      setLoading2FA(false);
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

          {/* SÉCURITÉ */}
          {section === "Sécurité" && (
            <div className="flex flex-col gap-6">
              {/* VÉRIFICATION MOT DE PASSE */}
              <div className={`rounded-2xl shadow p-6 flex flex-col gap-6 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
                <h2 className={`text-sm font-bold border-b pb-3 flex items-center gap-2 ${darkMode ? "text-gray-200 border-gray-700" : "text-gray-700"}`}>
                  <Lock size={16} /> Modification du mot de passe
                </h2>
                
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

              {/* SECTION DOUBLE AUTHENTIFICATION (2FA) */}
              <div className={`rounded-2xl shadow p-6 border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"}`}>
                <div className="flex items-center gap-2 mb-2">
                  <KeyRound className="text-blue-500" size={18} />
                  <h3 className={`font-semibold text-sm ${darkMode ? "text-gray-100" : "text-gray-800"}`}>
                    Double authentification (2FA)
                  </h3>
                </div>
                
                <p className="text-xs text-gray-500 mb-5 leading-relaxed">
                  Ajoutez une couche de sécurité supplémentaire à votre compte NÉRÉ Health en configurant une application d'authentification (Google Authenticator, Authy, etc.).
                </p>

                {erreur2FA && (
                  <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs flex items-center gap-2">
                    <AlertCircle size={14} className="flex-shrink-0" />
                    {erreur2FA}
                  </div>
                )}

                {!qrCode && !succes2FA && (
                  <button 
                    onClick={lancerActivation2FA} 
                    disabled={loading2FA}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all shadow-sm disabled:opacity-50"
                  >
                    {loading2FA ? <Loader className="animate-spin" size={16} /> : <QrCode size={16} />}
                    {loading2FA ? "Génération..." : "Activer la double authentification"}
                  </button>
                )}

                {qrCode && !succes2FA && (
                  <div className="space-y-4 max-w-md mx-auto pt-2">
                    <div className="p-4 bg-white rounded-2xl shadow-inner border border-gray-200 flex justify-center">
                      <img src={qrCode} alt="QR Code 2FA" className="w-44 h-44 object-contain" />
                    </div>

                    <p className="text-xs text-center text-gray-400">
                      Scannez le QR Code ou entrez ce code manuellement : <br />
                      <span className="font-mono text-sm font-semibold text-blue-500 tracking-wider block mt-1">{secretManuel}</span>
                    </p>

                    <input
                      type="text"
                      maxLength={6}
                      value={codeVerif}
                      onChange={(e) => {
                        setErreur2FA(null);
                        setCodeVerif(e.target.value.replace(/\D/g, ""));
                      }}
                      placeholder="Code à 6 chiffres"
                      className={`w-full text-center text-xl font-mono tracking-widest py-2.5 rounded-xl border outline-none transition-all ${
                        darkMode ? "bg-gray-700 border-gray-600 text-white focus:border-blue-500" : "border-gray-200 focus:border-blue-500"
                      }`}
                    />

                    <button 
                      onClick={confirmerActivation} 
                      disabled={codeVerif.length !== 6 || loading2FA}
                      className="w-full bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-xl text-sm font-medium transition-all shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {loading2FA ? <Loader className="animate-spin" size={16} /> : <Check size={16} />}
                      {loading2FA ? "Vérification..." : "Confirmer l'activation"}
                    </button>
                  </div>
                )}

                {succes2FA && (
                  <div className="flex items-center gap-2 text-green-600 text-sm font-medium bg-green-50 dark:bg-green-950/30 p-3.5 rounded-xl border border-green-200 dark:border-green-900/40">
                    <CheckCircle2 size={18} className="flex-shrink-0" />
                    <span>Double authentification activée avec succès sur ce compte !</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* CONFIDENTIALITÉ */}
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