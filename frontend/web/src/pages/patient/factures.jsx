import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Eye, CreditCard, CheckCircle, Clock, XCircle, X, Loader, Smartphone, CalendarDays, User } from 'lucide-react';
import { get, post } from '../../services/apiClient';
import { getUserTimezone } from '../../utils/timezone';
import { toXAF, formatXAF } from '../../utils/currency';
import { validatePhone, phoneError } from '../../utils/validatePhone';

const StatutBadge = ({ statut, size = 10 }) => {
  const s = (statut || '').toLowerCase();
  const isPaid = s === 'paye' || s === 'payé' || s === 'paye_partiel' || s === 'valide_manuellement';
  const isPending = s === 'en_attente_validation' || s === 'paye_en_attente_validation';
  const isUnpaid = s === 'en_attente' || s === 'en_attente_paiement';
  return (
    <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full font-semibold w-fit
      ${isPaid ? "bg-green-100 text-green-600"
        : isPending ? "bg-orange-100 text-orange-500"
        : isUnpaid ? "bg-yellow-100 text-yellow-600"
        : "bg-red-100 text-red-500"}`}>
      {isPaid ? <CheckCircle size={size} /> : isPending ? <Clock size={size} /> : isUnpaid ? <CreditCard size={size} /> : <XCircle size={size} />}
      {statut}
    </span>
  );
};

const STATUT_MAP = {
  paye: 'Payé', payé: 'Payé', paye_partiel: 'Partiel', valide_manuellement: 'Payé',
  en_attente: 'En attente', en_attente_paiement: 'En attente de paiement',
  paye_en_attente_validation: 'En attente de validation',
  annule: 'Annulé', annulé: 'Annulé', echoue: 'Échoué',
  rembourse: 'Remboursé', remboursé: 'Remboursé',
};

function formatStatut(s) { return STATUT_MAP[s?.toLowerCase()] || s || '-'; }

const dessinerFacture = (doc, autoTable, reference, date, methode, montantXAF, statut, patientNom, startY) => {
  doc.setDrawColor(59, 130, 246);
  doc.setLineWidth(0.5);
  doc.line(20, startY, 190, startY);
  doc.setFontSize(14);
  doc.setTextColor(59, 130, 246);
  doc.text(`Facture ${reference}`, 20, startY + 12);
  doc.setFontSize(10);
  doc.setTextColor(120, 120, 120);
  doc.text(`Date : ${date || '-'}`, 20, startY + 22);
  doc.text(`Patient : ${patientNom || '-'}`, 20, startY + 30);
  autoTable(doc, {
    startY: startY + 36,
    head: [["Champ", "Détail"]],
    body: [
      ["Méthode", methode || '-'],
      ["Montant", `${Number(montantXAF).toLocaleString()} XAF`],
      ["Statut", formatStatut(statut)],
    ],
    theme: "grid",
    headStyles: { fillColor: [59, 130, 246], textColor: 255, fontStyle: "bold", fontSize: 10 },
    styles: { fontSize: 10, cellPadding: 4 },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 55 } },
    margin: { left: 20, right: 20 },
  });
  return doc.lastAutoTable.finalY + 20;
};

const telechargerFacture = async (entry, patientNom) => {
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');
  const doc = new jsPDF();
  doc.setFontSize(22);
  doc.setTextColor(59, 130, 246);
  doc.text("Néré Health", 20, 20);
  doc.setFontSize(10);
  doc.setTextColor(120, 120, 120);
  doc.text("Plateforme de santé numérique", 20, 28);
  doc.setDrawColor(59, 130, 246);
  doc.setLineWidth(0.8);
  doc.line(20, 33, 190, 33);
  const dateStr = entry.created_at ? new Date(entry.created_at).toLocaleDateString('fr-FR', { timeZone: getUserTimezone() }) : '-';
  dessinerFacture(doc, autoTable, entry.reference, dateStr, entry.methode, toXAF(entry.montant, entry.devise), entry.statut, patientNom, 40);
  doc.setFontSize(9);
  doc.setTextColor(150);
  doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR', { timeZone: getUserTimezone() })} — Néré Health`, 20, 285);
  doc.save(`facture-${entry.reference || entry.id}.pdf`);
};

const telechargerToutes = async (entries, patientNom) => {
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');
  const doc = new jsPDF();
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFontSize(26);
  doc.setTextColor(59, 130, 246);
  doc.text("Néré Health", 20, 30);
  doc.setFontSize(13);
  doc.setTextColor(80, 80, 80);
  doc.text("Récapitulatif complet de vos factures", 20, 42);
  doc.setDrawColor(59, 130, 246);
  doc.setLineWidth(0.8);
  doc.line(20, 48, 190, 48);
  doc.setFontSize(11);
  doc.setTextColor(50, 50, 50);
  doc.text(`Patient : ${patientNom || '-'}`, 20, 60);
  doc.text(`Nombre de factures : ${entries.length}`, 20, 72);
  const total = entries.reduce((acc, e) => acc + toXAF(e.montant, e.devise), 0);
  doc.text(`Total : ${formatXAF(total)}`, 20, 84);
  doc.text(`Date d'export : ${new Date().toLocaleDateString('fr-FR', { timeZone: getUserTimezone() })}`, 20, 96);
  entries.forEach((e) => {
    doc.addPage();
    doc.setFontSize(16);
    doc.setTextColor(59, 130, 246);
    doc.text("Néré Health", 20, 18);
    doc.setFontSize(9);
    doc.setTextColor(150);
    doc.text("Plateforme de santé numérique", 20, 25);
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(20, 29, 190, 29);
    const dateStr = e.created_at ? new Date(e.created_at).toLocaleDateString('fr-FR', { timeZone: getUserTimezone() }) : '-';
    dessinerFacture(doc, autoTable, e.reference, dateStr, e.methode, toXAF(e.montant, e.devise), e.statut, patientNom, 36);
    doc.setFontSize(8);
    doc.setTextColor(180);
    doc.text(`Néré Health — ${new Date().toLocaleDateString('fr-FR', { timeZone: getUserTimezone() })}`, 20, pageHeight - 10);
  });
  doc.save("toutes-mes-factures.pdf");
};

export default function Factures({ darkMode }) {
  const navigate = useNavigate();
  const [paiements, setPaiements] = useState([]);
  const [rdvsAttentePaiement, setRdvsAttentePaiement] = useState([]);
  const [medecinsMap, setMedecinsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [filtre, setFiltre] = useState("Tous");
  const [detailEntry, setDetailEntry] = useState(null);

  const [showPaiementModal, setShowPaiementModal] = useState(false);
  const [rdvPayer, setRdvPayer] = useState(null);
  const [methodePaiement, setMethodePaiement] = useState("");
  const [telephonePaiement, setTelephonePaiement] = useState("");
  const [paiementEnCours, setPaiementEnCours] = useState(false);
  const [paiementReussi, setPaiementReussi] = useState(false);
  const [paiementErreur, setPaiementErreur] = useState(null);
  const [rdvsMap, setRdvsMap] = useState({});
  const [patientNom, setPatientNom] = useState('');

  useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    Promise.all([
      get('/api/paiements', { limit: 200 }),
      get('/api/rendez_vous', { statut: 'en_attente_paiement', limit: 200 }),
      get('/api/rendez_vous', { statut: 'en_attente', limit: 200 }),
    ]).then(([paiementsData, rdvs1, rdvs2]) => {
      setPaiements(paiementsData || []);
      const rdvs = [...(rdvs1 || []), ...(rdvs2 || [])];
      const seen = new Set();
      const uniqueRdvs = rdvs.filter(r => {
        if (seen.has(r.id)) return false;
        seen.add(r.id);
        return true;
      });
      setRdvsAttentePaiement(uniqueRdvs);

      const allRdvIds = [...new Set([
        ...uniqueRdvs.map(r => r.id),
        ...(paiementsData || []).map(p => p.rdv_id).filter(Boolean),
      ])];
      const rdvPromises = allRdvIds.map(rid =>
        get(`/api/rendez_vous/${rid}`).then(r => [rid, r]).catch(() => [rid, null])
      );
      const medecinIds = [...new Set([
        ...uniqueRdvs.map(r => r.medecin_id),
        ...(paiementsData || []).map(p => p.medecin_id),
      ])];
      const userPromises = medecinIds.map(mid =>
        get(`/api/users/${mid}`).then(u => [mid, `${u.prenom || ''} ${u.nom || ''}`.trim() || 'Médecin']).catch(() => [mid, 'Médecin'])
      );

      const patientPromise = currentUser?.id
        ? get(`/api/patients/${currentUser.id}`).then(p => `${p.prenom || ''} ${p.nom || ''}`.trim() || 'Patient').catch(() => 'Patient')
        : Promise.resolve('Patient');

      Promise.all([...rdvPromises, ...userPromises, patientPromise]).then(results => {
        const rMap = {};
        const mMap = {};
        let nom = 'Patient';
        for (const item of results) {
          if (Array.isArray(item)) {
            const [id, data] = item;
            if (typeof id === 'string' && data && typeof data === 'object' && data.date_heure_debut) {
              rMap[id] = data;
            } else if (typeof id === 'string' && typeof data === 'string') {
              mMap[id] = data;
            }
          } else if (typeof item === 'string') {
            nom = item;
          }
        }
        setRdvsMap(rMap);
        setMedecinsMap(mMap);
        setPatientNom(nom);
      });
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const openPaiement = (entry) => {
    setRdvPayer(entry);
    setShowPaiementModal(true);
    setMethodePaiement("");
    setTelephonePaiement("");
    setPaiementReussi(false);
    setPaiementErreur(null);
  };

  const rdvsAvecNom = rdvsAttentePaiement.map(r => ({
    id: r.id,
    reference: r.numero_rdv || r.id?.slice(0, 8),
    created_at: r.created_at,
    montant: r.montant,
    devise: r.devise || 'XAF',
    methode: null,
    statut: r.statut,
    medecin_id: r.medecin_id,
    motif_consultation: r.motif_consultation,
    date_heure_debut: r.date_heure_debut,
    date_heure_fin: r.date_heure_fin,
    _type: 'rdv',
    _rdv: r,
  }));

  const allEntries = [
    ...paiements.map(p => {
      const rdvData = p.rdv_id ? (rdvsMap[p.rdv_id] || {}) : {};
      return {
        ...p,
        _type: 'paiement',
        montant: p.montant_total,
        date_heure_debut: rdvData.date_heure_debut || null,
        date_heure_fin: rdvData.date_heure_fin || null,
        motif_consultation: rdvData.motif_consultation || null,
      };
    }),
    ...rdvsAvecNom,
  ];

  const filtres = [
    { label: "Tous", val: "Tous" },
    { label: "Payé", val: "Payé" },
    { label: "En attente de paiement", val: "En attente de paiement" },
    { label: "En attente de validation", val: "En attente de validation" },
    { label: "Échoué", val: "Échoué" },
  ];

  const entriesFiltrees = filtre === "Tous"
    ? allEntries
    : allEntries.filter(e => formatStatut(e.statut) === filtre);

  const totalPaye = allEntries.filter(e => /paye|payé|valide_manuellement/.test((e.statut || '').toLowerCase())).reduce((acc, e) => acc + toXAF(e.montant, e.devise), 0);
  const enAttenteValidation = allEntries.filter(e => (e.statut || '').toLowerCase() === 'paye_en_attente_validation').reduce((acc, e) => acc + toXAF(e.montant, e.devise), 0);
  const enAttentePaiement = allEntries.filter(e => (e.statut || '').toLowerCase() === 'en_attente_paiement' || (e.statut || '').toLowerCase() === 'en_attente').reduce((acc, e) => acc + toXAF(e.montant, e.devise), 0);

  const handlePayer = async () => {
    if (!methodePaiement || !rdvPayer) return;
    if ((methodePaiement === "mtn_momo" || methodePaiement === "orange_money") && telephonePaiement && !validatePhone(telephonePaiement)) {
      setPaiementErreur(phoneError());
      return;
    }
    setPaiementEnCours(true);
    setPaiementErreur(null);
    try {
      const rdvId = rdvPayer._type === 'rdv' ? rdvPayer._rdv.id : rdvPayer.rdv_id;
      await post(`/api/paiements/initier?rdv_id=${rdvId}`, {
        methode: methodePaiement,
        telephone: telephonePaiement || null,
      });
      setPaiementReussi(true);
      setTimeout(() => {
        setShowPaiementModal(false);
        setPaiementReussi(false);
        setRdvPayer(null);
        setMethodePaiement("");
        setTelephonePaiement("");
        if (rdvPayer._type === 'rdv') {
          setRdvsAttentePaiement(prev => prev.filter(r => r.id !== rdvPayer._rdv.id));
        }
        setPaiements(prev => prev.map(p => p.rdv_id === rdvId ? { ...p, statut: 'en_attente_validation' } : p));
      }, 2500);
    } catch (err) {
      setPaiementErreur(err?.message || "Erreur lors du paiement");
    } finally {
      setPaiementEnCours(false);
    }
  };

  const detailIsRdv = detailEntry?._type === 'rdv';
  const detailMedecinNom = detailEntry ? (medecinsMap[detailEntry.medecin_id] || 'Médecin') : '';
  const detailRdvDate = (detailEntry?.date_heure_debut)
    ? new Date(detailEntry.date_heure_debut).toLocaleDateString('fr-FR', { timeZone: getUserTimezone(), weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    : null;
  const detailRdvHeure = (detailEntry?.date_heure_debut)
    ? new Date(detailEntry.date_heure_debut).toLocaleTimeString('fr-FR', { timeZone: getUserTimezone(), hour: '2-digit', minute: '2-digit' })
    : null;
  const detailRdvFin = (detailEntry?.date_heure_fin)
    ? new Date(detailEntry.date_heure_fin).toLocaleTimeString('fr-FR', { timeZone: getUserTimezone(), hour: '2-digit', minute: '2-digit' })
    : null;

  const methodeLabel = (m) => {
    const map = { mtn_momo: 'MTN MoMo', orange_money: 'Orange Money', carte_visa: 'Visa', carte_mastercard: 'Mastercard', virement_bancaire: 'Virement', notchpay: 'NotchPay', stripe: 'Stripe', portefeuille_nere: 'Portefeuille Néré' };
    return map[m] || m || '-';
  };

  const formatPaymentInfo = (e) => {
    if (!e || e._type === 'rdv') return null;
    const m = (e.methode || '').toLowerCase();
    if ((m === 'mtn_momo' || m === 'orange_money') && e.telephone_paiement) {
      return { label: 'Tél. Mobile Money', value: e.telephone_paiement };
    }
    if ((m === 'carte_visa' || m === 'carte_mastercard') && e.derniers_4_chiffres) {
      return { label: 'Carte', value: `**** ${e.derniers_4_chiffres}` };
    }
    return null;
  };

  const detailPaymentInfo = detailEntry ? formatPaymentInfo(detailEntry) : null;

  if (loading) {
    return (
      <div className={`p-4 md:p-6 min-h-screen flex items-center justify-center ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
        <Loader className="animate-spin text-blue-500" size={32} />
      </div>
    );
  }

  const renderActions = (e) => {
    const isFailed = (e.statut || '').toLowerCase() === 'echoue';
    const isRdv = e._type === 'rdv';

    return (
      <div className="flex gap-2">
        <button onClick={() => setDetailEntry(e)}
          title="Voir les détails"
          className={`p-1.5 rounded-lg transition-all ${darkMode ? "bg-gray-600 hover:bg-gray-500 text-gray-300" : "bg-gray-100 hover:bg-gray-200 text-gray-600"}`}>
          <Eye size={14} />
        </button>
        {isRdv && (
          <button onClick={() => openPaiement(e)}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-all">
            Payer
          </button>
        )}
        {!isRdv && isFailed && (
          <button onClick={() => openPaiement(e)}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-all">
            Payer
          </button>
        )}
        {!isRdv && !isFailed && (
          <button onClick={() => telechargerFacture(e, patientNom)}
            className={`p-1.5 rounded-lg transition-all ${darkMode ? "bg-blue-900 hover:bg-blue-800 text-blue-400" : "bg-blue-50 hover:bg-blue-100 text-blue-500"}`}>
            <Download size={14} />
          </button>
        )}
      </div>
    );
  };

  const renderMobileActions = (e) => {
    const isFailed = (e.statut || '').toLowerCase() === 'echoue';
    const isRdv = e._type === 'rdv';

    return (
      <div className="flex gap-2">
        <button onClick={() => setDetailEntry(e)}
          title="Voir les détails"
          className={`p-2 rounded-xl ${darkMode ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-600"}`}>
          <Eye size={15} />
        </button>
        {isRdv && (
          <button onClick={() => openPaiement(e)}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-all">
            Payer
          </button>
        )}
        {!isRdv && isFailed && (
          <button onClick={() => openPaiement(e)}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-all">
            Payer
          </button>
        )}
        {!isRdv && !isFailed && (
          <button onClick={() => telechargerFacture(e, patientNom)}
            className={`p-2 rounded-xl ${darkMode ? "bg-blue-900 text-blue-400" : "bg-blue-50 text-blue-500"}`}>
            <Download size={15} />
          </button>
        )}
      </div>
    );
  };

  return (
    <div className={`p-4 md:p-6 min-h-screen ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-blue-500">Mes Factures</h1>
          <p className={`text-sm mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Historique de vos paiements</p>
        </div>
        {allEntries.length > 0 && (
          <button onClick={() => telechargerToutes(allEntries, patientNom)}
            className="flex items-center gap-2 px-3 md:px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-all shadow">
            <Download size={16} />
            <span className="hidden sm:inline">Tout télécharger</span>
            <span className="sm:hidden">Exporter</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total payé", value: formatXAF(totalPaye), icon: CheckCircle, color: "bg-green-100 text-green-500" },
          { label: "En attente validation", value: formatXAF(enAttenteValidation), icon: Clock, color: "bg-orange-100 text-orange-500" },
          { label: "À payer", value: formatXAF(enAttentePaiement), icon: CreditCard, color: "bg-yellow-100 text-yellow-500" },
          { label: "Factures", value: allEntries.length, icon: CreditCard, color: "bg-blue-100 text-blue-500" },
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className={`rounded-2xl shadow p-3 md:p-4 flex flex-col md:flex-row items-center md:items-start gap-2 md:gap-4 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
              <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${stat.color}`}><Icon size={20} /></div>
              <div className="text-center md:text-left">
                <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{stat.label}</p>
                <p className={`text-sm md:text-lg font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex gap-2 flex-wrap mb-4">
        {filtres.map((f) => (
          <button key={f.val} onClick={() => setFiltre(f.val)}
            className={`px-3 md:px-4 py-1.5 rounded-full text-xs md:text-sm font-medium transition-all ${filtre === f.val ? "bg-blue-600 text-white" : darkMode ? "bg-gray-800 text-gray-300 border border-gray-600" : "bg-white text-gray-600 border border-gray-200"}`}>
            {f.label}
          </button>
        ))}
      </div>

      {entriesFiltrees.length === 0 ? (
        <p className={`text-center py-10 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Aucune facture trouvée.</p>
      ) : (
        <>
          <div className="flex flex-col gap-3 md:hidden">
            {entriesFiltrees.map((e) => {
              const montantXAF = toXAF(e.montant, e.devise);
              return (
                <div key={e.id} className={`rounded-2xl shadow p-4 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-sm font-bold text-blue-500">{e.reference}</p>
                      <p className={`text-xs mt-0.5 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                        {e.created_at ? new Date(e.created_at).toLocaleDateString('fr-FR', { timeZone: getUserTimezone() }) : '-'}
                      </p>
                    </div>
                    <StatutBadge statut={formatStatut(e.statut)} />
                  </div>
                  <p className={`text-xs mb-3 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                    {e._type === 'rdv' ? medecinsMap[e.medecin_id] || 'Médecin' : e.methode || '-'}
                  </p>
                  <div className="flex items-center justify-between">
                    <p className={`text-base font-bold ${darkMode ? "text-white" : "text-gray-800"}`}>
                      {formatXAF(montantXAF)}
                    </p>
                    {renderMobileActions(e)}
                  </div>
                </div>
              );
            })}
          </div>

          <div className={`hidden md:block rounded-2xl shadow overflow-hidden ${darkMode ? "bg-gray-800" : "bg-white"}`}>
            <table className="w-full text-sm">
              <thead className={darkMode ? "bg-gray-700" : "bg-gray-50"}>
                <tr>
                  {["Référence", "Date", "Méthode", "Montant", "Statut", "Actions"].map(h => (
                    <th key={h} className={`text-left px-5 py-3 text-xs font-semibold ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {entriesFiltrees.map((e) => {
                  const montantXAF = toXAF(e.montant, e.devise);
                  return (
                    <tr key={e.id} className={`border-t transition-all ${darkMode ? "border-gray-700 hover:bg-gray-700" : "border-gray-50 hover:bg-gray-50"}`}>
                      <td className="px-5 py-4 font-medium text-blue-500">{e.reference}</td>
                      <td className={`px-5 py-4 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                        {e.created_at ? new Date(e.created_at).toLocaleDateString('fr-FR', { timeZone: getUserTimezone() }) : '-'}
                      </td>
                      <td className={`px-5 py-4 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                        {e._type === 'rdv' ? medecinsMap[e.medecin_id] || 'Médecin' : e.methode || '-'}
                      </td>
                      <td className={`px-5 py-4 font-semibold ${darkMode ? "text-white" : "text-gray-800"}`}>
                        {formatXAF(montantXAF)}
                      </td>
                      <td className="px-5 py-4"><StatutBadge statut={formatStatut(e.statut)} /></td>
                      <td className="px-5 py-4">
                        {renderActions(e)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {detailEntry && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-md rounded-3xl shadow-2xl p-6 ${darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-800"}`}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-blue-500">{detailEntry.reference}</h2>
                <p className={`text-xs mt-0.5 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  {detailEntry.created_at ? new Date(detailEntry.created_at).toLocaleDateString('fr-FR', { timeZone: getUserTimezone() }) : '-'}
                </p>
              </div>
              <button onClick={() => setDetailEntry(null)}
                className={`p-2 rounded-xl ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}><X size={18} /></button>
            </div>

            <div className={`rounded-2xl p-4 flex flex-col gap-3 mb-6 ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
              {detailRdvDate && (
                <div className="flex justify-between items-center">
                  <span className={`text-sm flex items-center gap-2 ${darkMode ? "text-gray-400" : "text-gray-500"}`}><CalendarDays size={14} /> Date</span>
                  <span className="text-sm font-semibold text-right">{detailRdvDate}</span>
                </div>
              )}
              {detailRdvHeure && (
                <div className="flex justify-between items-center">
                  <span className={`text-sm flex items-center gap-2 ${darkMode ? "text-gray-400" : "text-gray-500"}`}><Clock size={14} /> Heure</span>
                  <span className="text-sm font-semibold">{detailRdvHeure}{detailRdvFin ? ` - ${detailRdvFin}` : ''}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className={`text-sm flex items-center gap-2 ${darkMode ? "text-gray-400" : "text-gray-500"}`}><User size={14} /> Médecin</span>
                <span className="text-sm font-semibold">{detailMedecinNom}</span>
              </div>
              {detailEntry.motif_consultation && (
                <div className="flex justify-between items-center">
                  <span className={`text-sm flex items-center gap-2 ${darkMode ? "text-gray-400" : "text-gray-500"}`}><CreditCard size={14} /> Motif</span>
                  <span className="text-sm font-semibold text-right max-w-[60%]">{detailEntry.motif_consultation}</span>
                </div>
              )}
              {!detailIsRdv && detailEntry.methode && (
                <div className="flex justify-between items-center">
                  <span className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Méthode</span>
                  <span className="text-sm font-semibold">{methodeLabel(detailEntry.methode)}</span>
                </div>
              )}
              {detailPaymentInfo && (
                <div className="flex justify-between items-center">
                  <span className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{detailPaymentInfo.label}</span>
                  <span className="text-sm font-semibold">{detailPaymentInfo.value}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t">
                <span className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Montant</span>
                <span className="text-xl font-bold text-green-500">{formatXAF(toXAF(detailEntry.montant, detailEntry.devise))}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Statut</span>
                <StatutBadge statut={formatStatut(detailEntry.statut)} size={11} />
              </div>
            </div>

            <div className="flex gap-3">
              {detailIsRdv ? (
                <button onClick={() => { setDetailEntry(null); openPaiement(detailEntry); }}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-sm font-semibold">
                  <CreditCard size={15} /> Payer
                </button>
              ) : (detailEntry.statut || '').toLowerCase() === 'echoue' ? (
                <button onClick={() => { setDetailEntry(null); openPaiement(detailEntry); }}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-sm font-semibold">
                  <CreditCard size={15} /> Réessayer le paiement
                </button>
              ) : (
                <button onClick={() => { telechargerFacture(detailEntry, patientNom); setDetailEntry(null); }}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-sm font-semibold">
                  <Download size={15} /> Télécharger
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showPaiementModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden ${darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"}`}>
            <div className="h-1.5 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500" />
            <div className="flex items-center justify-between p-5 border-b dark:border-gray-700">
              <div>
                <h2 className="text-lg font-bold">Paiement du rendez-vous</h2>
                <p className="text-sm text-gray-400 mt-0.5">{rdvPayer ? formatXAF(toXAF(rdvPayer.montant, rdvPayer.devise)) : ''}</p>
              </div>
              {!paiementReussi && (
                <button onClick={() => { setShowPaiementModal(false); setRdvPayer(null); setMethodePaiement(""); setTelephonePaiement(""); }}
                  className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition">
                  <X size={18} />
                </button>
              )}
            </div>

            {paiementReussi ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle size={32} className="text-green-500" />
                </div>
                <p className="font-bold text-lg">Paiement effectué !</p>
                <p className="text-sm text-gray-400 mt-1">Votre paiement est en cours de vérification par l'administrateur.</p>
                <p className="text-xs text-gray-500 mt-3">Vous serez notifié une fois le rendez-vous confirmé.</p>
              </div>
            ) : (
              <div className="p-5 space-y-4">
                <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                  Choisissez votre mode de paiement :
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setMethodePaiement("mtn_momo")}
                    className={`p-4 rounded-xl border-2 transition flex flex-col items-center gap-2 ${methodePaiement === "mtn_momo"
                      ? "border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20"
                      : darkMode ? "border-gray-600 hover:border-gray-500" : "border-gray-200 hover:border-gray-300"
                      }`}>
                    <Smartphone size={24} className="text-yellow-500" />
                    <span className="text-xs font-semibold">MTN MoMo</span>
                  </button>
                  <button onClick={() => setMethodePaiement("orange_money")}
                    className={`p-4 rounded-xl border-2 transition flex flex-col items-center gap-2 ${methodePaiement === "orange_money"
                      ? "border-orange-400 bg-orange-50 dark:bg-orange-900/20"
                      : darkMode ? "border-gray-600 hover:border-gray-500" : "border-gray-200 hover:border-gray-300"
                      }`}>
                    <Smartphone size={24} className="text-orange-500" />
                    <span className="text-xs font-semibold">Orange Money</span>
                  </button>
                  <button onClick={() => setMethodePaiement("carte_visa")}
                    className={`p-4 rounded-xl border-2 transition flex flex-col items-center gap-2 ${methodePaiement === "carte_visa"
                      ? "border-blue-400 bg-blue-50 dark:bg-blue-900/20"
                      : darkMode ? "border-gray-600 hover:border-gray-500" : "border-gray-200 hover:border-gray-300"
                      }`}>
                    <CreditCard size={24} className="text-blue-500" />
                    <span className="text-xs font-semibold">Visa</span>
                  </button>
                  <button onClick={() => setMethodePaiement("carte_mastercard")}
                    className={`p-4 rounded-xl border-2 transition flex flex-col items-center gap-2 ${methodePaiement === "carte_mastercard"
                      ? "border-red-400 bg-red-50 dark:bg-red-900/20"
                      : darkMode ? "border-gray-600 hover:border-gray-500" : "border-gray-200 hover:border-gray-300"
                      }`}>
                    <CreditCard size={24} className="text-red-500" />
                    <span className="text-xs font-semibold">Mastercard</span>
                  </button>
                </div>

                {(methodePaiement === "mtn_momo" || methodePaiement === "orange_money") && (
                  <div>
                    <label className="text-xs font-medium text-gray-400">Numéro de téléphone</label>
                    <input type="tel" value={telephonePaiement} onChange={e => setTelephonePaiement(e.target.value)}
                      placeholder="6XX XXX XXX" maxLength={9} pattern="6[0-9]{8}"
                      className={`w-full mt-1 p-3 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-green-500 transition ${darkMode ? "bg-gray-700 border-gray-600" : "border-gray-300"
                        }`} />
                  </div>
                )}

                {paiementErreur && (
                  <p className="text-xs text-red-500 text-center">{paiementErreur}</p>
                )}

                <button onClick={handlePayer}
                  disabled={!methodePaiement || paiementEnCours || ((methodePaiement === "mtn_momo" || methodePaiement === "orange_money") && !telephonePaiement)}
                  className={`w-full py-3 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2 ${!methodePaiement || paiementEnCours
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 shadow-lg"
                    }`}>
                  {paiementEnCours ? (
                    <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> Paiement en cours...</>
                  ) : (
                    <>Payer {rdvPayer ? formatXAF(toXAF(rdvPayer.montant, rdvPayer.devise)) : ''}</>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
