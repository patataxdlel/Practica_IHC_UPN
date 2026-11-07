package pe.minsa.gestionmedicamentos.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import pe.minsa.gestionmedicamentos.model.Toma;
import pe.minsa.gestionmedicamentos.service.TomaService;

import java.util.List;

@RestController
@RequestMapping("/api/tomas")
@CrossOrigin(origins = "*")
public class TomaController {
    
    private final TomaService tomaService;

    public TomaController(TomaService tomaService) {
        this.tomaService = tomaService;
    }

    // Listar tomas de un horario
    @GetMapping("/horario/{horarioId}")
    public List<Toma> listarPorHorario(@PathVariable Long horarioId) {
        return tomaService.listarPorHorario(horarioId);
    }

    // Registrar/Confirmar toma (aplica validación de 120 min de duplicidad - RN-15)
    @PostMapping
    public ResponseEntity<?> registrarToma(@RequestBody Toma toma) {
        try {
            Toma nuevaToma = tomaService.registrarToma(toma);
            return ResponseEntity.ok(nuevaToma);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
