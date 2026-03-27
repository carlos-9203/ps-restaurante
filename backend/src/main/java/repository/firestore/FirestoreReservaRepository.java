package repository.firestore;

import model.Reserva;
import repository.interfaces.ReservaRepository;

import java.util.Date;
import java.util.List;
import java.util.Optional;

public class FirestoreReservaRepository implements ReservaRepository {
    @Override
    public List<Reserva> findByDate(Date date) {
        return List.of();
    }

    @Override
    public List<Reserva> findAll() {
        return List.of();
    }

    @Override
    public Optional<Reserva> findById(String s) {
        return Optional.empty();
    }

    @Override
    public Reserva save(Reserva entity) {
        return null;
    }

    @Override
    public Reserva update(String s, Reserva entity) {
        return null;
    }

    @Override
    public void deleteById(String s) {

    }

    @Override
    public boolean existsById(String s) {
        return false;
    }
}
