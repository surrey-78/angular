import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SapService } from '../../services/sap';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  kunnr: string = localStorage.getItem('kunnr') || '';
  salesOrders: any[] = [];
  deliveries: any[] = [];
  inquiries: any[] = [];
  loading: boolean = true;
  
  activeSection: 'inquiry' | 'sales' | 'delivery' | 'analytics' = 'inquiry';
  private chart: Chart | undefined;

  constructor(private sapService: SapService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    if (this.kunnr) {
      this.loadDashboardData();
    } else {
      this.loading = false;
      console.warn('Customer ID (KUNNR) not found in local storage.');
    }
  }

  // Cleanup chart on component destroy to prevent memory leaks
  ngOnDestroy(): void {
    if (this.chart) {
      this.chart.destroy();
    }
  }

  navigateTo(section: 'inquiry' | 'sales' | 'delivery' | 'analytics') {
    this.activeSection = section;
    this.cdr.detectChanges();
    
    if (section === 'analytics') {
      // Use requestAnimationFrame for smoother rendering after DOM update
      requestAnimationFrame(() => this.renderPieChart());
    } else {
      const contentCard = document.querySelector('.deep-content-card');
      if (contentCard) {
        contentCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }

  renderPieChart() {
    const canvas = document.getElementById('businessPieChart') as HTMLCanvasElement;
    if (!canvas) return;

    if (this.chart) {
      this.chart.destroy();
    }

    // Handle empty data scenario visually
    const hasData = (this.inquiries.length + this.salesOrders.length + this.deliveries.length) > 0;

    this.chart = new Chart(canvas, {
      type: 'pie',
      data: {
        labels: ['Inquiries', 'Sales Orders', 'Deliveries'],
        datasets: [{
          data: hasData 
            ? [this.inquiries.length, this.salesOrders.length, this.deliveries.length] 
            : [1, 1, 1], // Placeholder for empty state
          backgroundColor: hasData 
            ? ['#FFD700', '#27ae60', '#2d0000'] 
            : ['#e0e0e0', '#d0d0d0', '#c0c0c0'], // Gray for no data
          borderColor: '#ffffff',
          borderWidth: 3,
          hoverOffset: 25
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          tooltip: {
            enabled: hasData, // Disable tooltips if no real data
            callbacks: {
              label: (context) => ` ${context.label}: ${context.raw} units`
            }
          },
          legend: {
            position: 'bottom',
            labels: {
              font: { family: 'Inter', weight: 'bold', size: 14 },
              padding: 25,
              usePointStyle: true
            }
          }
        },
        animation: {
          animateRotate: true,
          animateScale: true
        }
      }
    });
  }

  getPercentage(type: string): string {
    const total = this.inquiries.length + this.salesOrders.length + this.deliveries.length;
    if (total === 0) return '0.0';
    
    const count = type === 'inquiry' ? this.inquiries.length : 
                  type === 'sales' ? this.salesOrders.length : this.deliveries.length;
                  
    return ((count / total) * 100).toFixed(1);
  }

  loadDashboardData() {
    const sapKunnr = this.kunnr.padStart(10, '0');
    this.loading = true;

    this.sapService.getDashboard(sapKunnr).subscribe({
      next: (data: any) => {
        // Map data ensuring we always have an array
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

  private mapDashboardResponse(wrapper: any): any[] {
    if (!wrapper) return [];
    
    // SAP response can be a single object, an array, or nested in .item
    let raw = wrapper.item || wrapper;
    if (raw && raw.item) raw = raw.item;
    
    const items = Array.isArray(raw) ? raw : (raw && typeof raw === 'object' ? [raw] : []);
    
    return items.map(item => {
      const normalized: any = {};
      Object.keys(item).forEach(key => {
        const upKey = key.toUpperCase();
        
        // Handle standard SAP currency/tax fields
        if (['WAERK', 'WAERS', 'HWAER'].includes(upKey)) {
          normalized['Waerk'] = item[key];
        } else if (upKey === 'MWSBP') {
          normalized['Mwsbp'] = item[key];
        } else {
          // Fallback to PascalCase (Vbeln, Erdat, etc)
          const pascalKey = key.charAt(0).toUpperCase() + key.slice(1).toLowerCase();
          normalized[pascalKey] = item[key];
        }
      });
      return normalized;
    });
  }
}