package pe.minsa.gestionmedicamentos.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import pe.minsa.gestionmedicamentos.model.Horario;
import pe.minsa.gestionmedicamentos.service.HorarioService;

import java.util.List;

@RestController
@RequestMapping("/api/horarios")
@CrossOrigin(origins = "*")
public class HorarioController {
    
    private final HorarioService horarioService;

    public HorarioController(HorarioService horarioService) {
        this.horarioService = horarioService;
    }

    // Listar horarios de un medicamento específico
    @GetMapping("/medicamento/{medicamentoId}")
    public List<Horario> listarPorMedicamento(@PathVariable Long medicamentoId) {
        return horarioService.listarPorMedicamento(medicamentoId);
    }

    // Registrar un nuevo horario
    @PostMapping
    public ResponseEntity<?> registrarHorario(@RequestBody Horario horario) {
        try {
            Horario nuevoHorario = horarioService.registrarHorario(horario);
            return ResponseEntity.ok(nuevoHorario);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
