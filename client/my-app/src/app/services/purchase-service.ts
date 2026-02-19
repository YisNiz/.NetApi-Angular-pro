import { Injectable } from '@angular/core';
import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';
import { PurchaseDetailDto, PurchaseDto, WinnersGiftsReportDto } from '../models/purchase';

@Injectable({
  providedIn: 'root',
})
export class PurchaseService {

  AUTH_URL = 'http://localhost:5062/api/Purchase';

  constructor(private http: HttpClient) { }

  getAllPurchase(): Observable<PurchaseDto[]> {
    const token = localStorage.getItem('token');
    return this.http.get<PurchaseDto[]>
      (`${this.AUTH_URL}/GetAllPurchases`,
        { headers: { Authorization: `Bearer ${token}` }, })
  }


  getBuyersDetails(giftId: number): Observable<PurchaseDetailDto[]> {
    const token = localStorage.getItem('token');
    return this.http.get<PurchaseDetailDto[]>
      (`${this.AUTH_URL}/BuyersDetails/${giftId}`,
        { headers: { Authorization: `Bearer ${token}` } })
  }

  sortingGiftsAsync(param: string): Observable<PurchaseDto[]> {
    const token = localStorage.getItem('token');

    return this.http.get<PurchaseDto[]>(
      `${this.AUTH_URL}/SortingGifts`,
      {
        params: { sortParam: param },
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
  }
  MakeLottery(giftId: number): Observable<string> {
    const token = localStorage.getItem('token');

    return this.http.post(
      `${this.AUTH_URL}/MakeLottery/${giftId}`,
      null,
      {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'text'
      }
    );
  }

  makeWinnersReport(): Observable<WinnersGiftsReportDto[]> {
    const token = localStorage.getItem('token');
    return this.http.get<WinnersGiftsReportDto[]>
      (`${this.AUTH_URL}/WinnersGiftsReports`,
        { headers: { Authorization: `Bearer ${token}` } })
  }


  makeRevenueReport(): Observable<number> {
    const token = localStorage.getItem('token');
    return this.http.get<number>
      (`${this.AUTH_URL}/TotalSalesRevenueReport`,
        {
          headers: { Authorization: `Bearer ${token}` }
        })
  }
}



