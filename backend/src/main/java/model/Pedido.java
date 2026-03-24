package model;

import java.time.LocalDate;


public record Pedido(int id, Cuenta cuenta, PedidoEstado pedidoEstado, LocalDate localDate){}

