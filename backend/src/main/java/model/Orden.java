package model;

import java.math.BigDecimal;
import java.time.LocalDate;

public record Orden(String id, Pedido pedido, Plato plato, BigDecimal price, OrdenEstado ordenEstado, LocalDate fecha, String Detalles){}
