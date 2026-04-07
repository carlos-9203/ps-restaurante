import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Header } from '../../../shared/components/header/header';

interface Plato {
  id: number;
  nombre: string;
  cantidad: number;
}

@Component({
  selector: 'app-menu-page',
  standalone: true,
  //Importamos el HeaderComponent para poder usar su etiqueta
  imports: [CommonModule, Header],
  templateUrl: './menu-page.html',
  styleUrls: ['./menu-page.css'],
})
export class MenuPage {
  // Simulamos 9 platos vacíos
  // Ahora nuestros platos tienen id, nombre y cantidad
  platos = signal<Plato[]>([
    { id: 1, nombre: 'Forem ipsum', cantidad: 0 },
    { id: 2, nombre: 'Forem ipsum', cantidad: 0 },
    { id: 3, nombre: 'Forem ipsum', cantidad: 0 },
    { id: 4, nombre: 'Forem ipsum', cantidad: 0 },
    { id: 5, nombre: 'Forem ipsum', cantidad: 0 },
    { id: 6, nombre: 'Forem ipsum', cantidad: 0 },
    { id: 7, nombre: 'Forem ipsum', cantidad: 0 },
    { id: 8, nombre: 'Forem ipsum', cantidad: 0 },
    { id: 9, nombre: 'Forem ipsum', cantidad: 0 },
  ]);

  // Función para sumar platos
  incrementar(id: number) {
    this.platos.update((lista) =>
      lista.map((plato) => (plato.id === id ? { ...plato, cantidad: plato.cantidad + 1 } : plato)),
    );
  }

  // Función para restar platos
  decrementar(id: number) {
    this.platos.update((lista) =>
      lista.map((plato) =>
        plato.id === id && plato.cantidad > 0 ? { ...plato, cantidad: plato.cantidad - 1 } : plato,
      ),
    );
  }
}
