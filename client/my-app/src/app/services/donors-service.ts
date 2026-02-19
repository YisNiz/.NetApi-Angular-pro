// import { Injectable } from '@angular/core';
// import { Observable } from 'rxjs';
// import { HttpClient } from '@angular/common/http';
// import {  DonorDto } from '../models/donor';

// @Injectable({
//   providedIn: 'root',
// })
// export class DonorsService {
//     AUTH_URL = 'http://localhost:5062/api/Donor';

//     constructor(private http: HttpClient) { }

//     getAllDonors(): Observable<DonorDto[]> {  
//     const token = localStorage.getItem('token');
//     return this.http.get<DonorDto[]>
//     (`${this.AUTH_URL}/GetAllDonors`,
//       { headers:{ Authorization: `Bearer ${token}`}})
//   }
// }
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DonorDto } from '../models/donor';
import { GiftDto } from '../models/gift';

@Injectable({
  providedIn: 'root'
})
export class DonorService {

  private readonly apiUrl = 'http://localhost:5062/api/Donor';

  constructor(private http: HttpClient) { }

  private getAuthHeaders(): { headers: HttpHeaders } {
    const token = localStorage.getItem('token') || '';
    return { headers: new HttpHeaders({ Authorization: `Bearer ${token}` }) };
  }

  getAllDonors(): Observable<DonorDto[]> {
    return this.http.get<DonorDto[]>(`${this.apiUrl}/GetAllDonors`, this.getAuthHeaders());
  }

  addDonor(donor: DonorDto): Observable<string> {
    const token = localStorage.getItem('token') || '';
    const headers = { Authorization: `Bearer ${token}` };

    return this.http.post(`${this.apiUrl}/AddDonor`, donor, {
      headers: headers,
      responseType: 'text'
    });
  }
  deleteDonor(id: number): Observable<string> {
    console.log('Deleting donor ID:', id);
    const token = localStorage.getItem('token') || '';

    const headers = { Authorization: `Bearer ${token}` };

    return this.http.delete(`${this.apiUrl}/DeleteDonor/${id}`, {
      headers: headers,
      responseType: 'text'
    });
  }

  updateDonor(id: number, donor: DonorDto): Observable<any> {
    return this.http.put(
      `${this.apiUrl}/UpdateDonor/${id}`,
      donor,
      {
        headers: this.getAuthHeaders().headers,
        responseType: 'text'
      },

    );
  }

  getDonorGifts(id: number): Observable<GiftDto[]> {
    return this.http.get<GiftDto[]>(`${this.apiUrl}/GetDonorGifts/${id}`, this.getAuthHeaders());
  }

  filterDonors(name?: string, email?: string, giftId?: number): Observable<DonorDto[]> {
    let params = new HttpParams();
    if (name) params = params.set('name', name);
    if (email) params = params.set('email', email);
    if (giftId) params = params.set('giftId', giftId);

    return this.http.get<DonorDto[]>(`${this.apiUrl}/FilterDonors`, { ...this.getAuthHeaders(), params });
  }

  getAllGifts(): Observable<GiftDto[]> {
    const token = localStorage.getItem('token');
    return this.http.get<GiftDto[]>
      (`${this.apiUrl}/GetAllGifts`, {
        headers: { Authorization: `Bearer ${token}` }
      })


  }

}




