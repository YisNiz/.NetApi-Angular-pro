import { ChangeDetectorRef, Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { UserGiftDto } from '../../../models/products';
import { CommonModule } from '@angular/common';
import { OrderItemDto } from '../../../models/cart';
import { CartService } from '../../../services/cart-service';
import { ConfirmationService, MessageService } from 'primeng/api';
import { Router } from '@angular/router';
import { switchMap } from 'rxjs';
import { Toast } from "primeng/toast";

@Component({
  selector: 'app-cart',
  imports: [CommonModule, Toast],
  providers: [MessageService, ConfirmationService],
  templateUrl: './cart.html',
  styleUrl: './cart.sass',
})
export class Cart {
  private cartServ = inject(CartService);
  constructor(private cdr: ChangeDetectorRef) { }
  
  @Input() cartItems: OrderItemDto[] = [];
  @Output() close = new EventEmitter<void>();
  @Input() showCart: boolean = false;
  @Output() cartUpdated = new EventEmitter<OrderItemDto[]>();

  private msg = inject(MessageService);
  private router = inject(Router);
  cartItemsCount: number = this.cartItems.length

  onClose() {
    this.close.emit();
  }

  getCartTotal(): number {
    return this.cartItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
  }


  decreaseItemAmount(giftId: number) {
    this.cartServ.updateItemAmount(giftId).pipe(
      switchMap(() => this.cartServ.getAllCartItems())
    ).subscribe({
      next: (items) => {
        this.cartItems = items;
        this.cartUpdated.emit(this.cartItems);
      },
      error: (err) => {
        if (err?.status === 401) this.router.navigateByUrl('/login');
      }
    });
  }

  increaseQuantity(giftId: number) {
    this.cartServ.addProductToCart(giftId).pipe(
      switchMap(() => this.cartServ.getAllCartItems())
    ).subscribe({
      next: (items) => {
        this.cartItems = items;
        this.cartUpdated.emit(this.cartItems);
      },
      error: (err) => {
        if (err?.status === 401) this.router.navigateByUrl('/login');
      }
    });
  }


  isDeleting = false;
  removeFromCart(giftId: number) {
    if (this.isDeleting) return;

    this.isDeleting = true;

    this.cartServ.deleteProductFromCart(giftId).pipe(
      switchMap(() => this.cartServ.getAllCartItems())
    ).subscribe({
      next: (items) => {
        this.cartItems = items;
        this.cartUpdated.emit(items);
        this.msg.add({ severity: 'success', summary: 'Success', detail: 'Deleted successfully' });
        this.isDeleting = false;
      },
      error: (err) => {
        const serverMsg =
          err?.error?.message ??
          (typeof err?.error === 'string' ? err.error : null) ??
          'cannot delete product from cart';

        this.msg.add({ severity: 'error', summary: 'Error', detail: serverMsg });

        if (err.status == 401)
          this.router.navigateByUrl('/login');

        this.isDeleting = false;
      }
    });
  }

  checkout() {
    if (this.cartItems.length === 0) {
      return;
    }
    this.cartServ.checkout().subscribe({
      next: (msg) => {
        alert(msg)
        this.msg.add({ severity: 'success', summary: 'Success', detail: msg });

        this.cartItems = [];
        this.cartUpdated.emit(this.cartItems);
        this.onClose()
      },
      error: (err) => {
        const serverMsg =
          err?.error?.message ??
          (typeof err?.error === 'string' ? err.error : 'Checkout failed');

        this.msg.add({ severity: 'error', summary: 'Error', detail: serverMsg });

        if (err?.status === 401) {
          this.router.navigateByUrl('/login');
        }
      }
    });
  }

}
