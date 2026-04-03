package service.application;

import model.Cuenta;
import model.Orden;
import model.OrdenEstado;
import model.Pedido;
import model.PedidoEstado;
import repository.interfaces.CuentaRepository;
import repository.interfaces.OrdenRepository;
import repository.interfaces.PedidoRepository;

import java.time.Instant;
import java.util.List;

public class PedidoApplicationService {

    private final PedidoRepository pedidoRepository;
    private final CuentaRepository cuentaRepository;
    private final OrdenRepository ordenRepository;
    private final MesaApplicationService mesaApplicationService;

    public PedidoApplicationService(
            PedidoRepository pedidoRepository,
            CuentaRepository cuentaRepository,
            OrdenRepository ordenRepository,
            MesaApplicationService mesaApplicationService
    ) {
        this.pedidoRepository = pedidoRepository;
        this.cuentaRepository = cuentaRepository;
        this.ordenRepository = ordenRepository;
        this.mesaApplicationService = mesaApplicationService;
    }

    /**
     * Crea un pedido en la cuenta activa de una mesa.
     */
    public Pedido crearPedidoDesdeMesa(String mesaId) {
        Cuenta cuenta = mesaApplicationService.obtenerCuentaActivaDeMesa(mesaId)
                .orElseThrow(() -> new IllegalArgumentException("La mesa no tiene cuenta activa"));

        return crearPedidoEnCuenta(cuenta.id());
    }

    /**
     * Crea un pedido en una cuenta concreta.
     */
    public Pedido crearPedidoEnCuenta(String cuentaId) {
        Cuenta cuenta = cuentaRepository.findById(cuentaId)
                .orElseThrow(() -> new IllegalArgumentException("La cuenta no existe"));

        if (cuenta.estaPagada()) {
            throw new IllegalArgumentException("No se puede crear un pedido en una cuenta pagada");
        }

        Pedido nuevoPedido = new Pedido(
                null,
                cuenta,
                PedidoEstado.Pendiente,
                Instant.now()
        );

        return pedidoRepository.save(nuevoPedido);
    }

    /**
     * Devuelve un pedido por id.
     */
    public Pedido obtenerPedidoPorId(String pedidoId) {
        return pedidoRepository.findById(pedidoId)
                .orElseThrow(() -> new IllegalArgumentException("El pedido no existe"));
    }

    /**
     * Devuelve todos los pedidos de una cuenta.
     */
    public List<Pedido> obtenerPedidosDeCuenta(String cuentaId) {
        Cuenta cuenta = cuentaRepository.findById(cuentaId)
                .orElseThrow(() -> new IllegalArgumentException("La cuenta no existe"));

        return pedidoRepository.findAll().stream()
                .filter(pedido -> pedido.cuenta() != null)
                .filter(pedido -> pedido.cuenta().id() != null)
                .filter(pedido -> pedido.cuenta().id().equals(cuenta.id()))
                .toList();
    }

    /**
     * Devuelve los pedidos de la cuenta activa de una mesa.
     */
    public List<Pedido> obtenerPedidosActivosDeMesa(String mesaId) {
        Cuenta cuenta = mesaApplicationService.obtenerCuentaActivaDeMesa(mesaId)
                .orElseThrow(() -> new IllegalArgumentException("La mesa no tiene cuenta activa"));

        return obtenerPedidosDeCuenta(cuenta.id());
    }

    /**
     * Un pedido está listo si todas sus órdenes están en estado Listo.
     * Si no tiene órdenes, se mantiene Pendiente.
     */
    public Pedido recalcularEstadoPedido(String pedidoId) {
        Pedido pedido = obtenerPedidoPorId(pedidoId);

        List<Orden> ordenes = ordenRepository.findAll().stream()
                .filter(orden -> orden.pedido() != null)
                .filter(orden -> orden.pedido().id() != null)
                .filter(orden -> orden.pedido().id().equals(pedido.id()))
                .toList();

        boolean todasListas = !ordenes.isEmpty()
                && ordenes.stream().allMatch(o -> o.ordenEstado() == OrdenEstado.Listo);

        Pedido actualizado = new Pedido(
                pedido.id(),
                pedido.cuenta(),
                todasListas ? PedidoEstado.Listo : PedidoEstado.Pendiente,
                pedido.fechaPedido()
        );

        return pedidoRepository.update(pedido.id(), actualizado);
    }

    /**
     * Devuelve true si el pedido está listo.
     */
    public boolean pedidoEstaListo(String pedidoId) {
        Pedido pedido = obtenerPedidoPorId(pedidoId);
        return pedido.pedidoEstado() == PedidoEstado.Listo;
    }
}