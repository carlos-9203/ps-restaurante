package repository.interfaces;

import model.Mesa;

import java.util.List;

public interface MesaRepository extends Repository<Mesa, String> {
    List<Mesa> findByCapacidad(int capacidad);
}
