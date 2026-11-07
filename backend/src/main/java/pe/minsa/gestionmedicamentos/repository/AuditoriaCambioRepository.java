package pe.minsa.gestionmedicamentos.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.minsa.gestionmedicamentos.model.AuditoriaCambio;
import java.util.List;

public interface AuditoriaCambioRepository extends JpaRepository<AuditoriaCambio, Long> {
    List<AuditoriaCambio> findByPacienteAfectadoId(Long pacienteAfectadoId);
}
