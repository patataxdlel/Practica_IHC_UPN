package pe.minsa.gestionmedicamentos.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.minsa.gestionmedicamentos.model.Medicamento;
import java.util.List;

public interface MedicamentoRepository extends JpaRepository<Medicamento, Long> {
    List<Medicamento> findByPacienteId(Long pacienteId);
}
