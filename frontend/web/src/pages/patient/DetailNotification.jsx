import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Bell, Loader, CheckCircle, XCircle, Shield, CalendarClock } from "lucide-react";
import { get, put, post } from "../../services/apiClient";
import { getUserTimezone } from "../../utils/timezone";

const ICON_MAP = {
  rdv: 'bg-blue-100 text-blue-500', examen: 'bg-green-100 text-green-500',
  paiement: 'bg-purple-100 text-purple-500', message: 'bg-orange-100 text-orange-500',
  ordonnance: 'bg-red-100 text-red-500',
};

const TYPE_LABELS = {
  rappel_rdv: "Rappel de rendez-vous",
  confirmation_rdv: "Confirmation de rendez-vous",
  annulation_rdv: "Annulation de rendez-vous",
  confirmation_paiement: "Confirmation de paiement",
  echec_paiement: "Échec de paiement",
  remboursement: "Remboursement",
  nouveau_message: "Nouveau message",
  resultat_labo_disponible: "Résultat de laboratoire disponible",
  ordonnance_prete: "Ordonnance prête",
  alerte_systeme: "Alerte système",
  compte_valide: "Compte validé",
  compte_rejete: "Compte rejeté",
  nouveaux_avis: "Nouvel avis",
  document_ajoute: "Document ajouté",
  rappel_prise_medicament: "Rappel de prise de médicament",
  reponse_ticket: "Réponse au ticket",
  demande_reprogrammation: "Demande de reprogrammation",
};

export default function DetailNotification({ darkMode }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const [notif, setNotif] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accessAction, setAccessAction] = useState(null);
  const [accessLoading, setAccessLoading] = useState(false);
  const [rescheduleAction, setRescheduleAction] = useState(null);
  const [rescheduleLoading, setRescheduleLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    get(`/api/notifications/${id}`)
      .then(data => {
        setNotif(data);
        if (data && data.statut !== 'lu' && data.type !== 'demande_reprogrammation') {
          put(`/api/notifications/${id}/lu`).catch(() => {});
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const isDemandeAcces = notif?.donnees_supplementaires?.type === "demande_acces_dossier";
  const isDemandeReprogrammation = notif?.type === "demande_reprogrammation";
  const isReprogrammationDejaTraitee = isDemandeReprogrammation && notif?.statut === "lu" && !rescheduleAction;

  const handleAcceptAccess = async () => {
    const dossierId = notif.donnees_supplementaires?.dossier_id;
    const medecinId = notif.donnees_supplementaires?.medecin_id;
    if (!dossierId || !medecinId) return;

    setAccessLoading(true);
    try {
      await post(`/api/dossiers_medicaux/${dossierId}/accept-access?medecin_id=${medecinId}`, {});
      setAccessAction("accepted");
    } catch (e) {
      console.error(e);
    } finally {
      setAccessLoading(false);
    }
  };

  const handleDeclineAccess = async () => {
    setAccessAction("declined");
  };

  const handleAcceptReschedule = async () => {
    const rdvId = notif.donnees_supplementaires?.rendez_vous_id || notif.reference_externe;
    if (!rdvId) return;
    setRescheduleLoading(true);
    try {
      await post(`/api/rendez_vous/${rdvId}/accept-reschedule`, {});
      setRescheduleAction("accepted");
    } catch (e) {
      console.error(e);
    } finally {
      setRescheduleLoading(false);
    }
  };

  const handleDeclineReschedule = async () => {
    const rdvId = notif.donnees_supplementaires?.rendez_vous_id || notif.reference_externe;
    if (!rdvId) return;
    setRescheduleLoading(true);
    try {
      await post(`/api/rendez_vous/${rdvId}/reject-reschedule`, {});
      setRescheduleAction("declined");
    } catch (e) {
      console.error(e);
    } finally {
      setRescheduleLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader className="animate-spin text-blue-500" size={32} />
      </div>
    );
  }

  if (!notif) {
    return <div className={`p-6 ${darkMode ? "text-white" : ""}`}>Notification introuvable</div>;
  }

  const couleur = isDemandeAcces ? 'bg-yellow-100 text-yellow-500' : (ICON_MAP[notif.type] || ICON_MAP.message);
  const typeLabel = isDemandeAcces ? "Demande d'accès" : (TYPE_LABELS[notif.type] || notif.type || 'Notification');

  return (
    <div className={`${darkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-800"}`}>
      <button onClick={() => navigate(-1)}
        className={`flex items-center gap-2 mb-6 text-sm font-medium transition-all ${darkMode ? "text-gray-300 hover:text-white" : "text-gray-600 hover:text-blue-500"}`}>
        <ArrowLeft size={18} /> Retour
      </button>

      <div className={`rounded-3xl shadow-lg p-6 min-w-0 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
        <div className="flex items-start gap-4 mb-6">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${couleur}`}>
            {isDemandeAcces ? <Shield size={26} /> : <Bell size={26} />}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{typeLabel}</h1>
            <p className="text-sm text-gray-400 mt-1">
              {notif.created_at ? new Date(notif.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: getUserTimezone() }) : ''}
            </p>
          </div>
        </div>

        <div className={`rounded-2xl p-5 ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
          <div className="flex items-center gap-2 mb-3">
            {isDemandeAcces ? <Shield size={18} className="text-yellow-500" /> : <Bell size={18} className="text-blue-500" />}
            <p className="font-semibold">Détails de la notification</p>
          </div>
          <p className={`leading-relaxed text-sm whitespace-pre-wrap ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
            {notif.contenu || 'Aucun contenu'}
          </p>
        </div>

        {isDemandeAcces && (
          <div className={`mt-5 rounded-2xl p-5 ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
            {accessAction === "accepted" ? (
              <div className="flex flex-col items-center py-4 gap-3">
                <CheckCircle className="w-12 h-12 text-green-500" />
                <p className="text-sm font-semibold text-green-600">Accès autorisé</p>
                <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  Le Dr. {notif.donnees_supplementaires?.medecin_nom?.replace(/^Dr\.\s*/, '')} peut désormais accéder à votre dossier médical.
                </p>
                <button
                  onClick={() => navigate("/parametres#confidentialites")}
                  className="mt-2 text-xs text-blue-500 font-medium underline"
                >
                  Voir mes paramètres de confidentialité
                </button>
              </div>
            ) : accessAction === "declined" ? (
              <div className="flex flex-col items-center py-4 gap-3">
                <XCircle className="w-12 h-12 text-red-400" />
                <p className="text-sm font-semibold text-red-500">Accès refusé</p>
                <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  Le médecin n'a pas été autorisé à accéder à votre dossier.
                </p>
              </div>
            ) : (
              <>
                <p className={`text-sm font-medium mb-4 ${darkMode ? "text-gray-200" : "text-gray-700"}`}>
                  Souhaitez-vous autoriser ce médecin à accéder à votre dossier médical ?
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={handleAcceptAccess}
                    disabled={accessLoading}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium bg-green-600 text-white hover:bg-green-700 transition disabled:opacity-50"
                  >
                    {accessLoading ? <Loader className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    Oui, autoriser
                  </button>
                  <button
                    onClick={handleDeclineAccess}
                    disabled={accessLoading}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium bg-red-100 text-red-600 hover:bg-red-200 transition disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" />
                    Non, refuser
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {isDemandeReprogrammation && notif.donnees_supplementaires && (
          <div className={`mt-5 rounded-2xl p-5 ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
            {rescheduleAction === "accepted" ? (
              <div className="flex flex-col items-center py-4 gap-3">
                <CheckCircle className="w-12 h-12 text-green-500" />
                <p className="text-sm font-semibold text-green-600">Reprogrammation acceptée</p>
                <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  Le rendez-vous a été déplacé. Consultez vos rendez-vous pour les détails.
                </p>
              </div>
            ) : rescheduleAction === "declined" ? (
              <div className="flex flex-col items-center py-4 gap-3">
                <XCircle className="w-12 h-12 text-red-400" />
                <p className="text-sm font-semibold text-red-500">Reprogrammation refusée</p>
                <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  Le rendez-vous reste à sa date initiale.
                </p>
              </div>
            ) : isReprogrammationDejaTraitee ? (
              <div className="flex flex-col items-center py-4 gap-3">
                <CheckCircle className="w-12 h-12 text-gray-400" />
                <p className="text-sm font-semibold text-gray-500">Demande déjà traitée</p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-3">
                  <CalendarClock size={18} className="text-blue-500" />
                  <p className={`text-sm font-semibold ${darkMode ? "text-gray-200" : "text-gray-700"}`}>
                    Nouveau créneau proposé
                  </p>
                </div>
                {notif.donnees_supplementaires.ancienne_date && (
                  <p className={`text-xs mb-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                    Date actuelle : {new Date(notif.donnees_supplementaires.ancienne_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} à {new Date(notif.donnees_supplementaires.ancienne_date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}
                {notif.donnees_supplementaires.nouvelle_date_debut && (
                  <p className={`text-xs mb-4 font-medium ${darkMode ? "text-blue-400" : "text-blue-600"}`}>
                    Nouvelle date : {new Date(notif.donnees_supplementaires.nouvelle_date_debut).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} à {new Date(notif.donnees_supplementaires.nouvelle_date_debut).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}
                <div className="flex gap-3">
                  <button
                    onClick={handleAcceptReschedule}
                    disabled={rescheduleLoading}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium bg-green-600 text-white hover:bg-green-700 transition disabled:opacity-50"
                  >
                    {rescheduleLoading ? <Loader className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    Accepter
                  </button>
                  <button
                    onClick={handleDeclineReschedule}
                    disabled={rescheduleLoading}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium bg-red-100 text-red-600 hover:bg-red-200 transition disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" />
                    Refuser
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        <div className="mt-5 flex flex-wrap justify-end gap-2">
          {notif.type === 'nouveaux_avis' && notif.reference_externe && (
            <button
              onClick={() => navigate(`/medecin/${notif.reference_externe}`)}
              className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-medium rounded-xl transition-all"
            >
              Donner mon avis
            </button>
          )}
          {notif.type === 'reponse_ticket' && (
            <button
              onClick={() => navigate('/mes-tickets')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-all"
            >
              Voir le ticket
            </button>
          )}
          <span className={`text-xs px-3 py-1 rounded-full ${darkMode ? "bg-gray-700 text-gray-300" : "bg-blue-50 text-blue-500"}`}>
            {notif.statut === 'lu' ? 'Lue' : 'Non lue'}
          </span>
        </div>
      </div>
    </div>
  );
}
