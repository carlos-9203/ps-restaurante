import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { catchError, forkJoin, map, of, take } from 'rxjs';
import {
  OrdenCocinaResponse,
  OrdenesApiService,
} from '../../services/ordenes-api.service';
import {NavbarComponent} from '../../components/navbar/navbar';

type ResultadoCarga = {
  ok: boolean;
  data: OrdenCocinaResponse[];
};

@Component({
  selector: 'app-bebidas',
  standalone: true,
  imports: [CommonModule, NavbarComponent],
  templateUrl: './bebidas.html',
  styleUrl: './bebidas.css',
})
export class BebidasComponent implements OnInit, OnDestroy {
  private readonly ordenesApi = inject(OrdenesApiService);

  private intervaloRefresco?: number;
  private intervaloReloj?: number;

  private readonly pollingMs = 3000;
  private readonly refreshAfterWriteMs = 1500;

  readonly cargando = signal<boolean>(true);
  readonly error = signal<string | null>(null);
  readonly procesandoOrdenId = signal<string | null>(null);
  readonly pausadoHasta = signal(0);
  readonly ahora = signal(Date.now());

  readonly ordenes = signal<OrdenCocinaResponse[]>([]);

  readonly ordenesOrdenadas = computed(() => {
    const prioridad: Record<string, number> = {
      Pendiente: 1,
      Preparación: 2,
      Listo: 3,
    };

    return [...this.ordenes()].sort((a, b) => {
      const porEstado = (prioridad[a.ordenEstado] ?? 99) - (prioridad[b.ordenEstado] ?? 99);
      if (porEstado !== 0) return porEstado;

      const fechaA = new Date(a.pedido?.fechaPedido ?? a.fecha).getTime();
      const fechaB = new Date(b.pedido?.fechaPedido ?? b.fecha).getTime();
      return fechaA - fechaB;
    });
  });

  readonly pendientesCount = computed(
    () => this.ordenes().filter((o) => o.ordenEstado !== 'Listo').length,
  );

  readonly listasCount = computed(
    () => this.ordenes().filter((o) => o.ordenEstado === 'Listo').length,
  );

  readonly hayDatos = computed(() => this.ordenesOrdenadas().length > 0);

  ngOnInit(): void {
    this.cargarBebidas(true);

    this.intervaloRefresco = window.setInterval(() => {
      if (!this.estaSincronizacionPausada()) {
        this.cargarBebidas(false);
      }
    }, this.pollingMs);

    this.intervaloReloj = window.setInterval(() => {
      this.ahora.set(Date.now());
    }, 30000);
  }

  ngOnDestroy(): void {
    if (this.intervaloRefresco) {
      window.clearInterval(this.intervaloRefresco);
    }
    if (this.intervaloReloj) {
      window.clearInterval(this.intervaloReloj);
    }
  }

  avanzarEstado(orden: OrdenCocinaResponse): void {
    if (this.procesandoOrdenId()) return;

    if (orden.ordenEstado === 'Listo') return;

    this.procesandoOrdenId.set(orden.id);
    this.error.set(null);
    this.pausarSincronizacion(this.refreshAfterWriteMs + 500);

    const accion =
      orden.ordenEstado === 'Pendiente'
        ? this.ordenesApi.marcarEnPreparacion(orden.id)
        : this.ordenesApi.marcarLista(orden.id);

    accion.pipe(take(1)).subscribe({
      next: () => this.recargarConRetardo(this.refreshAfterWriteMs),
      error: (err) => {
        console.error(err);
        this.error.set('No se pudo actualizar la bebida.');
        this.recargarConRetardo(this.refreshAfterWriteMs);
      },
    });
  }

  retrocederEstado(orden: OrdenCocinaResponse): void {
    if (this.procesandoOrdenId()) return;
    if (orden.ordenEstado === 'Pendiente') return;

    this.procesandoOrdenId.set(orden.id);
    this.error.set(null);
    this.pausarSincronizacion(this.refreshAfterWriteMs + 500);

    this.ordenesApi
      .marcarPendiente(orden.id)
      .pipe(take(1))
      .subscribe({
        next: () => this.recargarConRetardo(this.refreshAfterWriteMs),
        error: (err) => {
          console.error(err);
          this.error.set('No se pudo actualizar la bebida.');
          this.recargarConRetardo(this.refreshAfterWriteMs);
        },
      });
  }

  mesaDeOrden(orden: OrdenCocinaResponse): string {
    const mesas = orden.pedido?.cuenta?.mesas ?? [];
    if (mesas.length === 1) return `Mesa ${mesas[0].id}`;
    if (mesas.length > 1) return `Mesas ${mesas.map((m) => m.id).join(', ')}`;

    const mesaDetalles = this.extraerMesaDesdeTexto(orden.detalles);
    return mesaDetalles ? `Mesa ${mesaDetalles}` : 'Mesa sin asignar';
  }

  numeroMesaPlano(orden: OrdenCocinaResponse): string {
    const mesas = orden.pedido?.cuenta?.mesas ?? [];
    if (mesas.length > 0) return mesas.map((m) => String(m.id)).join(', ');

    return this.extraerMesaDesdeTexto(orden.detalles) ?? 'Sin mesa';
  }

  etiquetaEstado(orden: OrdenCocinaResponse): string {
    switch (orden.ordenEstado) {
      case 'Pendiente':
        return 'PENDIENTE';
      case 'Preparación':
        return 'PREPARANDO';
      case 'Listo':
        return 'LISTO';
      default:
        return orden.ordenEstado.toUpperCase();
    }
  }

  tiempoTexto(orden: OrdenCocinaResponse): string {
    const referencia = orden.pedido?.fechaPedido ?? orden.fecha;
    const diffMin = this.diferenciaEnMinutos(referencia);

    if (diffMin < 1) return '< 1 min';
    if (diffMin < 60) return `${diffMin} min`;

    const horas = Math.floor(diffMin / 60);
    const minutosRestantes = diffMin % 60;

    return minutosRestantes === 0
      ? `${horas} h`
      : `${horas} h ${minutosRestantes} min`;
  }

  accionPrincipalTexto(orden: OrdenCocinaResponse): string {
    switch (orden.ordenEstado) {
      case 'Pendiente':
        return 'PASAR A PREPARACIÓN';
      case 'Preparación':
        return 'MARCAR COMO LISTO';
      case 'Listo':
        return 'LISTO';
      default:
        return 'ACTUALIZAR';
    }
  }

  detallesVisibles(orden: OrdenCocinaResponse): string {
    const detalles = orden.detalles?.trim();
    return detalles && detalles.length > 0 ? detalles : 'Sin detalles';
  }

  private cargarBebidas(mostrarLoading: boolean): void {
    if (this.estaSincronizacionPausada()) return;

    if (mostrarLoading) {
      this.cargando.set(true);
    }

    const cargaSegura = (obs: ReturnType<OrdenesApiService['obtenerPendientesBarra']>) =>
      obs.pipe(
        map((data) => ({ ok: true, data }) as ResultadoCarga),
        catchError((err) => {
          console.error(err);
          return of({ ok: false, data: [] } as ResultadoCarga);
        }),
      );

    forkJoin({
      pendientes: cargaSegura(this.ordenesApi.obtenerPendientesBarra()),
      preparacion: cargaSegura(this.ordenesApi.obtenerEnPreparacionBarra()),
      listas: cargaSegura(this.ordenesApi.obtenerListasBarra()),
    })
      .pipe(take(1))
      .subscribe({
        next: ({ pendientes, preparacion, listas }) => {
          const combinadas = [
            ...pendientes.data,
            ...preparacion.data,
            ...listas.data,
          ];

          const visibles = this.filtrarVisibles(combinadas);
          this.ordenes.set(visibles);

          const peticionesOk = [pendientes.ok, preparacion.ok, listas.ok].filter(Boolean).length;

          if (peticionesOk === 0 && visibles.length === 0) {
            this.error.set('No se pudieron cargar las bebidas.');
          } else {
            this.error.set(null);
          }

          this.cargando.set(false);
          this.procesandoOrdenId.set(null);
        },
        error: (err) => {
          console.error(err);
          this.error.set('No se pudieron cargar las bebidas.');
          this.cargando.set(false);
          this.procesandoOrdenId.set(null);
        },
      });
  }

  private filtrarVisibles(ordenes: OrdenCocinaResponse[]): OrdenCocinaResponse[] {
    return ordenes.filter((orden) => {
      const esBebida = orden.plato?.categoria === 'Bebida';
      const estadoVisible =
        orden.ordenEstado === 'Pendiente' ||
        orden.ordenEstado === 'Preparación' ||
        orden.ordenEstado === 'Listo';

      const cuentaPagada = orden.pedido?.cuenta?.payed === true;

      return esBebida && estadoVisible && !cuentaPagada;
    });
  }

  private diferenciaEnMinutos(fechaIso: string): number {
    const fecha = new Date(fechaIso).getTime();
    if (Number.isNaN(fecha)) return 0;

    return Math.max(0, Math.floor((this.ahora() - fecha) / 60000));
  }

  private extraerMesaDesdeTexto(texto?: string | null): string | null {
    if (!texto) return null;
    const match = texto.match(/\bmesa\s*[:#-]?\s*(\d+)\b/i);
    return match?.[1] ?? null;
  }

  private pausarSincronizacion(ms: number): void {
    this.pausadoHasta.set(Date.now() + ms);
  }

  private estaSincronizacionPausada(): boolean {
    return Date.now() < this.pausadoHasta();
  }

  private recargarConRetardo(ms: number): void {
    window.setTimeout(() => this.cargarBebidas(false), ms);
  }
}
