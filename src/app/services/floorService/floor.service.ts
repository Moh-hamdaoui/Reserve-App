import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { AuthService } from '../authService/auth.service';

export interface Place {
  id: number;
  name: string;
  active: boolean;
  floorId: number;
  positionX: number;
  positionY: number;
}

export interface Floor {
  id: number;
  name: string;
  placesNumber: number;
  places: Place[];
}

export interface CreateFloorDto {
  name: string;
}

export interface CreatePlaceDto {
  name: string;
  positionX?: number;
  positionY?: number;
  active?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class FloorService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly apiUrl = '/api/floors';

  getAllFloors(): Observable<Floor[]> {
    return this.http
      .get<Floor[]>(this.apiUrl, this.authOptions())
      .pipe(catchError(error => this.handleError(error)));
  }

  createFloor(dto: CreateFloorDto): Observable<Floor> {
    return this.http
      .post<Floor>(this.apiUrl, dto, this.authOptions())
      .pipe(catchError(error => this.handleError(error)));
  }

  updateFloor(id: number, dto: CreateFloorDto): Observable<{ id: number; name: string }> {
    return this.http
      .put<{ id: number; name: string }>(`${this.apiUrl}/${id}`, dto, this.authOptions())
      .pipe(catchError(error => this.handleError(error)));
  }

  deleteFloor(id: number): Observable<{ message: string }> {
    return this.http
      .delete<{ message: string }>(`${this.apiUrl}/${id}`, this.authOptions())
      .pipe(catchError(error => this.handleError(error)));
  }

  createPlace(floorId: number, dto: CreatePlaceDto): Observable<Place> {
    return this.http
      .post<Place>(`${this.apiUrl}/${floorId}/places`, dto, this.authOptions())
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
    console.error('FloorService error', error);
    return throwError(() => new Error(error.error?.message ?? 'Erreur lors de la gestion des étages'));
  }
}
