package repository.firestore;

import com.google.cloud.Timestamp;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QuerySnapshot;
import model.Cuenta;
import model.Mesa;
import model.Reserva;
import repository.interfaces.CuentaRepository;

import java.util.*;
import java.util.concurrent.ExecutionException;
import java.util.stream.Collectors;

public class FirestoreCuentaRepository extends AbstractFirestoreRepository<Cuenta> implements CuentaRepository {

    public FirestoreCuentaRepository(Firestore db) {
        super(db, "cuentas");
    }

    // --- Record Mapping Implementation ---

    @Override
    protected Cuenta mapToEntity(String id, Map<String, Object> data) {
        // We map the list of Mesas from the data (assuming IDs/basic data stored)
        List<Map<String, Object>> mesasData = (List<Map<String, Object>>) data.getOrDefault("mesas", List.of());
        List<Mesa> mesas = mesasData.stream()
                .map(m -> new Mesa(
                        (String) m.get("id"),
                        ((Long) m.getOrDefault("capacidad", 0L)).intValue()
                ))
                .collect(Collectors.toList());

        // We handle Optional Reserva
        Map<String, Object> reservaData = (Map<String, Object>) data.get("reserva");
        Optional<Reserva> reserva = Optional.empty();
        if (reservaData != null) {
            Timestamp tFecha = (Timestamp) reservaData.get("fecha");
            Timestamp tCreacion = (Timestamp) reservaData.get("fecha_creacion");
            reserva = Optional.of(new Reserva(
                    (String) reservaData.get("id"),
                    (String) reservaData.get("nombre"),
                    (tFecha != null) ? tFecha.toDate() : null,
                    ((Long) reservaData.getOrDefault("capacidad", 0L)).intValue(),
                    (tCreacion != null) ? tCreacion.toDate() : new Date()
            ));
        }

        Timestamp tCreacion = (Timestamp) data.get("fecha_creacion");
        return new Cuenta(
                id,
                mesas,
                (Boolean) data.getOrDefault("payed", false),
                reserva,
                (tCreacion != null) ? tCreacion.toDate() : new Date()
        );
    }

    @Override
    protected Map<String, Object> entityToMap(Cuenta cuenta) {
        Map<String, Object> map = new HashMap<>();
        
        // Map List of Mesas to List of Maps
        List<Map<String, Object>> mesasMap = cuenta.mesas().stream()
                .map(m -> {
                    Map<String, Object> mesaMap = new HashMap<>();
                    mesaMap.put("id", m.id());
                    mesaMap.put("capacidad", m.capacidad());
                    return mesaMap;
                })
                .collect(Collectors.toList());
        
        map.put("mesas", mesasMap);
        map.put("payed", cuenta.payed());
        map.put("fecha_creacion", cuenta.fecha_creacion());

        // Map Optional Reserva
        cuenta.reserva().ifPresent(res -> {
            Map<String, Object> resMap = new HashMap<>();
            resMap.put("id", res.id());
            resMap.put("nombre", res.nombre());
            resMap.put("fecha", res.fecha());
            resMap.put("capacidad", res.capacidad());
            resMap.put("fecha_creacion", res.fecha_creacion());
            map.put("reserva", resMap);
        });

        return map;
    }

    @Override
    protected String getEntityId(Cuenta cuenta) {
        return cuenta.id();
    }

    @Override
    protected Cuenta createWithId(Cuenta cuenta, String id) {
        return new Cuenta(
                id,
                cuenta.mesas(),
                cuenta.payed(),
                cuenta.reserva(),
                cuenta.fecha_creacion()
        );
    }

    // --- CuentaRepository Specific Implementation ---

    @Override
    public Optional<Cuenta> findByMesa(Mesa mesa) {
        // In Firestore, searching inside a list of objects (mesas) is done with array-contains
        try {
            // Note: This requires the exact same object map. If mesas change frequently, 
            // it's better to store just the IDs of the mesas in a field like "mesa_ids".
            // For now, we follow the current record structure.
            QuerySnapshot query = collection.whereArrayContains("mesas", Map.of(
                    "id", mesa.id(),
                    "capacidad", mesa.capacidad()
            )).get().get();
            
            return query.getDocuments().stream()
                    .map(doc -> mapToEntity(doc.getId(), doc.getData()))
                    .findFirst();
        } catch (InterruptedException | ExecutionException e) {
            throw new RuntimeException("Error fetching cuenta by mesa", e);
        }
    }

    @Override
    public List<Cuenta> findByPayed(Boolean payed) {
        try {
            QuerySnapshot query = collection.whereEqualTo("payed", payed).get().get();
            return query.getDocuments().stream()
                    .map(doc -> mapToEntity(doc.getId(), doc.getData()))
                    .collect(Collectors.toList());
        } catch (InterruptedException | ExecutionException e) {
            throw new RuntimeException("Error fetching cuentas by payed status", e);
        }
    }
}
