import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Header } from '../../../shared/components/header/header';
import { OrderService } from '../../../shared/services/order';

@Component({
  selector: 'app-bill-page',
  standalone: true,
  imports: [CommonModule, Header],
  templateUrl: './bill-page.html',
  styleUrls: ['./bill-page.css'],
})
export class BillPage {
  readonly viewMode = signal<'normal' | 'dividida'>('normal');
  readonly showDetailPopup = signal(false);

  private readonly orderService = inject(OrderService);

  readonly pedidos = this.orderService.pedidosConfirmados;

  readonly totalNormal = computed(() => {
    return this.pedidos().reduce(
      (acc, item) => acc + item.cantidad * item.precioUnitario,
      0,
    );
  });

  readonly pedidosSeleccionados = computed(() => {
    return this.pedidos()
      .map((item) => {
        const seleccionados = item.subItems.filter((s) => s.seleccionado).length;
        return {
          nombre: item.nombre,
          cantidad: seleccionados,
          precioUnitario: item.precioUnitario,
        };
      })
      .filter((item) => item.cantidad > 0);
  });

  readonly totalDividida = computed(() => {
    return this.pedidosSeleccionados().reduce(
      (acc, item) => acc + item.cantidad * item.precioUnitario,
      0,
    );
  });

  cambiarVista(vista: 'normal' | 'dividida'): void {
    this.viewMode.set(vista);
    this.showDetailPopup.set(false);
  }

  toggleSubItem(itemIndex: number, subItemId: string): void {
    this.pedidos.update((lista) => {
      const nuevaLista = [...lista];
      const subItem = nuevaLista[itemIndex].subItems.find((s) => s.id === subItemId);

      if (subItem) {
        subItem.seleccionado = !subItem.seleccionado;
      }

      return nuevaLista;
    });
  }

  abrirDetalle(): void {
    this.showDetailPopup.set(true);
  }

  cerrarDetalle(): void {
    this.showDetailPopup.set(false);
  }

  cantidadSeleccionada(itemIndex: number): number {
    return this.pedidos()[itemIndex].subItems.filter((s) => s.seleccionado).length;
  }
}
