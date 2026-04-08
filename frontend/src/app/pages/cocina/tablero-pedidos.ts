import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin, take } from 'rxjs';
import {
  OrdenCocinaResponse,
  OrdenesApiService,
} from '../../services/ordenes-api.service';

@Component({
  selector: 'app-tablero-pedidos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tablero-pedidos.component.html',
  styleUrls: ['./tablero-pedidos.component.css'],
})
export class TableroPedidos implements OnInit, OnDestroy {
  private readonly ordenesApiService = inject(OrdenesApiService);
  private intervaloRefresco?: number;

  readonly cargando = signal(true);
  readonly actualizando = signal(false);
  readonly error = signal<string | null>(null);

  readonly ordenesPendientes = signal<OrdenCocinaResponse[]>([]);
  readonly ordenesPreparacion = signal<OrdenCocinaResponse[]>([]);
  readonly ordenesListas = signal<OrdenCocinaResponse[]>([]);

  readonly totalOrdenes = computed(
    () =>
      this.ordenesPendientes().length +
      this.ordenesPreparacion().length +
      this.ordenesListas().length,
  );

  ngOnInit(): void {
    this.cargarTablero(true);

    this.intervaloRefresco = window.setInterval(() => {
      this.cargarTablero(false);
    }, 4000);
  }

  ngOnDestroy(): void {
    if (this.intervaloRefresco) {
      window.clearInterval(this.intervaloRefresco);
    }
  }

  recargar(): void {
    this.cargarTablero(true);
  }

  pasarAPreparacion(ordenId: string): void {
    if (this.actualizando()) {
      return;
    }

    this.actualizando.set(true);

    this.ordenesApiService
      .marcarEnPreparacion(ordenId)
      .pipe(take(1))
      .subscribe({
        next: () => {
          this.actualizando.set(false);
          this.cargarTablero(false);
        },
        error: () => {
          this.actualizando.set(false);
          this.error.set('No se ha podido actualizar el estado de la orden.');
        },
      });
  }

  pasarAPendiente(ordenId: string): void {
    if (this.actualizando()) {
      return;
    }

    this.actualizando.set(true);

    this.ordenesApiService
      .marcarPendiente(ordenId)
      .pipe(take(1))
      .subscribe({
        next: () => {
          this.actualizando.set(false);
          this.cargarTablero(false);
        },
        error: () => {
          this.actualizando.set(false);
          this.error.set('No se ha podido actualizar el estado de la orden.');
        },
      });
  }

  pasarALista(ordenId: string): void {
    if (this.actualizando()) {
      return;
    }

    this.actualizando.set(true);

    this.ordenesApiService
      .marcarLista(ordenId)
      .pipe(take(1))
      .subscribe({
        next: () => {
          this.actualizando.set(false);
          this.cargarTablero(false);
        },
        error: () => {
          this.actualizando.set(false);
          this.error.set('No se ha podido actualizar el estado de la orden.');
        },
      });
  }

  mesaDeOrden(orden: OrdenCocinaResponse): string {
    const mesas = orden.pedido?.cuenta?.mesas ?? [];

    if (mesas.length === 0) {
      return 'Mesa ?';
    }

    if (mesas.length === 1) {
      return `Mesa ${mesas[0].id}`;
    }

    return `Mesas ${mesas.map((mesa) => mesa.id).join(', ')}`;
  }

  tiempoTranscurrido(fechaIso: string): string {
    const fecha = new Date(fechaIso).getTime();
    const ahora = Date.now();
    const minutos = Math.max(0, Math.floor((ahora - fecha) / 60000));

    if (minutos < 1) {
      return 'Hace menos de 1 min';
    }

    if (minutos === 1) {
      return 'Hace 1 min';
    }

    if (minutos < 60) {
      return `Hace ${minutos} min`;
    }

    const horas = Math.floor(minutos / 60);

    if (horas === 1) {
      return 'Hace 1 h';
    }

    return `Hace ${horas} h`;
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src =
      'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1200&auto=format&fit=crop';
  }

  private cargarTablero(mostrarLoading: boolean): void {
    if (mostrarLoading) {
      this.cargando.set(true);
    }

    this.error.set(null);

    forkJoin({
      pendientes: this.ordenesApiService.obtenerPendientesCocina(),
      preparacion: this.ordenesApiService.obtenerEnPreparacionCocina(),
      listas: this.ordenesApiService.obtenerListasCocina(),
    })
      .pipe(take(1))
      .subscribe({
        next: ({ pendientes, preparacion, listas }) => {
          this.ordenesPendientes.set(pendientes);
          this.ordenesPreparacion.set(preparacion);
          this.ordenesListas.set(listas);
          this.cargando.set(false);
        },
        error: () => {
          this.error.set('No se ha podido cargar el tablero de cocina.');
          this.cargando.set(false);
        },
      });
  }
}
