import { useState } from 'react';
import { CreditCard, Smartphone, CheckCircle, Loader, AlertCircle } from 'lucide-react';

const PAYMENT_METHODS = [
  {
    id: 'mtn_momo',        // ✅ valeur exacte de l'ENUM
    label: 'MTN Mobile Money',
    icon: '📱',
    color: 'bg-yellow-500',
    type: 'mobile_money',
    placeholder: '+237 6XX XX XX XX',
  },
  {
    id: 'orange_money',    // ✅ valeur exacte de l'ENUM
    label: 'Orange Money',
    icon: '📱',
    color: 'bg-orange-500',
    type: 'mobile_money',
    placeholder: '+237 6XX XX XX XX',
  },
  {
    id: 'carte_visa',      // ✅ valeur exacte de l'ENUM
    label: 'Carte Visa',
    icon: '💳',
    color: 'bg-blue-500',
    type: 'carte',
  },
  {
    id: 'carte_mastercard', // ✅ valeur exacte de l'ENUM
    label: 'Carte Mastercard',
    icon: '💳',
    color: 'bg-red-500',
    type: 'carte',
  },
];
export default function PaymentForm({ montant, devise = 'XAF', onSubmit, darkMode }) {
  const [methode, setMethode] = useState(null);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const selectedMethod = PAYMENT_METHODS.find(m => m.id === methode);

 const handleSubmit = async () => {
  setError(null);
  
  // Validation
  if (selectedMethod?.type === 'mobile_money' && !formData.phone?.trim()) {
    setError('Veuillez saisir votre numéro de téléphone');
    return;
  }
  if (selectedMethod?.type === 'carte') {
    if (!formData.cardNumber || formData.cardNumber.replace(/\s/g, '').length < 12) {
      setError('Numéro de carte invalide');
      return;
    }
    if (!formData.cardHolder?.trim()) {
      setError('Nom du titulaire requis');
      return;
    }
    if (!formData.expiry || !/^\d{2}\/\d{2}$/.test(formData.expiry)) {
      setError("Date d'expiration invalide (MM/AA)");
      return;
    }
    if (!formData.cvv || formData.cvv.length < 3) {
      setError('CVV invalide');
      return;
    }
  }

  setLoading(true);
  try {
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await onSubmit({
      methode: selectedMethod.type,
      fournisseur: methode,  // ✅ c'est l'ID (mtn_momo, orange_money, carte_visa...) qui va dans l'ENUM
      phone_number: selectedMethod.type === 'mobile_money' ? formData.phone : null,
      card_number: selectedMethod.type === 'carte' ? formData.cardNumber : null,
      card_holder: selectedMethod.type === 'carte' ? formData.cardHolder : null,
    });
    
    setSuccess(true);
  } catch (err) {
    setError(err.message || 'Erreur de paiement');
  } finally {
    setLoading(false);
  }
};

  if (success) {
    return (
      <div className={`p-6 rounded-2xl text-center ${darkMode ? 'bg-green-900/20 border border-green-700' : 'bg-green-50 border border-green-200'}`}>
        <CheckCircle size={48} className="mx-auto text-green-500 mb-3" />
        <h3 className={`text-lg font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
          Paiement pré-autorisé !
        </h3>
        <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          Vos fonds sont sécurisés. Le débit n'aura lieu que lorsque le médecin confirmera votre rendez-vous.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Montant à payer */}
      <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-blue-50'}`}>
        <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Montant à pré-autoriser</p>
        <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
          {montant.toLocaleString()} <span className="text-sm font-normal">{devise}</span>
        </p>
        <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          💡 Aucun débit immédiat — paiement sécurisé
        </p>
      </div>

      {/* Choix de la méthode */}
      <div>
        <p className={`text-xs font-bold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          Choisir un mode de paiement
        </p>
        <div className="grid grid-cols-1 gap-2">
          {PAYMENT_METHODS.map((m) => (
            <button
              key={m.id}
              onClick={() => { setMethode(m.id); setFormData({}); setError(null); }}
              className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                methode === m.id
                  ? 'border-blue-500 bg-blue-50/10'
                  : darkMode ? 'border-gray-600 hover:border-gray-500' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className={`w-10 h-10 rounded-lg ${m.color} flex items-center justify-center text-white text-lg`}>
                {m.icon}
              </div>
              <span className={`flex-1 text-left text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                {m.label}
              </span>
              {methode === m.id && <CheckCircle size={18} className="text-blue-500" />}
            </button>
          ))}
        </div>
      </div>

      {/* Formulaire dynamique selon méthode */}
      {selectedMethod && (
        <div className={`p-4 rounded-xl border ${darkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`}>
          {selectedMethod.type === 'mobile_money' ? (
            <div>
              <label className={`text-xs font-bold mb-2 block ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Numéro de téléphone
              </label>
              <div className="relative">
                <Smartphone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="tel"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder={selectedMethod.placeholder}
                  className={`w-full pl-10 pr-3 py-2.5 rounded-lg border text-sm ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                  }`}
                />
              </div>
              <p className={`text-xs mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Vous recevrez une demande de confirmation sur votre téléphone.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className={`text-xs font-bold mb-1 block ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Numéro de carte
                </label>
                <div className="relative">
                  <CreditCard size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={formData.cardNumber || ''}
                    onChange={(e) => {
                      // Format automatique : 1234 5678 9012 3456
                      const val = e.target.value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
                      setFormData({ ...formData, cardNumber: val });
                    }}
                    placeholder="1234 5678 9012 3456"
                    maxLength={19}
                    className={`w-full pl-10 pr-3 py-2.5 rounded-lg border text-sm ${
                      darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className={`text-xs font-bold mb-1 block ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Titulaire de la carte
                </label>
                <input
                  type="text"
                  value={formData.cardHolder || ''}
                  onChange={(e) => setFormData({ ...formData, cardHolder: e.target.value.toUpperCase() })}
                  placeholder="NOM PRENOM"
                  className={`w-full px-3 py-2.5 rounded-lg border text-sm ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`text-xs font-bold mb-1 block ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Expiration
                  </label>
                  <input
                    type="text"
                    value={formData.expiry || ''}
                    onChange={(e) => {
                      let val = e.target.value.replace(/\D/g, '');
                      if (val.length >= 2) val = val.slice(0, 2) + '/' + val.slice(2, 4);
                      setFormData({ ...formData, expiry: val });
                    }}
                    placeholder="MM/AA"
                    maxLength={5}
                    className={`w-full px-3 py-2.5 rounded-lg border text-sm ${
                      darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                    }`}
                  />
                </div>
                <div>
                  <label className={`text-xs font-bold mb-1 block ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    CVV
                  </label>
                  <input
                    type="text"
                    value={formData.cvv || ''}
                    onChange={(e) => setFormData({ ...formData, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                    placeholder="123"
                    maxLength={4}
                    className={`w-full px-3 py-2.5 rounded-lg border text-sm ${
                      darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                    }`}
                  />
                </div>
              </div>

              <div className={`flex items-start gap-2 p-2 rounded-lg text-xs ${darkMode ? 'bg-blue-900/20 text-blue-300' : 'bg-blue-50 text-blue-700'}`}>
                🔒 Paiement sécurisé — vos données de carte ne sont pas stockées en clair.
              </div>
            </div>
          )}
        </div>
      )}

      {/* Erreur */}
      {error && (
        <div className={`p-3 rounded-xl flex items-center gap-2 text-sm ${darkMode ? 'bg-red-900/30 text-red-300' : 'bg-red-50 text-red-600'}`}>
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Bouton confirmer */}
      <button
        onClick={handleSubmit}
        disabled={!methode || loading}
        className="w-full py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader className="animate-spin" size={16} />
            Traitement en cours...
          </>
        ) : (
          <>
            <CheckCircle size={16} />
            Pré-autoriser {montant.toLocaleString()} {devise}
          </>
        )}
      </button>
    </div>
  );
}