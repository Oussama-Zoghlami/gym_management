import { Component, OnInit, OnDestroy } from '@angular/core';
import { NutritionService, NutritionData, DailyNutritionLog, NutritionEntry } from '../../services/nutrition.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-nutrition-tracker',
  templateUrl: './nutrition-tracker.component.html',
  styleUrls: ['./nutrition-tracker.component.scss']
})
export class NutritionTrackerComponent implements OnInit, OnDestroy {
  isOpen = false;
  searchQuery = '';
  searchResults: NutritionData[] = [];
  isLoading = false;
  dailyLog: DailyNutritionLog | null = null;
  selectedFood: NutritionData | null = null;
  servingSize = 1;
  showAddForm = false;
  todayDate = new Date().toISOString().split('T')[0];

  private subscriptions: Subscription[] = [];

  constructor(private nutritionService: NutritionService) {}

  ngOnInit(): void {
    this.subscriptions.push(
      this.nutritionService.dailyLog$.subscribe(log => {
        this.dailyLog = log;
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  toggleTracker(): void {
    this.isOpen = !this.isOpen;
    if (!this.isOpen) {
      this.resetForm();
    }
  }

  searchFood(): void {
    if (!this.searchQuery.trim()) {
      this.searchResults = [];
      return;
    }

    this.isLoading = true;
    this.nutritionService.searchFood(this.searchQuery).subscribe({
      next: (results) => {
        this.searchResults = results;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error searching food:', error);
        this.searchResults = [];
        this.isLoading = false;
      }
    });
  }

  selectFood(food: NutritionData): void {
    this.selectedFood = food;
    this.servingSize = 1;
    this.showAddForm = true;
    this.searchResults = [];
    this.searchQuery = '';
  }

  addFoodToLog(): void {
    if (this.selectedFood) {
      this.nutritionService.addFoodToLog(this.selectedFood, this.servingSize);
      this.resetForm();
    }
  }

  removeEntry(entryId: string): void {
    this.nutritionService.removeEntry(entryId);
  }

  clearTodayLog(): void {
    if (confirm('Are you sure you want to clear today\'s nutrition log?')) {
      this.nutritionService.clearTodayLog();
    }
  }

  resetForm(): void {
    this.searchQuery = '';
    this.searchResults = [];
    this.selectedFood = null;
    this.servingSize = 1;
    this.showAddForm = false;
    this.isLoading = false;
  }

  formatTime(timestamp: string): string {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getCalorieGoal(): number {
    // Default calorie goal - you can make this configurable
    return 2000;
  }

  getProteinGoal(): number {
    // Default protein goal in grams
    return 150;
  }

  getProgressPercentage(current: number, goal: number): number {
    return Math.min((current / goal) * 100, 100);
  }

  // Helper methods for template calculations
  round(value: number): number {
    return Math.round(value);
  }

  roundToDecimal(value: number, decimals: number = 1): number {
    return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
  }

  max(value1: number, value2: number): number {
    return Math.max(value1, value2);
  }

  calculateCalories(calories: number, servingSize: number): number {
    return Math.round(calories * servingSize);
  }

  calculateProtein(protein: number, servingSize: number): number {
    return Math.round(protein * servingSize * 10) / 10;
  }
}
