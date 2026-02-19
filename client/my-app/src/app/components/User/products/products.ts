import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { GiftManagement } from '../../../services/gift-service';
import { Router } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { UserGiftDto } from '../../../models/products';
import { catchError, finalize, Observable, of, switchMap, tap } from 'rxjs';
import { ButtonModule } from "primeng/button";
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { ProgressSpinnerModule } from "primeng/progressspinner";
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Cart } from "../cart/cart";
import { CartService } from '../../../services/cart-service';
import { AuthService } from '../../../services/auth';
import { OrderItemDto } from '../../../models/cart';

@Component({
  selector: 'app-products',
  imports: [
    ButtonModule,
    CardModule,
    TagModule,
    ToastModule,
    InputTextModule,
    MessageModule,
    CommonModule,
    ProgressSpinnerModule,
    FormsModule,
    Cart
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './products.html',
  styleUrl: './products.sass',
})
export class Products {


  private authServ = inject(AuthService);
  private cartServ = inject(CartService);
  private giftServ = inject(GiftManagement);
  private router = inject(Router);
  private msg = inject(MessageService);

  loading: boolean = false;
  giftList!: UserGiftDto[];
  cartVisible: boolean = false;
  cartItems: OrderItemDto[] = [];

  constructor(private cdr: ChangeDetectorRef) { }

  ngOnInit() {
    this.loading = true;

    this.giftServ.getAllProducts().pipe(
      catchError((err) => {
        const serverMsg =
          err?.error?.message ??
          (typeof err?.error === 'string' ? err.error : null) ??
          'cannot get products';
        // this.msg.add({ severity: 'error', summary: 'Error', detail: serverMsg });
        if (err.status === 401) this.router.navigateByUrl('/login');

        return of([] as UserGiftDto[]);
      })
    ).subscribe((p) => {
      this.giftList = p;
      if (!p || p.length === 0) {
        // this.msg.add({ severity: 'info', summary: 'Info', detail: 'You don’t have products yet...' });
      } else {
        // this.msg.add({ severity: 'success', summary: 'Success', detail: 'products loaded successfully!' });
      }
      this.loading = false;
      this.cdr.detectChanges();
    });

    if (!this.authServ.hasToken()) {
      return;
    }

    this.cartServ.getAllCartItems().subscribe({
      next: (items) => {
        this.cartItems = items;
        this.cdr.detectChanges();
        // if(!items || items.length === 0)
        // this.msg.add({ severity: 'info', summary: 'Info', detail: 'Your cart is empty...' });
      },
      error: (err) => {

        const serverMsg =
          err?.error?.message ??
          (typeof err?.error === 'string' ? err.error : null) ??
          'cannot load cart';
        // this.msg.add({ severity: 'error', summary: 'Error', detail: serverMsg });

        if (err?.status === 401) this.router.navigateByUrl('/login');
      }
    });
  }




  giftTrackBy(index: number, gift: UserGiftDto) {
    return gift.id;
  }


  onSortByPriceOrCategory(param: string) {
    this.giftServ.sortingProducts(param).subscribe({
      next: (g) => {
        this.giftList = g
        this.msg.add({ severity: 'info', summary: 'info', detail: `products sorted by ${param}` });
        this.cdr.detectChanges();
      },
      error: (err) => {
        const serverMsg =
          err?.error?.message ??
          (typeof err?.error === 'string' ? err.error : null) ??
          'cannot sorted gift';
        this.msg.add({ severity: 'error', summary: 'Error', detail: serverMsg });
        this.cdr.detectChanges();

        if (err?.status === 401) this.router.navigateByUrl('/login');
      }
    });
  }

  onClearFilters() {
    this.giftServ.getAllProducts().subscribe(g => {
      this.giftList = g;
      this.cdr.detectChanges();
    });
  }

  onOpenCart() {
    this.cartVisible = true;

    if (!this.authServ.hasToken()) {
      this.cartItems = [];
      // this.msg.add({ severity: 'info', summary: 'Info', detail: 'Your cart is empty...' });

      return;
    }
    this.cartServ.getAllCartItems().subscribe({
      next: (items) => {
        this.cartItems = items;
        // if (!items || items.length === 0)
          // this.msg.add({ severity: 'info', summary: 'Info', detail: 'Your cart is empty...' });
        // else
          // this.msg.add({ severity: 'success', summary: 'Success', detail: 'cart uploaded succesfuly' });

      },
      error: (err) => {
        const serverMsg =
          err?.error?.message ??
          (typeof err?.error === 'string' ? err.error : null) ??
          'cannot add to cart';

        // this.msg.add({ severity: 'error', summary: 'Error', detail: serverMsg });

        if (err?.status === 401) this.router.navigateByUrl('/login');
      }
    });
    this.cartVisible = true;

  }
  onCloseCart() {
    this.cartVisible = false;
  }

  onAddToCart(giftId: number) {
    if (!this.authServ.hasToken()) {
      this.msg.add({
        severity: 'error',
        summary: 'Error',
        detail: 'You need login first!'
      });

      setTimeout(() => {
        this.router.navigateByUrl('/login');
      }, 1000);
      return;
    }

    this.cartServ.addProductToCart(giftId).pipe(
      switchMap(() => this.cartServ.getAllCartItems())
    ).subscribe({
      next: (items) => {
        this.cartItems = items;
        this.msg.add({ severity: 'info', summary: 'Added', detail: 'Gift added to cart' });
        this.cdr.detectChanges();
      },
      error: (err) => {
        const serverMsg =
          err?.error?.message ??
          (typeof err?.error === 'string' ? err.error : null) ??
          'cannot add to cart';
        this.msg.add({ severity: 'error', summary: 'Error', detail: serverMsg });
        if (err?.status === 401) this.router.navigateByUrl('/login');
      }
    });
  }


  get cartItemsCount(): number {
    return this.cartItems.reduce((sum, item) => sum + item.quantity, 0);
  }
}

