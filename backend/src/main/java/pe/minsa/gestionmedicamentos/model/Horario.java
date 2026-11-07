package pe.minsa.gestionmedicamentos.model;

import jakarta.persistence.*;
import java.time.LocalTime;

@Entity
@Table(name = "horarios")
public class Horario {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "medicamento_id", nullable = false)
    private Medicamento medicamento;

    @Column(name = "hora_programada", nullable = false)
    private LocalTime horaProgramada;

    @Column(length = 50)
    private String frecuencia; // Ej: Cada 8 horas, Diario

    public Horario() {}

    // Getters y Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Medicamento getMedicamento() { return medicamento; }
    public void setMedicamento(Medicamento medicamento) { this.medicamento = medicamento; }
    public LocalTime getHoraProgramada() { return horaProgramada; }
    public void setHoraProgramada(LocalTime horaProgramada) { this.horaProgramada = horaProgramada; }
    public String getFrecuencia() { return frecuencia; }
    public void setFrecuencia(String frecuencia) { this.frecuencia = frecuencia; }
}
