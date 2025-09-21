import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface SubscriptionPlan {
  name: string;
  displayName: string;
  price: number;
  interval: string;
  priceInCents: number;
}

export interface Subscription {
  id: number;
  gymId: number;
  plan: SubscriptionPlan;
  status: string;
  amount: number;
  startDate: string;
  endDate: string;
}

export interface CreateCheckoutRequest {
  gymId: number;
  plan: string;
}

export interface CheckoutResponse {
  checkoutUrl: string;
}

@Injectable({
  providedIn: 'root'
})
export class SubscriptionService {
  private apiUrl = 'http://localhost:8080/api/v1/subscriptions';

  constructor(private http: HttpClient) {}

  getStripePublicKey(): Observable<{ publicKey: string }> {
    return this.http.get<{ publicKey: string }>(`${this.apiUrl}/stripe-public-key`);
  }

  createCheckoutSession(request: CreateCheckoutRequest): Observable<CheckoutResponse> {
    return this.http.post<CheckoutResponse>(`${this.apiUrl}/create-checkout-session`, request);
  }

  getActiveSubscription(): Observable<Subscription | null> {
    return this.http.get<Subscription | null>(`${this.apiUrl}/active`);
  }

  getSubscriptionHistory(): Observable<Subscription[]> {
    return this.http.get<Subscription[]>(`${this.apiUrl}/history`);
  }

  checkSubscription(gymId: number): Observable<{ hasActiveSubscription: boolean }> {
    return this.http.get<{ hasActiveSubscription: boolean }>(`${this.apiUrl}/check-subscription/${gymId}`);
  }

  cancelSubscription(subscriptionId: number): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/cancel/${subscriptionId}`, {});
  }

  completePayment(sessionId: string): Observable<{ message: string; subscription: Subscription }> {
    return this.http.post<{ message: string; subscription: Subscription }>(`${this.apiUrl}/complete-payment`, 
      { sessionId: sessionId });
  }

  getSubscriptionPlans(): SubscriptionPlan[] {
    return [
      {
        name: 'MONTHLY',
        displayName: 'Monthly',
        price: 29.99,
        interval: 'month',
        priceInCents: 2999
      },
      {
        name: 'ANNUAL',
        displayName: 'Annual',
        price: 299.99,
        interval: 'year',
        priceInCents: 29999
      }
    ];
  }
}
