package pe.minsa.gestionmedicamentos.service;


import org.springframework.stereotype.Service;
import pe.minsa.gestionmedicamentos.model.Toma;
import pe.minsa.gestionmedicamentos.repository.TomaRepository;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class TomaService {
    
    private final TomaRepository tomaRepository;

    public TomaService(TomaRepository tomaRepository) {
        this.tomaRepository = tomaRepository;
    }

    // Listar tomas por horario
    public List<Toma> listarPorHorario(Long horarioId) {
        return tomaRepository.findByHorarioId(horarioId);
    }

    // Registrar o confirmar una toma con validación de duplicidad (RN-15)
    public Toma registrarToma(Toma nuevaToma) {
        List<Toma> tomasExistentes = tomaRepository.findByHorarioId(nuevaToma.getHorario().getId());

        LocalDateTime horaActual = LocalDateTime.now();

        // Validar si existe una toma ya registrada como "TOMADA" en los últimos 120 minutos
        for (Toma toma : tomasExistentes) {
            if ("TOMADA".equals(toma.getEstado()) && toma.getFechaHoraReal() != null) {
                long minutosTranscurridos = java.time.Duration.between(toma.getFechaHoraReal(), horaActual).toMinutes();
                if (minutosTranscurridos < 120) {
                    throw new RuntimeException("ALERTA DE SEGURIDAD: La dosis ya fue tomada hace " + minutosTranscurridos + 
                        " minutos. No se permite registrar tomas duplicadas en menos de 120 minutos (RN-15).");
                }
            }
        }

        nuevaToma.setFechaHoraReal(horaActual);
        nuevaToma.setEstado("TOMADA");
        return tomaRepository.save(nuevaToma);
    }
}
