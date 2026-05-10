import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AideStructure from './pages/structure/AideStructure';
import ParametresStructure from './pages/structure/ParametresStructure';
import ProfilStructure from './pages/structure/profilStructure';
import DemandesStructure from './pages/structure/DemandesStructure'; 
import PersonnelStructure from './pages/structure/PersonnelStructure';


// Components Patient
import Sidebar from './components/sidebar';
import Header from './components/header';



// Pages Patient
import Dashboard from './pages/patient/dashboard';
import Annuaire from './pages/patient/Annuaire';
import ProfilMedecin from './pages/patient/profilMedecin';
import DossierPatient from './pages/patient/dossierpatient';
import Prescriptions from './pages/patient/Prescriptions';
import Factures from './pages/patient/factures';
import Messages from './pages/patient/messages';
import Notifications from './pages/patient/notifications';
import Aide from './pages/patient/Aides';
import Parametres from './pages/patient/parametre';
import StructuresSante from './pages/patient/structuressante';
import DashboardStructure from './pages/structure/DashboardStructure';

function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [role] = useState("patient");

  // ── INTERFACE PATIENT ──
  if (role === "patient") {
    return (
      <BrowserRouter>
        <div className={`flex min-h-screen ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
          <Sidebar darkMode={darkMode}  role={role} nomStructure="Hopital general" typeStructure="Hopital" />
          <div className="flex flex-col flex-1 lg:ml-56">
            <Header darkMode={darkMode} setDarkMode={setDarkMode} />
            <main className="flex-1 p-4 mt-14 overflow-x-hidden">
              <Routes>
                <Route path="/dashboard" element={<Dashboard darkMode={darkMode} />} />
                <Route path="/annuaire" element={<Annuaire darkMode={darkMode} />} />
                <Route path="/medecin/:id" element={<ProfilMedecin darkMode={darkMode} />} />
                <Route path="/dossiers" element={<DossierPatient darkMode={darkMode} />} />
                <Route path="/prescriptions" element={<Prescriptions darkMode={darkMode} />} />
                <Route path="/factures" element={<Factures darkMode={darkMode} />} />
                <Route path="/messages" element={<Messages darkMode={darkMode} />} />
                <Route path="/notifications" element={<Notifications darkMode={darkMode} />} />
                <Route path="/aide" element={<Aide darkMode={darkMode} />} />
                <Route path="/parametres" element={<Parametres darkMode={darkMode} />} />
                <Route path="/structures" element={<StructuresSante darkMode={darkMode} />} />
                <Route path="/profilStructure/:id" element={<ProfilStructure darkMode={darkMode} />} />

              </Routes>
            </main>
          </div>
        </div>
      </BrowserRouter>
    );
  }

  // ── INTERFACE STRUCTURE ──
  return (
    <BrowserRouter>
      <div className={`flex min-h-screen ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
       <Sidebar 
          darkMode={darkMode} 
          role={role} 
          nomStructure="Hôpital Général" 
         typeStructure="Hôpital" 
       />

        <div className="flex flex-col flex-1 lg:ml-56">
          <Header darkMode={darkMode} setDarkMode={setDarkMode} />
          <main className="flex-1 p-4 mt-14 overflow-x-hidden">
            <Routes>
              <Route path="/structure" element={<DashboardStructure darkMode={darkMode} />} />
              <Route path="/structure/aide" element={<AideStructure darkMode={darkMode} />} />
              <Route path="/structure/parametres" element={<ParametresStructure darkMode={darkMode} />} />
              <Route path="/structure/profil" element={<ProfilStructure darkMode={darkMode} />} />
             <Route path="/structure/personnel" element={<PersonnelStructure darkMode={darkMode} />} /> 
             <Route path="/structure/demandes" element={<DemandesStructure darkMode={darkMode} />} />

            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;