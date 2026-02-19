import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { OrderItemDto } from '../models/cart';

@Injectable({
  providedIn: 'root',
})
export class CartService {

  constructor(private http: HttpClient) { }

  BASE_URL = 'http://localhost:5062/api/User';


  addProductToCart(giftId: number): Observable<string> {
    const token = localStorage.getItem('token');

    return this.http.post<string>(
      `${this.BASE_URL}/AddGiftToCart`,
      null,
      {
        params: { giftId: giftId },
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'text' as 'json'
      }
    );
  }


  getAllCartItems(): Observable<OrderItemDto[] | []> {
    const token = localStorage.getItem('token');
    return this.http.get<OrderItemDto[] | []>
      (`${this.BASE_URL}/GetCartItems`,
        { headers: { Authorization: `Bearer ${token}` } })
  }

  deleteProductFromCart(giftId: number): Observable<string> {
    const token = localStorage.getItem('token');
    return this.http.delete(
      `${this.BASE_URL}/RemoveGiftFromCart`,
      {
        headers: { Authorization: `Bearer ${token}` },
        params: { giftId: giftId },
        responseType: 'text'
      }
    );
  }

  updateItemAmount(giftId: number): Observable<string> {
    const token = localStorage.getItem('token');

    return this.http.put(
      `${this.BASE_URL}/UpdateAmountItemInCartAsync`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
        params: { giftId: giftId },
        responseType: 'text'
      }
    );
  }

  checkout(): Observable<string> {
    const token = localStorage.getItem('token');
    return this.http.post(
      `${this.BASE_URL}/Checkout`,
      null,
      {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'text'
      }
    );
  }




}
