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
  _selectedRecipeUrl = 'https://docs.google.com/spreadsheets/d/1NaASPAFoxVtKBiai9bbZqeenMfGrkLkmNiV0FoSoZms/edit#gid=0';

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
  errorReport: any;
  colToHash = {};
  hashToCol = {};
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
    // this.embedUrl = null;
    this.reloadDataAndValidate();
  }

  get selectedRecipeUrl() {
    return this._selectedRecipeUrl;
  }

  set selectedRecipeUrl(selectedRecipeUrl: string) {
    this._selectedRecipeUrl = selectedRecipeUrl;

    this.reloadDataAndValidate();
  }

  protected reloadDataAndValidate() {
    this.errorsXY = {};

    const dataObservable = this.getData();
    dataObservable.subscribe((data) => {
      this.data = data;

      for (let i = 0; i < data[1].length; i++) {
        this.colToHash[i] = data[1][i];
        this.hashToCol[data[1][i]] = i;
      }
      console.log('colToHash map is built');

      const hotInstance = this.hotRegisterer.getInstance(this.tableId);
      hotInstance.loadData(data);
      console.log('Data loaded');
    });

    const locationsObservable = this.validateData();
    locationsObservable.subscribe((report) => {
      console.log('test');
      this.errorReport = report;
      report.flatErrors.forEach((val, index) => {
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
    this.reloadDataAndValidate();

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

  private validateData(): Observable<any> {

    // const url =  'https://github.com/alexandru-m-g/datavalidation-temp/raw/master/Dummy%20data.xlsx';
    const url = this.selectedUrl;
    // const schema_url = 'https://docs.google.com/spreadsheets/d/1NaASPAFoxVtKBiai9bbZqeenMfGrkLkmNiV0FoSoZms/edit#gid=0';
    const schemaUrl = this.selectedRecipeUrl;
    const params = [
      {
        key: 'url',
        value: url
      },
      {
        key: 'schema_url',
        value: schemaUrl
      }
    ];
    const validationResult = this.hxlProxyService.makeValidationCall(params);
    return validationResult;
  }

  private getData(): Observable<any> {
    // const url =  'https://github.com/alexandru-m-g/datavalidation-temp/raw/master/Dummy%20data.xlsx';
    const url = this.selectedUrl;
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

  get tableColumnName(): string {
    return 'A';
  }
}
