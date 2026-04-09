import { TarjetaPedidoComponent } from '../../components/tarjeta-pedido/tarjeta-pedido';
import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Pedido } from '../../models/pedido.model';

@Component({
  selector: 'app-bebidas',
  standalone: true,
  imports: [CommonModule, TarjetaPedidoComponent],
  templateUrl: './bebidas.html',
  styleUrl: './bebidas.css',
})
export class BebidasComponent {
  pedidos = signal<Pedido[]>([
    {
      id: '1',
      mesa: 5,
      estado: 'pendiente',
      tiempo: '5 min',
      items: [
        { cantidad: 2, nombre: 'Cervezas Tropical' },
        { cantidad: 2, nombre: 'Cliper de Fresa' },
        { cantidad: 1, nombre: 'Botella de vino Yaiza' },
      ],
    },
    // Ponemos uno en 'preparando' para que veas el nuevo color
    {
      id: '2',
      mesa: 15,
      estado: 'preparando',
      tiempo: '5 min',
      items: [
        { cantidad: 2, nombre: 'Cervezas Tropical' },
        { cantidad: 2, nombre: 'Cliper de Fresa' },
        { cantidad: 1, nombre: 'Botella de vino Yaiza' },
      ],
    },
    {
      id: '3',
      mesa: 1,
      estado: 'pendiente',
      tiempo: '5 min',
      items: [
        { cantidad: 2, nombre: 'Cervezas Tropical' },
        { cantidad: 2, nombre: 'Cliper de Fresa' },
        { cantidad: 1, nombre: 'Botella de vino Yaiza' },
      ],
    },
    {
      id: '4',
      mesa: 9,
      estado: 'listo',
      tiempo: '5 min',
      items: [
        { cantidad: 2, nombre: 'Cervezas Tropical' },
        { cantidad: 2, nombre: 'Cliper de Fresa' },
        { cantidad: 1, nombre: 'Botella de vino Yaiza' },
      ],
    },
    {
      id: '5',
      mesa: 20,
      estado: 'listo',
      tiempo: '5 min',
      items: [
        { cantidad: 2, nombre: 'Cervezas Tropical' },
        { cantidad: 2, nombre: 'Cliper de Fresa' },
        { cantidad: 1, nombre: 'Botella de vino Yaiza' },
      ],
    },
    {
      id: '6',
      mesa: 12,
      estado: 'listo',
      tiempo: '5 min',
      items: [
        { cantidad: 2, nombre: 'Cervezas Tropical' },
        { cantidad: 2, nombre: 'Cliper de Fresa' },
        { cantidad: 1, nombre: 'Botella de vino Yaiza' },
      ],
    },
  ]);

  private audioNotificacion = new Audio('audio/campana.mp3');

  recibirNuevoPedido(nuevoPedido: Pedido) {
    this.reproducirSonido();
    this.pedidos.update((lista) => [...lista, nuevoPedido]);
  }

  private reproducirSonido() {
    this.audioNotificacion.currentTime = 0;
    this.audioNotificacion.play().catch(e => console.warn(e));
  }

  pedidosOrdenados = computed(() => {
    const prioridad: Record<string, number> = {
      pendiente: 1,
      preparando: 2,
      listo: 3,
      recoger: 4,
      entregado: 5
    };
    return [...this.pedidos()].sort((a, b) => prioridad[a.estado] - prioridad[b.estado]);
  });

  pendientesCount = computed(() => this.pedidos().filter((p) => p.estado !== 'listo').length);

  avanzarEstado(pedido: Pedido) {
    this.pedidos.update((lista) =>
      lista.map((p) => {
        if (p.id === pedido.id) {
          if (p.estado === 'pendiente') return { ...p, estado: 'preparando' };
          if (p.estado === 'preparando') return { ...p, estado: 'listo' };
        }
        return p;
      }),
    );
  }

  retrocederEstado(pedido: Pedido) {
    this.pedidos.update(lista => lista.map(p => {
      if (p.id === pedido.id) {
        if (p.estado === 'listo') return { ...p, estado: 'preparando' };
        if (p.estado === 'preparando') return { ...p, estado: 'pendiente' };
      }
      return p;
    }));
  }
}
