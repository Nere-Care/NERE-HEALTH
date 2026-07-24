export const doctorSpecialities = [
  "Généraliste",
  "Cardiologue",
  "Dermatologue",
  "Pédiatre",
  "Gynécologue",
  "Neurologue",
  "Dentiste",
  "Orthopédiste",
  "Ophtalmologue",
];

export const nurseSpecialities = [
  "Infirmier général",
  "Infirmier pédiatrique",
  "Infirmier en soins intensifs",
  "Infirmier chirurgical",
  "Infirmier communautaire",
  "Sage-femme",
  "Infirmier d'urgence",
  "Infirmier anesthésiste",
  "Infirmier de bloc opératoire",
  "Infirmier psychiatrique",
  "Infirmier en santé publique",
  "Infirmier en gériatrie",
];

export const cities = ["Douala", "Yaoundé", "Bafoussam", "Bamenda", "Garoua", "Maroua"];

export const districtsByCity = {
  Douala: [
    "Bonamoussadi",
    "Akwa",
    "Deido",
    "Makepe",
    "Logpom",
    "Bali",
    "Bonapriso",
    "Bonanjo",
    "Bessengue",
    "Ndogbong",
    "Kotto",
    "Bepanda",
    "Cité Verte",
    "Nyalla",
    "Yassa",
  ],
  "Yaoundé": [
    "Mvan",
    "Mendong",
    "Biyem-Assi",
    "Ngoa-Ekellé",
    "Mfoundi",
    "Tsinga",
    "Emana",
    "Nkolbisson",
    "Etoudi",
    "Bastos",
    "Elig-Edzoa",
    "Mvog-Mbi",
    "Mokolo",
    "Briqueterie",
    "Nsimeyong",
  ],
  Bafoussam: [
    "Banengo",
    "Djeleng",
    "Tamdja",
    "Famla",
    "Kong",
    "Ndiengdam",
  ],
  Bamenda: [
    "Nkwen",
    "Mankon",
    "Mbeng",
    "Azire",
    "Mulang",
    "Upstation",
    "Bayelle",
  ],
  Garoua: [
    "Roumdé",
    "Yelwa",
    "Djamboutou",
    "Pitoa",
    "Langui",
  ],
  Maroua: [
    "Dougoui",
    "Djarengol",
    "Zokok",
    "Domayo",
    "Hardé",
  ],
};

export function getDistrictsForCity(city) {
  return districtsByCity[city] || [];
}

export const hospitals = [
  "Centre Médical Néré",
  "Hôpital Laquintinie",
  "Hôpital Général de Douala",
  "Hôpital Général de Yaoundé",
  "CHU Yaoundé",
  "Clinique Bonassama",
];

export const FORMES = [
  "comprimes", "gelules", "sirop", "injectable",
  "creme", "pommade", "gouttes", "suppositoire",
  "patch", "inhalateur", "autre",
];

export const MOMENTS_PRISE = [
  { value: "matin", label: "Matin", labelSentence: "le matin" },
  { value: "midi", label: "Midi", labelSentence: "le midi" },
  { value: "soir", label: "Soir", labelSentence: "le soir" },
  { value: "coucher", label: "Coucher", labelSentence: "le coucher" },
  { value: "personnalise", label: "Personnalisé...", labelSentence: "" },
];

export const UNITES_MEDICAMENT = [
  { value: "comprime", label: "comprimé(s)", singular: "comprimé", plural: "comprimés" },
  { value: "gelule", label: "gélule(s)", singular: "gélule", plural: "gélules" },
  { value: "ml", label: "ml", singular: "ml", plural: "ml" },
  { value: "goutte", label: "goutte(s)", singular: "goutte", plural: "gouttes" },
  { value: "sachet", label: "sachet(s)", singular: "sachet", plural: "sachets" },
  { value: "mg", label: "mg", singular: "mg", plural: "mg" },
  { value: "autre", label: "autre", singular: "", plural: "" },
];

export const CONDITIONS_REPAS = [
  { value: "avant_repas", label: "Avant le repas", icon: "⏰" },
  { value: "apres_repas", label: "Après le repas", icon: "🍽️" },
  { value: "a_jeun", label: "À jeun", icon: "⏭️" },
  { value: "sans_lien", label: "Sans lien", icon: "➖" },
];

export const DOC_TYPES = [
  { value: "resultat_labo", label: "Résultats d'analyse biologique" },
  { value: "imagerie_radio", label: "Radiographie" },
  { value: "imagerie_echographie", label: "Échographie" },
  { value: "imagerie_scanner", label: "Scanner" },
  { value: "imagerie_irm", label: "IRM" },
  { value: "mammographie", label: "Mammographie" },
  { value: "ordonnance_scannee", label: "Ordonnance de médicaments" },
  { value: "ordonnance_biologie", label: "Ordonnance de biologie" },
  { value: "ordonnance_imagerie", label: "Ordonnance d'imagerie" },
  { value: "compte_rendu_consultation", label: "Compte rendu de consultation" },
  { value: "certificat_medical", label: "Certificat médical" },
  { value: "carnet_vaccination", label: "Carnet de vaccination" },
  { value: "autre", label: "Autre" },
];

export const TYPE_COLORS = {
  resultat_labo: "bg-purple-100 text-purple-600",
  imagerie_radio: "bg-blue-100 text-blue-600",
  imagerie_echographie: "bg-cyan-100 text-cyan-600",
  imagerie_scanner: "bg-indigo-100 text-indigo-600",
  imagerie_irm: "bg-violet-100 text-violet-600",
  mammographie: "bg-pink-100 text-pink-600",
  ordonnance_scannee: "bg-green-100 text-green-600",
  ordonnance_biologie: "bg-emerald-100 text-emerald-600",
  ordonnance_imagerie: "bg-teal-100 text-teal-600",
  compte_rendu_consultation: "bg-amber-100 text-amber-600",
  certificat_medical: "bg-red-100 text-red-600",
  carnet_vaccination: "bg-teal-100 text-teal-600",
  autre: "bg-gray-100 text-gray-600",
};

export const TYPES_IMAGERIE = [
  { value: "imagerie_scanner", label: "Scanner (TDM)" },
  { value: "imagerie_radio", label: "Radiographie" },
  { value: "mammographie", label: "Mammographie" },
  { value: "imagerie_echographie", label: "Échographie" },
  { value: "imagerie_irm", label: "IRM" },
];

export const ZONES_ANATOMIQUES = [
  "Tête",
  "Encéphale / Cerveau",
  "Orbite",
  "Région temporomandibulaire (ATM)",
  "Cou / Région cervicale",
  "Thyroïde",
  "Thorax / Poitrine",
  "Poumons",
  "Cœur",
  "Seins (bilatéral)",
  "Sein droit",
  "Sein gauche",
  "Abdomen",
  "Foie",
  "Rein / Voies urinaires",
  "Bassin / Bassin osseux",
  "Vessie",
  "Colonne vertébrale (cervicale)",
  "Colonne vertébrale (thoracique)",
  "Colonne vertébrale (lombaire)",
  "Thoracolumbaire",
  "Membre supérieur droit",
  "Membre supérieur gauche",
  "Hanche droite",
  "Hanche gauche",
  "Genou droit",
  "Genou gauche",
  "Membre inférieur droit",
  "Membre inférieur gauche",
  "Pied droit",
  "Pied gauche",
  "Squelette complet",
];