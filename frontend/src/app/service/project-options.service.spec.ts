import { TestBed } from '@angular/core/testing';

import { ProjectOptionsService } from './project-options.service';

describe('ProjectOptionsService', () => {
  let service: ProjectOptionsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProjectOptionsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
