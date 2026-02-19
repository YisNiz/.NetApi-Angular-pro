import { Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { CategoriesService } from '../../../services/categories-service';
import { catchError, Observable, of, tap } from 'rxjs';
import { CategoryDto } from '../../../models/gift';
import { CommonModule } from '@angular/common';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

import { ButtonModule } from 'primeng/button';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TableModule } from "primeng/table";
import { Toast } from "primeng/toast";
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { CreateCategoryDto } from '../../../models/category';

@Component({
  selector: 'app-manage-categories',
  imports: [
    CommonModule,
    RouterModule,
    ButtonModule,
    ProgressSpinnerModule,
    TableModule,
    Toast,
    FormsModule,
    InputTextModule, ConfirmDialogModule, ToastModule
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './manage-categories.html',
  styleUrl: './manage-categories.sass',
})
export class ManageCategories {

  private categoryServ = inject(CategoriesService)
  private router = inject(Router);
  private confirmationService = inject(ConfirmationService);
  private msg = inject(MessageService);

  categories$!: Observable<CategoryDto[]>;
  loading: any;

  editingCategoryId: number | null = null;
  editingCategoryName: string = '';

  ngOnInit() {
    this.loadCategories();
  }

  loadCategories() {
    this.categories$ = this.categoryServ.getAllCategories().pipe(
      tap((c) => {
        if (!c || c.length === 0) {
          this.msg.add({ severity: 'info', summary: 'Info', detail: 'You don’t have categories yet...' });
        } else {
          this.msg.add({ severity: 'success', summary: 'Success', detail: 'categories loaded successfully!' });
        }
      }),
      catchError((err) => {
        const serverMsg =
          err?.error?.message ??
          (typeof err?.error === 'string' ? err.error : null) ??
          'cannot get categories';
        this.msg.add({ severity: 'error', summary: 'Error', detail: serverMsg });
        if (err.status === 401) this.router.navigateByUrl('/login');
        return of([] as CategoryDto[]);
      })
    );
  }

  newCategoryName = '';

  onAddCategory() {
    const name = this.newCategoryName.trim();
    if (!name) return;
    const dto: CreateCategoryDto = { name };
    this.categoryServ.addCategory(dto).subscribe({
      next: (msg) => {
        this.msg.add({ severity: 'success', summary: 'Success', detail: msg });
        this.newCategoryName = '';
        this.loadCategories();
      },
      error: (err) => {
        const serverMsg = err?.error?.message ?? 'cannot add category';
        this.msg.add({ severity: 'error', summary: 'Error', detail: serverMsg });
        if (err.status === 401) this.router.navigateByUrl('/login');
      }
    });
  }

  onDeleteCategory(category: CategoryDto) {
    this.confirmationService.confirm({
      message: `Deleting this category will also delete all related gifts. Are you sure?`,
      header: 'Confirm Deletion',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.categoryServ.deleteCategory(category.id).subscribe({
          next: (msg) => {
            this.msg.add({ severity: 'success', summary: 'Deleted', detail: msg });
            this.loadCategories();
          },
          error: (err) => {
            const serverMsg = err?.error?.message ?? 'cannot delete category';
            this.msg.add({ severity: 'error', summary: 'Error', detail: serverMsg });
          }
        });
      }
    });
  }


  startEdit(category: CategoryDto) {
    this.editingCategoryId = category.id;
    this.editingCategoryName = category.name;
  }

  cancelEdit() {
    this.editingCategoryId = null;
    this.editingCategoryName = '';
  }

  saveEdit(category: CategoryDto) {
    const trimmedName = this.editingCategoryName.trim();
    if (!trimmedName) return;
    const updatedDto: CategoryDto = { id: category.id, name: trimmedName };
    this.categoryServ.updateCategory(updatedDto).subscribe({
      next: (msg) => {
        this.msg.add({ severity: 'success', summary: 'Updated', detail: msg });
        this.cancelEdit();
        this.loadCategories();
      },
      error: (err) => {
        const serverMsg = err?.error?.message ?? 'cannot update category';
        this.msg.add({ severity: 'error', summary: 'Error', detail: serverMsg });
      }
    });
  }
}
