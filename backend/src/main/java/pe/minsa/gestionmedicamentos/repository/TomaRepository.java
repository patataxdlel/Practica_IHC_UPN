package pe.minsa.gestionmedicamentos.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.minsa.gestionmedicamentos.model.Toma;
import java.util.List;

public interface TomaRepository extends JpaRepository<Toma, Long> {
    List<Toma> findByHorarioId(Long horarioId);
}
