package repository.firestore;

import com.google.cloud.Timestamp;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QuerySnapshot;
import model.Reserva;
import repository.interfaces.ReservaRepository;

import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;
import java.util.stream.Collectors;

public class FirestoreReservaRepository extends AbstractFirestoreRepository<Reserva> implements ReservaRepository {

    public FirestoreReservaRepository(Firestore db) {
        super(db, "reservas");
    }

    // --- Record Mapping Implementation ---

    @Override
    protected Reserva mapToEntity(String id, Map<String, Object> data) {
        Timestamp timestampFecha = (Timestamp) data.get("fecha");
        Timestamp timestampCreacion = (Timestamp) data.get("fecha_creacion");

        return new Reserva(
            id,
            (String) data.get("nombre"),
            (timestampFecha != null) ? timestampFecha.toDate() : null,
            ((Long) data.getOrDefault("capacidad", 0L)).intValue(),
            (timestampCreacion != null) ? timestampCreacion.toDate() : new Date()
        );
    }

    @Override
    protected Map<String, Object> entityToMap(Reserva reserva) {
        return Map.of(
            "nombre", reserva.nombre(),
            "fecha", reserva.fecha(), // Auto-convert to Timestamp
            "capacidad", reserva.capacidad(),
            "fecha_creacion", reserva.fecha_creacion() // Auto-convert to Timestamp
        );
    }

    @Override
    protected String getEntityId(Reserva reserva) {
        return reserva.id();
    }

    @Override
    protected Reserva createWithId(Reserva reserva, String id) {
        return new Reserva(
            id,
            reserva.nombre(),
            reserva.fecha(),
            reserva.capacidad(),
            reserva.fecha_creacion()
        );
    }

    // --- ReservaRepository Specific Implementation ---

    @Override
    public List<Reserva> findByDate(Date date) {
        try {
            // Firestore directly compares java.util.Date as Timestamps
            QuerySnapshot query = collection.whereEqualTo("fecha", date).get().get();
            return query.getDocuments().stream()
                    .map(doc -> mapToEntity(doc.getId(), doc.getData()))
                    .collect(Collectors.toList());
        } catch (InterruptedException | ExecutionException e) {
            throw new RuntimeException("Error fetching reservas by date: " + date, e);
        }
    }
}
