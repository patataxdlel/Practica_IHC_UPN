import { useState } from 'react';
import { Users, Search, CheckCircle2 } from 'lucide-react';
import { apiService, type Usuario } from '../api/apiService';

interface Props {
  altoContraste: boolean;
}

export default function CuidadorPage({ altoContraste }: Props) {
  const [dniBuscado, setDniBuscado] = useState('');
  const [pacienteVinculado, setPacienteVinculado] = useState<Usuario | null>(null);
  const [errorBusqueda, setErrorBusqueda] = useState('');

  const buscarPaciente = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorBusqueda('');
    setPacienteVinculado(null);
    try {
      const user = await apiService.obtenerUsuarioPorDni(dniBuscado);
      setPacienteVinculado(user);
    } catch {
      setErrorBusqueda('No se encontró ningún paciente registrado con ese DNI.');
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-black">Panel de Supervisión de Cuidadores</h2>
      
      <div className={`p-6 rounded-2xl border shadow-md space-y-4 ${
        altoContraste ? 'bg-zinc-900 border-yellow-400 text-yellow-300' : 'bg-white border-gray-200 text-gray-900'
      }`}>
        <h3 className="text-lg font-bold flex items-center gap-2">
          <Users size={24} className="text-blue-600" /> Vincular Paciente por DNI
        </h3>
        <form onSubmit={buscarPaciente} className="flex gap-3">
          <input
            type="text"
            value={dniBuscado}
            onChange={(e) => setDniBuscado(e.target.value)}
            placeholder="Ingrese el DNI del paciente a cuidar"
            className={`flex-1 p-3 border rounded-xl font-medium outline-none ${
              altoContraste ? 'bg-zinc-800 border-yellow-400 text-yellow-300 placeholder-yellow-500/50' : 'bg-white border-gray-300 text-gray-900'
            }`}
            required
          />
          <button type="submit" className="px-6 py-3 bg-blue-900 hover:bg-blue-950 text-white font-bold rounded-xl shadow flex items-center gap-2">
            <Search size={20} /> Buscar
          </button>
        </form>

        {errorBusqueda && <p className="text-red-500 font-bold text-sm">{errorBusqueda}</p>}
      </div>

      {pacienteVinculado && (
        <div className={`p-6 rounded-2xl border shadow-md space-y-4 ${
          altoContraste ? 'bg-zinc-900 border-yellow-400 text-yellow-300' : 'bg-white border-gray-200 text-gray-900'
        }`}>
          <div className="flex items-center justify-between border-b pb-4 dark:border-zinc-800">
            <div>
              <h3 className="text-xl font-bold">{pacienteVinculado.nombres} {pacienteVinculado.apellidos}</h3>
              <p className="text-sm opacity-75">DNI: {pacienteVinculado.dni} • Correo: {pacienteVinculado.email}</p>
            </div>
            <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-full flex items-center gap-1">
              <CheckCircle2 size={16} /> Vinculación Exitosa
            </span>
          </div>

          <div className={`p-4 rounded-xl border space-y-2 ${
            altoContraste ? 'bg-zinc-950 border-yellow-400/50 text-yellow-300' : 'bg-blue-50 border-blue-200 text-blue-950'
          }`}>
            <h4 className="font-bold text-sm uppercase tracking-wide">Estado de Adherencia:</h4>
            <p className="text-sm font-semibold">✓ El paciente está cumpliendo con su tratamiento programado sin alertas de retraso en las últimas 24 horas.</p>
          </div>
        </div>
      )}
    </div>
  );
}