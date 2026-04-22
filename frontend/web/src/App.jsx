import Sidebar from './components/sidebar';
import Header from './components/header';
import DossierPatient from './pages/dossierpatient';

function App() {
  return (
    <div className="flex-1 p-4 mt-14 bg-gray-50" style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <div style={{ marginLeft: "224px", flex: 1, display: "flex", flexDirection: "column" }}>
        <Header titre="Dossiers Patients" />
        <main style={{ flex: 1, padding: "16px", backgroundColor: "#f9fafb", marginTop: "5px" }}>
          <DossierPatient />
        </main>
      </div>
    </div>
  );
}

export default App;