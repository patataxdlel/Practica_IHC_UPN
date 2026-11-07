package pe.minsa.gestionmedicamentos.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.minsa.gestionmedicamentos.model.Usuario;
import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    Optional<Usuario> findByDni(String dni);
    Optional<Usuario> findByEmail(String email);
}
