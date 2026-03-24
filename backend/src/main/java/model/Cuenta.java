package model;

import java.util.List;
import java.util.Optional;

public record Cuenta(int id, List<Mesa> mesas, boolean payed, Optional<Reserva> reserva) { }

