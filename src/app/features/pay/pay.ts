import { Component } from '@angular/core';
import { ExternalPayment } from './external-payment/external-payment';

@Component({
  selector: 'app-pay',
  imports: [ExternalPayment],
  templateUrl: './pay.html',
  styleUrl: './pay.css',
})
export class Pay { }
