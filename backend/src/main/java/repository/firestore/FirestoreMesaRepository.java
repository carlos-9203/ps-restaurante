package repository.firestore;

import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QuerySnapshot;
import model.Mesa;
import repository.interfaces.MesaRepository;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;
import java.util.stream.Collectors;

public class FirestoreMesaRepository extends AbstractFirestoreRepository<Mesa> implements MesaRepository {

    public FirestoreMesaRepository(Firestore db) {
        super(db, "mesas");
    }

    // --- Record Mapping Implementation ---

    @Override
    protected Mesa mapToEntity(String id, Map<String, Object> data) {
        return new Mesa(
            id,
            ((Long) data.getOrDefault("capacidad", 0L)).intValue()
        );
    }

    @Override
    protected Map<String, Object> entityToMap(Mesa mesa) {
        Map<String, Object> map = new HashMap<>();
        map.put("capacidad", mesa.capacidad());
        return map;
    }

    @Override
    protected String getEntityId(Mesa mesa) {
        return mesa.id();
    }

    @Override
    protected Mesa createWithId(Mesa mesa, String id) {
        return new Mesa(id, mesa.capacidad());
    }

    // --- MesaRepository Specific Implementation ---

    @Override
    public List<Mesa> findByCapacidad(int capacidad) {
        try {
            QuerySnapshot query = collection.whereEqualTo("capacidad", capacidad).get().get();
            return query.getDocuments().stream()
                    .map(doc -> mapToEntity(doc.getId(), doc.getData()))
                    .collect(Collectors.toList());
        } catch (InterruptedException | ExecutionException e) {
            throw new RuntimeException("Error fetching mesas by capacidad: " + capacidad, e);
        }
    }
}
