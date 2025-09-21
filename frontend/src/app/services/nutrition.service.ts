import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

export interface NutritionData {
  food_name: string;
  nf_calories: number;
  nf_protein: number;
  nf_total_carbohydrate: number;
  nf_total_fat: number;
  serving_weight_grams: number;
  serving_unit: string;
  serving_qty: number;
}

export interface NutritionResponse {
  foods: NutritionData[];
}

export interface DailyNutritionLog {
  date: string;
  entries: NutritionEntry[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
}

export interface NutritionEntry {
  id: string;
  food_name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  serving_size: string;
  timestamp: string;
}

@Injectable({
  providedIn: 'root'
})
export class NutritionService {
  private readonly NUTRITIONIX_API_URL = 'https://trackapi.nutritionix.com/v2';
  // Nutritionix API credentials
  private readonly APP_ID = '20bd4122';
  private readonly APP_KEY = 'd9de1facbbd31cbd389a69ef596ea5a3';
  
  private dailyLogSubject = new BehaviorSubject<DailyNutritionLog | null>(null);
  public dailyLog$ = this.dailyLogSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadTodayLog();
  }

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'x-app-id': this.APP_ID,
      'x-app-key': this.APP_KEY
    });
  }

  searchFood(query: string): Observable<NutritionData[]> {
    if (!query.trim()) {
      return of([]);
    }

    const body = {
      query: query,
      timezone: 'US/Eastern'
    };

    return this.http.post<NutritionResponse>(`${this.NUTRITIONIX_API_URL}/natural/nutrients`, body, {
      headers: this.getHeaders()
    }).pipe(
      map(response => response.foods || []),
      catchError(error => {
        console.error('Error searching food:', error);
        return of([]);
      })
    );
  }

  addFoodToLog(food: NutritionData, servingSize: number = 1): void {
    const today = new Date().toISOString().split('T')[0];
    const currentLog = this.dailyLogSubject.value;
    
    const entry: NutritionEntry = {
      id: Date.now().toString(),
      food_name: food.food_name,
      calories: Math.round(food.nf_calories * servingSize),
      protein: Math.round(food.nf_protein * servingSize * 10) / 10,
      carbs: Math.round(food.nf_total_carbohydrate * servingSize * 10) / 10,
      fat: Math.round(food.nf_total_fat * servingSize * 10) / 10,
      serving_size: `${servingSize} ${food.serving_unit}`,
      timestamp: new Date().toISOString()
    };

    let updatedLog: DailyNutritionLog;
    
    if (currentLog && currentLog.date === today) {
      updatedLog = {
        ...currentLog,
        entries: [...currentLog.entries, entry],
        totalCalories: currentLog.totalCalories + entry.calories,
        totalProtein: Math.round((currentLog.totalProtein + entry.protein) * 10) / 10,
        totalCarbs: Math.round((currentLog.totalCarbs + entry.carbs) * 10) / 10,
        totalFat: Math.round((currentLog.totalFat + entry.fat) * 10) / 10
      };
    } else {
      updatedLog = {
        date: today,
        entries: [entry],
        totalCalories: entry.calories,
        totalProtein: entry.protein,
        totalCarbs: entry.carbs,
        totalFat: entry.fat
      };
    }

    this.dailyLogSubject.next(updatedLog);
    this.saveToLocalStorage(updatedLog);
  }

  removeEntry(entryId: string): void {
    const currentLog = this.dailyLogSubject.value;
    if (!currentLog) return;

    const entryToRemove = currentLog.entries.find(entry => entry.id === entryId);
    if (!entryToRemove) return;

    const updatedLog: DailyNutritionLog = {
      ...currentLog,
      entries: currentLog.entries.filter(entry => entry.id !== entryId),
      totalCalories: currentLog.totalCalories - entryToRemove.calories,
      totalProtein: Math.round((currentLog.totalProtein - entryToRemove.protein) * 10) / 10,
      totalCarbs: Math.round((currentLog.totalCarbs - entryToRemove.carbs) * 10) / 10,
      totalFat: Math.round((currentLog.totalFat - entryToRemove.fat) * 10) / 10
    };

    this.dailyLogSubject.next(updatedLog);
    this.saveToLocalStorage(updatedLog);
  }

  getTodayLog(): DailyNutritionLog | null {
    return this.dailyLogSubject.value;
  }

  private loadTodayLog(): void {
    const today = new Date().toISOString().split('T')[0];
    const savedLog = localStorage.getItem(`nutrition_log_${today}`);
    
    if (savedLog) {
      try {
        const log: DailyNutritionLog = JSON.parse(savedLog);
        this.dailyLogSubject.next(log);
      } catch (error) {
        console.error('Error loading nutrition log:', error);
      }
    }
  }

  private saveToLocalStorage(log: DailyNutritionLog): void {
    localStorage.setItem(`nutrition_log_${log.date}`, JSON.stringify(log));
  }

  clearTodayLog(): void {
    const today = new Date().toISOString().split('T')[0];
    localStorage.removeItem(`nutrition_log_${today}`);
    this.dailyLogSubject.next(null);
  }
}
