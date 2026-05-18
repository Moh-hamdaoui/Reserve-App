import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { signal } from '@angular/core';
import { of } from 'rxjs';

import { HomeComponent } from './home.component';
import { AuthService } from '../services/authService/auth.service';
import { FloorService } from '../services/floorService/floor.service';
import { ReservationService } from '../services/reservationService/reservation.service';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;
  let authServiceSpy: { logout: ReturnType<typeof vi.fn> };
  let routerSpy: { navigate: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    authServiceSpy = {
      logout: vi.fn()
    };

    routerSpy = { navigate: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        {
          provide: AuthService,
          useValue: {
            user: signal({ id: 1, email: 'test@example.com', firstName: 'Test', lastName: 'User' }),
            isAuthenticated: signal(true),
            logout: authServiceSpy.logout
          }
        },
        {
          provide: FloorService,
          useValue: {
            getAllFloors: () => of([])
          }
        },
        {
          provide: ReservationService,
          useValue: {
            getByDate: () => of([]),
            create: vi.fn(),
            cancel: vi.fn()
          }
        },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should logout and navigate to login', () => {
    component.logout();
    expect(authServiceSpy.logout).toHaveBeenCalled();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/login']);
  });
});
