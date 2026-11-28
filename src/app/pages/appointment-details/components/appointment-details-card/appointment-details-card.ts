import {
  Component,
  EventEmitter,
  Input,
  Output,
  inject,
} from '@angular/core';

import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

import { CancelAppointment } from '../../../../components/cancel-appointment/cancel-appointment';
import { Button } from '../../../../components/button/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MessageComponent } from '../../../../features/dashboard/components/message/message';

export interface Appointment {
  ID: string | number;
  DoctorID?: number;
  ApptStatus?: string;
  PatientInfo?: string;
  AppointmentTime?: string;
  Doctor?: string;
  Specialty?: string;
  ApptDate?: string;
  ApptTime?: string;
  Telemedicine?: number;
  ApptMonth?: string;
  ApptDay?: string;
  drImg?: string;
  AmountDue?: number;
  TenantName?: string;
}

@Component({
  selector: 'app-appointment-details-card',
  standalone: true,
  imports: [
    MatIconModule,
    CancelAppointment,
    MatFormFieldModule,
    Button,
    MessageComponent
  ],
  templateUrl: './appointment-details-card.html',
  styleUrl: './appointment-details-card.css',
})
export class AppointmentDetailsCard {
  private readonly router = inject(Router);

  @Input({ required: true }) appointment!: Appointment;
  @Output() refetch = new EventEmitter<void>();
  messageDoctorID = 0;
  messageDoctorName = ''
  isMessage = false;
  open = false;

  get isCancelled(): boolean {
    return (
      this.appointment?.ApptStatus?.toLowerCase() === 'cancelled'
    );
  }

  get isConfirmed(): boolean {
    return (
      this.appointment?.ApptStatus?.toLowerCase() === 'confirmed'
    );
  }

  get isTelemedicine(): boolean {
    return this.appointment?.Telemedicine === 1;
  }

  get appointmentType(): string {
    return this.isTelemedicine
      ? 'Telemedicine'
      : 'In-person';
  }

  get formattedDate(): string {
    if (!this.appointment?.ApptDate) {
      return '';
    }

    return new Date(this.appointment.ApptDate).toLocaleDateString(
      'en-US',
      {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }
    );
  }

  get formattedTime(): string {
    if (!this.appointment?.AppointmentTime) {
      return '';
    }

    return new Date(
      this.appointment.AppointmentTime
    ).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }

  handleViewClick(): void {
    this.router.navigate([
      '/appointments',
      this.appointment.ID,
    ]);
  }

  openCancelDialog(): void {
    this.open = true;
  }

  handleDialogChange(value: boolean): void {
    this.open = value;
  }

  handleRefetch(): void {
    this.refetch.emit();
  }



  get canMessage(): boolean {
    const status = this.appointment?.ApptStatus?.trim().toLowerCase();

    return ['in-progress', 'completed', 'checked in'].includes(status ?? '');
  }

  openDoctorMessage(): void {
    if (!this.appointment?.DoctorID) {
      return;
    }

    this.messageDoctorID = this.appointment.DoctorID;
    this.messageDoctorName = this.appointment.Doctor ?? '';
    this.isMessage = true;
  }
}
