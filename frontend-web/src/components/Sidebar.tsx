import { UserCheck, Users, Stethoscope, HelpCircle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  rolActivo: 'PACIENTE' | 'CUIDADOR' | 'MEDICO';
  onSelectRol: (rol: 'PACIENTE' | 'CUIDADOR' | 'MEDICO') => void;
  altoContraste: boolean;
}

export default function Sidebar({ isOpen, rolActivo, onSelectRol, altoContraste }: Props) {
  if (!isOpen) return null;

  const menuItems = [
    { id: 'PACIENTE' as const, label: 'Modo Paciente', icon: UserCheck, desc: 'Mis dosis y tomas guiadas por voz' },
    { id: 'CUIDADOR' as const, label: 'Modo Cuidador', icon: Users, desc: 'Supervisión de familiares y alertas' },
    { id: 'MEDICO' as const, label: 'Modo Médico', icon: Stethoscope, desc: 'Auditoría clínica y recetas de salud' },
  ];

  return (
    <aside className={`w-72 border-r p-4 transition-all duration-300 flex flex-col justify-between ${
      altoContraste ? 'bg-black text-yellow-300 border-yellow-500' : 'bg-white text-gray-800 border-gray-200'
    }`}>
      <div className="space-y-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 px-2">Vistas y Roles</p>
          <nav className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isSelected = rolActivo === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectRol(item.id)}
                  className={`w-full flex items-start gap-3 p-3 rounded-xl text-left transition-all ${
                    isSelected
                      ? altoContraste
                        ? 'bg-yellow-300 text-black font-extrabold shadow-lg'
                        : 'bg-blue-900 text-white font-bold shadow-md'
                      : altoContraste
                        ? 'hover:bg-zinc-900 text-yellow-300'
                        : 'hover:bg-blue-50 text-gray-700'
                  }`}
                >
                  <Icon size={24} className="mt-0.5 shrink-0" />
                  <div>
                    <div className="text-base leading-snug">{item.label}</div>
                    <div className={`text-xs mt-0.5 font-normal ${
                      isSelected 
                        ? (altoContraste ? 'text-black' : 'text-blue-100') 
                        : (altoContraste ? 'text-yellow-400/70' : 'text-gray-500')
                    }`}>
                      {item.desc}
                    </div>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        <hr className={altoContraste ? 'border-zinc-800' : 'border-gray-200'} />

        <div className={`p-4 rounded-xl border ${
          altoContraste ? 'bg-zinc-950 border-yellow-400/30 text-yellow-300' : 'bg-blue-50/80 border-blue-200 text-gray-800'
        }`}>
          <div className={`flex items-center gap-2 font-bold text-sm mb-1 ${altoContraste ? 'text-yellow-300' : 'text-blue-900'}`}>
            <HelpCircle size={18} />
            <span>Guía de Accesibilidad</span>
          </div>
          <p className={`text-xs leading-relaxed ${altoContraste ? 'text-yellow-200' : 'text-gray-700'}`}>
            Navegación asistida por síntesis de voz y diseño adaptado para adultos mayores (WCAG 2.1 AAA).
          </p>
        </div>
      </div>

      <div className={`pt-4 border-t text-center text-xs opacity-70 ${altoContraste ? 'border-zinc-900 text-yellow-400' : 'border-gray-100 text-gray-500'}`}>
        MINSA Platform v2.0
      </div>
    </aside>
  );
}