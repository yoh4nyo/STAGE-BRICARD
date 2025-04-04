import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardAdminProjectComponent } from './dashboard-admin-project.component';

describe('DashboardAdminProjectComponent', () => {
  let component: DashboardAdminProjectComponent;
  let fixture: ComponentFixture<DashboardAdminProjectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DashboardAdminProjectComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DashboardAdminProjectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
