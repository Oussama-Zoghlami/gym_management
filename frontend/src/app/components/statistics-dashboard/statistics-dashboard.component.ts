import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { StatisticsService, OverallStatistics, TopGymStats, GymStatistics } from '../../services/statistics.service';

@Component({
  selector: 'app-statistics-dashboard',
  templateUrl: './statistics-dashboard.component.html',
  styleUrls: ['./statistics-dashboard.component.scss']
})
export class StatisticsDashboardComponent implements OnInit {
  overallStats: OverallStatistics | null = null;
  topGymsBySubscriptions: TopGymStats[] = [];
  topGymsByRevenue: TopGymStats[] = [];
  topGymsByCoaches: TopGymStats[] = [];
  topGymsByWorkoutPlans: TopGymStats[] = [];
  topGymsByCompletedWorkouts: TopGymStats[] = [];
  topGymsByRating: TopGymStats[] = [];
  
  isLoading = true;
  activeTab: 'overview' | 'subscriptions' | 'revenue' | 'coaches' | 'workouts' | 'rating' = 'overview';
  selectedGym: GymStatistics | null = null;
  showGymDetails = false;

  constructor(
    public statisticsService: StatisticsService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadAllStatistics();
  }

  loadAllStatistics(): void {
    this.isLoading = true;
    
    // Load overall statistics
    this.statisticsService.getOverallStatistics().subscribe({
      next: (stats) => {
        this.overallStats = stats;
      },
      error: (error) => {
        console.error('Error loading overall statistics:', error);
      }
    });

    // Load top gyms by subscriptions
    this.statisticsService.getTopGymsBySubscriptions().subscribe({
      next: (stats) => {
        this.topGymsBySubscriptions = stats;
      },
      error: (error) => {
        console.error('Error loading top gyms by subscriptions:', error);
      }
    });

    // Load top gyms by revenue
    this.statisticsService.getTopGymsByRevenue().subscribe({
      next: (stats) => {
        this.topGymsByRevenue = stats;
      },
      error: (error) => {
        console.error('Error loading top gyms by revenue:', error);
      }
    });

    // Load top gyms by coaches
    this.statisticsService.getTopGymsByCoaches().subscribe({
      next: (stats) => {
        this.topGymsByCoaches = stats;
      },
      error: (error) => {
        console.error('Error loading top gyms by coaches:', error);
      }
    });

    // Load top gyms by workout plans
    this.statisticsService.getTopGymsByWorkoutPlans().subscribe({
      next: (stats) => {
        this.topGymsByWorkoutPlans = stats;
      },
      error: (error) => {
        console.error('Error loading top gyms by workout plans:', error);
      }
    });

    // Load top gyms by completed workouts
    this.statisticsService.getTopGymsByCompletedWorkouts().subscribe({
      next: (stats) => {
        this.topGymsByCompletedWorkouts = stats;
      },
      error: (error) => {
        console.error('Error loading top gyms by completed workouts:', error);
      }
    });

    // Load top gyms by rating
    this.statisticsService.getTopGymsByRating().subscribe({
      next: (stats) => {
        this.topGymsByRating = stats;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading top gyms by rating:', error);
        this.isLoading = false;
      }
    });
  }

  setActiveTab(tab: 'overview' | 'subscriptions' | 'revenue' | 'coaches' | 'workouts' | 'rating'): void {
    this.activeTab = tab;
  }

  viewGymDetails(gymId: number): void {
    this.statisticsService.getGymStatistics(gymId).subscribe({
      next: (stats) => {
        this.selectedGym = stats;
        this.showGymDetails = true;
      },
      error: (error) => {
        console.error('Error loading gym statistics:', error);
      }
    });
  }

  closeGymDetails(): void {
    this.showGymDetails = false;
    this.selectedGym = null;
  }

  refreshData(): void {
    this.loadAllStatistics();
  }

  goBack(): void {
    this.router.navigate(['/superadmin']);
  }

  getCurrentTopGyms(): TopGymStats[] {
    switch (this.activeTab) {
      case 'subscriptions':
        return this.topGymsBySubscriptions;
      case 'revenue':
        return this.topGymsByRevenue;
      case 'coaches':
        return this.topGymsByCoaches;
      case 'workouts':
        return this.topGymsByWorkoutPlans;
      case 'rating':
        return this.topGymsByRating;
      default:
        return this.topGymsBySubscriptions;
    }
  }

  getTabTitle(): string {
    switch (this.activeTab) {
      case 'subscriptions':
        return 'Most Subscribed Gyms';
      case 'revenue':
        return 'Highest Revenue Gyms';
      case 'coaches':
        return 'Gyms with Most Coaches';
      case 'workouts':
        return 'Most Successful Workout Plans';
      case 'rating':
        return 'Highest Rated Gyms';
      default:
        return 'Gym Statistics';
    }
  }

  getTabIcon(): string {
    switch (this.activeTab) {
      case 'subscriptions':
        return 'people';
      case 'revenue':
        return 'attach_money';
      case 'coaches':
        return 'fitness_center';
      case 'workouts':
        return 'sports_gymnastics';
      case 'rating':
        return 'star';
      default:
        return 'analytics';
    }
  }

  // Safe getters for quick stats
  get topSubscribedGym(): TopGymStats | null {
    return this.topGymsBySubscriptions[0] || null;
  }

  get topRevenueGym(): TopGymStats | null {
    return this.topGymsByRevenue[0] || null;
  }

  get topCoachesGym(): TopGymStats | null {
    return this.topGymsByCoaches[0] || null;
  }

  get topRatedGym(): TopGymStats | null {
    return this.topGymsByRating[0] || null;
  }
}
