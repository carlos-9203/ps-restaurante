import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { TableSessionService } from '../services/table-session.service';

export const tableAccessGuard: CanActivateFn = (route) => {
  const router = inject(Router);
  const tableSessionService = inject(TableSessionService);

  const mesaId = route.paramMap.get('id');

  if (mesaId && tableSessionService.tieneAccesoAMesa(mesaId)) {
    return true;
  }

  if (mesaId) {
    return router.createUrlTree(['/acceso', mesaId]);
  }

  return router.createUrlTree(['/']);
};
