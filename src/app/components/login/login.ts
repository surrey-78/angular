import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { Router } from '@angular/router';
import { SapService } from '../../services/sap';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent {
  kunnr: string = '';
  password: string = '';
  errorMessage: string = '';
  loading: boolean = false;

  constructor(private sapService: SapService, private router: Router) {}

  onLogin() {
    if (!this.kunnr || !this.password) {
      this.errorMessage = 'Please enter both Customer ID and Password';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    // Standardizing KUNNR format to 10 digits
    const formattedKunnr = this.kunnr.padStart(10, '0');

    this.sapService.login(formattedKunnr, this.password).subscribe({
      next: (data: any) => {
        console.log('Login Raw Response:', data);

        // Normalize the response object to handle case-sensitivity
        const loginData = this.normalizeKeys(data?.EsLogin);
        const profileData = this.normalizeKeys(data?.EsProfile);

        // Check for success: SAP typically sends 'S' for success
        const isSuccess = loginData?.Success === 'S' || loginData?.Success === 'X';

        if (isSuccess) {
          // 1. Store the Customer ID
          localStorage.setItem('kunnr', formattedKunnr);
          
          // 2. Store the Profile Data (Name, City, etc.)
          if (profileData) {
            localStorage.setItem('userData', JSON.stringify(profileData));
          }
          
          // 3. Navigate to Dashboard
          this.router.navigate(['/dashboard']);
        } else {
          // Display specific message from SAP FM
          this.errorMessage = loginData?.Message || 'Invalid Credentials. Please try again.';
        }
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Login Connection Error:', err);
        this.errorMessage = 'SAP Server Connection failed. Please check your proxy.';
        this.loading = false;
      }
    });
  }

  /**
   * Helper to ensure we can read SAP keys regardless of casing
   * Converts all keys to PascalCase (e.g., success -> Success)
   */
  private normalizeKeys(obj: any): any {
    if (!obj || typeof obj !== 'object') return obj;
    const normalized: any = {};
    Object.keys(obj).forEach(key => {
      const normalizedKey = key.charAt(0).toUpperCase() + key.slice(1).toLowerCase();
      normalized[normalizedKey] = obj[key];
    });
    return normalized;
  }
}