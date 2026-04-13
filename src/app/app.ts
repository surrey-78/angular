import { Component, HostListener } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterModule, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  title = 'SAP Customer Portal';
  showNavbar = false;
  
  // Profile Dropdown States
  isProfileOpen = false;
  userProfile: any = null;

  constructor(private router: Router) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      const currentRoute = event.urlAfterRedirects;
      this.showNavbar = currentRoute !== '/' && currentRoute !== '/login';
      
      // Load user data whenever we are on a protected page
      if (this.showNavbar) {
        this.loadUserData();
      }
    });
  }

  loadUserData() {
    const data = localStorage.getItem('userData');
    if (data) {
      this.userProfile = JSON.parse(data);
    }
  }

  toggleProfile(event: Event) {
    event.stopPropagation(); // Prevents the HostListener from closing it immediately
    this.isProfileOpen = !this.isProfileOpen;
  }

  // Closes the profile dropdown if you click anywhere else on the screen
  @HostListener('document:click')
  closeProfile() {
    this.isProfileOpen = false;
  }

  logout() {
    this.isProfileOpen = false;
    localStorage.clear();
    this.router.navigate(['/']);
  }
}