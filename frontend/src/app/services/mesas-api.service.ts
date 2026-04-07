import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin, map, Observable } from 'rxjs';
import { Mesa, MesaApi } from '../models/mesa.model';
import { MESAS_LAYOUT } from '../data/mesas-layout';

interface CuentaApi {
  id: string;
  mesas: Array<{
    id: string;
    capacidad: number;
  }>;
  payed: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class MesasApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:7070';

  obtenerMesas(): Observable<MesaApi[]> {
    return this.http.get<MesaApi[]>(`${this.apiUrl}/mesas`);
  }

  obtenerCuentas(): Observable<CuentaApi[]> {
    return this.http.get<CuentaApi[]>(`${this.apiUrl}/cuentas`);
  }

  ocuparMesa(id: string): Observable<unknown> {
    return this.http.post(`${this.apiUrl}/mesas/${id}/ocupar`, {});
  }

  liberarMesa(id: string): Observable<unknown> {
    return this.http.post(`${this.apiUrl}/mesas/${id}/liberar`, {});
  }

  cargarMesasParaVista(): Observable<Mesa[]> {
    return forkJoin({
      mesas: this.obtenerMesas(),
      cuentas: this.obtenerCuentas(),
    }).pipe(
      map(({ mesas, cuentas }) => {
        const layoutMap = new Map(MESAS_LAYOUT.map((mesa) => [mesa.id, mesa]));

        return mesas
          .map((mesaDb) => {
            const layout = layoutMap.get(mesaDb.id);

            const cuentaActiva = cuentas.find(
              (cuenta) =>
                !cuenta.payed &&
                cuenta.mesas?.some((mesa) => mesa.id === mesaDb.id)
            );

            return {
              id: mesaDb.id,
              capacidad: mesaDb.capacidad,
              zona: layout?.zona ?? 'interior',
              estado: cuentaActiva ? 'ocupada' : 'libre',
              cuentaActivaId: cuentaActiva?.id ?? null,
            } as Mesa;
          })
          .sort((a, b) => Number(a.id) - Number(b.id));
      })
    );
  }
}
