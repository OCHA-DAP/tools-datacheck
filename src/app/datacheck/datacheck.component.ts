import { AnalyticsService } from './../common/analytics.service';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'hdx-datacheck',
  templateUrl: './datacheck.component.html',
  styleUrls: ['./datacheck.component.less']
})
export class DatacheckComponent implements OnInit {
  loadingStatus: false;

  constructor(private analyticsService: AnalyticsService) { }

  ngOnInit() {
    this.analyticsService.init();
  }

}
