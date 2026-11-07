import { useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import { apiService, type Usuario } from '../api/apiService';
import PacientePage from './PacientePage';
import CuidadorPage from './CuidadorPage';
import MedicoPage from './MedicoPage';

interface Props {
  usuario: Usuario | null;
  rolActivo: 'PACIENTE' | 'CUIDADOR' | 'MEDICO';
  altoContraste: boolean;
  hablarText: (txt: string) => void;
}

export default function DashboardPage({ usuario, rolActivo, altoContraste, hablarText }: Props) {
  const [errorRN15, setErrorRN15] = useState('');

  const confirmarToma = async (medNombre: string, horarioId?: number) => {
    setErrorRN15('');
    try {
      // Usamos el ID del horario especificado o el ID 1 por defecto
      const idParaToma = horarioId || 1;

      await apiService.registrarToma({
        horario: { id: idParaToma },
        fechaHoraProgramada: new Date().toISOString(),
        estado: 'TOMADA'
      });

      const msj = `¡Perfecto! Toma de ${medNombre} registrada con éxito.`;
      hablarText(msj);
      alert(msj);
    } catch (err: any) {
      console.error('Error al registrar toma:', err);
      const detalle = err.response?.data || err.message;
      
      let msg = '';
      if (typeof detalle === 'string' && detalle.includes('RN-15')) {
        msg = detalle;
      } else if (typeof detalle === 'string' && detalle.includes('foreign key')) {
        msg = 'Error de BD: El ID de horario no existe en la tabla "horarios".';
      } else {
        msg = err.response?.data?.message || 'Bloqueo de seguridad RN-15: No puede tomar la misma dosis dentro de los 120 minutos.';
      }
      
      setErrorRN15(msg);
      hablarText('Atención: Alerta de seguridad RN 15.');
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {errorRN15 && (
        <div className="p-5 bg-red-600 text-white rounded-2xl shadow-xl flex items-center gap-4 border-2 border-red-400 animate-bounce">
          <ShieldAlert size={40} className="shrink-0" />
          <div>
            <h4 className="text-xl font-black">BLOQUEO DE SEGURIDAD (RN-15)</h4>
            <p className="text-sm font-semibold">{errorRN15}</p>
          </div>
        </div>
      )}

      {rolActivo === 'PACIENTE' && (
        <PacientePage 
          usuario={usuario} 
          altoContraste={altoContraste} 
          onConfirmarToma={(nombre) => confirmarToma(nombre, 1)} 
          hablarText={hablarText} 
        />
      )}
      {rolActivo === 'CUIDADOR' && <CuidadorPage altoContraste={altoContraste} />}
      {rolActivo === 'MEDICO' && <MedicoPage altoContraste={altoContraste} />}
    </div>
  );
}