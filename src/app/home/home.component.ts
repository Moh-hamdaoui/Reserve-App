import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../services/authService/auth.service';

interface Place {
  id: number;
  name: string;
  active: boolean;
  floorId: number;
  reserved: boolean;
  reservedBy?: string;
}

interface Floor {
  id: number;
  name: string;
  places: Place[];
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  user = this.authService.user;
  isAuthenticated = this.authService.isAuthenticated;

  selectedFloor = signal<number>(1);

  floors: Floor[] = [
    {
      id: 1,
      name: 'Étage 1',
      places: [
        { id: 1, name: 'A-1', active: true, floorId: 1, reserved: false },
        { id: 2, name: 'A-2', active: true, floorId: 1, reserved: true, reservedBy: 'Marie Dupont' },
        { id: 3, name: 'A-3', active: true, floorId: 1, reserved: false },
        { id: 4, name: 'A-4', active: false, floorId: 1, reserved: false },
        { id: 5, name: 'A-5', active: true, floorId: 1, reserved: true, reservedBy: 'Jean Martin' },
        { id: 6, name: 'A-6', active: true, floorId: 1, reserved: false },
        { id: 7, name: 'A-7', active: true, floorId: 1, reserved: false },
        { id: 8, name: 'A-8', active: true, floorId: 1, reserved: true, reservedBy: 'Sophie Leroy' },
      ]
    },
    {
      id: 2,
      name: 'Étage 2',
      places: [
        { id: 9, name: 'B-1', active: true, floorId: 2, reserved: true, reservedBy: 'Paul Bernard' },
        { id: 10, name: 'B-2', active: true, floorId: 2, reserved: false },
        { id: 11, name: 'B-3', active: true, floorId: 2, reserved: false },
        { id: 12, name: 'B-4', active: true, floorId: 2, reserved: true, reservedBy: 'Claire Moreau' },
        { id: 13, name: 'B-5', active: false, floorId: 2, reserved: false },
        { id: 14, name: 'B-6', active: true, floorId: 2, reserved: false },
      ]
    }
  ];

  get currentFloor(): Floor | undefined {
    return this.floors.find(f => f.id === this.selectedFloor());
  }

  get availableCount(): number {
    return this.currentFloor?.places.filter(p => p.active && !p.reserved).length ?? 0;
  }

  get reservedCount(): number {
    return this.currentFloor?.places.filter(p => p.reserved).length ?? 0;
  }

  get inactiveCount(): number {
    return this.currentFloor?.places.filter(p => !p.active).length ?? 0;
  }

  selectFloor(floorId: number): void {
    this.selectedFloor.set(floorId);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}