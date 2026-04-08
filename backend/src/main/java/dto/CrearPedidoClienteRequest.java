package dto;

import java.util.List;

public class CrearPedidoClienteRequest {

    public List<ItemPedidoRequest> items;

    public static class ItemPedidoRequest {
        public String platoId;
        public Integer cantidad;
        public String detalles;
    }
}