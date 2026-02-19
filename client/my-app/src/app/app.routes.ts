import { Routes } from '@angular/router';
import { Login } from './components/Auth/login/login';
import { Register } from './components/Auth/register/register';
import { Products } from './components/User/products/products';
import { ManageGifts } from './components/Manager/manage-gifts/manage-gifts';
import { authGuard } from './gards/auth.gard';
import { managerGuard } from './gards/manager.gard';
import { ManageDonors } from './components/Manager/manage-donors/manage-donors';
import { ManagePurchase } from './components/Manager/manage-purchase/manage-purchase';
import { ManageCategories } from './components/Manager/manage-categories/manage-categories';
import { ManagerMenu } from './components/Layout/manager-menu/manager-menu';
import { UserMenu } from './components/Layout/user-menu/user-menu';

export const routes: Routes = [

  // התחלה אוטומטית למוצרים
  { path: '', redirectTo: 'user/products', pathMatch: 'full' },

  { path: 'login', component: Login },
  { path: 'register', component: Register },

  // משתמש רגיל – ללא guard
  {
    path: 'user',
    component: UserMenu,
    children: [
      { path: '', redirectTo: 'products', pathMatch: 'full' },
      { path: 'products', component: Products },
    ]
  },

  // מנהל – מוגן
  {
    path: 'manager',
    canActivateChild: [authGuard, managerGuard],
    component: ManagerMenu,
    children: [
      { path: '', redirectTo: 'gifts', pathMatch: 'full' },
      { path: 'gifts', component: ManageGifts },
      { path: 'donors', component: ManageDonors },
      { path: 'purchases', component: ManagePurchase },
      { path: 'categories', component: ManageCategories },
    ]
  },

  // אם כתבו כתובת לא קיימת
  { path: '**', redirectTo: 'user/products' }

];
