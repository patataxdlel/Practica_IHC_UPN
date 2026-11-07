import { useState } from 'react';
import { Stethoscope, Pill, ShieldCheck, Search, CheckCircle } from 'lucide-react';
import { apiService, type Medicamento, type Usuario } from '../api/apiService';

interface Props {
  altoContraste: boolean;
}

export default function MedicoPage({ altoContraste }: Props) {
  const [dniBusqueda, setDniBusqueda] = useState('');
  const [pacienteEncontrado, setPacienteEncontrado] = useState<Usuario | null>(null);
  const [errorPaciente, setErrorPaciente] = useState('');

  const [nombreMed, setNombreMed] = useState('');
  const [formaFarmaceutica, setFormaFarmaceutica] = useState('Pastilla');
  const [dosis, setDosis] = useState('1 unidad');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [motivoAuditoria, setMotivoAuditoria] = useState('');

  const buscarPacientePorDni = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorPaciente('');
    setPacienteEncontrado(null);
    try {
      const usuario = await apiService.obtenerUsuarioPorDni(dniBusqueda);
      if (usuario) {
        setPacienteEncontrado(usuario);
      }
    } catch {
      setErrorPaciente('No se encontró ningún paciente registrado con ese DNI en el sistema.');
    }
  };

  const registrarMedicamentoRecetado = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pacienteEncontrado || !pacienteEncontrado.id) {
      alert('Debe buscar y verificar un paciente por su DNI antes de prescribir.');
      return;
    }
    if (!motivoAuditoria.trim()) {
      alert('Error de Auditoría: El médico debe registrar obligatoriamente un motivo clínico para prescribir o modificar el tratamiento.');
      return;
    }

    try {
      const nuevoMed: Medicamento = {
        nombre: nombreMed,
        formaFarmaceutica,
        dosis,
        fechaInicio: fechaInicio || new Date().toISOString().split('T')[0],
        fechaFin: fechaFin || new Date().toISOString().split('T')[0],
        paciente: { id: pacienteEncontrado.id }
      };

      await apiService.registrarMedicamento(nuevoMed);
      alert('¡Medicamento recetado y registrado con éxito en el sistema de auditoría del MINSA!');
      setNombreMed('');
      setMotivoAuditoria('');
      setDniBusqueda('');
      setPacienteEncontrado(null);
    } catch (err: any) {
      alert('Error al registrar medicamento: ' + (err.response?.data || err.message));
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-black flex items-center gap-3">
        <Stethoscope size={30} className="text-blue-600" /> Panel Clínico - Recetas y Auditoría Médica
      </h2>

      <div className={`p-6 rounded-2xl border shadow-md space-y-4 ${
        altoContraste ? 'bg-zinc-900 border-yellow-400 text-yellow-300' : 'bg-white border-gray-200 text-gray-900'
      }`}>
        <h3 className="text-lg font-bold border-b pb-2 flex items-center gap-2">
          <Search size={22} /> Paso 1: Identificar Paciente por DNI
        </h3>

        <form onSubmit={buscarPacientePorDni} className="flex gap-3">
          <input
            type="text"
            value={dniBusqueda}
            onChange={(e) => setDniBusqueda(e.target.value)}
            placeholder="Ingrese el DNI del paciente (Ej. 12345678)"
            className={`flex-1 p-3 border rounded-xl font-medium outline-none ${
              altoContraste ? 'bg-zinc-800 border-yellow-400 text-yellow-300' : 'bg-white border-gray-300 text-gray-900'
            }`}
            required
          />
          <button type="submit" className="px-6 py-3 bg-blue-900 hover:bg-blue-950 text-white font-bold rounded-xl shadow flex items-center gap-2">
            <Search size={20} /> Buscar Paciente
          </button>
        </form>

        {errorPaciente && <p className="text-red-500 font-bold text-sm">{errorPaciente}</p>}

        {pacienteEncontrado && (
          <div className="p-4 bg-emerald-50 dark:bg-zinc-800 rounded-xl border border-emerald-200 dark:border-zinc-700 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
                ✓ Paciente Verificado: {pacienteEncontrado.nombres} {pacienteEncontrado.apellidos}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">DNI: {pacienteEncontrado.dni} • Correo: {pacienteEncontrado.email}</p>
            </div>
            <CheckCircle className="text-emerald-600 dark:text-emerald-400" size={24} />
          </div>
        )}
      </div>

      {pacienteEncontrado && (
        <form onSubmit={registrarMedicamentoRecetado} className={`p-6 rounded-2xl border shadow-md space-y-4 ${
          altoContraste ? 'bg-zinc-900 border-yellow-400 text-yellow-300' : 'bg-white border-gray-200 text-gray-900'
        }`}>
          <h3 className="text-lg font-bold border-b pb-2 flex items-center gap-2">
            <Pill size={22} /> Paso 2: Prescribir Nuevo Medicamento
          </h3>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold mb-1">Nombre del Medicamento:</label>
              <input
                type="text"
                value={nombreMed}
                onChange={(e) => setNombreMed(e.target.value)}
                placeholder="Ej. Amoxicilina 500mg"
                className={`w-full p-3 border rounded-xl font-medium outline-none ${
                  altoContraste ? 'bg-zinc-800 border-yellow-400 text-yellow-300' : 'bg-white border-gray-300 text-gray-900'
                }`}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-1">Forma Farmacéutica:</label>
              <select
                value={formaFarmaceutica}
                onChange={(e) => setFormaFarmaceutica(e.target.value)}
                className={`w-full p-3 border rounded-xl font-medium outline-none ${
                  altoContraste ? 'bg-zinc-800 border-yellow-400 text-yellow-300' : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                <option value="Pastilla">Pastilla</option>
                <option value="Jarabe">Jarabe</option>
                <option value="Inyectable">Inyectable</option>
                <option value="Gotas">Gotas</option>
              </select>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-bold mb-1">Dosis:</label>
              <input
                type="text"
                value={dosis}
                onChange={(e) => setDosis(e.target.value)}
                placeholder="Ej. 1 cápsula cada 8 horas"
                className={`w-full p-3 border rounded-xl font-medium outline-none ${
                  altoContraste ? 'bg-zinc-800 border-yellow-400 text-yellow-300' : 'bg-white border-gray-300 text-gray-900'
                }`}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-1">F. Inicio:</label>
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className={`w-full p-3 border rounded-xl font-medium text-sm outline-none ${
                  altoContraste ? 'bg-zinc-800 border-yellow-400 text-yellow-300' : 'bg-white border-gray-300 text-gray-900'
                }`}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-1">F. Fin:</label>
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className={`w-full p-3 border rounded-xl font-medium text-sm outline-none ${
                  altoContraste ? 'bg-zinc-800 border-yellow-400 text-yellow-300' : 'bg-white border-gray-300 text-gray-900'
                }`}
                required
              />
            </div>
          </div>

          <div className="pt-4 border-t dark:border-zinc-800 space-y-2">
            <label className="block text-sm font-bold flex items-center gap-1 text-red-600 dark:text-red-400">
              <ShieldCheck size={18} /> Motivo Clínico / Auditoría (Obligatorio por norma MINSA):
            </label>
            <textarea
              value={motivoAuditoria}
              onChange={(e) => setMotivoAuditoria(e.target.value)}
              placeholder="Escriba la justificación médica del tratamiento..."
              className={`w-full p-4 border rounded-xl text-base font-medium outline-none ${
                altoContraste ? 'bg-zinc-800 border-yellow-400 text-yellow-300' : 'bg-white border-gray-300 text-gray-900'
              }`}
              rows={3}
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-4 bg-blue-900 hover:bg-blue-950 text-white font-extrabold rounded-xl shadow-lg transition text-lg"
          >
            Guardar Tratamiento y Registrar Auditoría
          </button>
        </form>
      )}
    </div>
  );
}