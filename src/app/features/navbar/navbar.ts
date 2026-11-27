import { Component, inject, Input } from '@angular/core';
import { Router } from '@angular/router';

import { ServicesDropdown } from './components/services-dropdown/services-dropdown';
import { NotificationPopover } from './components/notification-popover/notification-popover';
import { ProfilePopover } from './components/profile-popover/profile-popover';
import { Logo } from './components/logo/logo';
import { MessageCenterComponent } from '../dashboard/components/message/message-center/message-center';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    MatIconModule,
    Logo,
    ServicesDropdown,
    NotificationPopover,
    ProfilePopover,
    MessageCenterComponent
  ],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {


  isMobileMenuOpen: boolean = false;

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  private router = inject(Router);

  @Input() patientDetails: any = null;

  isAuthenticated(): boolean {
    return !!sessionStorage.getItem('tkn');
  }

  signIn(): void {
    this.router.navigate(['/auth/sign-in']);
  }
}