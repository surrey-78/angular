import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SapService } from '../../services/sap';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class DashboardComponent implements OnInit {
  kunnr: string = localStorage.getItem('kunnr') || '';
  salesOrders: any[] = [];
  deliveries: any[] = [];
  loading: boolean = true;

  constructor(private sapService: SapService) {}

  ngOnInit(): void {
    if (this.kunnr) {
      this.loadDashboardData();
    }
  }

  loadDashboardData() {
    this.sapService.getDashboard(this.kunnr).subscribe({
      next: (data: any) => {
        console.log('--- RAW DASHBOARD DATA ---', data);

        // SAP 'mc-style' usually returns EtSales.item or EtSales
        this.salesOrders = this.processSapTable(data?.EtSales);
        this.deliveries = this.processSapTable(data?.EtDelivery);

        console.log('Orders for UI:', this.salesOrders);
        this.loading = false;
      },
      error: (err) => {
        console.error('Dashboard Error:', err);
        this.loading = false;
      }
    });
  }

  // Helper to handle SAP's weird table nesting
  private processSapTable(tableObj: any): any[] {
    if (!tableObj) return [];
    // If tableObj.item exists, use it; otherwise use tableObj itself
    const data = tableObj.item || tableObj;
    return Array.isArray(data) ? data : [data];
  }
}