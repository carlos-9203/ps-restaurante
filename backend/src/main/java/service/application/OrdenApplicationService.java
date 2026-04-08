package service.application;

import model.Categoria;
import model.Orden;
import model.OrdenEstado;
import model.Pedido;
import model.Plato;
import repository.interfaces.OrdenRepository;
import repository.interfaces.PedidoRepository;
import repository.interfaces.PlatoRepository;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

public class OrdenApplicationService {

    private final OrdenRepository ordenRepository;
    private final PedidoRepository pedidoRepository;
    private final PlatoRepository platoRepository;
    private final PedidoApplicationService pedidoApplicationService;

    public OrdenApplicationService(
            OrdenRepository ordenRepository,
            PedidoRepository pedidoRepository,
            PlatoRepository platoRepository,
            PedidoApplicationService pedidoApplicationService
    ) {
        this.ordenRepository = ordenRepository;
        this.pedidoRepository = pedidoRepository;
        this.platoRepository = platoRepository;
        this.pedidoApplicationService = pedidoApplicationService;
    }

    public Orden crearOrdenDesdePedidoYPlato(String pedidoId, String platoId, String detalles) {
        Pedido pedido = pedidoRepository.findById(pedidoId)
                .orElseThrow(() -> new IllegalArgumentException("El pedido no existe"));

        Plato plato = platoRepository.findById(platoId)
                .orElseThrow(() -> new IllegalArgumentException("El plato no existe"));

        Orden orden = new Orden(
                null,
                pedido,
                plato,
                plato.precio(),
                OrdenEstado.Pendiente,
                Instant.now(),
                detalles == null ? "" : detalles.trim()
        );

        return ordenRepository.save(orden);
    }

    public List<Orden> crearOrdenesDesdePedido(String pedidoId, List<String> platosIds) {
        return crearOrdenesDesdePedido(pedidoId, platosIds, null);
    }

    public List<Orden> crearOrdenesDesdePedido(String pedidoId, List<String> platosIds, List<String> detalles) {
        if (platosIds == null || platosIds.isEmpty()) {
            throw new IllegalArgumentException("Debes indicar al menos un plato");
        }

        List<Orden> ordenes = new ArrayList<>();

        for (int i = 0; i < platosIds.size(); i++) {
            String platoId = platosIds.get(i);
            String detalle = "";

            if (detalles != null && i < detalles.size() && detalles.get(i) != null) {
                detalle = detalles.get(i);
            }

            Orden orden = crearOrdenDesdePedidoYPlato(pedidoId, platoId, detalle);
            ordenes.add(orden);
        }

        pedidoApplicationService.recalcularEstadoPedido(pedidoId);
        return ordenes;
    }

    public Orden obtenerOrdenPorId(String ordenId) {
        return ordenRepository.findById(ordenId)
                .orElseThrow(() -> new IllegalArgumentException("La orden no existe"));
    }

    public List<Orden> obtenerOrdenesDePedido(String pedidoId) {
        Pedido pedido = pedidoRepository.findById(pedidoId)
                .orElseThrow(() -> new IllegalArgumentException("El pedido no existe"));

        return ordenRepository.findAll().stream()
                .filter(orden -> orden.pedido() != null)
                .filter(orden -> orden.pedido().id() != null)
                .filter(orden -> orden.pedido().id().equals(pedido.id()))
                .toList();
    }

    public List<Orden> obtenerOrdenesPendientes() {
        return ordenRepository.findAll().stream()
                .filter(orden -> orden.ordenEstado() == OrdenEstado.Pendiente)
                .toList();
    }

    public List<Orden> obtenerOrdenesEnPreparacion() {
        return ordenRepository.findAll().stream()
                .filter(orden -> orden.ordenEstado() == OrdenEstado.Preparación)
                .toList();
    }

    public List<Orden> obtenerOrdenesListas() {
        return ordenRepository.findAll().stream()
                .filter(orden -> orden.ordenEstado() == OrdenEstado.Listo)
                .toList();
    }

    public List<Orden> obtenerOrdenesCocinaPendientes() {
        return obtenerOrdenesCocinaPorEstado(OrdenEstado.Pendiente);
    }

    public List<Orden> obtenerOrdenesCocinaEnPreparacion() {
        return obtenerOrdenesCocinaPorEstado(OrdenEstado.Preparación);
    }

    public List<Orden> obtenerOrdenesCocinaListas() {
        return obtenerOrdenesCocinaPorEstado(OrdenEstado.Listo);
    }

    public Orden marcarOrdenPendiente(String ordenId) {
        Orden orden = obtenerOrdenPorId(ordenId);

        Orden actualizada = new Orden(
                orden.id(),
                orden.pedido(),
                orden.plato(),
                orden.precio(),
                OrdenEstado.Pendiente,
                orden.fecha(),
                orden.detalles()
        );

        Orden guardada = ordenRepository.update(orden.id(), actualizada);
        pedidoApplicationService.recalcularEstadoPedido(orden.pedido().id());
        return guardada;
    }

    public Orden marcarOrdenEnPreparacion(String ordenId) {
        Orden orden = obtenerOrdenPorId(ordenId);

        Orden actualizada = new Orden(
                orden.id(),
                orden.pedido(),
                orden.plato(),
                orden.precio(),
                OrdenEstado.Preparación,
                orden.fecha(),
                orden.detalles()
        );

        Orden guardada = ordenRepository.update(orden.id(), actualizada);
        pedidoApplicationService.recalcularEstadoPedido(orden.pedido().id());
        return guardada;
    }

    public Orden marcarOrdenLista(String ordenId) {
        Orden orden = obtenerOrdenPorId(ordenId);

        Orden actualizada = new Orden(
                orden.id(),
                orden.pedido(),
                orden.plato(),
                orden.precio(),
                OrdenEstado.Listo,
                orden.fecha(),
                orden.detalles()
        );

        Orden guardada = ordenRepository.update(orden.id(), actualizada);
        pedidoApplicationService.recalcularEstadoPedido(orden.pedido().id());
        return guardada;
    }

    public boolean estanTodasListasLasOrdenes(String pedidoId) {
        List<Orden> ordenes = obtenerOrdenesDePedido(pedidoId);

        return !ordenes.isEmpty()
                && ordenes.stream().allMatch(orden -> orden.ordenEstado() == OrdenEstado.Listo);
    }

    private List<Orden> obtenerOrdenesCocinaPorEstado(OrdenEstado estado) {
        return ordenRepository.findAll().stream()
                .filter(orden -> orden.ordenEstado() == estado)
                .filter(orden -> orden.plato() != null)
                .filter(orden -> orden.plato().categoria() != null)
                .filter(orden -> orden.plato().categoria() != Categoria.Bebida)
                .sorted((a, b) -> a.fecha().compareTo(b.fecha()))
                .toList();
    }
}