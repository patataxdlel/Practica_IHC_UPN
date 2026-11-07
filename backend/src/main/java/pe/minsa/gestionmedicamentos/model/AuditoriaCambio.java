package pe.minsa.gestionmedicamentos.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "auditoria_cambios")
public class AuditoriaCambio {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "usuario_modifica_id", nullable = false)
    private Usuario usuarioModifica; // El médico o editor que hizo el cambio

    @ManyToOne
    @JoinColumn(name = "paciente_afectado_id", nullable = false)
    private Usuario pacienteAfectado;

    @Column(nullable = false, length = 100)
    private String accion; // Ej: MODIFICAR_HORARIO, CAMBIAR_DOSIS

    @Column(columnDefinition = "TEXT", nullable = false)
    private String motivoComentario; // El comentario obligatorio del médico

    @Column(name = "fecha_modificacion")
    private LocalDateTime fechaModificacion;

    @PrePersist
    public void prePersist() {
        this.fechaModificacion = LocalDateTime.now();
    }

    public AuditoriaCambio() {}

    // Getters y Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Usuario getUsuarioModifica() { return usuarioModifica; }
    public void setUsuarioModifica(Usuario usuarioModifica) { this.usuarioModifica = usuarioModifica; }
    public Usuario getPacienteAfectado() { return pacienteAfectado; }
    public void setPacienteAfectado(Usuario pacienteAfectado) { this.pacienteAfectado = pacienteAfectado; }
    public String getAccion() { return accion; }
    public void setAccion(String accion) { this.accion = accion; }
    public String getMotivoComentario() { return motivoComentario; }
    public void setMotivoComentario(String motivoComentario) { this.motivoComentario = motivoComentario; }
    public LocalDateTime getFechaModificacion() { return fechaModificacion; }
    public void setFechaModificacion(LocalDateTime fechaModificacion) { this.fechaModificacion = fechaModificacion; }
}
