import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { PurchaseService } from '../../../services/purchase-service';
import { PurchaseDetailDto, PurchaseDto, WinnersGiftsReportDto } from '../../../models/purchase';
import { ConfirmationService, MessageService } from 'primeng/api';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { AvatarModule } from 'primeng/avatar';
import { TooltipModule } from 'primeng/tooltip';
import { CommonModule } from '@angular/common';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

@Component({
  selector: 'app-manage-purchase',
  standalone: true,
  imports: [
    CardModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    DialogModule,
    AvatarModule,
    TooltipModule,
    CommonModule,
    ToastModule,
    ProgressSpinnerModule,
    TagModule,
  ],
  providers: [MessageService, ConfirmationService,],
  templateUrl: './manage-purchase.html',
  styleUrl: './manage-purchase.sass',
})
export class ManagePurchase {
  private purchServ = inject(PurchaseService);
  private router = inject(Router);
  private msg = inject(MessageService);
  loading: boolean = false;
  allWinners$!: Observable<boolean>;

  purchases$!: Observable<PurchaseDto[]>;
  details$: Observable<PurchaseDetailDto[]> = of([]);
  winnersReport$!: Observable<WinnersGiftsReportDto[]>;
  ngOnInit() {
    this.loading = true;
    this.purchases$ = this.purchServ.getAllPurchase().pipe(
      tap((p) => {
        if (!p || p.length === 0 || []) {
          this.msg.add({ severity: 'info', summary: 'Info', detail: 'You don’t have purchases yet...' });
        } else {
          this.msg.add({ severity: 'success', summary: 'Success', detail: 'Purchases loaded successfully!' });
        }
        this.loading = false
      }),
      catchError((err) => {
        const serverMsg =
          err?.error?.message ??
          (typeof err?.error === 'string' ? err.error : null) ??
          'cannot get purchases';
        this.loading = false

        this.msg.add({ severity: 'error', summary: 'Error', detail: serverMsg });
        if (err.status === 401) this.router.navigateByUrl('/login');

        return of([] as PurchaseDto[]);

      })

    );

  }

  show: boolean = false

  onShowPurchaseDetails(id: number) {
    this.show = true;
    this.details$ = this.purchServ.getBuyersDetails(id).pipe(
      tap((p) => {
        if (!p || p.length == 0) {
          this.msg.add({ severity: 'info', summary: 'Info', detail: 'You don’t have details yet...' });
        } else {
          this.msg.add({ severity: 'success', summary: 'Success', detail: 'details loaded successfully!' });
        }
      }),
      catchError((err) => {
        this.show = false;
        const serverMsg =
          err?.error?.message ??
          (typeof err?.error === 'string' ? err.error : null) ??
          'cannot get details';

        this.msg.add({ severity: 'error', summary: 'Error', detail: serverMsg });
        if (err.status === 401) this.router.navigateByUrl('/login');

        return of([] as PurchaseDetailDto[]);
      })
    );
  }



  sortPurchases(param: string) {
    this.purchases$ = this.purchServ.sortingGiftsAsync(param).pipe(
      tap((p) => {
        this.msg.add({ severity: 'info', summary: 'Info', detail: `sorting by ${param}` });
      }),
      catchError(err => {
        this.msg.add({ severity: 'error', summary: 'Error', detail: 'Sort failed' });
        return of([] as PurchaseDto[]);
      })
    );
  }
  resetSorting() {
    this.purchases$ = this.purchServ.getAllPurchase();
    this.msg.add({ severity: 'info', summary: 'Reset', detail: 'Sorting reset' });
  }


  onDrawWinner(id: number) {
    this.purchServ.MakeLottery(id).subscribe({
      next: (p) => {
        this.msg.add({ severity: 'success', summary: 'Success', detail: p });
        this.purchases$ = this.purchServ.getAllPurchase();
      },
      error: (err) => {
        const serverMsg =
          err?.error?.message ??
          (typeof err?.error === 'string' ? err.error : null) ??
          'cannot lottery';

        this.msg.add({ severity: 'error', summary: 'Error', detail: serverMsg });
        if (err.status === 401) this.router.navigateByUrl('/login');
      }
    });
  }

  onGiftsWinnersReport() {
    this.purchServ.makeWinnersReport().subscribe({
      next: (rows) => {
        const data = rows.map(r => ({
          'Gift Name': r.giftName ?? '',
          'Gift Description': r.giftDescription ?? '',
          'Purchase Date': r.purchaseDate ? new Date(r.purchaseDate).toLocaleString() : '',
          'Username': r.user?.userName ?? '',
          'Name': r.user?.name ?? '',
          'Phone': r.user?.phone ?? '',
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Winners');

        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });

        saveAs(blob, 'Gifts_Winners_Report.xlsx');

        this.msg.add({ severity: 'success', summary: 'Success', detail: 'Excel downloaded' });
      },
      error: (err) => {
        const serverMsg =
          err?.error?.message ??
          (typeof err?.error === 'string' ? err.error : null) ??
          'cannot create report';

        this.msg.add({ severity: 'error', summary: 'Error', detail: serverMsg });
        if (err.status === 401) this.router.navigateByUrl('/login');
      }
    });
  }


  onTotalSalesReport() {
    this.purchServ.makeRevenueReport().subscribe({
      next: (sum) => {

        const data = [
          { 'Total Revenue': sum }
        ];

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Revenue');

        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });

        saveAs(blob, 'Gifts_Revenue_Report.xlsx');

        this.msg.add({ severity: 'success', summary: 'Success', detail: 'Excel downloaded' });
      },
      error: (err) => {
        const serverMsg =
          err?.error?.message ??
          (typeof err?.error === 'string' ? err.error : null) ??
          'cannot create report';

        this.msg.add({ severity: 'error', summary: 'Error', detail: serverMsg });
        if (err.status === 401) this.router.navigateByUrl('/login');
      }
    });
  }

}



