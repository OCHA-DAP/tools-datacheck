import { HxlproxyService } from './../services/hxlproxy.service';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import { GooglepickerDirective } from '../../common/googlepicker.directive';
import { DropboxchooserDirective } from '../../common/dropboxchooser.directive';
import {
  Component,
  OnInit,
  ChangeDetectorRef,
  ViewChild,
  HostListener,
  ElementRef,
  AfterViewInit
} from '@angular/core';
import { AnalyticsService } from '../../common/analytics.service';
import { HttpService } from '../../shared/http.service';
import { DomSanitizer} from '@angular/platform-browser';
import { Http } from '@angular/http';
import * as Handsontable from 'handsontable';
import { HotTableRegisterer } from '@handsontable/angular';
import { Observable } from 'rxjs/Observable';

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
  tableSettings: any;
  tableId: string = 'table1';
  data: any[] = Handsontable.helper.createSpreadsheetData(10, 10);
  sampleData = [
    {
      'id': 'c7fb99a5-43ec-4b3f-b8db-935640c75aeb',
      'name': 'Test dataset (provided by Dan)',
      'description': 'Lorem ipsum ... ' +
      'vulnerable populations and SADD available. Data collected and put together by the Malagasy Red ' +
      'Cross Society (MRCS)',
      'url': 'https://data.humdata.org/dataset/94b6d7f8-9b6d-4bca-81d7-6abb83edae16/resource/c7fb99a5-43ec-4b3f-b8db-' +
      '935640c75aeb/download/assesment_data_crm_05april2017.xlsx',
      'org': 'IFRC',
    },
  ];

  httpService: HttpService;
  embedUrl: string = null;
  errorsXY = {};
  selectedColumn: number;
  selectedRow: number;
  selectedTitle: string;
  colToHash = {};
  private bordersInitialised = false;

  constructor(private router: Router, private route: ActivatedRoute,
              private analyticsService: AnalyticsService,
              http: Http, private sanitizer: DomSanitizer,
              private hotRegisterer: HotTableRegisterer,
              private hxlProxyService: HxlproxyService) {
    this.httpService = <HttpService> http;
  }

  get selectedUrl() {
    return this._selectedUrl;
  }

  set selectedUrl(selectedUrl: string) {
    this._selectedUrl = selectedUrl;
    this.embedUrl = null;
  }

  ngOnInit() {
    this._selectedUrl = this.sampleData[0].url;
    this.route.paramMap.subscribe((params: ParamMap) => {
      this.httpService.turnOnModal();
      const urlParam = params.get('url');
      if (urlParam) {
        this._selectedUrl = urlParam;
        this.sampleUrlSelected = false;
      }
    });
    let dataObservable = this.getData();
    let locationsObservable = this.validateData();
    locationsObservable.subscribe((locations) => {
      console.log('test');
      locations.forEach((val, index) => {
        let errorsX = this.errorsXY[val.hashtag];
        if (errorsX === undefined) {
          errorsX = {};
          this.errorsXY[val.hashtag] = errorsX;
        }
        errorsX[val.row] = val.row;
      });
      console.log('showing errors');
      const hotInstance = this.hotRegisterer.getInstance(this.tableId);
      hotInstance.render();
      hotInstance.loadData(this.data);
    });
    dataObservable.subscribe((data) => {
      this.data = data;

      for (let i = 0; i < data[1].length; i++) {
        this.colToHash[i] = data[1][i];
      }
      console.log('colToHash map is built');

      const hotInstance = this.hotRegisterer.getInstance(this.tableId);
      hotInstance.loadData(data);
      console.log('Data loaded');
    });

    let headerRenderer = (instance, td, row, col, prop, value, cellProperties) => {
      Handsontable.renderers.TextRenderer.apply(this, [instance, td, row, col, prop, value, cellProperties]);
      if (row === 0) {
        // td.style.fontWeight = 'bold';
        // td.style.color = 'green';
        // td.style.background = '#CEC';
      } else {
        td.style.fontWeight = 'bold';
      }
    };
    let valueRenderer = (instance, td, row, col, prop, value, cellProperties) => {
      Handsontable.renderers.TextRenderer.apply(this, [instance, td, row, col, prop, value, cellProperties]);
      const hash = this.colToHash[col];
      if (hash) {
        console.log('rendering WITH HASH');
      } else {
        console.log('rendering NO HASH')
      }
      // if row contains negative number
      if (this.errorsXY[hash] !== undefined && this.errorsXY[hash][row] !== undefined) {
        // add class "negative"
        td.style.color = 'red';
      }

      if (value === 'MDG72') {
        td.style.fontStyle = 'italic';
      }
    };
    let beforeKeyDown = (event: KeyboardEvent) => {
      console.log("Key down");
      const hotInstance = this.hotRegisterer.getInstance(this.tableId);
      event.stopPropagation();
      event.stopImmediatePropagation();
      event.preventDefault();

      let selection = hotInstance.getSelected();
      console.log(`Selection: ${selection}`);
      const selectedCol:number = selection[0][1];
      const selectedRow:number = selection[0][0];
      let nextCol: number, nextRow: number;

      const t = this.colToHash[selectedCol];
      let errorsX = this.errorsXY[t];
      if (event.keyCode == 38) {
        // up arrow
        console.log("up arrow");
        for (let key in errorsX) {
          const val: number = parseInt(key);
          if ((val < selectedRow) && (nextRow === undefined || nextRow < val)) {
            nextRow = val;
          }
        }
        if (nextRow !== undefined) {
          nextCol = selectedCol;
        } else {
          nextCol = selectedCol;
        }
      }
      else if (event.keyCode == 40) {
        // down arrow
        console.log("down arrow");
        for (let key in errorsX) {
          const val: number = parseInt(key);
          if ((val > selectedRow) && (nextRow === undefined || nextRow > val)) {
            nextRow = val;
          }
        }
        if (nextRow !== undefined) {
          nextCol = selectedCol;
        }
      }
      else if (event.keyCode == 37) {
        // left arrow
        console.log("left arrow");
        nextCol = selectedCol - 1;
      }
      else if (event.keyCode == 39) {
        // right arrow
        console.log("right arrow");
        nextCol = selectedCol + 1;
      }

      if (nextRow !== undefined && nextCol !== undefined) {
        hotInstance.selectCell(nextRow, nextCol, nextRow, nextCol, true, false);
        hotInstance.scrollViewportTo(nextRow, nextCol, true, true);
      } else {
        if (nextCol !== undefined) {
          hotInstance.selectColumns(nextCol);
          hotInstance.scrollViewportTo(1, nextCol, true, true);
        }
      }
    };
    let afterSelection = (r: number, c: number, r2: number, c2: number, preventScrolling: object, selectionLayerLevel: number) => {
      this.initBorders();
      console.log(`Selected ${r}, ${c}, ${r2}, ${c2}`);
      if ((c2-c)*(r2-r) > 1) {
        //column selected
        this.selectedColumn = c;
        this.selectedRow = null;
      } else {
        //cell selected
        this.selectedColumn = c;
        this.selectedRow = r;
      }
      this.updateErrorPopup();
    };
    this.tableSettings = {
      data: this.data,
      editor: false,
      fillHandle: false,
      copyPaste: false,
      colHeaders: true,
      fixedRowsTop: 2,
      width: "100%",
      selectionModeString: 'range',
      height: 400,
      afterSelection: afterSelection,
      beforeKeyDown: beforeKeyDown,
      cells: function(row, col, prop) {
        let cellProperties: any = {};

        if (row < 2) {
          cellProperties.renderer = headerRenderer;
        } else {
          cellProperties.renderer = valueRenderer;
        }

        return cellProperties;
      },
      rowHeaders: true
    };
  }

  private validateData(): Observable<Array<any>> {
    // const locations = [
    //   {
    //     "row": 18,
    //     "col": 0,
    //     "hashtag": "#adm2+name",
    //     "error_value": 0
    //   },
    //   {
    //     "row": 19,
    //     "col": 0,
    //     "hashtag": "#adm2+name",
    //     "error_value": 0
    //   },
    //   {
    //     "row": 6,
    //     "col": 3,
    //     "hashtag": "#adm2+name",
    //     "error_value": 42
    //   },
    //   {
    //     "row": 11,
    //     "col": 3,
    //     "hashtag": "#adm2+name",
    //     "error_value": 42
    //   },
    //   {
    //     "row": 3,
    //     "col": 8,
    //     "hashtag": "#adm2+name",
    //     "error_value": 42
    //   },
    //   {
    //     "row": 6,
    //     "col": 2,
    //     "hashtag": "#adm2+name",
    //     "error_value": 42
    //   },
    //   {
    //     "row": 13,
    //     "col": 4,
    //     "hashtag": "#adm2+name",
    //     "error_value": 42
    //   },
    //   {
    //     "row": 18,
    //     "col": 7,
    //     "hashtag": "#adm2+name",
    //     "error_value": 42
    //   },
    //   {
    //     "row": 5,
    //     "col": 10,
    //     "hashtag": "#adm2+name",
    //     "error_value": 42
    //   }
    // ];
    // return Observable.of(locations);

    const url =  'https://github.com/alexandru-m-g/datavalidation-temp/raw/master/Dummy%20data.xlsx';
    const schema_url = 'https://docs.google.com/spreadsheets/d/1NaASPAFoxVtKBiai9bbZqeenMfGrkLkmNiV0FoSoZms/edit#gid=0';
    const params = [
      {
        key: 'url',
        value: url
      },
      {
        key: 'schema_url',
        value: schema_url
      }
    ];
    const validationResult = this.hxlProxyService.makeValidationCall(params);
    return validationResult;
  }

  private getData(): Observable<any> {
    const sample1 = [
      ['Région','Pcode Region','District','Pcode District','Communes','Pcode Communes','Fokontany','Pcode Fokontany','Personnes Décédées','Personnes Blessées','Maisons Détruites','Maisons Inondées','Maisons décoiffées','Personnes déplacées','Familles déplacées','H','F','Moins de 05 ans','Enceinte','Handicapés','Plus de 60 ans'],
      ['#adm1+name','#adm1+code','#adm2+name','#adm2+code','#adm3+name','#adm3+code','#adm4+name','#adm4+code','#affected+killed','#affected+injured','#affected+damaged','#affected+flooded','#affected+roofless','#affected+idps+individuals','#affected+idps+households','#affected+idps+individuals+m','#affected+idps+individuals+f','#affected+idps+individuals+infants','#affected+idps+individuals+f+pregnant','#affected+idps+individuals+vulnerable','#affected+idps+individuals+elderly'],
      ['Sava','MDG72','Sambava','MDG72711','Sambava Cu','MDG72711010','Ambodisatrana','MDG72711010011','0','0','83','64','54','524','102','280','244','86','19','6','44'],
      ['Sava','MDG72','Sambava','MDG72711','Farahalana','MDG72711079','Farahalana ','MDG72711079001','0','0','41','0','0','216','41','114','102','63','23','2','23'],
      ['Sava','MDG72','Sambava','MDG72711','Farahalana','MDG72711079','Antohomaro','MDG72711079002','1','0','0','0','0','0','0','0','0','0','0','0','0'],
      ['Sava','MDG72','Antalaha','MDG72710','Antalaha Ambonivohitra','MDG72710010','Ambondrona','MDG72710010006','0','0','670','123','715','4138','953','1927','2211','689','49','44','305'],
      ['Sava','MDG72','Antalaha','MDG72710','Antalaha Ambonivohitra','MDG72710010','Ankoalabe','MDG72710010012','0','0','456','269','752','7870','1189','2423','5447','539','56','22','241'],
      ['Sava','MDG72','Antalaha','MDG72710','Antalaha Ambonivohitra','MDG72710010','Ambatofisaka','MDG72710010002','0','2','70','0','234','416','304','204','212','220','43','35','139'],
      ['Sava','MDG72','Antalaha','MDG72710','Antalaha Ambonivohitra','MDG72710010','Antsonasona','MDG72710010011','0','0','91','37','272','6011','726','2218','3793','257','27','4','146'],
      ['Sava','MDG72','Antalaha','MDG72710','Antalaha Ambonivohitra','MDG72710010','Anjiamangotroka','MDG72710010016','0','0','43','0','198','946','241','440','506','128','11','6','49'],
      ['Sava','MDG72','Antalaha','MDG72710','Antalaha Ambonivohitra','MDG72710010','Tanambao','MDG72710010001','0','0','171','113','109','2179','534','1147','1032','236','10','5','73'],
      ['Sava','MDG72','Antalaha','MDG72710','Antalaha Ambonivohitra','MDG72710010','Tanambaonampano','MDG72710010003','1','0','154','0','85','1000','222','491','509','114','14','5','56'],
      ['Sava','MDG72','Antalaha','MDG72710','Antalaha Ambonivohitra','MDG72710010','Ambatoratsy ','MDG72710010008','0','6','18','109','51','527','349','297','230','144','6','3','53'],
      ['Sava','MDG72','Antalaha','MDG72710','Antalaha Ambonivohitra','MDG72710010','Maherifody','MDG72710010013','0','151','521','236','215','3105','928','1498','1607','517','221','42','209'],
      ['Sava','MDG72','Antalaha','MDG72710','Antalaha Ambonivohitra','MDG72710010','Ambatomitraka','MDG72710010005','0','0','472','126','489','9658','1087','3025','6633','595','71','73','24'],
      ['Sava','MDG72','Antalaha','MDG72710','Antalaha Ambonivohitra','MDG72710010','Antsirandambo','MDG72710010007','0','0','164','27','0','932','190','465','467','118','19','18','50'],
      ['Sava','MDG72','Antalaha','MDG72710','Antalaha Ambonivohitra','MDG72710010','Ambodibonara','MDG72710010004','0','5','207','11','160','1905','378','912','993','298','28','38','129'],
      ['Sava','MDG72','Antalaha','MDG72710','Ambinanifaho','MDG72710190','Tsarahonenana','MDG72710190005','0','1','98','7','17','684','120','337','347','108','21','10','52'],
      ['Sava','MDG72','Antalaha','MDG72710','Ambinanifaho','MDG72710190','Ambodimanga','MDG72710190002','0','0','62','0','92','638','154','311','327','41','28','7','55'],
      ['Sava','MDG72','Antalaha','MDG72710','Ambinanifaho','MDG72710190','Beanamalao','MDG72710190004','0','0','36','0','24','286','60','147','139','9','3','4','14'],
      ['Sava','MDG72','Antalaha','MDG72710','Ambinanifaho','MDG72710190','Ampanatsovana','MDG72710190003','0','0','28','0','73','207','45','132','75','132','12','5','4'],
      ['Sava','MDG72','Antalaha','MDG72710','Ambinanifaho','MDG72710190','Ambinanifaho','MDG72710190001','0','0','36','0','84','483','120','208','275','44','4','3','16'],
      ['Sava','MDG72','Antalaha','MDG72710','Lanjarivo','MDG72710230','Lanjarivo','MDG72710230001','0','0','13','0','47','113','60','50','63','7','4','1','35'],
      ['Sava','MDG72','Antalaha','MDG72710','Lanjarivo','MDG72710230','Analanantsoa','MDG72710230010','0','0','36','0','162','198','57','80','118','28','6','1','40'],
      ['Sava','MDG72','Antalaha','MDG72710','Lanjarivo','MDG72710230','Vohitrarivo','MDG72710230004','0','0','20','0','23','80','23','30','50','15','2','1','18'],
      ['Sava','MDG72','Antalaha','MDG72710','Lanjarivo','MDG72710230','Vohitsoa','MDG72710230009','0','0','13','0','9','62','22','26','36','9','0','0','4'],
      ['Sava','MDG72','Antalaha','MDG72710','Lanjarivo','MDG72710230','Sarahandrano','MDG72710230003','0','0','13','0','9','83','25','35','48','12','5','0','6'],
      ['Sava','MDG72','Antalaha','MDG72710','Lanjarivo','MDG72710230','Mahadera','MDG72710230011','0','0','18','0','13','91','30','32','59','7','1','0','10'],
      ['Sava','MDG72','Antalaha','MDG72710','Lanjarivo','MDG72710230','Mangatsahatsa','MDG72710230007','0','0','13','0','15','59','23','16','43','4','1','0','10'],
      ['Sava','MDG72','Antalaha','MDG72710','Lanjarivo','MDG72710230','Andampibe','MDG72710230013','0','0','13','0','15','65','28','20','45','5','2','0','9'],
      ['Sava','MDG72','Antalaha','MDG72710','Lanjarivo','MDG72710230','Ambodilalona','MDG72710230005','0','0','14','0','16','93','30','26','67','3','1','0','7'],
      ['Sava','MDG72','Antalaha','MDG72710','Antsahanoro','MDG72710090','Antsahanoro','MDG72710090001','0','0','117','0','123','890','210','426','464','87','29','4','53'],
      ['Sava','MDG72','Antalaha','MDG72710','Ampanaovana','MDG72710272','Marofinaritra','MDG72710272005','0','0','31','0','89','494','120','237','257','10','11','0','40'],
      ['Sava','MDG72','Antalaha','MDG72710','Ampohibe','MDG72710050','Sahantaha','MDG72710050009','0','5','301','51','9','1082','310','570','512','184','22','12','71'],
      ['Sava','MDG72','Antalaha','MDG72710','Ampohibe','MDG72710050','Ampatakana','MDG72710050018','0','0','30','0','162','905','192','440','465','165','5','11','41'],
      ['Sava','MDG72','Antalaha','MDG72710','Ampohibe','MDG72710050','Andasibe','MDG72710050019','0','0','47','31','91','239','60','97','142','20','0','0','9'],
      ['Sava','MDG72','Antalaha','MDG72710','Ampohibe','MDG72710050','Ankiakantely','MDG72710050013','0','0','25','0','31','209','56','111','98','32','4','0','11'],
      ['Sava','MDG72','Antalaha','MDG72710','Ampohibe','MDG72710050','Andongozabe','MDG72710050011','0','0','97','0','86','701','183','309','392','54','11','4','30'],
      ['Sava','MDG72','Antalaha','MDG72710','Ampohibe','MDG72710050','Ampohibe','MDG72710050001','0','0','54','0','54','282','60','116','166','65','8','7','21'],
      ['Sava','MDG72','Antalaha','MDG72710','Ampohibe','MDG72710050','Anjarina','MDG72710050006','0','0','22','2','50','308','77','150','158','36','7','6','23'],
      ['Sava','MDG72','Antalaha','MDG72710','Ampohibe','MDG72710050','Ambodivoangibe','MDG72710050003','0','0','27','0','30','416','90','205','211','34','1','2','48'],
      ['Sava','MDG72','Antalaha','MDG72710','Ampohibe','MDG72710050','Mahatsara','MDG72710050004','0','0','46','4','59','256','60','133','123','33','2','7','18'],
      ['Sava','MDG72','Antalaha','MDG72710','Ampohibe','MDG72710050','Tanandava','MDG72710050012','0','0','164','0','79','789','208','361','428','184','6','4','31'],
      ['Sava','MDG72','Antalaha','MDG72710','Ampohibe','MDG72710050','Namohana','MDG72710050010','0','0','0','5','24','113','50','55','58','4','2','3','16'],
      ['Sava','MDG72','Antalaha','MDG72710','Ampohibe','MDG72710050','Ambodibaro','MDG72710050014','0','0','5','3','46','518','120','122','396','53','9','10','47'],
      ['Sava','MDG72','Antalaha','MDG72710','Ampohibe','MDG72710050','Tanambao Mahatera','MDG72710050015','0','0','0','0','0','308','90','100','208','41','4','6','19'],
      ['Sava','MDG72','Antalaha','MDG72710','Ampohibe','MDG72710050','Ankiakahely','MDG72710050016','0','0','0','0','0','227','60','93','134','28','1','0','15'],
      ['Sava','MDG72','Antalaha','MDG72710','Ampahana','MDG72710030','Maromokotra','MDG72710030005','0','0','28','45','57','530','147','246','284','91','10','4','29'],
      ['Sava','MDG72','Antalaha','MDG72710','Ampahana','MDG72710030','Antseranambidy','MDG72710030010','0','0','41','53','47','257','69','126','131','44','2','5','28'],
      ['Sava','MDG72','Antalaha','MDG72710','Ampahana','MDG72710030','Ampotatra','MDG72710030011','0','0','13','100','128','911','289','456','455','71','11','3','39'],
      ['Sava','MDG72','Antalaha','MDG72710','Ampahana','MDG72710030','Antapolo','MDG72710030009','0','0','31','46','61','233','61','107','126','36','0','8','20'],
      ['Sava','MDG72','Antalaha','MDG72710','Ampahana','MDG72710030','Andrapengy','MDG72710030004','0','0','64','106','55','536','139','262','274','91','5','8','45'],
      ['Sava','MDG72','Antalaha','MDG72710','Antsahanoro','MDG72710090','Antsahaniatina','MDG72710090010','1','0','0','0','0','0','0','0','0','0','0','0','0'],
      ['Sava','MDG72','Antalaha','MDG72710','Ambalabe','MDG72710170','Ambalabe','MDG72710170001','0','1','0','0','0','0','0','0','0','0','0','0','0'],
      ['Sava','MDG72','Antalaha','MDG72710','Ampohibe','MDG72710050','Tanandava','MDG72710050012','0','1','0','0','0','0','0','0','0','0','0','0','0'],
    ];
    // return Observable.of(sample1);

    const url =  'https://github.com/alexandru-m-g/datavalidation-temp/raw/master/Dummy%20data.xlsx';
    const params = [
      {
        key: 'url',
        value: url
      }
    ];

    const result = this.hxlProxyService.makeDataCall(params);
    return result;
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

  initBorders() {
    let colorBorders = function () {
      let borders = document.querySelectorAll('.handsontable .wtBorder');
      for (let i = 0; i < borders.length; i++) {
        let border: HTMLElement = borders[i] as HTMLElement;
        border.style.backgroundColor = '#f2645a';
        if (border.style.width === "1px") {
          border.style.width = "2px";
        }
        if (border.style.height === "1px") {
          border.style.height = "0";
        }
      }
    };
    if (!this.bordersInitialised) {
      this.bordersInitialised = true;
      setTimeout(colorBorders, 50);
    }
  }

  private updateErrorPopup() {
    if (this.selectedColumn !== null){
      let errorsX = this.errorsXY[this.selectedColumn];
      this.selectedTitle = this.data[0][this.selectedColumn];
      if (errorsX !== undefined) {
        if (this.selectedRow !== null) {
          let error = errorsX[this.selectedRow];
          this.selectedTitle = this.data[this.selectedRow][this.selectedColumn];
        }
      }
    } else {
      this.selectedTitle = null;
    }
  }
}
