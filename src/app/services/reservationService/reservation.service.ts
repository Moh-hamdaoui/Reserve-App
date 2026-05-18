import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { AuthService } from '../authService/auth.service';

export type ReservationPeriod = 'full' | 'morning' | 'afternoon';

export interface ReservationByDate {
  id: number;
  userId: number;
  placeId: number;
  date: string;
  period: ReservationPeriod;
  firstName: string;
  lastName: string;
}

export interface MyReservation {
  id: number;
  placeId: number;
  date: string;
  period: ReservationPeriod;
  created_at: string;
  placeName: string;
  floorId: number;
  floorName: string;
}

export interface ReservationDetail extends MyReservation {
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
}

export interface CreateReservationDto {
  placeId: number;
  date: string;
  period?: ReservationPeriod;
}

export interface CreatedReservation {
  id: number;
  userId: number;
  placeId: number;
  date: string;
  period: ReservationPeriod;
}

@Injectable({
  providedIn: 'root'
})
export class ReservationService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly apiUrl = '/api/reservations';

  getByDate(date: string): Observable<ReservationByDate[]> {
    const params = new HttpParams().set('date', date);
    return this.http
      .get<ReservationByDate[]>(this.apiUrl, { ...this.authOptions(), params })
      .pipe(catchError(error => this.handleError(error)));
  }

  getMine(): Observable<MyReservation[]> {
    return this.http
      .get<MyReservation[]>(`${this.apiUrl}/mine`, this.authOptions())
      .pipe(catchError(error => this.handleError(error)));
  }

  getAll(): Observable<ReservationDetail[]> {
    return this.http
      .get<ReservationDetail[]>(`${this.apiUrl}/all`, this.authOptions())
      .pipe(catchError(error => this.handleError(error)));
  }

  create(dto: CreateReservationDto): Observable<CreatedReservation> {
    return this.http
      .post<CreatedReservation>(this.apiUrl, dto, this.authOptions())
      .pipe(catchError(error => this.handleError(error)));
  }

  cancel(id: number): Observable<{ message: string }> {
    return this.http
      .delete<{ message: string }>(`${this.apiUrl}/${id}`, this.authOptions())
      .pipe(catchError(error => this.handleError(error)));
  }

  private authOptions(): { headers: HttpHeaders } | Record<string, never> {
    const authorization = this.authService.getAuthorizationHeader();
    if (!authorization) {
      return {};
    }
    return { headers: new HttpHeaders({ Authorization: authorization }) };
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('ReservationService error', error);
    const body = error.error;
    const message =
      (typeof body === 'object' && body?.message) ||
      (typeof body === 'string' ? body : null) ||
      error.message ||
      'Erreur lors de la gestion des réservations';
    return throwError(() => new Error(message));
  }
}
