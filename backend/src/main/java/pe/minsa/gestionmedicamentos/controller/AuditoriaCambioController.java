package pe.minsa.gestionmedicamentos.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import pe.minsa.gestionmedicamentos.model.AuditoriaCambio;
import pe.minsa.gestionmedicamentos.service.AuditoriaCambioService;

import java.util.List;

@RestController
@RequestMapping("/api/auditoria")
@CrossOrigin(origins = "*")
public class AuditoriaCambioController {
    
    private final AuditoriaCambioService auditoriaCambioService;

    public AuditoriaCambioController(AuditoriaCambioService auditoriaCambioService) {
        this.auditoriaCambioService = auditoriaCambioService;
    }

    // Consultar el historial de auditoría y comentarios de un paciente
    @GetMapping("/paciente/{pacienteId}")
    public List<AuditoriaCambio> listarPorPaciente(@PathVariable Long pacienteId) {
        return auditoriaCambioService.listarPorPaciente(pacienteId);
    }

    // Registrar un cambio con el motivo obligatorio del médico
    @PostMapping
    public ResponseEntity<?> registrarAuditoria(@RequestBody AuditoriaCambio auditoria) {
        try {
            AuditoriaCambio nuevoCambio = auditoriaCambioService.registrarAuditoria(auditoria);
            return ResponseEntity.ok(nuevoCambio);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
