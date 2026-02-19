import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { BuyerDetailDto, LoginRequest, LoginResponseDto, UserDto, UserStatus } from '../models/user';
import { jwtDecode } from 'jwt-decode';
import { tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  AUTH_URL = 'http://localhost:5062/api/Auth';


  constructor(private http: HttpClient) { }


  registerUser(dto: UserDto): Observable<BuyerDetailDto> {
    return this.http.post<BuyerDetailDto>(
      `${this.AUTH_URL}/Register`, dto);
  }

  loginUser(dto: LoginRequest) {
    return this.http.post<LoginResponseDto>(`${this.AUTH_URL}/Login`, dto).pipe(
      tap(res => {
        localStorage.setItem('token', res.token);
        localStorage.setItem('role', res.role);

      })
    );
  }


  hasToken(): boolean {
    return !!localStorage.getItem('token');
  }


  getRole(): string | null {
    const x = localStorage.getItem('role');
    if (x === null) return null;

    return UserStatus[Number(x)];
  }
}


