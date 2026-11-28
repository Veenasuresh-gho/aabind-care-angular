import {
  Component,
  OnInit,
  OnDestroy,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { GHOService } from '../../../services/gho.service';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface PaymentRequestDetails {
  apptId: number | string;
  billingId: number | string;
  amount: number;
  message: string;
  patImg?: string;
  drImg?: string;
}

@Component({
  selector: 'app-external-payment',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './external-payment.html',
  styleUrls: ['./external-payment.css']
})
export class ExternalPayment implements OnInit, OnDestroy {

  private srv = inject(GHOService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  paymentRequestId = '';

  externalPaymentRequestDetails: PaymentRequestDetails | null = null;

  isFetching = true;
  isGetPatientBillingLoading = false;

  notification = '';
  notificationType: 'success' | 'error' = 'success';

  private destroyed = false;

  ngOnInit(): void {
    this.paymentRequestId = this.router.url
      .split('?')[0]
      .split('#')[0]
      .split('/')
      .filter(Boolean)
      .pop() || '';

    if (!this.paymentRequestId) {
      this.isFetching = false;
      return;
    }

    this.fetchExternalPaymentRequestDetails();
  }

  ngOnDestroy(): void {
    this.destroyed = true;
  }

  fetchExternalPaymentRequestDetails(): void {
    this.isFetching = true;
    const tags = [
      { T: 'dk1', V: this.paymentRequestId },
      { T: 'c10', V: '99' }
    ];

    this.srv.getdata('patientpaymentrequest', tags).subscribe({
      next: (r: any) => {
        if (this.destroyed) return;
        if (r?.Status === 1 && r?.Data) {
          const data = Array.isArray(r.Data)
            ? r.Data[0]
            : r.Data;
          this.externalPaymentRequestDetails = data;
        } else {
          this.showNotification(
            r?.Message || 'Unable to fetch payment details.',
            'error'
          );
        }
        this.isFetching = false;
      },
      error: (err: any) => {
        if (this.destroyed) return;
        console.error('Payment request error:', err);
        this.isFetching = false;
        this.showNotification(
          'Unable to load payment details.',
          'error'
        );
      }
    });
  }
  get paymentMessage(): string {
    const data = this.externalPaymentRequestDetails;
    if (!data?.message) return '';
    return data.message
      .replaceAll('src="patImg"', `src="${data.patImg || ''}"`)
      .replaceAll('src="drImg"', `src="${data.drImg || ''}"`);
  }
  private loadRazorpay(): Promise<boolean> {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }
  async handlePayment(): Promise<void> {
    const details = this.externalPaymentRequestDetails;
    if (!details) return;
    this.isGetPatientBillingLoading = true;
    const loaded = await this.loadRazorpay();
    if (!loaded) {
      this.isGetPatientBillingLoading = false;
      this.showNotification(
        'Unable to load Razorpay. Please try again.',
        'error'
      );
      return;
    }
    const tags = [
      { T: 'dk1', V: String(details.apptId) },
      { T: 'dk2', V: String(details.billingId || '0') },
      { T: 'c9', V: 'PRX' },
      { T: 'c10', V: '4' }
    ];
    this.srv.getdata('patientbillings', tags).subscribe({
      next: (r: any) => {
        this.isGetPatientBillingLoading = false;
        if (r?.Status !== 1) {
          this.showNotification(
            r?.Message || 'Unable to create payment order.',
            'error'
          );
          return;
        }
        const res = Array.isArray(r.Data)
          ? r.Data[0]
          : r.Data;
        if (!res?.razorpayOrderId) {
          console.error('Invalid Razorpay order response:', r);
          this.showNotification(
            'Razorpay order ID was not returned.',
            'error'
          );
          return;
        }
        this.openRazorpay(res, details);
      },
      error: (err: any) => {
        this.isGetPatientBillingLoading = false;
        console.error('Patient billing error:', err);
        this.showNotification(
          'Unable to process payment. Please try again.',
          'error'
        );
      }
    });
  }
  private openRazorpay(
    res: any,
    details: PaymentRequestDetails
  ): void {
    const options = {
      key: 'YOUR_RAZORPAY_KEY',
      amount: Number(details.amount) * 100,
      currency: res.currency || 'INR',
      order_id: res.razorpayOrderId,
      name: 'PRx Care',
      description: 'Appointment Payment',
      prefill: {
        email: res.email,
        contact: res.phone
      },
      handler: (response: any) => {
        console.log('Razorpay payment response:', response);
        this.showNotification(
          'Payment Successful',
          'success'
        );
      },

      modal: {
        ondismiss: () => {
          this.showNotification(
            'Payment Cancelled',
            'error'
          );

        }
      }
    };
    const razorpay = new window.Razorpay(options);
    razorpay.open();
  }
  private showNotification(
    message: string,
    type: 'success' | 'error'
  ): void {
    this.notification = message;
    this.notificationType = type;
  }
  closeNotification(): void {
    this.notification = '';
  }
}
