package repository.firestore;

import com.google.cloud.Timestamp;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QuerySnapshot;
import model.Cuenta;
import model.Notificacion;
import model.TipoNotificacion;
import repository.interfaces.NotificacionRepository;

import java.util.*;
import java.util.concurrent.ExecutionException;
import java.util.stream.Collectors;

public class FirestoreNotificacionRepository extends AbstractFirestoreRepository<Notificacion> implements NotificacionRepository {

    public FirestoreNotificacionRepository(Firestore db) {
        super(db, "notificaciones");
    }

    // --- Record Mapping Implementation ---

    @Override
    protected Notificacion mapToEntity(String id, Map<String, Object> data) {
        // Mapping Cuenta (Shallow but with correct Date and Reserva info)
        Map<String, Object> cuentaData = (Map<String, Object>) data.get("cuenta");
        Cuenta cuenta = null;
        if (cuentaData != null) {
            Timestamp tCuenta = (Timestamp) cuentaData.get("fecha_creacion");
            Date cFecha = (tCuenta != null) ? tCuenta.toDate() : new Date();

            // Mapping Shallow Reserva
            Map<String, Object> resData = (Map<String, Object>) cuentaData.get("reserva");
            Optional<Reserva> reserva = Optional.empty();
            if (resData != null) {
                reserva = Optional.of(new Reserva(
                    (String) resData.get("id"),
                    (String) resData.get("nombre"),
                    null, 0, null // Other fields omitted for shallow view
                ));
            }

            cuenta = new Cuenta(
                (String) cuentaData.get("id"),
                List.of(), 
                (Boolean) cuentaData.getOrDefault("payed", false),
                reserva,
                cFecha
            );
        }

        Timestamp timestamp = (Timestamp) data.get("fecha");
        Date fecha = (timestamp != null) ? timestamp.toDate() : new Date();

        return new Notificacion(
            id,
            cuenta,
            TipoNotificacion.valueOf((String) data.get("tipo")),
            (Boolean) data.getOrDefault("leida", false),
            fecha
        );
    }

    @Override
    protected Map<String, Object> entityToMap(Notificacion notificacion) {
        Map<String, Object> map = new HashMap<>();
        
        // Map shallow Cuenta info with its creation date and Reserva ID
        if (notificacion.cuenta() != null) {
            Map<String, Object> cuentaMap = new HashMap<>();
            cuentaMap.put("id", notificacion.cuenta().id());
            cuentaMap.put("payed", notificacion.cuenta().payed());
            cuentaMap.put("fecha_creacion", notificacion.cuenta().fecha_creacion());
            
            notificacion.cuenta().reserva().ifPresent(res -> {
                Map<String, Object> resMap = new HashMap<>();
                resMap.put("id", res.id());
                resMap.put("nombre", res.nombre());
                cuentaMap.put("reserva", resMap);
            });
            
            map.put("cuenta", cuentaMap);
        }

        map.put("tipo", notificacion.tipo().name());
        map.put("leida", notificacion.leida());
        map.put("fecha", notificacion.fecha());
        
        return map;
    }

    @Override
    protected String getEntityId(Notificacion notificacion) {
        return notificacion.id();
    }

    @Override
    protected Notificacion createWithId(Notificacion notificacion, String id) {
        return new Notificacion(
            id,
            notificacion.cuenta(),
            notificacion.tipo(),
            notificacion.leida(),
            notificacion.fecha()
        );
    }

    // --- NotificacionRepository Specific Implementation ---

    @Override
    public List<Notificacion> findByCuenta(Cuenta cuenta) {
        try {
            QuerySnapshot query = collection.whereEqualTo("cuenta.id", cuenta.id()).get().get();
            return query.getDocuments().stream()
                    .map(doc -> mapToEntity(doc.getId(), doc.getData()))
                    .collect(Collectors.toList());
        } catch (InterruptedException | ExecutionException e) {
            throw new RuntimeException("Error fetching notificaciones by cuenta", e);
        }
    }

    @Override
    public List<Notificacion> findByTipoNotificacion(TipoNotificacion tipoNotificacion) {
        try {
            QuerySnapshot query = collection.whereEqualTo("tipo", tipoNotificacion.name()).get().get();
            return query.getDocuments().stream()
                    .map(doc -> mapToEntity(doc.getId(), doc.getData()))
                    .collect(Collectors.toList());
        } catch (InterruptedException | ExecutionException e) {
            throw new RuntimeException("Error fetching notificaciones by tipo", e);
        }
    }

    @Override
    public List<Notificacion> findByLeida(boolean leida) {
        try {
            QuerySnapshot query = collection.whereEqualTo("leida", leida).get().get();
            return query.getDocuments().stream()
                    .map(doc -> mapToEntity(doc.getId(), doc.getData()))
                    .collect(Collectors.toList());
        } catch (InterruptedException | ExecutionException e) {
            throw new RuntimeException("Error fetching notificaciones by leida status", e);
        }
    }
}
