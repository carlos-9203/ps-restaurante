import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MesaCardComponent } from '../../components/mesa-card/mesa-card';
import { MesaDetalleComponent } from '../../components/mesa-detalle/mesa-detalle';
import { Mesa, ZonaMesa } from '../../models/mesa.model';
import { MesasApiService } from '../../services/mesas-api.service';

@Component({
  selector: 'app-mesas',
  standalone: true,
  imports: [CommonModule, MesaCardComponent, MesaDetalleComponent],
  templateUrl: './mesas.html',
  styleUrl: './mesas.css',
})
export class MesasComponent {
  private readonly mesasApi = inject(MesasApiService);

  readonly zona = signal<ZonaMesa>('interior');
  readonly mesaSeleccionada = signal<Mesa | null>(null);
  readonly mesas = signal<Mesa[]>([]);
  readonly cargando = signal(true);
  readonly error = signal<string | null>(null);
  readonly accionMesaId = signal<string | null>(null);

  readonly mesasActuales = computed(() =>
    this.mesas()
      .filter((mesa) => mesa.zona === this.zona())
      .sort((a, b) => Number(a.id) - Number(b.id))
  );

  constructor() {
    this.recargarMesas();
  }

  seleccionar(mesa: Mesa): void {
    if (this.mesaSeleccionada()?.id === mesa.id) {
      this.mesaSeleccionada.set(null);
      return;
    }

    this.mesaSeleccionada.set(mesa);
  }

  cambiarZona(nuevaZona: ZonaMesa): void {
    this.zona.set(nuevaZona);
    this.mesaSeleccionada.set(null);
  }

  cerrarSeleccion(event: MouseEvent): void {
    const target = event.target as HTMLElement;

    if (!target.closest('app-mesa-card') && !target.closest('.sidebar-detalle')) {
      this.mesaSeleccionada.set(null);
    }
  }

  ocuparMesa(mesaId: string): void {
    this.error.set(null);
    this.accionMesaId.set(mesaId);

    this.mesasApi.ocuparMesa(mesaId).subscribe({
      next: () => this.recargarMesas(mesaId),
      error: (err) => {
        console.error('Error ocupando mesa:', err);
        this.accionMesaId.set(null);
        this.error.set(this.extraerMensaje(err));
      },
    });
  }

  liberarMesa(mesaId: string): void {
    this.error.set(null);
    this.accionMesaId.set(mesaId);

    this.mesasApi.liberarMesa(mesaId).subscribe({
      next: () => this.recargarMesas(mesaId),
      error: (err) => {
        console.error('Error liberando mesa:', err);
        this.accionMesaId.set(null);
        this.error.set(this.extraerMensaje(err));
      },
    });
  }

  private recargarMesas(mesaAReseleccionar?: string): void {
    this.cargando.set(true);
    this.error.set(null);

    this.mesasApi.cargarMesasParaVista().subscribe({
      next: (mesas) => {
        this.mesas.set(mesas);
        this.cargando.set(false);
        this.accionMesaId.set(null);

        if (mesaAReseleccionar) {
          const nuevaMesa = mesas.find((m) => m.id === mesaAReseleccionar) ?? null;
          this.mesaSeleccionada.set(nuevaMesa);
          return;
        }

        const seleccionActual = this.mesaSeleccionada();
        if (!seleccionActual) {
          return;
        }

        const mesaRefrescada = mesas.find((m) => m.id === seleccionActual.id) ?? null;
        this.mesaSeleccionada.set(mesaRefrescada);
      },
      error: (err) => {
        console.error('Error recargar mesa:', err);
        this.accionMesaId.set(null);
        this.error.set(this.extraerMensaje(err));
      },
    });
  }

  private extraerMensaje(error: unknown): string {
    const err = error as { error?: { message?: string } };
    return err?.error?.message ?? 'Ha ocurrido un error al comunicar con el backend';
  }
}
