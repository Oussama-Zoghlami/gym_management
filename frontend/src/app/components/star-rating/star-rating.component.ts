import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';

@Component({
  selector: 'app-star-rating',
  templateUrl: './star-rating.component.html',
  styleUrls: ['./star-rating.component.scss']
})
export class StarRatingComponent implements OnInit {
  @Input() rating: number = 0;
  @Input() maxStars: number = 5;
  @Input() readonly: boolean = false;
  @Input() showCount: boolean = false;
  @Input() count: number = 0;
  @Output() ratingChange = new EventEmitter<number>();

  // Debug method to verify inputs are working
  get debugInfo(): string {
    return `Rating: ${this.rating}, ShowCount: ${this.showCount}, Count: ${this.count}`;
  }

  stars: number[] = [];
  hoverRating: number = 0;

  ngOnInit(): void {
    this.stars = Array(this.maxStars).fill(0).map((_, i) => i + 1);
  }

  onStarClick(star: number): void {
    if (!this.readonly) {
      this.rating = star;
      this.ratingChange.emit(this.rating);
    }
  }

  onStarHover(star: number): void {
    if (!this.readonly) {
      this.hoverRating = star;
    }
  }

  onStarLeave(): void {
    if (!this.readonly) {
      this.hoverRating = 0;
    }
  }

  getStarClass(star: number): string {
    const currentRating = this.hoverRating || this.rating;
    if (star <= currentRating) {
      return 'star filled';
    }
    return 'star empty';
  }
}
