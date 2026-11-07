package pe.minsa.gestionmedicamentos.service;

import org.springframework.stereotype.Service;
import pe.minsa.gestionmedicamentos.model.Medicamento;
import pe.minsa.gestionmedicamentos.repository.MedicamentoRepository;

import java.util.List;

@Service
public class MedicamentoService {
    
    private final MedicamentoRepository medicamentoRepository;

    public MedicamentoService(MedicamentoRepository medicamentoRepository) {
        this.medicamentoRepository = medicamentoRepository;
    }

    // Listar medicamentos de un paciente específico
    public List<Medicamento> listarPorPaciente(Long pacienteId) {
        return medicamentoRepository.findByPacienteId(pacienteId);
    }

    // Registrar un nuevo medicamento
    public Medicamento registrarMedicamento(Medicamento medicamento) {
        // Regla: Validar que la fecha fin no sea anterior a la fecha de inicio (RF-01)
        if (medicamento.getFechaFin().isBefore(medicamento.getFechaInicio())) {
            throw new RuntimeException("La fecha de finalización no puede ser anterior a la fecha de inicio.");
        }
        return medicamentoRepository.save(medicamento);
    }

    // Eliminar medicamento por ID
    public void eliminarMedicamento(Long id) {
        medicamentoRepository.deleteById(id);
    }
}
