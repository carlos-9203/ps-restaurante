import { TarjetaPedidoComponent } from '../../components/tarjeta-pedido/tarjeta-pedido';
import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Pedido } from '../../models/pedido.model';

@Component({
  selector: 'app-comidas',
  standalone: true,
  imports: [CommonModule, TarjetaPedidoComponent],
  templateUrl: './comidas.html',
  styleUrl: './comidas.css',
})
export class ComidasComponent {
  // Datos iniciales: ¡Ya están separados plato a plato!
  pedidos = signal<Pedido[]>([
    {
      id: '1-0', // Le añadimos un sufijo al ID
      mesa: 5,
      estado: 'recoger',
      tiempo: '5 min',
      items: [{ cantidad: 1, nombre: 'Ensalada César' }], // Solo un plato
    },
    {
      id: '1-1', // Siguiente plato de la misma mesa
      mesa: 5,
      estado: 'recoger',
      tiempo: '5 min',
      items: [{ cantidad: 1, nombre: 'Solomillo al punto' }], // Solo un plato
    },
    {
      id: '2-0',
      mesa: 12,
      estado: 'entregado',
      tiempo: '5 min',
      items: [{ cantidad: 2, nombre: 'Hamburguesa Especial' }], // Si piden 2 del MISMO plato, van juntos
    },
  ]);

  private audioNotificacion = new Audio('audio/campana.mp3');

  // LA MAGIA: Cuando llega un pedido nuevo, lo rompemos plato a plato
  recibirNuevoPedido(comandaEntera: Pedido) {
    this.reproducirSonido();

    const platosIndividuales: Pedido[] = [];

    // Recorremos cada producto que ha pedido la mesa
    comandaEntera.items.forEach((item, itemIndex) => {
      // Hacemos un bucle tantas veces como "cantidad" hayan pedido
      // Si piden 3 ensaladas, este bucle da 3 vueltas
      for (let i = 0; i < item.cantidad; i++) {
        platosIndividuales.push({
          ...comandaEntera,
          id: `${comandaEntera.id}-${itemIndex}-${i}`, // ID ultra-único (ej: "45-0-1")
          estado: 'recoger',
          // ¡Aquí la clave! Forzamos a que la cantidad SIEMPRE sea 1
          items: [{ cantidad: 1, nombre: item.nombre }],
        });
      }
    });

    // Añadimos todos los platos individuales (todos con cantidad 1) a la vista
    this.pedidos.update((lista) => [...lista, ...platosIndividuales]);
  }

  private reproducirSonido() {
    this.audioNotificacion.currentTime = 0;
    this.audioNotificacion.play().catch((e) => console.warn(e));
  }

  // Ordenamos para que los que hay que RECOGER salgan primero
  pedidosOrdenados = computed(() => {
    const prioridad: Record<string, number> = {
      pendiente: 1,
      preparando: 2,
      listo: 3,
      recoger: 4,
      entregado: 5,
    };
    return [...this.pedidos()].sort((a, b) => prioridad[a.estado] - prioridad[b.estado]);
  });

  // Contamos solo los que están por RECOGER
  pendientesCount = computed(() => this.pedidos().filter((p) => p.estado === 'recoger').length);

  // Lógica de avance: De RECOGER pasa a ENTREGADO
  avanzarEstado(pedido: Pedido) {
    this.pedidos.update((lista) =>
      lista.map((p) => {
        if (p.id === pedido.id) {
          if (p.estado === 'recoger') return { ...p, estado: 'entregado' };
        }
        return p;
      }),
    );
  }

  // Lógica de retroceso: De ENTREGADO vuelve a RECOGER (por si te equivocas)
  retrocederEstado(pedido: Pedido) {
    this.pedidos.update((lista) =>
      lista.map((p) => {
        if (p.id === pedido.id) {
          if (p.estado === 'entregado') return { ...p, estado: 'recoger' };
        }
        return p;
      }),
    );
  }
}
