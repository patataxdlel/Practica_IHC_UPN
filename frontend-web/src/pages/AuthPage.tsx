import React, { useState } from 'react';
import { Pill, ShieldCheck, LogIn, UserPlus } from 'lucide-react';
import { apiService, type Usuario } from '../api/apiService';

interface Props {
  onLoginSuccess: (usuario: Usuario) => void;
  altoContraste: boolean;
  hablarText: (txt: string) => void;
}

export default function AuthPage({ onLoginSuccess, altoContraste, hablarText }: Props) {
  const [modo, setModo] = useState<'LOGIN' | 'REGISTRO'>('LOGIN');
  const [dni, setDni] = useState('');

  const [form, setForm] = useState<Usuario>({
    nombres: '',
    apellidos: '',
    dni: '',
    email: '',
    password: '',
    celular: '',
    roles: ['PACIENTE']
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const user = await apiService.obtenerUsuarioPorDni(dni);
      hablarText(`Bienvenido de nuevo, ${user.nombres}`);
      onLoginSuccess(user);
    } catch {
      alert('DNI no encontrado en el padrón del MINSA.');
    }
  };

  const handleRegistro = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiService.registrarUsuario(form);
      alert('¡Usuario registrado correctamente!');
      hablarText('Registro completado. Ahora puede iniciar sesión.');
      setModo('LOGIN');
    } catch (err: any) {
      alert('Error en el registro: ' + (err.response?.data || err.message));
    }
  };

  return (
    <div className={`min-h-[calc(100vh-65px)] flex items-center justify-center p-6 transition-colors ${
      altoContraste ? 'bg-black text-yellow-300' : 'bg-blue-50 text-gray-900'
    }`}>
      <div className={`max-w-4xl w-full grid md:grid-cols-2 rounded-2xl shadow-2xl overflow-hidden border ${
        altoContraste 
          ? 'bg-zinc-950 border-yellow-400 text-yellow-300' 
          : 'bg-white border-gray-200 text-gray-900'
      }`}>
        
        <div className={`p-8 flex flex-col justify-between relative overflow-hidden ${
          altoContraste ? 'bg-zinc-900 border-r border-yellow-400' : 'bg-blue-900 text-white'
        }`}>
          <div className="absolute inset-0 bg-cover bg-center opacity-20" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?q=80&w=1000&auto=format&fit=crop')` }} />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <Pill size={40} className="text-yellow-400" />
              <span className="text-2xl font-black tracking-wide">MINSA SALUD</span>
            </div>
            <h2 className="text-3xl font-extrabold leading-tight mb-4">Gestión Inclusiva y Segura de Medicamentos</h2>
            <p className={`text-sm leading-relaxed ${altoContraste ? 'text-yellow-200' : 'text-blue-100'}`}>
              Plataforma oficial para la prevención de duplicidad de dosis (RN-15), supervisión clínica y control de recetas.
            </p>
          </div>
          <div className={`relative z-10 mt-8 pt-4 border-t flex items-center gap-3 text-xs ${
            altoContraste ? 'border-yellow-400/40 text-yellow-300' : 'border-blue-700/50 text-blue-200'
          }`}>
            <ShieldCheck size={20} className="text-emerald-400" />
            <span>WCAG 2.1 Aligned • Accesibilidad Auditiva y Visual</span>
          </div>
        </div>

        <div className="p-8 flex flex-col justify-center">
          <div className={`flex gap-2 p-1 rounded-xl mb-6 border ${
            altoContraste ? 'bg-zinc-900 border-yellow-400/50' : 'bg-gray-100 border-gray-200'
          }`}>
            <button
              onClick={() => setModo('LOGIN')}
              className={`flex-1 py-2 font-bold rounded-lg text-sm transition ${
                modo === 'LOGIN' 
                  ? (altoContraste ? 'bg-yellow-300 text-black shadow' : 'bg-blue-900 text-white shadow') 
                  : (altoContraste ? 'text-yellow-300 hover:bg-zinc-800' : 'text-gray-600 hover:text-gray-900')
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              onClick={() => setModo('REGISTRO')}
              className={`flex-1 py-2 font-bold rounded-lg text-sm transition ${
                modo === 'REGISTRO' 
                  ? (altoContraste ? 'bg-yellow-300 text-black shadow' : 'bg-blue-900 text-white shadow') 
                  : (altoContraste ? 'text-yellow-300 hover:bg-zinc-800' : 'text-gray-600 hover:text-gray-900')
              }`}
            >
              Registrarse
            </button>
          </div>

          {modo === 'LOGIN' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-1">Número de DNI:</label>
                <input
                  type="text"
                  value={dni}
                  onChange={(e) => setDni(e.target.value)}
                  placeholder="Ingrese sus 8 dígitos"
                  className={`w-full p-3 border rounded-xl font-medium outline-none ${
                    altoContraste 
                      ? 'bg-zinc-900 border-yellow-400 text-yellow-300 placeholder-yellow-500/50 focus:ring-2 focus:ring-yellow-400' 
                      : 'bg-white border-gray-300 text-gray-900 focus:ring-2 focus:ring-blue-600'
                  }`}
                  required
                />
              </div>
              <button 
                type="submit" 
                className={`w-full py-3.5 font-bold rounded-xl shadow-lg transition flex items-center justify-center gap-2 ${
                  altoContraste 
                    ? 'bg-yellow-300 hover:bg-yellow-400 text-black' 
                    : 'bg-blue-900 hover:bg-blue-950 text-white'
                }`}
              >
                <LogIn size={20} /> Entrar a la Plataforma
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegistro} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <input 
                  type="text" 
                  placeholder="Nombres" 
                  onChange={(e) => setForm({...form, nombres: e.target.value})} 
                  className={`p-2.5 border rounded-lg text-sm outline-none ${
                    altoContraste ? 'bg-zinc-900 border-yellow-400 text-yellow-300 placeholder-yellow-500/50' : 'bg-white border-gray-300 text-gray-900'
                  }`} 
                  required 
                />
                <input 
                  type="text" 
                  placeholder="Apellidos" 
                  onChange={(e) => setForm({...form, apellidos: e.target.value})} 
                  className={`p-2.5 border rounded-lg text-sm outline-none ${
                    altoContraste ? 'bg-zinc-900 border-yellow-400 text-yellow-300 placeholder-yellow-500/50' : 'bg-white border-gray-300 text-gray-900'
                  }`} 
                  required 
                />
              </div>
              <input 
                type="text" 
                placeholder="DNI" 
                onChange={(e) => setForm({...form, dni: e.target.value})} 
                className={`w-full p-2.5 border rounded-lg text-sm outline-none ${
                  altoContraste ? 'bg-zinc-900 border-yellow-400 text-yellow-300 placeholder-yellow-500/50' : 'bg-white border-gray-300 text-gray-900'
                }`} 
                required 
              />
              <input 
                type="email" 
                placeholder="Correo electrónico" 
                onChange={(e) => setForm({...form, email: e.target.value})} 
                className={`w-full p-2.5 border rounded-lg text-sm outline-none ${
                  altoContraste ? 'bg-zinc-900 border-yellow-400 text-yellow-300 placeholder-yellow-500/50' : 'bg-white border-gray-300 text-gray-900'
                }`} 
                required 
              />
              <input 
                type="password" 
                placeholder="Contraseña" 
                onChange={(e) => setForm({...form, password: e.target.value})} 
                className={`w-full p-2.5 border rounded-lg text-sm outline-none ${
                  altoContraste ? 'bg-zinc-900 border-yellow-400 text-yellow-300 placeholder-yellow-500/50' : 'bg-white border-gray-300 text-gray-900'
                }`} 
                required 
              />
              
              <div>
                <label className="block text-xs font-bold mb-1">Seleccionar Rol de Usuario:</label>
                <select 
                  onChange={(e) => setForm({...form, roles: [e.target.value]})} 
                  className={`w-full p-2.5 border rounded-lg text-sm font-semibold outline-none ${
                    altoContraste ? 'bg-zinc-900 border-yellow-400 text-yellow-300' : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="PACIENTE">Rol: Paciente</option>
                  <option value="CUIDADOR">Rol: Cuidador</option>
                  <option value="MEDICO">Rol: Médico Auditor</option>
                </select>
              </div>

              <button 
                type="submit" 
                className={`w-full py-3 font-bold rounded-xl shadow transition flex items-center justify-center gap-2 mt-2 ${
                  altoContraste ? 'bg-yellow-300 text-black hover:bg-yellow-400' : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                <UserPlus size={20} /> Crear Cuenta Unificada
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}