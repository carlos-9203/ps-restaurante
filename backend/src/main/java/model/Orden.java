package model;

import java.time.LocalDate;

public record Orden(Pedido pedido, Plato plato, double price, OrdenEstado ordenEstado, LocalDate localDate, String Detalles){}
