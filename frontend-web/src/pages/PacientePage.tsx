import { useState, useEffect } from 'react';
import { CheckCircle, Pill, Clock, PlusCircle, X } from 'lucide-react';
import { apiService, type Medicamento, type Usuario } from '../api/apiService';

interface Props {
  usuario: Usuario | null;
  altoContraste: boolean;
  onConfirmarToma: (nombreMed: string) => void;
  hablarText: (txt: string) => void;
}

export default function PacientePage({ usuario, altoContraste, onConfirmarToma, hablarText }: Props) {
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([]);
  const [mostrarModal, setMostrarModal] = useState(false);

  const obtenerFechaHoy = () => new Date().toISOString().split('T')[0];

  const [nombreMed, setNombreMed] = useState('');
  const [formaFarmaceutica, setFormaFarmaceutica] = useState('Pastilla');
  const [dosis, setDosis] = useState('1 unidad');
  const [fechaInicio, setFechaInicio] = useState(obtenerFechaHoy());
  const [fechaFin, setFechaFin] = useState(obtenerFechaHoy());

  useEffect(() => {
    if (usuario?.id) {
      cargarMedicamentos(usuario.id);
    }
  }, [usuario]);

  const cargarMedicamentos = async (pacienteId: number) => {
    try {
      const data = await apiService.listarMedicamentosPorPaciente(pacienteId);
      setMedicamentos(data);
    } catch {
      console.log('Cargando lista de medicamentos...');
    }
  };

  const handleAutorregistro = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuario?.id) {
      alert('Error: No hay sesión de usuario activa.');
      return;
    }

    try {
      const nuevoMed: Medicamento = {
        nombre: nombreMed,
        formaFarmaceutica,
        dosis,
        fechaInicio: fechaInicio,
        fechaFin: fechaFin,
        paciente: { id: usuario.id }
      };

      await apiService.registrarMedicamento(nuevoMed);
      hablarText(`Medicamento ${nombreMed} registrado con éxito.`);
      alert('¡Medicamento agregado correctamente a su tratamiento!');
      setMostrarModal(false);
      setNombreMed('');
      setFechaInicio(obtenerFechaHoy());
      setFechaFin(obtenerFechaHoy());
      cargarMedicamentos(usuario.id);
    } catch (err: any) {
      alert('Error al registrar medicamento: ' + (err.response?.data?.message || err.message || 'Error de red'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black">Mis Medicamentos Programados</h2>
          <p className="text-sm opacity-75">Gestione sus recetas médicas o sus medicamentos adquiridos por cuenta propia.</p>
        </div>
        <button
          onClick={() => { setMostrarModal(true); hablarText('Abriendo formulario para registrar medicamento'); }}
          className={`px-6 py-3 font-extrabold rounded-2xl shadow-lg flex items-center gap-2 transition ${
            altoContraste ? 'bg-yellow-300 text-black hover:bg-yellow-400' : 'bg-blue-900 text-white hover:bg-blue-950'
          }`}
        >
          <PlusCircle size={22} /> + Registrar Mi Medicamento
        </button>
      </div>

      {medicamentos.length === 0 ? (
        <div className={`p-8 rounded-2xl border text-center ${altoContraste ? 'bg-zinc-900 border-yellow-400 text-yellow-300' : 'bg-white border-gray-200 text-gray-700'}`}>
          <Pill size={48} className="mx-auto mb-3 opacity-50 text-blue-600" />
          <p className="text-lg font-bold">No tiene medicamentos registrados todavía.</p>
          <p className="text-sm opacity-75 mt-1">Haga clic en el botón superior para agregar sus medicinas de botica o de receta médica.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {medicamentos.map((med) => (
            <div key={med.id} className={`p-6 rounded-2xl border shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-6 ${
              altoContraste ? 'bg-zinc-900 border-yellow-400 text-yellow-300' : 'bg-white border-gray-200 text-gray-900'
            }`}>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 text-blue-900 rounded-xl">
                    <Pill size={32} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">{med.nombre}</h3>
                    <p className="text-sm font-semibold opacity-75">{med.formaFarmaceutica} • Dosis: {med.dosis}</p>
                  </div>
                </div>
                <p className="text-sm flex items-center gap-1">
                  <Clock size={16} /> Vigencia: Desde {med.fechaInicio} hasta {med.fechaFin}
                </p>
              </div>

              <button
                onClick={() => onConfirmarToma(med.nombre)}
                className={`w-full md:w-auto px-8 py-4 text-lg font-extrabold rounded-2xl shadow-xl flex items-center justify-center gap-3 transition transform active:scale-95 ${
                  altoContraste
                    ? 'bg-yellow-300 text-black hover:bg-yellow-400'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                <CheckCircle size={28} /> TOMAR MEDICAMENTO
              </button>
            </div>
          ))}
        </div>
      )}

      {mostrarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className={`max-w-lg w-full p-6 rounded-3xl shadow-2xl border ${
            altoContraste ? 'bg-zinc-950 border-yellow-400 text-yellow-300' : 'bg-white border-gray-200 text-gray-900'
          }`}>
            <div className="flex items-center justify-between border-b pb-4 mb-4 dark:border-zinc-800">
              <h3 className="text-xl font-black flex items-center gap-2">
                <Pill className="text-blue-600" /> Registrar Medicamento Personal / Botica
              </h3>
              <button onClick={() => setMostrarModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition">
                <X size={22} />
              </button>
            </div>

            <form onSubmit={handleAutorregistro} className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-1">Nombre del Medicamento:</label>
                <input
                  type="text"
                  value={nombreMed}
                  onChange={(e) => setNombreMed(e.target.value)}
                  placeholder="Ej. Panadol Antigripal, Ibuprofeno..."
                  className={`w-full p-3 border rounded-xl font-medium outline-none ${
                    altoContraste ? 'bg-zinc-900 border-yellow-400 text-yellow-300' : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-bold mb-1">Forma:</label>
                  <select
                    value={formaFarmaceutica}
                    onChange={(e) => setFormaFarmaceutica(e.target.value)}
                    className={`w-full p-3 border rounded-xl font-medium outline-none ${
                      altoContraste ? 'bg-zinc-900 border-yellow-400 text-yellow-300' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="Pastilla">Pastilla</option>
                    <option value="Jarabe">Jarabe</option>
                    <option value="Inyectable">Inyectable</option>
                    <option value="Gotas">Gotas</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1">Dosis:</label>
                  <input
                    type="text"
                    value={dosis}
                    onChange={(e) => setDosis(e.target.value)}
                    placeholder="Ej. 1 unidad"
                    className={`w-full p-3 border rounded-xl font-medium outline-none ${
                      altoContraste ? 'bg-zinc-900 border-yellow-400 text-yellow-300' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1">Fecha Inicio:</label>
                  <input
                    type="date"
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                    className={`w-full p-3 border rounded-xl font-medium text-sm outline-none ${
                      altoContraste ? 'bg-zinc-900 border-yellow-400 text-yellow-300' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">Fecha Fin:</label>
                  <input
                    type="date"
                    value={fechaFin}
                    onChange={(e) => setFechaFin(e.target.value)}
                    className={`w-full p-3 border rounded-xl font-medium text-sm outline-none ${
                      altoContraste ? 'bg-zinc-900 border-yellow-400 text-yellow-300' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setMostrarModal(false)}
                  className="flex-1 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 font-bold rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`flex-1 py-3 font-extrabold rounded-xl shadow transition ${
                    altoContraste ? 'bg-yellow-300 text-black hover:bg-yellow-400' : 'bg-emerald-600 text-white hover:bg-emerald-700'
                  }`}
                >
                  Guardar Medicamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}