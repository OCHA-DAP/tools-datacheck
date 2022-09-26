import { Injectable } from '@angular/core';
import { AnalyticsService as GenericAnalyticsService } from 'hxl-preview-ng-lib';
import { environment } from './../../environments/environment';

declare const window: any;

@Injectable()
export class AnalyticsService {

  constructor(private genericAnalyticsService: GenericAnalyticsService) { }

  public init() {
    const hostname = window.location.hostname;

    // const gaToken = environment['googleAnalyticsKey'];
    const mpToken = hostname === environment['prodHostname'] ?          // if is prod use prod key
        environment['prodMixpanelKey'] : environment['testMixpanelKey'];

    this.genericAnalyticsService.init(mpToken);
  }


  /**
   *
   * @param datasourceType sample / upload / url
   * @param datasourceUrl url or filename in case of upload
   * @param validations list of checks performed
   * @param locations list of iso3 codes that were used in locations checks
   * @param errNum number of errors
   */
  public trackDataCheck(datasourceType: string, datasourceUrl, validations: string[], locations: string[],
          errNum: number) {

    const mpData = {
      'data source type': datasourceType,
      'data source url': datasourceUrl,
      'validations': validations,
      'locations': locations
    };

    // const gaData: GaExtras = {
    //   label: datasourceUrl,
    //   action: 'validate',
    //   value: errNum,
    //   dimensionInfo: {
    //     'dimension2': datasourceType
    //   }
    // };
    const gaData = {
      'type': datasourceType,
      'url': datasourceUrl,
    };


    this.genericAnalyticsService.trackEventCategory('data check', gaData, mpData);

  }

}
