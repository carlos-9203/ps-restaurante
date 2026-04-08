package util;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import dto.PlatoRequest;
import model.Plato;
import repository.firestore.FirestorePlatoRepository;
import service.PlatoService;

import java.io.InputStream;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

public final class PlatoSeeder {

    private PlatoSeeder() {
    }

    public static void seed(FirestorePlatoRepository platoRepository) {
        try {
            ObjectMapper objectMapper = new ObjectMapper();

            InputStream inputStream = PlatoSeeder.class
                    .getClassLoader()
                    .getResourceAsStream("platos.json");

            if (inputStream == null) {
                throw new IllegalStateException("No se encontró el fichero platos.json en resources");
            }

            List<PlatoRequest> platosBase = objectMapper.readValue(
                    inputStream,
                    new TypeReference<List<PlatoRequest>>() {}
            );

            PlatoService platoService = new PlatoService(platoRepository);

            Set<String> clavesExistentes = platoRepository.findAll().stream()
                    .map(plato -> normalizarClave(plato.nombre(), plato.categoria().name()))
                    .collect(Collectors.toSet());

            for (PlatoRequest request : platosBase) {
                String clave = normalizarClave(request.nombre, request.categoria);

                if (!clavesExistentes.contains(clave)) {
                    Plato creado = platoService.create(request);
                    clavesExistentes.add(normalizarClave(creado.nombre(), creado.categoria().name()));
                }
            }

        } catch (Exception e) {
            throw new RuntimeException("Error al cargar los platos iniciales", e);
        }
    }

    private static String normalizarClave(String nombre, String categoria) {
        return nombre.trim().toLowerCase() + "::" + categoria.trim().toLowerCase();
    }
}