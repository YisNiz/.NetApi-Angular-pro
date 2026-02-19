import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { Cart } from "../../User/cart/cart";

@Component({
  selector: 'app-manager-menu',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonModule],
  templateUrl: './manager-menu.html',
})
export class ManagerMenu {
  private router = inject(Router);
menuItems = [
  { label: 'Gifts', icon: 'pi pi-gift', link: 'gifts' },
  { label: 'Categories', icon: 'pi pi-tags', link: 'categories' },
  { label: 'Purchases', icon: 'pi pi-shopping-cart', link: 'purchases' },
  { label: 'Donors', icon: 'pi pi-users', link: 'donors' }
];


  goLogin() {
    this.router.navigateByUrl('/login');
  }

  goRegister() {
    this.router.navigateByUrl('/register');
  }

  logout() {
    localStorage.removeItem('token'); 
    this.router.navigateByUrl('/login');
  }
}
