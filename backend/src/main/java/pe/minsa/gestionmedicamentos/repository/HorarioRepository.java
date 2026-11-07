package pe.minsa.gestionmedicamentos.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.minsa.gestionmedicamentos.model.Horario;

import java.util.List;

public interface HorarioRepository extends JpaRepository<Horario, Long> {
    List<Horario> findByMedicamentoId(Long medicamentoId);
}
