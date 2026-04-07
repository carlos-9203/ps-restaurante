import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TableroPedidos } from './tablero-pedidos';

describe('TableroPedidos', () => {
  let component: TableroPedidos;
  let fixture: ComponentFixture<TableroPedidos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TableroPedidos],
    }).compileComponents();

    fixture = TestBed.createComponent(TableroPedidos);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
