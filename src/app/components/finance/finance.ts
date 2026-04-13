import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SapService } from '../../services/sap';

@Component({
  selector: 'app-finance',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './finance.html',
  styleUrls: ['./finance.css']
})
export class FinanceComponent implements OnInit {
  kunnr: string = localStorage.getItem('kunnr') || '';
  invoices: any[] = [];
  agingItems: any[] = [];
  memos: any[] = [];
  overallSales: number = 0;
  loading: boolean = true;

  constructor(private sapService: SapService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    if (this.kunnr) {
      this.loadFinanceData();
    } else {
      this.loading = false;
    }
  }

  loadFinanceData() {
    this.loading = true;
    const formattedKunnr = this.kunnr.padStart(10, '0');

    this.sapService.getFinanceSheet(formattedKunnr).subscribe({
      next: (data: any) => {
        // Log the full data to see exactly how the parser is nesting keys
        console.log('--- RAW FINANCE DATA ---', data);

        // Map each table using the refined extractor
        this.invoices = this.mapSapResponse(data?.EtInvoices);
        this.agingItems = this.mapSapResponse(data?.EtAging);
        this.memos = this.mapSapResponse(data?.EtMemos);
        
        // EvOverallSales is a direct value, not an object/array
        const sales = data?.EvOverallSales;
        this.overallSales = sales ? parseFloat(sales) : 0;

        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Finance API Error:', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Refined Mapper specifically for SAP XML 'item' structures
   */
  // finance.component.ts

private mapSapResponse(wrapper: any): any[] {
  // 1. If wrapper is null, undefined, or an empty string from SAP
  if (!wrapper || wrapper === "") return [];

  // 2. Dig into the 'item' wrapper
  let rawItems = wrapper.item || wrapper;

  // 3. Handle double nesting if it occurs
  if (rawItems && !Array.isArray(rawItems) && rawItems.item) {
    rawItems = rawItems.item;
  }

  // 4. Ensure we have an array to loop through
  const items = Array.isArray(rawItems) ? rawItems : (rawItems ? [rawItems] : []);

  // 5. If after all that it's still empty or not an object
  if (items.length === 0 || typeof items[0] !== 'object') return [];

  return items.map(item => {
    const normalized: any = {};
    Object.keys(item).forEach(key => {
      const upKey = key.toUpperCase();
      
      // Map to PascalCase for HTML template
      if (upKey === 'BELNR') normalized['Belnr'] = item[key]?.toString().replace(/^0+/, '');
      else if (upKey === 'BLDAT') normalized['Bldat'] = item[key];
      else if (upKey === 'WRBTR') normalized['Wrbtr'] = item[key];
      else if (upKey === 'WAERS') normalized['Waers'] = item[key];
      else if (upKey === 'AGING') normalized['Aging'] = item[key];
      else if (upKey === 'BUCKET') normalized['Bucket'] = item[key];
      else if (upKey === 'TYPE') normalized['Type'] = item[key];
      else {
        const pascalKey = key.charAt(0).toUpperCase() + key.slice(1).toLowerCase();
        normalized[pascalKey] = item[key];
      }
    });
    return normalized;
  });
}
}