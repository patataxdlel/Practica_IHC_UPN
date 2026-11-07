import { useState } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import type { Usuario } from './api/apiService';

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [altoContraste, setAltoContraste] = useState(false);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [rolActivo, setRolActivo] = useState<'PACIENTE' | 'CUIDADOR' | 'MEDICO'>('PACIENTE');
  const [mensajeAudible, setMensajeAudible] = useState('');

  const hablarText = (texto: string) => {
    setMensajeAudible(texto);
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(texto);
      utterance.lang = 'es-PE';
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className={`min-h-screen font-sans ${altoContraste ? 'bg-black text-yellow-300' : 'bg-gray-50 text-gray-900'}`}>
      <Navbar
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        altoContraste={altoContraste}
        onToggleContraste={() => {
          setAltoContraste(!altoContraste);
          hablarText(altoContraste ? 'Modo normal activado' : 'Alto contraste activado');
        }}
        usuario={usuario}
        onLogout={() => { setUsuario(null); hablarText('Sesión cerrada'); }}
        mensajeAudible={mensajeAudible}
      />

      {!usuario ? (
        <AuthPage
          onLoginSuccess={(u) => setUsuario(u)}
          altoContraste={altoContraste}
          hablarText={hablarText}
        />
      ) : (
        <div className="flex min-h-[calc(100vh-65px)]">
          <Sidebar
            isOpen={sidebarOpen}
            rolActivo={rolActivo}
            onSelectRol={(r) => { setRolActivo(r); hablarText(`Vista cambiada a ${r}`); }}
            altoContraste={altoContraste}
          />
          <main className="flex-1 overflow-y-auto">
            <DashboardPage
              usuario={usuario}
              rolActivo={rolActivo}
              altoContraste={altoContraste}
              hablarText={hablarText}
            />
          </main>
        </div>
      )}
    </div>
  );
}