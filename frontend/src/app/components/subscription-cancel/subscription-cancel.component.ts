import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-subscription-cancel',
  templateUrl: './subscription-cancel.component.html',
  styleUrls: ['./subscription-cancel.component.scss']
})
export class SubscriptionCancelComponent {

  constructor(private router: Router) {}

  goToDashboard(): void {
    this.router.navigate(['/member']);
  }

  tryAgain(): void {
    this.router.navigate(['/member']);
  }
}
