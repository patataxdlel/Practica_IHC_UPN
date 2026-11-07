package pe.minsa.gestionmedicamentos.service;

import org.springframework.stereotype.Service;
import pe.minsa.gestionmedicamentos.model.Usuario;
import pe.minsa.gestionmedicamentos.repository.UsuarioRepository;

import java.util.List;
import java.util.Optional;

@Service
public class UsuarioService {
    
    private final UsuarioRepository usuarioRepository;

    public UsuarioService(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    // Listar todos los usuarios
    public List<Usuario> listarUsuarios() {
        return usuarioRepository.findAll();
    }

    // Buscar usuario por ID
    public Optional<Usuario> obtenerPorId(Long id) {
        return usuarioRepository.findById(id);
    }

    // Buscar por DNI
    public Optional<Usuario> obtenerPorDni(String dni) {
        return usuarioRepository.findByDni(dni);
    }

    // Registrar nuevo usuario (Paciente, Cuidador o Médico)
    public Usuario registrarUsuario(Usuario usuario) {
        // Validar si el DNI ya está registrado
        if (usuarioRepository.findByDni(usuario.getDni()).isPresent()) {
            throw new RuntimeException("El DNI ya se encuentra registrado en el sistema.");
        }
        // Validar si el correo ya está registrado
        if (usuarioRepository.findByEmail(usuario.getEmail()).isPresent()) {
            throw new RuntimeException("El correo electrónico ya está en uso.");
        }
        return usuarioRepository.save(usuario);
    }
}
