import { Injectable } from '@angular/core';
import { AnalyticsService as GenericAnalyticsService, GA_PAGEVIEW } from 'hxl-preview-ng-lib';
import { environment } from './../../environments/environment';

declare const window: any;

@Injectable()
export class AnalyticsService {

  constructor(private genericAnalyticsService: GenericAnalyticsService) { }

  public init() {
    const hostname = window.location.hostname;

    const gaToken = environment['googleAnalyticsKey'];
    const mpToken = hostname === environment['prodHostname'] ?          // if is prod use prod key
        environment['prodMixpanelKey'] : environment['testMixpanelKey'];

    this.genericAnalyticsService.init(gaToken, mpToken);
  }

  public trackStepLoad(stepName: string, firstStep: boolean, lastStep: boolean,
            dataSourceUrl?: string, recipeUrl?: string, error?: string, additionalMpData?: {[s: string]: string|boolean|number}) {

    const mpData = {
      'workflow': 'quickcharts',
      'step name': stepName,
      'first step': firstStep,
      'last step': lastStep,
    };
    if (additionalMpData) {
      Object.assign(mpData, additionalMpData);
    }
    if (dataSourceUrl) {
      mpData['data source url'] = dataSourceUrl;
    }
    if (recipeUrl) {
      mpData['recipe url'] = recipeUrl;
    }
    if (error) {
      mpData['error'] = error;
    }

    this.genericAnalyticsService.trackEventCategory('load step', {action: stepName}, mpData);

  }

  public trackRecipeChanged(dataSourceUrl: string, recipeUrl: string, bitesNum: number) {
    const mpData = {
      'data source url': dataSourceUrl,
      'recipe url': recipeUrl,
      'number of bites': bitesNum,
    };
    this.genericAnalyticsService.trackEventCategory('recipe apply', {action: recipeUrl, value: bitesNum}, mpData);
  }

}
