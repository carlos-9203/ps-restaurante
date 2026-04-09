import { Routes } from '@angular/router';
import { MesasComponent } from './pages/mesas/mesas';
import { BebidasComponent } from './pages/bebidas/bebidas';
import { PlatosComponent } from './pages/platos/platos';
import { tableAccessGuard } from './guards/table-access.guard';
import { TableLogin } from './feature/access/table-login/table-login';
import { QrGenerator } from './feature/admin/qr-generator/qr-generator';
import { MenuPage } from './feature/menu/menu-page/menu-page';
import { BillPage } from './feature/bill/bill-page/bill-page';
import { TableroPedidos } from './pages/cocina/tablero-pedidos';

export const routes: Routes = [
  { path: '', redirectTo: 'mesas', pathMatch: 'full' },
  { path: 'mesas', component: MesasComponent },
  { path: 'bebidas', component: BebidasComponent },
  { path: 'platos', component: PlatosComponent },
  { path: 'acceso/:id', component: TableLogin },
  { path: 'admin/generar-qr', component: QrGenerator },
  { path: 'menu/:id', component: MenuPage, canActivate: [tableAccessGuard] },
  { path: 'cuenta/:id', component: BillPage, canActivate: [tableAccessGuard] },
  { path: 'cocina', component: TableroPedidos },
];
