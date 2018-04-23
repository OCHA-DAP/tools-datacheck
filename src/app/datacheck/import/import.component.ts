import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import { GooglepickerDirective } from '../../common/googlepicker.directive';
import { DropboxchooserDirective } from '../../common/dropboxchooser.directive';
import { Component, OnInit, ChangeDetectorRef, ViewChild, HostListener, ElementRef } from '@angular/core';
import { AnalyticsService } from '../../common/analytics.service';
import { HttpService } from '../../shared/http.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Http } from '@angular/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-import',
  templateUrl: './import.component.html',
  styleUrls: ['./import.component.less']
})
export class ImportComponent implements OnInit {

  readonly stepName = 'Import Data';
  sampleUrlSelected = true;
  hxlCheckError: any = null;
  _selectedUrl = '';
  sampleData = [
    {
      'id': 'c7fb99a5-43ec-4b3f-b8db-935640c75aeb',
      'name': 'Madagascar - Cyclone Enawo Needs Assessment Data',
      'description': 'Madagascar, Cyclone Enawo Final Needs Assessment data with disaggregated data related to key ' +
      'vulnerable populations and SADD available. Data collected and put together by the Malagasy Red ' +
      'Cross Society (MRCS)',
      'url': 'https://data.humdata.org/dataset/94b6d7f8-9b6d-4bca-81d7-6abb83edae16/resource/c7fb99a5-43ec-4b3f-b8db-' +
      '935640c75aeb/download/assesment_data_crm_05april2017.xlsx',
      'org': 'IFRC',
    },
    {
      'id': '152cf5c1-c61c-4f61-9768-68ab7ca852a7',
      'name': 'Zika Cases per Country in South and Central America',
      'description': 'Zika Cases Tracker per Country in South and Central America',
      'url': 'https://data.humdata.org/dataset/zika-cases-per-country-in-south-and-central-america/resource/322af5fe-' +
      '8860-4c09-81c7-78510da9a4b0/download/data.csv',
      'org': 'BRC Maps Team',
    },
    {
      'id': '283503e7-13de-4528-9e57-a804196eb57a',
      'name': 'Afghan Voluntary Repatriation 2017',
      'description': '',
      'url': 'https://data.humdata.org/dataset/283503e7-13de-4528-9e57-a804196eb57a/resource/9fa44427-' +
      'b9f5-4d62-9b91-464750c17cbd/download/afghan-voluntary-repatriation-2017.xlsx',
      'org': 'UNHCR Afghanistan ',
    },
    // {
    //   'id': '92128af6-6a4d-447c-bb9f-fa67fb0e17bb',
    //   'name': 'Ebola - West Africa - Ebola Treatment Centres, Isolation Wards Hospitals and Transit Centres',
    //   'description': '',
    //   'url': 'https://data.humdata.org/dataset/ebola-west-africa-ebola-treatment-centres-isolation-wards-hospitals-and-' +
    //   'transit-centres/resource/92128af6-6a4d-447c-bb9f-fa67fb0e17bb/download/data.csv',
    //   'org': 'BRC Maps Team',
    // },
    {
      'id': '8d8dc190-142f-4b84-a526-db960f15ea8b',
      'name': 'Afghanistan - Natural disaster incidents in 2017',
      'description': 'Natural disaster events include avalanches, earthquakes, flooding, heavy rainfall & snowfall, ' +
      'and landslides & mudflows as recorded by OCHA field offices based on assessments in the field.',
      'url': 'http://data.humdata.org/dataset/78ab5218-ba2c-43c8-b086-1750d8d3c7f0/resource/8d8dc190-142f-4b84-a526-' +
      'db960f15ea8b/download/afghanistan-natural-disaster-incidents-from-1-january-to-11-aug-2017.xlsx',
      'org': 'OCHA Afghanistan',
    },
    {
      'id': '1f9bee15-3e3c-40fd-b205-935848d49f05',
      'name': 'INSO Key Data Dashboard, Jan 2016 to August 2017',
      'description': 'This dashboard provides aggregated global data on the safety & security incidents affecting NGOs ' +
      'in those countries covered by INSO*. It is intended to improve the visibility of macro-trends in ' +
      'humanitarian safety in order to raise awareness, inform research and strengthen operational ' +
      'practise. All data is sourced from INSO and assumed correct at the time of publishing. Please ' +
      'read below for advanced definitions & meanings. The information contained in this dashboard may ' +
      'be cited or reproduced only with credit to INSO.',
      'url': 'https://data.humdata.org/dataset/019d1d0b-dc2f-4fa8-9355-fdc25da0ff4c/resource/1f9bee15-3e3c-40fd-b205-' +
      '935848d49f05/download/inso-ngo-safety-and-security-incidents-jan-2016-to-aug-2017.xlsx',
      'org': 'International NGO Safety Organisation (INSO)',
    },
    {
      'id': '8a595340-6ba7-461a-a6ed-be99c160fe43',
      'name': 'Population data by admin0, admin1 and admin2 (country, regions and departments).',
      'description': 'This data enumerates the population of Chad.',
      'url': 'http://data.humdata.org/dataset/5e60290d-0a82-48e2-9454-812b01c7d9d4/resource/8a595340-6ba7-461a-a6ed-' +
      'be99c160fe43/download/tcd_data_cod_ps_20170615.xlsx',
      'org': 'OCHA Chad',
    },
    {
      'id': 'f48c2fd7-9f36-47eb-9db9-ce6a8c04b30a',
      'name': 'Afghanistan - Natural disaster incidents in 2016',
      'description': 'Natural disaster events include avalanches, earthquakes, flooding, heavy rainfall & snowfall, ' +
      'and landslides & mudflows as recorded by OCHA field offices and IOM Afghanistan Humanitarian ' +
      'Assistance Database (HADB).',
      'url': 'http://data.humdata.org/dataset/dd05bb07-576a-40fe-a673-b3efeea78652/resource/f48c2fd7-9f36-47eb-9db9-' +
      'ce6a8c04b30a/download/afghanistan-natural-disaster-incidents-from-1-january-to-31-dec-2016.csv',
      'org': 'OCHA Afghanistan',
    }
  ];

  httpService: HttpService;
  shareUrl: string = null;
  embedUrl: string = null;
  iFrameUrl: SafeResourceUrl = null;
  pngDownloadFlag: Boolean = false;
  pngDownloadUrl: SafeResourceUrl = null;
  menuEmbed = true;

  @ViewChild('quickChartsIFrame')
  private quickChartsIFrame: ElementRef;

  @ViewChild('embedCode')
  private embedCode: ElementRef;

  constructor(private router: Router, private route: ActivatedRoute,
              private analyticsService: AnalyticsService,
              http: Http, private sanitizer: DomSanitizer) {
    this.httpService = <HttpService> http;
  }

  get selectedUrl() {
    return this._selectedUrl;
  }

  set selectedUrl(selectedUrl: string) {
    // this.getWizardConfig().hxlCheckError = null;
    this._selectedUrl = selectedUrl;
    const sivOpt: ScrollIntoViewOptions = {
      behavior: 'smooth'
    };
    this.quickChartsIFrame.nativeElement.scrollIntoView(sivOpt);
    this.embedUrl = null;
    this.updateIframeUrl();
  }

  ngOnInit() {
    // this._selectedUrl = this.getWizardConfig().url ? this.getWizardConfig().url : this.sampleData[0].url;
    this.route.paramMap.subscribe((params: ParamMap) => {
      this.httpService.turnOnModal();
      const urlParam = params.get('url');
      if (urlParam) {
        // this.wizardConfigService.getWizardConfigData().url = urlParam;
        this._selectedUrl = urlParam;
        this.sampleUrlSelected = false;
      }
      const recipeUrlParam = params.get('recipeUrl');
      if (recipeUrlParam) {
        // this.wizardConfigService.getWizardConfigData().recipeUrl = recipeUrlParam;
      }

      this.updateIframeUrl();
    });

    // this.analyticsService.trackStepLoad(this.stepName, true, false, this.getWizardConfig().url, this.getWizardConfig().recipeUrl,
    //   this.getWizardConfig().hxlCheckError ? this.getWizardConfig().hxlCheckError.errorSummary : null);
  }

  private updateIframeUrl() {
    // const recipeUrl = encodeURIComponent(this.wizardConfigService.getWizardConfigData().recipeUrl);
    // const url = encodeURIComponent(this._selectedUrl);
    // const hxlPreviewUrl = environment.hxlPreview;
    // const newUrl = `${hxlPreviewUrl}/show;url=${url};recipeUrl=${recipeUrl};toolsMode=true`;
    // this.iFrameUrl = this.sanitizer.bypassSecurityTrustResourceUrl(newUrl);
  }

  getWizardConfig() {
    // return this.wizardConfigService.getWizardConfigData();
  }

  updateSelectedUrl(newUrl: string) {
    console.log('Updating with ' + newUrl);
    this.selectedUrl = newUrl;
    this.sampleUrlSelected = false;
  }
  changeDatasource($event) {
    this.sampleUrlSelected = $event.target.value === 'sample';
  }

  changeSampleUrl(url) {
    this.selectedUrl = url;
  }

  iFrameLoaded() {
    if (this.iFrameUrl) {
      console.log('iFrame loaded!');
      this.getEmbedUrl();
      this.httpService.turnOffModal();
    }
  }

  @HostListener('window:message', ['$event'])
  onEmbedUrl($event) {
    const action = $event.data;

    const EMBED_URL = 'embedUrl:';
    if (action && action.startsWith && action.startsWith(EMBED_URL)) {
      if (window.parent) {
        const url: string = action.slice(EMBED_URL.length);
        // const parentOrigin = window.parent.location.href;
        console.log(`EMBED URL: ${url}`);
        const initMode = this.embedUrl == null;
        this.shareUrl = url;
        this.embedUrl = `<iframe src="${url}" style="border:none; width:100%; min-height:500px">`;

        const snapService = environment.snapService;
        const urlEncoded = encodeURIComponent(url);
        const pngDownloadUrl = `${snapService}/png?viewport={"width": 1280, "height": 1}&url=${urlEncoded}`;
        this.pngDownloadUrl = this.sanitizer.bypassSecurityTrustResourceUrl(pngDownloadUrl);
        if (this.pngDownloadFlag) {
          this.pngDownloadFlag = false;
          setTimeout(() => {
            window.open(pngDownloadUrl, '_blank');
          }, 2);
        }

        if (!initMode) {
          this.embedCode.nativeElement.focus();
          this.embedCode.nativeElement.setSelectionRange(0, 0);
          setTimeout(() => {
            this.embedCode.nativeElement.setSelectionRange(0, this.embedCode.nativeElement.value.length);
          }, 2);
        }
        return;
      }
    }
  }

  getEmbedUrl() {
    const origin = window.location.origin;
    const iFrame: HTMLIFrameElement = <HTMLIFrameElement> document.getElementById('quick-charts-iframe');
    let iFrameOrigin = environment.hxlPreview;
    if (!iFrameOrigin.startsWith('http')) {
      iFrameOrigin = origin + iFrameOrigin;
    }
    iFrame.contentWindow.window.postMessage(`getEmbedUrl: ${origin}`, iFrameOrigin);
  }

  prepareSnapshot($event) {
    this.pngDownloadFlag = true;
    this.getEmbedUrl();
  }

  prepareShare($event, scrollto = false) {
    const element = $event.target;
    this.shareUrl = '';
    this.embedUrl = '';
    // element.setSelectionRange(0, 0);
    // element.setSelectionRange(0, element.value.length);
    element.scrollIntoView({behavior: 'smooth', block: 'end'});
    setTimeout(() => {
      this.getEmbedUrl();
    }, 2);

  }

  changeMenuEmbed() {
    this.menuEmbed = !this.menuEmbed;
  }
}
