package pe.minsa.gestionmedicamentos.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "tomas")
public class Toma {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "horario_id", nullable = false)
    private Horario horario;

    @Column(name = "fecha_hora_programada", nullable = false)
    private LocalDateTime fechaHoraProgramada;

    @Column(name = "fecha_hora_real")
    private LocalDateTime fechaHoraReal; // Cuándo realmente presionó el botón de "Tomar"

    @Column(nullable = false, length = 20)
    private String estado; // PENDIENTE, TOMADA, OMITIDA

    public Toma() {}

    // Getters y Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Horario getHorario() { return horario; }
    public void setHorario(Horario horario) { this.horario = horario; }
    public LocalDateTime getFechaHoraProgramada() { return fechaHoraProgramada; }
    public void setFechaHoraProgramada(LocalDateTime fechaHoraProgramada) { this.fechaHoraProgramada = fechaHoraProgramada; }
    public LocalDateTime getFechaHoraReal() { return fechaHoraReal; }
    public void setFechaHoraReal(LocalDateTime fechaHoraReal) { this.fechaHoraReal = fechaHoraReal; }
    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }
}
