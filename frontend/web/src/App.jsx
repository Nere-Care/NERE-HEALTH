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
  const [langue, setLangue] = useState('fr');

  return (
    <BrowserRouter>
      <div className={`flex min-h-screen ${darkMode ? "bg-gray-900" : "bg-gray-50"}`}>
  
        <Sidebar darkMode={darkMode} langue={langue} />
        
        <div className="flex flex-col flex-1 lg:ml-56">
          <Header 
            darkMode={darkMode} 
            setDarkMode={setDarkMode}
            langue={langue}
            setLangue={setLangue}
          />
          <main className="flex-1 p-4 mt-14 overflow-x-hidden">
            <Routes>
              <Route path="/" element={<Annuaire />} />
              <Route path="/annuaire" element={<Annuaire />} />
              <Route path="/dossiers" element={<DossierPatient />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/aide" element={<Aide  />} />
              <Route path="/parametres" element={<Parametres />} />
              <Route path="/structures" element={<StructuresSante  />} />
            </Routes>
          </main>
        </div>

      </div>
    </BrowserRouter>
  );
}

export default App;