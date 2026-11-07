package pe.minsa.gestionmedicamentos.service;

import org.springframework.stereotype.Service;
import pe.minsa.gestionmedicamentos.model.Horario;
import pe.minsa.gestionmedicamentos.repository.HorarioRepository;

import java.util.List;

@Service
public class HorarioService {
    
    private final HorarioRepository horarioRepository;

    public HorarioService(HorarioRepository horarioRepository) {
        this.horarioRepository = horarioRepository;
    }

    // Listar horarios de un medicamento
    public List<Horario> listarPorMedicamento(Long medicamentoId) {
        return horarioRepository.findByMedicamentoId(medicamentoId);
    }

    // Registrar un nuevo horario
    public Horario registrarHorario(Horario horario) {
        return horarioRepository.save(horario);
    }
}
