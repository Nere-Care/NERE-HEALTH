import { createContext, useContext, useState } from 'react';

const translations = {
  fr: {
    // Sidebar
    tableauDeBord: "Tableau de Bord",
    annuaireMedecins: "Annuaire Medecins",
    structuresSante: "Structures de Sante",
    messages: "Messages",
    notifications: "Notifications",
    dossiersPatient: "Ma Santé",
    teleconsultation: "Teleconsultation",
    parametres: "Parametres",
    aide: "Aide",
    nereIA: "Nere IA",

    // Commun
    rechercher: "Rechercher...",
    patient: "Patient",
    consulter: "Consulter",
    filter: "Filtrer",
    voirTout: "Voir tout",
    ajouter: "Ajouter",

    // Dashboard
    bienvenue: "Bienvenue, Mle Agine 👋",
    bienvenueDesc: "Voici un aperçu de votre santé et vos prochains rendez-vous.",
    rdvAvenir: "Rendez-vous à venir",
    consultationsMois: "Consultations ce mois",
    messagesNonLus: "Messages non lus",
    prescriptionsActives: "Prescriptions actives",
    prochainRdv: "Prochain : 10 Jan",
    depuisDernierMois: "+12% depuis le mois dernier",
    de2Medecins: "De 2 médecins",
    aRenouveler: "2 à renouveler",
    aVenir: "À VENIR",
    teleconsultation2: "Téléconsultation",
    rejoindre: "Rejoindre",
    reporter: "Reporter",
    explorerSpec: "Explorer les spécialités",
    consultationsRecentes: "Consultations récentes",
    resumeSante: "Résumé santé",
    majIlYA: "Mis à jour il y a 2 jours",
    medecinsPop: "Médecins populaires",
    explorer: "Explorer",
    tension: "Tension",
    rythmeCardiaque: "Rythme cardiaque",
    glycemie: "Glycémie",
    poids: "Poids",
    normal: "Normal",
    faible: "Faible",
    eleve: "Élevé",
    medecin: "Médecin",
    type: "Type",
    date: "Date",
    statut: "Statut",
    action: "Action",
    voir: "Voir",
    termine: "Terminé",
    annule: "Annulé",

    // Annuaire
    annuaireTitre: "Annuaire Medecins",

    // Dossier Patient
    dossierTitre: "Ma Santé",
    infoPerso: "Informations personnelles",
    docsMedicaux: "Documents Medicaux",
    prescriptions: "Prescriptions",
    examens: "Examens",
    coordonnees: "Coordonnées",
    telephone: "Téléphone",
    email: "Email",
    adresse: "Adresse",
    infosMedicales: "Informations médicales",
    groupeSanguin: "Groupe sanguin",
    taille: "Taille",
    dateNaissance: "Date de naissance",
    age: "Âge",
    sexe: "Sexe",
    situationFamiliale: "Situation familiale",
    profession: "Profession",
    nationalite: "Nationalité",
    actif: "Actif",
    ajouterDocument: "+ Ajouter un document",
    telecharger: "Télécharger",
    details: "Détails",
    renouveler: "Renouveler",
    ajouterExamen: "+ Ajouter un examen",
    voirResultat: "Voir résultat",
    dosage: "Dosage",
    duree: "Durée",

    // Notifications
    nonLues: "Non lues",
    total: "Total",
    aujourdhui: "Aujourd'hui",
    toutesNotifs: "Toutes les notifications",
    toutMarquer: "Tout marquer comme lu",

    // Messages
    ecrireMessage: "Écrire un message...",

    // Structures
    hopitaux: "Hopitaux",
    cliniques: "Cliniques",
    pharmacies: "Pharmacies",
    laboratoires: "Laboratoires",
    contacter: "Contacter",
    ouvert: "Ouvert",
    ferme: "Fermé",

    // Aide
    aideTitre: "Centre d'Aide",
    commentAider: "Comment pouvons-nous vous aider ?",
    rechercherQuestion: "Rechercher une question...",
    guideUtilisateur: "Guide utilisateur",
    tutoriels: "Tutoriels vidéo",
    faq: "FAQ complète",
    questionsFrequentes: "Questions fréquentes",
    contacterSupport: "Contacter le support",
    chatDirect: "Chat en direct",
    disponible: "Disponible 24/7",

    // Parametres
    profil: "Profil",
    securite: "Sécurité",
    confidentialite: "Confidentialité",
    langue: "Langue",
    sauvegarder: "Sauvegarder",
    mettreAJour: "Mettre à jour",
    changerPhoto: "Changer la photo",
  },

  en: {
    // Sidebar
    tableauDeBord: "Dashboard",
    annuaireMedecins: "Doctor Directory",
    structuresSante: "Health Structures",
    messages: "Messages",
    notifications: "Notifications",
    dossiersPatient: "My Health",
    teleconsultation: "Teleconsultation",
    parametres: "Settings",
    aide: "Help",
    nereIA: "Nere AI",

    // Commun
    rechercher: "Search...",
    patient: "Patient",
    consulter: "Consult",
    filter: "Filter",
    voirTout: "View all",
    ajouter: "Add",

    // Dashboard
    bienvenue: "Welcome back, Mle Agine 👋",
    bienvenueDesc: "Here's an overview of your health and upcoming appointments.",
    rdvAvenir: "Upcoming Appointments",
    consultationsMois: "Consultations This Month",
    messagesNonLus: "Unread Messages",
    prescriptionsActives: "Active Prescriptions",
    prochainRdv: "Next: Jan 10",
    depuisDernierMois: "+12% from last month",
    de2Medecins: "From 2 doctors",
    aRenouveler: "2 need refill",
    aVenir: "UPCOMING",
    teleconsultation2: "Video Consultation",
    rejoindre: "Join Call",
    reporter: "Reschedule",
    explorerSpec: "Explore Departments",
    consultationsRecentes: "Recent Consultations",
    resumeSante: "Health Summary",
    majIlYA: "Last update: 2 days ago",
    medecinsPop: "Popular Doctors",
    explorer: "Explore more",
    tension: "Blood Pressure",
    rythmeCardiaque: "Heart Rate",
    glycemie: "Blood Sugar",
    poids: "Weight",
    normal: "Normal",
    faible: "Low",
    eleve: "High",
    medecin: "Doctor",
    type: "Type",
    date: "Date",
    statut: "Status",
    action: "Action",
    voir: "View",
    termine: "Completed",
    annule: "Cancelled",

    // Annuaire
    annuaireTitre: "Doctor Directory",

    // Dossier Patient
    dossierTitre: "My Health",
    infoPerso: "Personal Information",
    docsMedicaux: "Medical Documents",
    prescriptions: "Prescriptions",
    examens: "Examinations",
    coordonnees: "Contact Details",
    telephone: "Phone",
    email: "Email",
    adresse: "Address",
    infosMedicales: "Medical Information",
    groupeSanguin: "Blood Type",
    taille: "Height",
    dateNaissance: "Date of Birth",
    age: "Age",
    sexe: "Gender",
    situationFamiliale: "Marital Status",
    profession: "Profession",
    nationalite: "Nationality",
    actif: "Active",
    ajouterDocument: "+ Add Document",
    telecharger: "Download",
    details: "Details",
    renouveler: "Renew",
    ajouterExamen: "+ Add Examination",
    voirResultat: "View Result",
    dosage: "Dosage",
    duree: "Duration",

    // Notifications
    nonLues: "Unread",
    total: "Total",
    aujourdhui: "Today",
    toutesNotifs: "All notifications",
    toutMarquer: "Mark all as read",

    // Messages
    ecrireMessage: "Write a message...",

    // Structures
    hopitaux: "Hospitals",
    cliniques: "Clinics",
    pharmacies: "Pharmacies",
    laboratoires: "Laboratories",
    contacter: "Contact",
    ouvert: "Open",
    ferme: "Closed",

    // Aide
    aideTitre: "Help Center",
    commentAider: "How can we help you?",
    rechercherQuestion: "Search for a question...",
    guideUtilisateur: "User Guide",
    tutoriels: "Video Tutorials",
    faq: "Full FAQ",
    questionsFrequentes: "Frequently Asked Questions",
    contacterSupport: "Contact Support",
    chatDirect: "Live Chat",
    disponible: "Available 24/7",

    // Parametres
    profil: "Profile",
    securite: "Security",
    confidentialite: "Privacy",
    langue: "Language",
    sauvegarder: "Save",
    mettreAJour: "Update",
    changerPhoto: "Change Photo",
  }
};

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [langue, setLangue] = useState('fr');
  const t = translations[langue];
  return (
    <LanguageContext.Provider value={{ langue, setLangue, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}