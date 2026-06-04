import { useLocation, useNavigate } from 'react-router-dom';
import { CreditCard, Smartphone, ArrowLeft } from 'lucide-react';

import { useState } from 'react';

export default function Paiement({ darkMode }) {
  const location = useLocation();
  const navigate = useNavigate();

  const facture = location.state?.facture;

  const [methode, setMethode] = useState('Mobile Money');
  const [paiementReussi, setPaiementReussi] = useState(false);
  

  if (!facture) {
    return (
      <div className="p-6">
        <p>Aucune facture sélectionnée.</p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-4 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>

      {/* Retour */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 mb-6 text-blue-500"
      >
        <ArrowLeft size={18} />
        Retour
      </button>

      {/* Carte principale */}
      <div className={`max-w-2xl mx-auto rounded-3xl shadow-lg p-6
        ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>

        {/* Titre */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-blue-500">
            Paiement de facture
          </h1>
          <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
            Finalisez votre paiement en toute sécurité
          </p>
        </div>

        {/* Infos facture */}
        <div className={`rounded-2xl p-4 mb-6
          ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>

          <div className="flex justify-between mb-3">
            <span className="text-gray-500">Facture</span>
            <span className="font-semibold">{facture.id}</span>
          </div>

          <div className="flex justify-between mb-3">
            <span className="text-gray-500">Médecin</span>
            <span className="font-semibold">{facture.medecin}</span>
          </div>

          <div className="flex justify-between mb-3">
            <span className="text-gray-500">Service</span>
            <span className="font-semibold">{facture.acte}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-500">Montant</span>
            <span className="text-xl font-bold text-green-500">
              {facture.montant.toLocaleString()} FCFA
            </span>
          </div>
        </div>

        {/* Méthodes de paiement */}
        <h2 className="font-semibold mb-4">
          Choisissez un moyen de paiement
        </h2>

        <div className="grid gap-4 mb-6">

          {/* Mobile Money */}
          <button
            onClick={() => setMethode('Mobile Money')}
            className={`border rounded-2xl p-4 flex items-center justify-between transition-all
              ${methode === 'Mobile Money'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200'}`}
          >
            <div className="flex items-center gap-3">
              <Smartphone className="text-orange-500" />
              <div className="text-left">
                <p className="font-semibold">Mobile Money</p>
                <p className="text-sm text-gray-500">
                  MTN MoMo / Orange Money
                </p>
              </div>
            </div>

            <input
              type="radio"
              checked={methode === 'Mobile Money'}
              readOnly
            />
          </button>

          {/* Carte bancaire */}
          <button
            onClick={() => setMethode('Carte Bancaire')}
            className={`border rounded-2xl p-4 flex items-center justify-between transition-all
              ${methode === 'Carte Bancaire'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200'}`}
          >
            <div className="flex items-center gap-3">
              <CreditCard className="text-blue-500" />
              <div className="text-left">
                <p className="font-semibold">Carte Bancaire</p>
                <p className="text-sm text-gray-500">
                  Visa / Mastercard
                </p>
              </div>
            </div>

            <input
              type="radio"
              checked={methode === 'Carte Bancaire'}
              readOnly
            />
          </button>

        </div>

        {/* Bouton paiement */}
        <button
             onClick={() => setPaiementReussi(true)}
            className="w-full py-3 rounded-2xl bg-green-500 hover:bg-green-600 text-white font-semibold transition-all"
             >
            Confirmer le paiement
        </button>

      </div>

      {/* Modal succès paiement */}
        {paiementReussi && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">

    <div className={`w-full max-w-md rounded-3xl p-6 shadow-2xl
      ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}`}>

      {/* Icône */}
      <div className="flex justify-center mb-4">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
          <span className="text-4xl text-green-500">✓</span>
        </div>
      </div>

      {/* Texte */}
      <h2 className="text-2xl font-bold text-center mb-2">
        Paiement réussi
      </h2>

      <p className="text-center text-gray-500 mb-6">
        Votre facture a été payée avec succès.
      </p>

      {/* Infos */}
      <div className={`rounded-2xl p-4 mb-6
        ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>

        <div className="flex justify-between mb-2">
          <span>Facture</span>
          <span className="font-semibold">{facture.id}</span>
        </div>

        <div className="flex justify-between mb-2">
          <span>Montant</span>
          <span className="font-bold text-green-500">
            {facture.montant.toLocaleString()} FCFA
          </span>
        </div>

        <div className="flex justify-between">
          <span>Méthode</span>
          <span>{methode}</span>
        </div>
      </div>

      {/* Boutons */}
      <div className="grid grid-cols-2 gap-3">

        {/* Voir reçu */}
        <button
          className="py-3 rounded-2xl bg-blue-500 hover:bg-blue-600 text-white font-semibold"
        >
          Voir le reçu
        </button>

        {/* Imprimer */}
        <button
          onClick={() => window.print()}
          className="py-3 rounded-2xl border border-gray-300 hover:bg-gray-100 text-gray-700 font-semibold"
        >
          Imprimer
        </button>

      </div>

      {/* Fermer */}
      <button
        onClick={() => navigate('/factures')}
        className="w-full mt-4 py-3 rounded-2xl bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold"
      >
        Retour aux factures
      </button>

    </div>
  </div>
)}
    </div>
  );
}