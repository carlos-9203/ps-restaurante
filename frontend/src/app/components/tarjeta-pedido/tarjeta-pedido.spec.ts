import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TarjetaPedido } from './tarjeta-pedido';

describe('TarjetaPedido', () => {
  let component: TarjetaPedido;
  let fixture: ComponentFixture<TarjetaPedido>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TarjetaPedido],
    }).compileComponents();

    fixture = TestBed.createComponent(TarjetaPedido);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
