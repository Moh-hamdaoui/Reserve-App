import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AuthService } from '../services/authService/auth.service';
import { Floor, FloorService } from '../services/floorService/floor.service';
import {
  ReservationByDate,
  ReservationPeriod,
  ReservationService
} from '../services/reservationService/reservation.service';

interface PlaceView {
  id: number;
  name: string;
  active: boolean;
  floorId: number;
  reserved: boolean;
  reservedBy?: string;
  reservedPeriod?: ReservationPeriod;
  reservationId?: number;
  isOwnReservation: boolean;
}

interface FloorView {
  id: number;
  name: string;
  places: PlaceView[];
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly floorService = inject(FloorService);
  private readonly reservationService = inject(ReservationService);
  private readonly router = inject(Router);

  user = this.authService.user;
  isAuthenticated = this.authService.isAuthenticated;

  readonly floors = signal<FloorView[]>([]);
  readonly reservations = signal<ReservationByDate[]>([]);
  readonly selectedFloor = signal<number | null>(null);
  readonly selectedDate = signal(this.formatDate(new Date()));
  readonly selectedPeriod = signal<ReservationPeriod>('full');
  readonly isLoading = signal(false);
  readonly isActionLoading = signal(false);
  readonly errorMessage = signal('');

  readonly currentFloor = computed(() =>
    this.floors().find(f => f.id === this.selectedFloor()) ?? null
  );

  readonly availableCount = computed(
    () => this.currentFloor()?.places.filter(p => p.active && !p.reserved).length ?? 0
  );

  readonly reservedCount = computed(
    () => this.currentFloor()?.places.filter(p => p.reserved).length ?? 0
  );

  readonly inactiveCount = computed(
    () => this.currentFloor()?.places.filter(p => !p.active).length ?? 0
  );

  readonly periodOptions: { value: ReservationPeriod; label: string }[] = [
    { value: 'full', label: 'Journée' },
    { value: 'morning', label: 'Matin' },
    { value: 'afternoon', label: 'Après-midi' }
  ];

  readonly selectedPeriodLabel = computed(
    () => this.periodOptions.find(o => o.value === this.selectedPeriod())?.label ?? ''
  );

  ngOnInit(): void {
    this.loadData();
  }

  selectFloor(floorId: number): void {
    this.selectedFloor.set(floorId);
  }

  onDateChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    if (!value) {
      return;
    }
    this.selectedDate.set(value);
    this.loadData();
  }

  onPeriodChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as ReservationPeriod;
    this.selectedPeriod.set(value);
    this.applyReservations();
  }

  onPlaceClick(place: PlaceView): void {
    if (!place.active || this.isActionLoading()) {
      return;
    }

    if (place.reserved && place.isOwnReservation && place.reservationId) {
      this.cancelReservation(place.reservationId);
      return;
    }

    if (!place.reserved) {
      this.createReservation(place.id);
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  private loadData(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    forkJoin({
      floors: this.floorService.getAllFloors(),
      reservations: this.reservationService.getByDate(this.selectedDate())
    }).subscribe({
      next: ({ floors, reservations }) => {
        this.reservations.set(reservations);
        this.floors.set(this.mapFloors(floors));
        const firstFloorId = floors[0]?.id ?? null;
        const current = this.selectedFloor();
        if (current === null || !floors.some(f => f.id === current)) {
          this.selectedFloor.set(firstFloorId);
        }
        this.isLoading.set(false);
      },
      error: error => {
        this.errorMessage.set(error.message ?? 'Impossible de charger les données.');
        this.isLoading.set(false);
      }
    });
  }

  private applyReservations(): void {
    this.floors.update(floors =>
      floors.map(floor => ({
        ...floor,
        places: floor.places.map(place => this.mapPlace(place, floor.id))
      }))
    );
  }

  private mapFloors(floors: Floor[]): FloorView[] {
    return floors.map(floor => ({
      id: floor.id,
      name: floor.name,
      places: floor.places.map(place => this.mapPlace(place, floor.id))
    }));
  }

  private mapPlace(
    place: { id: number; name: string; active: boolean; floorId: number },
    floorId: number
  ): PlaceView {
    const reservation = this.getBlockingReservation(place.id, this.selectedPeriod());
    const userId = Number(this.user()?.id);

    return {
      id: place.id,
      name: place.name,
      active: place.active,
      floorId,
      reserved: !!reservation,
      reservedBy: reservation
        ? `${reservation.firstName} ${reservation.lastName}`
        : undefined,
      reservedPeriod: reservation?.period,
      reservationId: reservation?.id,
      isOwnReservation: reservation ? reservation.userId === userId : false
    };
  }

  private getBlockingReservation(
    placeId: number,
    period: ReservationPeriod
  ): ReservationByDate | undefined {
    const blocking = this.reservations().filter(
      r => r.placeId === placeId && this.blocksPeriod(r.period, period)
    );
    if (blocking.length === 0) {
      return undefined;
    }
    return (
      blocking.find(r => r.period === period) ??
      blocking.find(r => r.period === 'full') ??
      blocking[0]
    );
  }

  /** Une réservation existante empêche-t-elle de réserver le créneau demandé ? */
  private blocksPeriod(existing: ReservationPeriod, requested: ReservationPeriod): boolean {
    if (existing === 'full') {
      return true;
    }
    if (requested === 'full') {
      return true;
    }
    return existing === requested;
  }

  periodLabel(period: ReservationPeriod): string {
    return this.periodOptions.find(o => o.value === period)?.label ?? period;
  }

  private createReservation(placeId: number): void {
    this.isActionLoading.set(true);
    this.errorMessage.set('');

    this.reservationService
      .create({
        placeId,
        date: this.selectedDate(),
        period: this.selectedPeriod()
      })
      .subscribe({
        next: () => {
          this.isActionLoading.set(false);
          this.reloadReservations();
        },
        error: error => {
          this.errorMessage.set(error.message ?? 'Impossible de créer la réservation.');
          this.isActionLoading.set(false);
        }
      });
  }

  private cancelReservation(reservationId: number): void {
    this.isActionLoading.set(true);
    this.errorMessage.set('');

    this.reservationService.cancel(reservationId).subscribe({
      next: () => {
        this.isActionLoading.set(false);
        this.reloadReservations();
      },
      error: error => {
        this.errorMessage.set(error.message ?? 'Impossible d’annuler la réservation.');
        this.isActionLoading.set(false);
      }
    });
  }

  private reloadReservations(): void {
    this.reservationService.getByDate(this.selectedDate()).subscribe({
      next: reservations => {
        this.reservations.set(reservations);
        this.applyReservations();
      },
      error: error => {
        this.errorMessage.set(error.message ?? 'Impossible de recharger les réservations.');
      }
    });
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
