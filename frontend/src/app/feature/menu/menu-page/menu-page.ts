import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { take } from 'rxjs';
import { Header } from '../../../shared/components/header/header';
import { OrderService } from '../../../shared/services/order';
import {
  PedidosApiService,
  CrearPedidoClienteRequest,
} from '../../../services/pedidos-api.service';
import { PlatosApiService } from '../../../services/platos-api.service';
import { CategoriaPlato, PlatoApi, PlatoMenu } from '../../../models/plato.model';

@Component({
  selector: 'app-menu-page',
  standalone: true,
  imports: [CommonModule, Header],
  templateUrl: './menu-page.html',
  styleUrls: ['./menu-page.css'],
})
export class MenuPage {
  private readonly platosApiService = inject(PlatosApiService);
  private readonly pedidosApiService = inject(PedidosApiService);
  private readonly orderService = inject(OrderService);
  private readonly route = inject(ActivatedRoute);

  readonly cargando = signal(true);
  readonly enviando = signal(false);
  readonly error = signal<string | null>(null);
  readonly categoriaSeleccionada = signal<CategoriaPlato | 'Todos'>('Todos');
  readonly platos = signal<PlatoMenu[]>([]);
  readonly showConfirmPopup = signal(false);

  readonly categorias: ReadonlyArray<CategoriaPlato> = [
    'Bebida',
    'Entrante',
    'Principal',
    'Postre',
  ];

  readonly platosFiltrados = computed(() => {
    const categoria = this.categoriaSeleccionada();
    const lista = this.platos();

    if (categoria === 'Todos') {
      return lista;
    }

    return lista.filter((plato) => plato.categoria === categoria);
  });

  readonly platosSeleccionados = computed(() =>
    this.platos().filter((plato) => plato.cantidad > 0),
  );

  readonly totalSeleccionado = computed(() =>
    this.platos().reduce((acc, plato) => acc + plato.cantidad, 0),
  );

  readonly importeSeleccionado = computed(() =>
    this.platos().reduce(
      (acc, plato) => acc + plato.cantidad * Number(plato.precio),
      0,
    ),
  );

  constructor() {
    this.cargarMenu();
  }

  seleccionarCategoria(categoria: CategoriaPlato | 'Todos'): void {
    this.categoriaSeleccionada.set(categoria);
  }

  incrementar(id: string): void {
    this.platos.update((lista) =>
      lista.map((plato) =>
        plato.id === id
          ? { ...plato, cantidad: plato.cantidad + 1 }
          : plato,
      ),
    );
  }

  decrementar(id: string): void {
    this.platos.update((lista) =>
      lista.map((plato) =>
        plato.id === id && plato.cantidad > 0
          ? { ...plato, cantidad: plato.cantidad - 1 }
          : plato,
      ),
    );
  }

  abrirConfirmacionPedido(): void {
    if (this.totalSeleccionado() === 0 || this.enviando()) {
      return;
    }

    this.showConfirmPopup.set(true);
  }

  cerrarConfirmacionPedido(): void {
    if (this.enviando()) {
      return;
    }

    this.showConfirmPopup.set(false);
  }

  confirmarPedido(): void {
    if (this.enviando()) {
      return;
    }

    const mesaId = this.route.snapshot.paramMap.get('id');

    if (!mesaId) {
      this.error.set('No se ha podido identificar la mesa.');
      alert('No se ha podido identificar la mesa.');
      return;
    }

    const platosSeleccionados = this.platosSeleccionados();

    if (platosSeleccionados.length === 0) {
      this.error.set('Debes seleccionar al menos un plato.');
      alert('Debes seleccionar al menos un plato.');
      return;
    }

    this.enviando.set(true);
    this.error.set(null);

    const body: CrearPedidoClienteRequest = {
      items: platosSeleccionados.map((plato) => ({
        platoId: plato.id,
        cantidad: plato.cantidad,
        detalles: '',
      })),
    };

    this.pedidosApiService
      .crearPedidoDesdeMesa(mesaId, body)
      .pipe(take(1))
      .subscribe({
        next: () => {
          this.orderService.agregarPedido(
            platosSeleccionados.map((plato) => ({
              id: plato.id,
              nombre: plato.nombre,
              precio: Number(plato.precio),
              cantidad: plato.cantidad,
              categoria: plato.categoria,
              descripcion: plato.descripcion,
              imagen: plato.imagen,
            })),
          );

          this.platos.update((lista) =>
            lista.map((plato) => ({ ...plato, cantidad: 0 })),
          );

          this.enviando.set(false);
          this.showConfirmPopup.set(false);
          alert('¡Pedido enviado correctamente!');
        },
        error: (err) => {
          const mensaje =
            err?.error?.message ||
            err?.error?.mensaje ||
            'No se ha podido guardar el pedido en este momento.';

          this.error.set(mensaje);
          this.enviando.set(false);
          alert(mensaje);
        },
      });
  }

  recargar(): void {
    this.cargarMenu();
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src =
      'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1200&auto=format&fit=crop';
  }

  trackByPlato(_: number, plato: PlatoMenu): string {
    return plato.id;
  }

  private cargarMenu(): void {
    this.cargando.set(true);
    this.error.set(null);

    this.platosApiService
      .obtenerPlatos()
      .pipe(take(1))
      .subscribe({
        next: (platosApi: PlatoApi[]) => {
          const platosMenu: PlatoMenu[] = platosApi
            .slice()
            .sort(this.ordenarPorCategoriaYNombre)
            .map((plato) => ({
              ...plato,
              precio: Number(plato.precio),
              cantidad: 0,
            }));

          this.platos.set(platosMenu);
          this.cargando.set(false);
        },
        error: () => {
          this.error.set('No se ha podido cargar la carta en este momento.');
          this.cargando.set(false);
        },
      });
  }

  private ordenarPorCategoriaYNombre(a: PlatoApi, b: PlatoApi): number {
    const ordenCategorias: Record<CategoriaPlato, number> = {
      Bebida: 0,
      Entrante: 1,
      Principal: 2,
      Postre: 3,
    };

    const diferenciaCategoria =
      ordenCategorias[a.categoria] - ordenCategorias[b.categoria];

    if (diferenciaCategoria !== 0) {
      return diferenciaCategoria;
    }

    return a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' });
  }
}
