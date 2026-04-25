import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/sidebar';
import Header from './components/header';
import Annuaire from './pages/Annuaire';
import DossierPatient from './pages/dossierpatient';
import Messages from './pages/messages';
import Notifications from './pages/notifications';
import Aide from './pages/Aides';
import Parametres from './pages/parametre';
import StructuresSante from './pages/structuressante';

function App() {
  const [darkMode, setDarkMode] = useState(false);

  return (
    <BrowserRouter>
      <div style={{ display: "flex", minHeight: "100vh" }}
        className={darkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-800"}>
        
        <Sidebar darkMode={darkMode} />
        
        <div style={{ marginLeft: "224px", flex: 1, display: "flex", flexDirection: "column" }}>
          <Header darkMode={darkMode} setDarkMode={setDarkMode} />
          <main style={{ flex: 1, padding: "16px", marginTop: "56px" }}>
            <Routes>
              <Route path="/" element={<Annuaire />} />
              <Route path="/annuaire" element={<Annuaire />} />
              <Route path="/dossiers" element={<DossierPatient />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/aide" element={<Aide />} />
              <Route path="/parametres" element={<Parametres />} />
              <Route path="/structures" element={<StructuresSante />} />
            </Routes>
          </main>
        </div>

      </div>
    </BrowserRouter>
  );
}

export default App;