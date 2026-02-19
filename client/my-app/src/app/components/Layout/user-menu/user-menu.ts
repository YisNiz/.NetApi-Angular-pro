import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { Cart } from '../../User/cart/cart';

@Component({
  selector: 'app-user-menu',
  imports: [CommonModule, RouterModule, ButtonModule],
  templateUrl: './user-menu.html',
  styleUrl: './user-menu.sass',
})
export class UserMenu {
  private router = inject(Router);


menuItems = [
  { label: 'Products', icon: 'pi pi-gift', link: 'products' },
  
];

 cartVisible = false;
 
  // openCart()
  // {
     
       
  // }
 //  this.cartVisible = !this.cartVisible;
 isLoggedIn(): boolean {
  return !!localStorage.getItem('token');
}

isAdmin(): boolean {
  return localStorage.getItem('role') === 'Admin';
}

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
