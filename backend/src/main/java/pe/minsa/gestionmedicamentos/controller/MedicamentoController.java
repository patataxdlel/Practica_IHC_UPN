package pe.minsa.gestionmedicamentos.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import pe.minsa.gestionmedicamentos.model.Medicamento;
import pe.minsa.gestionmedicamentos.service.MedicamentoService;

import java.util.List;

@RestController
@RequestMapping("/api/medicamentos")
@CrossOrigin(origins = "*")
public class MedicamentoController {
    
    private final MedicamentoService medicamentoService;

    public MedicamentoController(MedicamentoService medicamentoService) {
        this.medicamentoService = medicamentoService;
    }

    // Listar medicamentos de un paciente por su ID
    @GetMapping("/paciente/{pacienteId}")
    public List<Medicamento> listarPorPaciente(@PathVariable Long pacienteId) {
        return medicamentoService.listarPorPaciente(pacienteId);
    }

    // Registrar un nuevo medicamento
    @PostMapping
    public ResponseEntity<?> registrarMedicamento(@RequestBody Medicamento medicamento) {
        try {
            Medicamento nuevoMedicamento = medicamentoService.registrarMedicamento(medicamento);
            return ResponseEntity.ok(nuevoMedicamento);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Eliminar un medicamento por ID
    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminarMedicamento(@PathVariable Long id) {
        try {
            medicamentoService.eliminarMedicamento(id);
            return ResponseEntity.ok("Medicamento eliminado exitosamente.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("No se pudo eliminar el medicamento.");
        }
    }
}
