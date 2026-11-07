import axiosClient from './axiosClient';

export interface Usuario {
  id?: number;
  nombres: string;
  apellidos: string;
  dni: string;
  email: string;
  password?: string;
  celular?: string;
  roles: string[];
}

export interface Medicamento {
  id?: number;
  nombre: string;
  formaFarmaceutica: string;
  dosis: string;
  fechaInicio: string;
  fechaFin: string;
  paciente: { id: number };
}

export interface Toma {
  id?: number;
  horario: { id: number };
  fechaHoraProgramada: string;
  fechaHoraReal?: string;
  estado: string;
}

export const apiService = {
  registrarUsuario: async (usuario: Usuario) => {
    const res = await axiosClient.post('/usuarios/registro', usuario);
    return res.data;
  },
  obtenerUsuarioPorDni: async (dni: string) => {
    const res = await axiosClient.get(`/usuarios/dni/${dni}`);
    return res.data;
  },
  listarMedicamentosPorPaciente: async (pacienteId: number) => {
    const res = await axiosClient.get<Medicamento[]>(`/medicamentos/paciente/${pacienteId}`);
    return res.data;
  },
  registrarMedicamento: async (medicamento: Medicamento) => {
    const res = await axiosClient.post<Medicamento>('/medicamentos', medicamento);
    return res.data;
  },
  registrarToma: async (toma: Toma) => {
    const res = await axiosClient.post<Toma>('/tomas', toma);
    return res.data;
  }
};