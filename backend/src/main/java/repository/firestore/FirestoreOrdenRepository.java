package repository.firestore;

import com.google.cloud.Timestamp;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QuerySnapshot;
import model.*;
import repository.interfaces.OrdenRepository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.*;
import java.util.concurrent.ExecutionException;
import java.util.stream.Collectors;

public class FirestoreOrdenRepository extends AbstractFirestoreRepository<Orden> implements OrdenRepository {

    public FirestoreOrdenRepository(Firestore db) {
        super(db, "ordenes");
    }

    // --- Record Mapping Implementation ---

    @Override
    protected Orden mapToEntity(String id, Map<String, Object> data) {
        // Mapping Price (Cents -> BigDecimal)
        Object priceObj = data.get("price");
        BigDecimal price = BigDecimal.ZERO;
        if (priceObj instanceof Number) {
            price = BigDecimal.valueOf(((Number) priceObj).longValue(), 2);
        }

        // Mapping Pedido (Shallow)
        Map<String, Object> pedidoData = (Map<String, Object>) data.get("pedido");
        Pedido pedido = null;
        if (pedidoData != null) {
            Timestamp tPedido = (Timestamp) pedidoData.get("localDate");
            LocalDate pDate = (tPedido != null) 
                ? tPedido.toDate().toInstant().atZone(ZoneId.systemDefault()).toLocalDate()
                : LocalDate.now();

            pedido = new Pedido(
                (String) pedidoData.get("id"),
                null, // Cuenta omitted
                PedidoEstado.valueOf((String) pedidoData.get("pedidoEstado")),
                pDate
            );
        }

        // Mapping Plato (Shallow but with Category)
        Map<String, Object> platoData = (Map<String, Object>) data.get("plato");
        Plato plato = null;
        if (platoData != null) {
            String catName = (String) platoData.get("categoria");
            Categoria categoria = (catName != null) ? Categoria.valueOf(catName) : Categoria.Principal;

            plato = new Plato(
                (String) platoData.get("id"),
                (String) platoData.get("nombre"),
                categoria,
                null, // Descripcion omitted
                BigDecimal.ZERO, // Price omitted
                true // Activo default
            );
        }

        Timestamp timestamp = (Timestamp) data.get("fecha");
        Date fecha = (timestamp != null) ? timestamp.toDate() : new Date();

        return new Orden(
            id,
            pedido,
            plato,
            price,
            OrdenEstado.valueOf((String) data.get("ordenEstado")),
            fecha,
            (String) data.get("detalles")
        );
    }

    @Override
    protected Map<String, Object> entityToMap(Orden orden) {
        Map<String, Object> map = new HashMap<>();
        
        // Map Price to Cents (Long)
        long priceInCents = orden.price().movePointRight(2).longValue();
        map.put("price", priceInCents);

        // Map Shallow Pedido
        if (orden.pedido() != null) {
            Map<String, Object> pedidoMap = new HashMap<>();
            pedidoMap.put("id", orden.pedido().id());
            pedidoMap.put("pedidoEstado", orden.pedido().pedidoEstado().name());
            
            // Map LocalDate to Date (Firestore auto-converts Date to Timestamp)
            Date pDate = Date.from(orden.pedido().localDate().atStartOfDay(ZoneId.systemDefault()).toInstant());
            pedidoMap.put("localDate", pDate);
            
            map.put("pedido", pedidoMap);
        }

        // Map Shallow Plato
        if (orden.plato() != null) {
            Map<String, Object> platoMap = new HashMap<>();
            platoMap.put("id", orden.plato().id());
            platoMap.put("nombre", orden.plato().nombre());
            platoMap.put("categoria", orden.plato().categoria().name());
            map.put("plato", platoMap);
        }

        map.put("ordenEstado", orden.ordenEstado().name());
        map.put("fecha", orden.fecha());
        map.put("detalles", orden.detalles());
        
        return map;
    }

    @Override
    protected String getEntityId(Orden orden) {
        return orden.id();
    }

    @Override
    protected Orden createWithId(Orden orden, String id) {
        return new Orden(
            id,
            orden.pedido(),
            orden.plato(),
            orden.price(),
            orden.ordenEstado(),
            orden.fecha(),
            orden.detalles()
        );
    }

    // --- OrdenRepository Specific Implementation ---

    @Override
    public List<Orden> findByPedido(Pedido pedido) {
        try {
            QuerySnapshot query = collection.whereEqualTo("pedido.id", pedido.id()).get().get();
            return query.getDocuments().stream()
                    .map(doc -> mapToEntity(doc.getId(), doc.getData()))
                    .collect(Collectors.toList());
        } catch (InterruptedException | ExecutionException e) {
            throw new RuntimeException("Error fetching ordenes by pedido", e);
        }
    }

    @Override
    public List<Orden> findByEstado(OrdenEstado estado) {
        try {
            QuerySnapshot query = collection.whereEqualTo("ordenEstado", estado.name()).get().get();
            return query.getDocuments().stream()
                    .map(doc -> mapToEntity(doc.getId(), doc.getData()))
                    .collect(Collectors.toList());
        } catch (InterruptedException | ExecutionException e) {
            throw new RuntimeException("Error fetching ordenes by estado", e);
        }
    }
}
