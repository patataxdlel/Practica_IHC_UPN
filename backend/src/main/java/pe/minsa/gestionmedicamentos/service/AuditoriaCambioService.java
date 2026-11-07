package pe.minsa.gestionmedicamentos.service;


import org.springframework.stereotype.Service;
import pe.minsa.gestionmedicamentos.model.AuditoriaCambio;
import pe.minsa.gestionmedicamentos.repository.AuditoriaCambioRepository;

import java.util.List;

@Service
public class AuditoriaCambioService {
    
    private final AuditoriaCambioRepository auditoriaCambioRepository;

    public AuditoriaCambioService(AuditoriaCambioRepository auditoriaCambioRepository) {
        this.auditoriaCambioRepository = auditoriaCambioRepository;
    }

    // Registrar un cambio con comentario obligatorio del médico
    public AuditoriaCambio registrarAuditoria(AuditoriaCambio auditoria) {
        if (auditoria.getMotivoComentario() == null || auditoria.getMotivoComentario().trim().isEmpty()) {
            throw new RuntimeException("El médico debe registrar obligatoriamente un motivo o comentario para este cambio.");
        }
        return auditoriaCambioRepository.save(auditoria);
    }

    // Consultar el historial de cambios de un paciente
    public List<AuditoriaCambio> listarPorPaciente(Long pacienteId) {
        return auditoriaCambioRepository.findByPacienteAfectadoId(pacienteId);
    }
}
