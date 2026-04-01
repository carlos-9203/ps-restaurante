package repository.firestore;

import com.google.cloud.Timestamp;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QuerySnapshot;
import model.Cuenta;
import model.Mesa;
import model.Pedido;
import model.PedidoEstado;
import model.Reserva;
import repository.interfaces.PedidoRepository;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.*;
import java.util.concurrent.ExecutionException;
import java.util.stream.Collectors;

public class FirestorePedidoRepository extends AbstractFirestoreRepository<Pedido> implements PedidoRepository {

    public FirestorePedidoRepository(Firestore db) {
        super(db, "pedidos");
    }

    // --- Record Mapping Implementation ---

    @Override
    protected Pedido mapToEntity(String id, Map<String, Object> data) {
        // Mapping Date (LocalDate) from Firestore Timestamp
        Timestamp timestamp = (Timestamp) data.get("localDate");
        LocalDate date = (timestamp != null) 
            ? timestamp.toDate().toInstant().atZone(ZoneId.systemDefault()).toLocalDate() 
            : LocalDate.now();

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

        return new Pedido(
            id,
            cuenta,
            PedidoEstado.valueOf((String) data.get("pedidoEstado")),
            date
        );
    }

    @Override
    protected Map<String, Object> entityToMap(Pedido pedido) {
        Map<String, Object> map = new HashMap<>();
        
        // Map shallow Cuenta info with its creation date and Reserva ID
        if (pedido.cuenta() != null) {
            Map<String, Object> cuentaMap = new HashMap<>();
            cuentaMap.put("id", pedido.cuenta().id());
            cuentaMap.put("payed", pedido.cuenta().payed());
            cuentaMap.put("fecha_creacion", pedido.cuenta().fecha_creacion());
            
            pedido.cuenta().reserva().ifPresent(res -> {
                Map<String, Object> resMap = new HashMap<>();
                resMap.put("id", res.id());
                resMap.put("nombre", res.nombre());
                cuentaMap.put("reserva", resMap);
            });
            
            map.put("cuenta", cuentaMap);
        }

        map.put("pedidoEstado", pedido.pedidoEstado().name());
        
        // Map LocalDate to Date (Firestore auto-converts Date to Timestamp)
        Date date = Date.from(pedido.localDate().atStartOfDay(ZoneId.systemDefault()).toInstant());
        map.put("localDate", date);
        
        return map;
    }

    @Override
    protected String getEntityId(Pedido pedido) {
        return pedido.id();
    }

    @Override
    protected Pedido createWithId(Pedido pedido, String id) {
        return new Pedido(
            id,
            pedido.cuenta(),
            pedido.pedidoEstado(),
            pedido.localDate()
        );
    }

    // --- PedidoRepository Specific Implementation ---

    @Override
    public List<Pedido> findByCuenta(Cuenta cuenta) {
        try {
            // We search by the Cuenta ID stored in the nested map
            QuerySnapshot query = collection.whereEqualTo("cuenta.id", cuenta.id()).get().get();
            return query.getDocuments().stream()
                    .map(doc -> mapToEntity(doc.getId(), doc.getData()))
                    .collect(Collectors.toList());
        } catch (InterruptedException | ExecutionException e) {
            throw new RuntimeException("Error fetching pedidos by cuenta", e);
        }
    }

    @Override
    public List<Pedido> findByEstado(PedidoEstado estado) {
        try {
            QuerySnapshot query = collection.whereEqualTo("pedidoEstado", estado.name()).get().get();
            return query.getDocuments().stream()
                    .map(doc -> mapToEntity(doc.getId(), doc.getData()))
                    .collect(Collectors.toList());
        } catch (InterruptedException | ExecutionException e) {
            throw new RuntimeException("Error fetching pedidos by estado", e);
        }
    }
}
