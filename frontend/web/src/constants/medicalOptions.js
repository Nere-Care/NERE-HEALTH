

// Villes principales du Cameroun avec leurs districts/quartiers
export const citiesWithDistricts = {
  "Yaoundé": [
    "Bastos", "Obili", "Ngousso", "Mvog-Bi", "Essos", "Nkol-Eton",
    "Nkol-Bisson", "Omnisport", "Mimboman", "Mokolo", "Nlongkak",
    "Ekounou", "Nkol-Messeng", "Biyem-Assi", "Emana", "Cite-Verte",
    "Tsinga", "Mvan", "Mendong", "Nkol-Ewouk", "Efoulan"
  ],
  "Douala": [
    "Akwa", "Bonanjo", "Bonapriso", "Deïdo", "New-Bell", "Nkongmondo",
    "Bassa", "Logbaba", "Bonabéri", "Makepe", "Pk-14", "Pk-9",
    "Logpom", "Ndogbong", "Bonamoussadi", "Bali", "Ndog-Passi",
    "Yassa", "Bonamati", "Kotto"
  ],
  "Bafoussam": [
    "Centre", "Tamdja", "Kamkop", "Famla", "Bamilike", "Djeleng",
    "Kong-Ni", "Baleng", "Bamougoum", "Fotetsa"
  ],
  "Bamenda": [
    "Town", "Mankon", "Nkwen", "Up Station", "Down Station",
    "Bambili", "Mile 14", "Nkwen-Ndop", "Nkwen-Bambui", "Tubah"
  ],
  "Garoua": [
    "Centre", "Yelwa", "Djamboutou", "Bamvoung", "Ngang",
    "Pitoa", "Lagdo", "Dourla", "Bibemi"
  ],
  "Maroua": [
    "Centre", "Domayo", "Kongola", "Palar", "Dougoi",
    "Doumpsey", "Angoual-Djire", "Zokok", "Bogo"
  ],
  "Ngaoundéré": [
    "Centre", "Djidda", "Mayel-Rey", "Bini", "Dang",
    "Baladji", "Babouri-Figuil"
  ],
  "Bertoua": [
    "Centre", "Mandjou", "Mansoa", "Mokolo", "Belabo",
    "Ndelele", "Gari-Gombo"
  ],
  "Ebolowa": [
    "Centre", "Nko'ovos", "Biwala", "Akoeman", "Nko'ovos-I",
    "Nko'ovos-II", "Angal"
  ],
  "Kribi": [
    "Centre", "Gare-Routiere", "Mvengue", "Bibossi", "Petit-Batanga",
    "Grand-Batanga", "Lolabé", "Campo"
  ],
  "Limbe": [
    "Centre", "Mile 2", "Mile 4", "Mile 6", "Down Beach",
    "Muyuka", "Bota", "Idenau"
  ],
  "Buea": [
    "Town", "Great Soppo", "Small Soppo", "Molyko", "Bokwango",
    "Bonduma", "Mile 16", "Buea-Town"
  ],
  "Nkongsamba": [
    "Centre", "Quartier-Nord", "Quartier-Sud", "Melong",
    "Loum", "Manjo", "Bare"
  ],
  "Kumba": [
    "Centre", "Fiango", "Kosala", "Mbonge", "Konye",
    "Limbé", "Nguti"
  ],
  "Edéa": [
    "Centre", "Log-Pouma", "Mouanko", "Nyanon", "Pouma",
    "Dizangué"
  ],
  "Ngaoundal": [
    "Centre", "Martap", "Nibong", "Nditam", "Bankim"
  ]
};

// Liste des villes (pour le SelectInput)
export const cities = Object.keys(citiesWithDistricts);

// Fonction pour récupérer les districts d'une ville
export const getDistrictsByCity = (city) => {
  return citiesWithDistricts[city] || [];
};

// Garder les anciennes listes pour compatibilité (médecins/infirmières)
export const doctorSpecialities = [
  "Cardiologie", "Dermatologie", "Gastro-entérologie", "Gynécologie",
  "Neurologie", "Ophtalmologie", "Pédiatrie", "Psychiatrie",
  "Pneumologie", "Urologie", "Chirurgie générale", "Médecine générale",
  "Orthopédie", "ORL", "Radiologie", "Anesthésiologie"
];

export const nurseSpecialities = [
  "Soins infirmiers généraux", "Puériculture", "Bloc opératoire",
  "Urgences", "Santé maternelle", "Santé communautaire",
  "Soins intensifs", "Gériatrie"
];

export const districts = Object.values(citiesWithDistricts).flat();

export const hospitals = [
  "Laquintinie Hospital",
  "Douala General Hospital",
  "CMC Bonassama",
  "District Hospital Akwa",
];