import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Header } from '../../../shared/components/header/header';

interface ItemCuenta {
  nombre: string;
  cantidad: number;
  precioUnitario: number;
}

@Component({
  selector: 'app-bill-page',
  standalone: true,
  imports: [CommonModule, Header],
  templateUrl: './bill-page.html',
  styleUrls: ['./bill-page.css'],
})
export class BillPage {
  // Datos simulados, lo que el cliente ha pedido
  pedidos = signal<ItemCuenta[]>([
    { nombre: 'Sorem ipsum dolor sit amet.', cantidad: 2, precioUnitario: 4.85 }, // 9.7
    { nombre: 'Sorem ipsum dolor sit amet.', cantidad: 2, precioUnitario: 1.65 }, // 3.3
    { nombre: 'Sorem ipsum dolor sit amet.', cantidad: 1, precioUnitario: 5.0 }, // 5
    { nombre: 'Sorem ipsum dolor sit amet.', cantidad: 1, precioUnitario: 13.22 }, // 13.22
    { nombre: 'Sorem ipsum dolor sit amet.', cantidad: 3, precioUnitario: 5.1 }, // 15.3
    { nombre: 'Sorem ipsum dolor sit amet.', cantidad: 2, precioUnitario: 3.85 }, // 7.7
    { nombre: 'Sorem ipsum dolor sit amet.', cantidad: 5, precioUnitario: 3.27 }, // 16.35
  ]);

  total = computed(() => {
    return this.pedidos().reduce(
      (acumulado, item) => acumulado + item.cantidad * item.precioUnitario,
      0,
    );
  });
}
