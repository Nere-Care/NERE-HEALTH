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

// Components Structure
import SidebarStructure from './components/structure/SidebarStructure';
import HeaderStructure from './components/structure/HeaderStructure';

// Pages Patient
import Dashboard from './pages/dashboard';
import Annuaire from './pages/Annuaire';
import DossierPatient from './pages/dossierpatient';
import Messages from './pages/messages';
import Notifications from './pages/notifications';
import Aide from './pages/Aides';
import Parametres from './pages/parametre';
import StructuresSante from './pages/structuressante';

// Pages Structure
import DashboardStructure from './pages/structure/DashboardStructure';

function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [role] = useState("structure");

  // ── INTERFACE PATIENT ──
  if (role === "patient") {
    return (
      <BrowserRouter>
        <div className={`flex min-h-screen ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
          <Sidebar darkMode={darkMode} />
          <div className="flex flex-col flex-1 lg:ml-56">
            <Header darkMode={darkMode} setDarkMode={setDarkMode} />
            <main className="flex-1 p-4 mt-14 overflow-x-hidden">
              <Routes>
                <Route path="/" element={<Dashboard darkMode={darkMode} />} />
                <Route path="/annuaire" element={<Annuaire darkMode={darkMode} />} />
                <Route path="/dossiers" element={<DossierPatient darkMode={darkMode} />} />
                <Route path="/messages" element={<Messages darkMode={darkMode} />} />
                <Route path="/notifications" element={<Notifications darkMode={darkMode} />} />
                <Route path="/aide" element={<Aide darkMode={darkMode} />} />
                <Route path="/parametres" element={<Parametres darkMode={darkMode} />} />
                <Route path="/structures" element={<StructuresSante darkMode={darkMode} />} />
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
        <SidebarStructure 
          darkMode={darkMode} 
          nomStructure="Hôpital Général" 
          typeStructure="Hôpital" 
        />

        <div className="flex flex-col flex-1 lg:ml-56">
          <HeaderStructure darkMode={darkMode} setDarkMode={setDarkMode} />

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