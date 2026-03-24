package model;

import java.time.LocalDate;

public record Reserva(String nombre, LocalDate fecha, int capacidad) { }
