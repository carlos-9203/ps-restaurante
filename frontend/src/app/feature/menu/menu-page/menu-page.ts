import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { take } from 'rxjs';
import { Header } from '../../../shared/components/header/header';
import { PlatoMenu, CategoriaPlato, PlatoApi } from '../../../models/plato.model';
import { PlatosApiService } from '../../../services/platos-api.service';
import { OrderService } from '../../../shared/services/order';

@Component({
  selector: 'app-menu-page',
  standalone: true,
  imports: [CommonModule, Header],
  templateUrl: './menu-page.html',
  styleUrls: ['./menu-page.css'],
})
export class MenuPage {
  private readonly platosApiService = inject(PlatosApiService);
  private readonly orderService = inject(OrderService);

  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);
  readonly categoriaSeleccionada = signal<CategoriaPlato | 'Todos'>('Todos');
  readonly platos = signal<PlatoMenu[]>([]);

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

  readonly totalSeleccionado = computed(() =>
    this.platos().reduce((acc, plato) => acc + plato.cantidad, 0)
  );

  readonly importeSeleccionado = computed(() =>
    this.platos().reduce((acc, plato) => acc + plato.cantidad * Number(plato.precio), 0)
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
          : plato
      )
    );
  }

  decrementar(id: string): void {
    this.platos.update((lista) =>
      lista.map((plato) =>
        plato.id === id && plato.cantidad > 0
          ? { ...plato, cantidad: plato.cantidad - 1 }
          : plato
      )
    );
  }

  enviarPedido(): void {
    const platosAPedir = this.platos()
      .filter((plato) => plato.cantidad > 0)
      .map((plato) => ({
        id: plato.id,
        nombre: plato.nombre,
        precio: Number(plato.precio),
        cantidad: plato.cantidad,
        categoria: plato.categoria,
        descripcion: plato.descripcion,
        imagen: plato.imagen,
      }));

    if (platosAPedir.length === 0) {
      return;
    }

    this.orderService.agregarPedido(platosAPedir);

    this.platos.update((lista) =>
      lista.map((plato) => ({ ...plato, cantidad: 0 }))
    );

    alert('¡Pedido añadido correctamente!');
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
