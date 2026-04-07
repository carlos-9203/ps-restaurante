import { Injectable } from '@angular/core';

interface TableSession {
  mesaId: string;
  cuentaId: string;
}

@Injectable({
  providedIn: 'root',
})
export class TableSessionService {
  private readonly storageKey = 'table-session';

  guardarSesion(mesaId: string, cuentaId: string): void {
    const session: TableSession = { mesaId, cuentaId };
    sessionStorage.setItem(this.storageKey, JSON.stringify(session));
  }

  obtenerSesion(): TableSession | null {
    const raw = sessionStorage.getItem(this.storageKey);
    if (!raw) return null;

    try {
      return JSON.parse(raw) as TableSession;
    } catch {
      return null;
    }
  }

  tieneAccesoAMesa(mesaId: string): boolean {
    const session = this.obtenerSesion();
    return !!session && session.mesaId === mesaId;
  }

  limpiarSesion(): void {
    sessionStorage.removeItem(this.storageKey);
  }
}
