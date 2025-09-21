import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ScheduleService, GymScheduleItem } from '../../services/schedule.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-admin-schedule',
  templateUrl: './admin-schedule.component.html',
  styleUrls: ['./admin-schedule.component.scss']
})
export class AdminScheduleComponent implements OnInit {
  form!: FormGroup;
  days = ['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY','SUNDAY'];
  isSaving = false;
  gymId?: number;
  gymCode: string = '';

  constructor(private fb: FormBuilder, private scheduleService: ScheduleService, private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      items: this.fb.array([])
    });
    const idParam = this.route.snapshot.paramMap.get('id');
    this.gymId = idParam ? Number(idParam) : undefined;
    const codeParam = this.route.snapshot.queryParamMap.get('code');
    if (codeParam && codeParam.length === 3) this.gymCode = codeParam;
    this.load();
  }

  get items(): FormArray<FormGroup> { return this.form.get('items') as FormArray<FormGroup>; }

  get itemGroups(): FormGroup[] { return this.items.controls as FormGroup[]; }

  private createItem(item?: GymScheduleItem): FormGroup {
    return this.fb.group({
      id: [item?.id || null],
      dayOfWeek: [item?.dayOfWeek || '', Validators.required],
      openTime: [item?.openTime || '', Validators.required],
      closeTime: [item?.closeTime || '', Validators.required],
      note: [item?.note || '']
    });
  }

  addItem(): void { this.items.push(this.createItem()); }
  removeItem(index: number): void { this.items.removeAt(index); }

  load(): void {
    const trimmedCode = (this.gymCode || '').trim();
    const obs = trimmedCode.length === 3
      ? this.scheduleService.getSchedulesForGymCode(trimmedCode)
      : (this.gymId ? this.scheduleService.getSchedulesForGym(this.gymId) : this.scheduleService.getMySchedule());
    obs.subscribe(list => {
      this.items.clear();
      if (list?.length) {
        list.forEach(i => this.items.push(this.createItem(i)));
      }
    });
  }

  loadByCode(): void {
    this.load();
  }

  save(): void {
    if (this.form.invalid) return;
    this.isSaving = true;

    const payload: GymScheduleItem[] = this.items.value as GymScheduleItem[];
    const newItems = payload.filter(i => !i.id);

    // Nothing new to save
    if (!newItems.length) { this.isSaving = false; return; }

    const trimmedCode = (this.gymCode || '').trim();
    if (trimmedCode.length === 3) {
      this.scheduleService.addSchedulesForGymCode(trimmedCode, newItems).subscribe({
        next: () => { this.isSaving = false; this.load(); },
        error: () => { this.isSaving = false; }
      });
      return;
    }

    if (this.gymId != null) {
      this.scheduleService.replaceSchedulesForGym(this.gymId, newItems).subscribe({
        next: () => { this.isSaving = false; this.load(); },
        error: () => { this.isSaving = false; }
      });
      return;
    }

    // Resolve current admin's gym id and POST only new items
    this.scheduleService.getMyGymId().subscribe({
      next: (gid: number) => {
        if (!gid) { this.isSaving = false; return; }
        this.scheduleService.replaceSchedulesForGym(gid, newItems).subscribe({
          next: () => { this.isSaving = false; this.load(); },
          error: () => { this.isSaving = false; }
        });
      },
      error: () => { this.isSaving = false; }
    });
  }

  delete(i: number): void {
    const trimmedCode = (this.gymCode || '').trim();
    if (trimmedCode.length === 3) {
      const fg = this.items.at(i) as FormGroup;
      const id = fg.value.id as number | null;
      if (!id) { this.items.removeAt(i); return; }
      this.scheduleService.deleteScheduleForGymCode(trimmedCode, id).subscribe({
        next: () => this.load(),
        error: () => {}
      });
      return;
    }

    if (this.gymId == null) { this.items.removeAt(i); return; }
    const fg = this.items.at(i) as FormGroup;
    const id = fg.value.id as number | null;
    if (!id) { this.items.removeAt(i); return; }
    this.scheduleService.deleteSchedule(this.gymId, id).subscribe({
      next: () => this.load(),
      error: () => {}
    });
  }
}


