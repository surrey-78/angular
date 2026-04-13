import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
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
  inquiries: any[] = [];
  loading: boolean = true;
  
  activeSection: 'inquiry' | 'sales' | 'delivery' = 'inquiry';

  constructor(private sapService: SapService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    if (this.kunnr) {
      this.loadDashboardData();
    } else {
      this.loading = false;
      console.warn('Customer ID missing.');
    }
  }

  navigateTo(section: 'inquiry' | 'sales' | 'delivery') {
    this.activeSection = section;
    this.cdr.detectChanges();
    
    const tableElement = document.querySelector('.content-card');
    if (tableElement) {
      tableElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  loadDashboardData() {
    const sapKunnr = this.kunnr.padStart(10, '0');
    this.loading = true;

    this.sapService.getDashboard(sapKunnr).subscribe({
      next: (data: any) => {
        console.log('--- DASHBOARD DATA RECEIVED ---', data);

        // Standardize mapping for all three arrays
        this.inquiries = this.mapDashboardResponse(data?.EtInquiry);
        this.salesOrders = this.mapDashboardResponse(data?.EtSales);
        this.deliveries = this.mapDashboardResponse(data?.EtDelivery);
        
        this.loading = false;
        this.cdr.detectChanges(); 
      },
      error: (err) => {
        console.error('SAP Dashboard Connection Error:', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Standardizes dashboard items and handles currency field mapping
   */
  private mapDashboardResponse(wrapper: any): any[] {
    if (!wrapper || wrapper === "") return [];

    // Extract the raw data from SAP "item" wrapper
    let raw = wrapper.item || wrapper;
    if (raw && !Array.isArray(raw) && raw.item) raw = raw.item;
    
    const items = Array.isArray(raw) ? raw : (raw ? [raw] : []);
    if (items.length === 0 || typeof items[0] !== 'object') return [];

    return items.map(item => {
      const normalized: any = {};
      Object.keys(item).forEach(key => {
        const upKey = key.toUpperCase();
        
        // Explicitly map Currency fields (WAERK or WAERS) to 'Waerk'
        // Standardize Currency in mapDashboardResponse logic
if (upKey === 'WAERK' || upKey === 'WAERS') {
  normalized['Waerk'] = item[key];
}
        // Explicitly map Tax field
        else if (upKey === 'MWSBP') {
          normalized['Mwsbp'] = item[key];
        }
        else {
          // Standard PascalCase for other fields (Vbeln, Erdat, Matnr, etc.)
          const pascalKey = key.charAt(0).toUpperCase() + key.slice(1).toLowerCase();
          normalized[pascalKey] = item[key];
        }
      });
      return normalized;
    });
  }
}