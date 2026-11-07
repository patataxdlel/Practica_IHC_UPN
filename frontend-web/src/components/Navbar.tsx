import { Menu, Eye, Volume2, LogOut } from 'lucide-react';
import type { Usuario } from '../api/apiService';

interface Props {
  onToggleSidebar: () => void;
  altoContraste: boolean;
  onToggleContraste: () => void;
  usuario: Usuario | null;
  onLogout: () => void;
  mensajeAudible: string;
}

export default function Navbar({
  onToggleSidebar,
  altoContraste,
  onToggleContraste,
  usuario,
  onLogout,
  mensajeAudible
}: Props) {
  return (
    <header className={`sticky top-0 z-50 flex items-center justify-between px-6 py-3 border-b shadow-md transition-colors ${
      altoContraste ? 'bg-black text-yellow-300 border-yellow-400' : 'bg-blue-900 text-white border-blue-800'
    }`}>
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className={`p-2 rounded-lg transition-transform active:scale-95 ${
            altoContraste ? 'hover:bg-zinc-800 text-yellow-300' : 'hover:bg-blue-800 text-white'
          }`}
          title="Abrir menú principal"
        >
          <Menu size={28} />
        </button>
        <div className="flex items-center gap-3">
          <div className="bg-red-600 text-white font-black text-xl px-3 py-1 rounded shadow">
            MINSA
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight leading-none">Sistema Inclusivo de Medicamentos</h1>
            <p className="text-xs opacity-80 mt-0.5">Ministerio de Salud del Perú — Accesibilidad Universal</p>
          </div>
        </div>
      </div>

      {mensajeAudible && (
        <div className={`hidden md:flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold animate-pulse ${
          altoContraste ? 'bg-zinc-800 text-yellow-300 border border-yellow-400' : 'bg-blue-800 text-blue-100'
        }`}>
          <Volume2 size={18} />
          <span>{mensajeAudible}</span>
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          onClick={onToggleContraste}
          className={`flex items-center gap-2 px-4 py-2 font-bold text-base rounded-lg shadow border transition-all ${
            altoContraste 
              ? 'bg-yellow-300 text-black border-yellow-400 hover:bg-yellow-400' 
              : 'bg-white text-blue-900 border-white hover:bg-blue-50'
          }`}
        >
          <Eye size={22} />
          <span>{altoContraste ? 'Contraste Normal' : 'Alto Contraste'}</span>
        </button>

        {usuario && (
          <div className="flex items-center gap-3 pl-3 border-l border-blue-700">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold leading-none">{usuario.nombres} {usuario.apellidos}</p>
              <span className="text-xs opacity-80">DNI: {usuario.dni}</span>
            </div>
            <button
              onClick={onLogout}
              className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
              title="Cerrar Sesión"
            >
              <LogOut size={20} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}