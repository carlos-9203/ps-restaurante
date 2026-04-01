package repository.firestore;

import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QuerySnapshot;
import com.google.cloud.Timestamp;
import model.Rol;
import model.Usuario;
import repository.interfaces.UsuarioRepository;

import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;
import java.util.stream.Collectors;

public class FirestoreUsuarioRepository extends AbstractFirestoreRepository<Usuario> implements UsuarioRepository {

    public FirestoreUsuarioRepository(Firestore db) {
        super(db, "usuarios");
    }

    // --- Record Mapping Implementation ---

    @Override
    protected Usuario mapToEntity(String id, Map<String, Object> data) {
        // We handle Firestore Timestamps to convert them back to java.util.Date
        Timestamp timestamp = (Timestamp) data.get("fecha_creacion");
        Date fechaCreacion = (timestamp != null) ? timestamp.toDate() : new Date();

        return new Usuario(
            id,
            (String) data.get("username"),
            (String) data.get("password"),
            Rol.valueOf((String) data.get("rol")),
            fechaCreacion
        );
    }

    @Override
    protected Map<String, Object> entityToMap(Usuario usuario) {
        return Map.of(
            "username", usuario.username(),
            "password", usuario.password(),
            "rol", usuario.rol().name(),
            "fecha_creacion", usuario.fecha_creacion() // Firestore automatically converts Date to Timestamp
        );
    }

    @Override
    protected String getEntityId(Usuario usuario) {
        return usuario.id();
    }

    @Override
    protected Usuario createWithId(Usuario usuario, String id) {
        return new Usuario(
            id,
            usuario.username(),
            usuario.password(),
            usuario.rol(),
            usuario.fecha_creacion()
        );
    }

    // --- UsuarioRepository Specific Implementation ---

    @Override
    public List<Usuario> findByNombre(String nombre) {
        try {
            QuerySnapshot query = collection.whereEqualTo("username", nombre).get().get();
            return query.getDocuments().stream()
                    .map(doc -> mapToEntity(doc.getId(), doc.getData()))
                    .collect(Collectors.toList());
        } catch (InterruptedException | ExecutionException e) {
            throw new RuntimeException("Error fetching usuarios by nombre: " + nombre, e);
        }
    }

    @Override
    public List<Usuario> findByRol(Rol rol) {
        try {
            QuerySnapshot query = collection.whereEqualTo("rol", rol.name()).get().get();
            return query.getDocuments().stream()
                    .map(doc -> mapToEntity(doc.getId(), doc.getData()))
                    .collect(Collectors.toList());
        } catch (InterruptedException | ExecutionException e) {
            throw new RuntimeException("Error fetching usuarios by rol: " + rol, e);
        }
    }
}
