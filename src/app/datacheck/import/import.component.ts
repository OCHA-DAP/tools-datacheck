import { RecipeService, RuleType, RULE_TYPE_TAG } from './../services/recipe.service';
import { COUNTRIES } from './../helpers/constants';
import { ConfigService } from './../config.service';
import { HxlproxyService } from './../services/hxlproxy.service';
import { Router, ActivatedRoute, ParamMap, Params } from '@angular/router';
import { GooglepickerDirective } from '../../common/googlepicker.directive';
import { DropboxchooserDirective } from '../../common/dropboxchooser.directive';
import {
  Component,
  OnInit,
  ChangeDetectorRef,
  ViewChild,
  HostListener,
  ElementRef,
  AfterViewInit, Renderer
} from '@angular/core';
import { AnalyticsService } from '../../common/analytics.service';
import { HttpService } from '../../shared/http.service';
import { DomSanitizer} from '@angular/platform-browser';
import { Http } from '@angular/http';
import * as Handsontable from 'handsontable';
import { HotTableRegisterer } from '@handsontable/angular';
import { Observable } from 'rxjs/Observable';


const DEFAULT_RECIPE = 'https://docs.google.com/spreadsheets/d/1NaASPAFoxVtKBiai9bbZqeenMfGrkLkmNiV0FoSoZms/edit#gid=0';

@Component({
  selector: 'app-import',
  templateUrl: './import.component.html',
  styleUrls: ['./import.component.less']
})
export class ImportComponent implements OnInit {

  readonly stepName = 'Import Data';
  dataSource = 'upload';
  hxlCheckError: any = null;
  _selectedUrl = '';
  _selectedRecipeUrl: string;

  selectedFile: File = null;

  recipeTemplate: any[] = [];
  ruleTypesMap: Map<string, RuleType>;

  tableSettings: any;
  tableId = 'table1';
  data: any[] = Handsontable.helper.createSpreadsheetData(10, 10);
  errorList: any[];

  sampleData = [
    // {
    //   'id': 'c7fb99a5-43ec-4b3f-b8db-935640c75aeb',
    //   'name': 'Alex\'s dataset',
    //   'description': 'Lorem ipsum ... ',
    //   'url': 'https://github.com/alexandru-m-g/datavalidation-temp/raw/master/Dummy%20data.xlsx',
    //   'org': 'IFRC',
    //   'recipe': null
    // },
    {
      'id': 'c7fb99a5-43ec-4b3f-b8db-935640c75aeb',
      'name': 'Sample data with name, p-code, and data type errors',
      'description': 'Lorem ipsum ... ',
      'url': 'https://docs.google.com/spreadsheets/d/1NXG_M2yTrdk5LS7FgUBVHbo6ZdMt3Wmo6jE0oVws2vA/export?format=csv',
      'org': 'HDX',
      'recipe': 'https://raw.githubusercontent.com/OCHA-DAP/tools-datacheck-validation/prod/pcodes/validation-schema-pcodes-sle.json'
    }
  ];

  httpService: HttpService;
  embedUrl: string = null;
  errorsXY = {};
  numberOfColumns: number;
  selectedColumn: number;
  selectedRow: number;
  _selectedTitle: string;
  errorReport: any;

  private bordersInitialised = false;
  private _hotInstance: Handsontable;
  selectedColumnName: string;
  showFilters = true;

  countries = [];
  showRecipeDropdown = true;

  showLoadingOverlay = false;
  loadingOverlayText = 'Loading data and running checks ...';

  customValidation = false;
  customValidationList: Array<any> = null;

  @ViewChild('hotTable')
  private hotTableEl: ElementRef;

  private lastRecipeUrl: string = null;
  public dataTitle: string[];
  public dataHXLTags: string[];
  public customValidationChoices: string[];


  constructor(private router: Router, private route: ActivatedRoute,
              private analyticsService: AnalyticsService,
              http: Http, private sanitizer: DomSanitizer,
              private hotRegisterer: HotTableRegisterer,
              private hxlProxyService: HxlproxyService,
              private configService: ConfigService,
              private recipeService: RecipeService,
              private elRef: ElementRef) {

    this.httpService = <HttpService> http;

    const BASE_URL = 'https://raw.githubusercontent.com/OCHA-DAP/tools-datacheck-validation/prod';
    this.countries = COUNTRIES.map( c => {
      return {
        name: c.name,
        url: `${BASE_URL}/pcodes/validation-schema-pcodes-${c.iso3}.json`
      };
    });
    this.countries.push({
      name: 'No country',
      url: `${BASE_URL}/basic-validation-schema.json`
    });
  }

  get selectedUrl(): string {
    return this._selectedUrl;
  }

  set selectedUrl(selectedUrl: string) {
    this._selectedUrl = selectedUrl;
    // this.embedUrl = null;
    this.reloadDataAndValidate();
  }

  get selectedRecipeUrl(): string {
    return this._selectedRecipeUrl;
  }

  set selectedRecipeUrl(selectedRecipeUrl: string) {
    this._selectedRecipeUrl = selectedRecipeUrl;

    this.reloadDataAndValidate();
  }

  get ruleTypes(): Set<RuleType> {
    if (!this.ruleTypesMap) {
      return new Set<RuleType>();
    }

    return new Set(this.ruleTypesMap.values());
  }

  get selectedRules(): any[] {
    if (this.ruleTypesMap) {
      const newRules = [];
      for (let i = 0; i < this.recipeTemplate.length; i++) {
        const rule = this.recipeTemplate[i];
        const type = rule[RULE_TYPE_TAG] ? rule[RULE_TYPE_TAG] : '';
        const ruleType = this.ruleTypesMap.get(type);
        if (!ruleType || ruleType.enabled) {
          newRules.push(rule);
        }

      }
      return newRules;
    }
    throw new Error('Selected rules shouldn\'t be accessed before the rules are loaded');
  }

  ngOnInit() {
    this.changeSampleUrl(this.sampleData[0].url, this.sampleData[0].recipe, true);
    this.route.paramMap.subscribe((params: ParamMap) => {
      this.httpService.turnOnModal();
      const urlParam = params.get('url');
      if (urlParam) {
        this._selectedUrl = urlParam;
        this.dataSource = 'sample';
      }
      const recipeUrlParam = params.get('recipeUrl');
      if (recipeUrlParam) {
        this._selectedRecipeUrl = recipeUrlParam;
      }
      this.reloadDataAndValidate();

      const showRecipeDropdown = params.get('recipeDropdown');
      if (showRecipeDropdown === 'false') {
        this.showRecipeDropdown = false;
      }
    });

    const headerRenderer = (instance, td, row, col, prop, value, cellProperties) => {
      Handsontable.renderers.TextRenderer.apply(this, [instance, td, row, col, prop, value, cellProperties]);
      if (row === 0) {
        // td.style.fontWeight = 'bold';
        // td.style.color = 'green';
        // td.style.background = '#CEC';
      } else {
        td.style.fontWeight = 'bold';
      }
    };
    const valueRenderer = (instance, td, row, col, prop, value, cellProperties) => {
      Handsontable.renderers.TextRenderer.apply(this, [instance, td, row, col, prop, value, cellProperties]);
      // const hash = this.colToHash[col];
      // if (hash) {
      //   console.log('rendering WITH HASH');
      // } else {
      //   console.log('rendering NO HASH')
      // }
      // if row contains negative number
      if (this.errorsXY[col] !== undefined && this.errorsXY[col][row] !== undefined) {
        // add class "negative"
        td.style.backgroundColor = '#f9ccc9';
      }

      if (value === 'MDG72') {
        td.style.fontStyle = 'italic';
      }
    };
    const beforeKeyDown = (event: KeyboardEvent) => {

      if (event.keyCode === 38 || event.keyCode === 40 || event.keyCode === 37 || event.keyCode === 39) {
        console.log('Key down');
        event.stopPropagation();
        event.stopImmediatePropagation();
        event.preventDefault();

        const selection = this.hotInstance.getSelected();
        console.log(`Selection: ${selection}`);
        const selectedCol: number = selection[0][1];
        const selectedRow: number = selection[0][0];
        let nextCol: number, nextRow: number;

        const errorsX = this.errorsXY[selectedCol];
        if (event.keyCode === 38) {
          // up arrow
          console.log('up arrow');
          // tslint:disable-next-line:forin
          for (const key in errorsX) {
            const val: number = parseInt(key, 10);
            if ((val < selectedRow) && (nextRow === undefined || nextRow < val)) {
              nextRow = val;
            }
          }
          if (nextRow !== undefined) {
            nextCol = selectedCol;
          } else {
            nextCol = selectedCol;
          }
        } else if (event.keyCode === 40) {
          // down arrow
          console.log('down arrow');
          // tslint:disable-next-line:forin
          for (const key in errorsX) {
            const val: number = parseInt(key, 10);
            if ((val > selectedRow) && (nextRow === undefined || nextRow > val)) {
              nextRow = val;
            }
          }
          if (nextRow !== undefined) {
            nextCol = selectedCol;
          }
        } else if (event.keyCode === 37) {
          // left arrow
          console.log('left arrow');
          nextCol = selectedCol - 1;
        } else if (event.keyCode === 39) {
          // right arrow
          console.log('right arrow');
          nextCol = selectedCol + 1;
        }
        setTimeout(() => {
          const currentCell = this.elRef.nativeElement.querySelector('hot-table');
          currentCell.scrollIntoView();
        }, 10);
        this.tableJumpTo(nextCol, nextRow);
      }
    };
    const afterSelection = (r: number, c: number, r2: number, c2: number, preventScrolling: object, selectionLayerLevel: number) => {
      this.initBorders();
      console.log(`Selected ${r}, ${c}, ${r2}, ${c2}`);
      this.selectedColumn = null;
      this.selectedRow = null;
      if ((c2 === c) && ((r2 - r) > 1)) {
        // column selected
        this.selectedColumn = c;
      } else {
        // cell selected
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
      minCols: 26,
      width: '100%',
      selectionModeString: 'single',
      height: '100%',
      // disableVisualSelection: ['area'],
      dragToScroll: false,
      afterSelection: afterSelection,
      beforeKeyDown: beforeKeyDown,
      cells: function(row, col, prop) {
        const cellProperties: any = {};

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

  private tableJumpTo(nextCol: number, nextRow: number) {
    if (nextRow !== undefined && nextCol !== undefined) {
      this.hotInstance.selectCell(nextRow, nextCol, nextRow, nextCol, true, true);
      this.hotInstance.scrollViewportTo(nextRow, nextCol, true, true);
    } else {
      if (nextCol !== undefined) {
        this.hotInstance.selectColumns(nextCol);
        this.hotInstance.scrollViewportTo(1, nextCol, true, true);
      }
    }

  }

  protected reloadDataAndValidate() {
    this.showLoadingOverlay = true;
    this.errorsXY = {};
    this.hxlCheckError = null;
    // const dataObservable = this.getData();
    // dataObservable.subscribe((data) => {
    //   this.dataTitle = data[0].slice(0);
    //   this.dataHXLTags = data[1].slice(0);
    //   this.data = data;
    //   this.numberOfColumns = data[0].length;

    //   this.hotInstance.loadData(data);
    //   console.log('Data loaded');
    // }, (error) => {
    //   if (error.source_status_code === 404) {
    //     this.hxlCheckError = 'The provided data source couldn\'t be found or read, please verify it is correct.';
    //   } else if (error.status === 403) {
    //     this.hxlCheckError = error.message;
    //   } else if (error.status === 500 && error.error == 'UnicodeDecodeError') {
    //     this.hxlCheckError = 'The provided data source is not a csv, xls or xlsx or couldn\'t be read. Please verify your data source!';
    //   }

    //   if (!this.hxlCheckError) {
    //     this.hxlCheckError =
    //       'Sorry, an unexpected has error occurred! Please pass this error report to our support team: '
    //       + JSON.stringify(error);
    //   }
    // });

    this.fetchRecipeTemplate(this.selectedRecipeUrl).subscribe(this.validateData.bind(this));
  }

  private validateData() {
    this.showLoadingOverlay = true;
    this.resetErrors();
    const selectedRules = this.selectedRules.slice(0);
    if (this.customValidationList) {
      this.customValidationList.forEach((val, idx) => {
        if (val.values && val.tag) {
          const values = val.values.replace(/,/g, '|');
          const index = idx + 1;
          selectedRules.push({
            '#valid_tag': val.tag,
            '#valid_severity': 'error',
            '#valid_value+list': values,
            // "#valid_value+target_tag": val.tag,
            '#description': 'Custom list validation ' + index,
            // "#rule_type":"Check for valid values",
            // "#rule_type_description":"Check for valid values"
          });
        }
      });
    }

    let validationObs = null;
    if (this.dataSource === 'upload' && this.selectedFile) {
      validationObs = this.recipeService.validateData(null, this.selectedFile, JSON.stringify(selectedRules));
    } else if (selectedRules && selectedRules.length > 0) {
      validationObs = this.recipeService.validateData(this.selectedUrl, null, JSON.stringify(selectedRules));
    } else {
      /**
       * If there's no rule selected we just simulate returning a report with no errors
       */
      validationObs = Observable.of(null);
    }
    validationObs.subscribe(report => {
      if (report) {
        this.data = report.dataset;
        this.dataTitle = this.data[0].slice(0);
        this.dataHXLTags = this.data[1].slice(0);
        this.numberOfColumns = this.data[0].length;

        this.errorReport = report;
        report.flatErrors.forEach((val, index) => {
          let errorsX = this.errorsXY[val.col];
          if (errorsX === undefined) {
            errorsX = {};
            this.errorsXY[val.col] = errorsX;
          }
          errorsX[val.row] = val.row;
        });
      }
      console.log('showing errors');
      this.hotInstance.render();
      this.hotInstance.loadData(this.data);
      this.updateErrorList();
      this.showLoadingOverlay = false;
    });
  }

  private fetchRecipeTemplate(recipeUrl: string): Observable<any[]> {
    let recipeObs: Observable<any[]> = null;
    if (this.lastRecipeUrl === recipeUrl && this.recipeTemplate) {
      recipeObs = Observable.of(this.recipeTemplate);
    } else {
      recipeObs = this.recipeService.fetchRecipeTemplate(recipeUrl).map(recipe => {
        this.recipeTemplate = recipe;
        this.ruleTypesMap = this.recipeService.extractListOfTypes(recipe);
        return recipe;
      });
    }

    return recipeObs;
  }

  protected onRuleTypeChange(ruleType: RuleType) {
    // console.log(this.ruleTypesMap);
    this.rulesRecheck();
  }

  protected rulesRecheck() {
    this.validateData();
  }

  protected onSelectDeselectRuleTypes(selected: boolean) {
    this.ruleTypes.forEach(ruleType => ruleType.enabled = selected);
    this.validateData();
  }

  // private getData(): Observable<any> {
  //   // const url =  'https://github.com/alexandru-m-g/datavalidation-temp/raw/master/Dummy%20data.xlsx';
  //   const url = this.selectedUrl;
  //   const params = [
  //     {
  //       key: 'url',
  //       value: url
  //     }
  //   ];

  //   const result = this.hxlProxyService.makeDataCall(params);
  //   return result;
  // }

  updateSelectedUrl(newUrl: string) {
    console.log('Updating with ' + newUrl);
    this.selectedUrl = newUrl;
    this.dataSource = 'url';
  }
  changeDatasource($event) {
    this.dataSource = $event.target.value;
  }

  changeSampleUrl(url: string, recipe: string, noReload?: boolean) {
    this._selectedUrl = url;
    if (recipe == null) {
      recipe = DEFAULT_RECIPE;
    }
    this._selectedRecipeUrl = recipe;

    if (!noReload) {
      this.reloadDataAndValidate();
    }
  }

  initBorders() {
    const colorBorders = function () {
      const borders = document.querySelectorAll('.handsontable .wtBorder');
      for (let i = 0; i < borders.length; i++) {
        const border: HTMLElement = borders[i] as HTMLElement;
        border.style.backgroundColor = '#f2645a';
        if (border.style.width === '1px') {
          border.style.width = '2px';
        }
        if (border.style.height === '1px') {
          border.style.height = '0';
        }
      }
    };
    if (!this.bordersInitialised) {
      this.bordersInitialised = true;
      setTimeout(colorBorders, 50);
    }
  }

  private updateErrorPopup() {
    this.updateErrorList();
    if (this.selectedColumn !== null) {
      const colHeader = this.hotInstance.getColHeader(this.selectedColumn);
      this.selectedColumnName = colHeader[0];

      const errorsX = this.errorsXY[this.selectedColumn];
      this._selectedTitle = this.data[0][this.selectedColumn];
      if (errorsX !== undefined) {
        if (this.selectedRow !== null) {
          const error = errorsX[this.selectedRow];
          this._selectedTitle = this.data[this.selectedRow][this.selectedColumn];
        }
      }
    } else {
      this._selectedTitle = null;
      this.selectedColumnName = null;
    }
  }

  get hotInstance(): Handsontable {
    // if (!this._hotInstance) {
      this._hotInstance = this.hotRegisterer.getInstance(this.tableId);
    // }
    return this._hotInstance;
  }

  private updateErrorList() {
    if (this.errorReport) {
      let issues: any[] = JSON.parse(JSON.stringify(this.errorReport.issues));
      if (this.selectedColumn != null) {
        issues = issues.filter((issue) => {
          let locations = issue.locations.slice(0);
          locations = locations.filter((location) => {
            // return (location.col == this.selectedColumn) &&
            return (location.col === this.selectedColumn) &&
              (this.selectedRow == null || location.row === this.selectedRow);
          });
          issue.locations = locations;
          issue.location_count = locations.length;
          return locations.length > 0;
        });
      }
      this.errorList = issues;
    } else {
      this.errorList = [];
    }

    return this.errorList;
  }

  getColHeaderFromCol(col: number) {
    return this.hotInstance.getColHeader(col);
  }

  get selectedTitle(): string {
    if (this.selectedColumn != null) {
      return this._selectedTitle;
    }
    const text = this.errorReport ? this.errorReport.stats.total + ' problems found' : '';
    return text;
  }

  jumpTo(col: number, row: number) {
    this.selectedColumn = col;
    this.selectedRow = row;
    this.tableJumpTo(this.selectedColumn, this.selectedRow);
    setTimeout(() => {
      const currentCell = this.elRef.nativeElement.querySelector('hot-table');
      currentCell.scrollIntoView();
    }, 10);
  }

  resetSelection(column: boolean, row: boolean) {
    if (column) {
      this.selectedColumn = null;
    }
    if (row) {
      this.selectedRow = null;
    }
    this.updateErrorList();
    this.updateErrorPopup();
  }

  private resetErrors() {
    this.errorReport = null;
    this.errorsXY = {};
    this.errorList = [];
  }

  reviewErrors() {
    this.selectedColumn = 0;
    this.updateErrorList();
    this.updateErrorPopup();
  }

  incrementColumn(val: number) {
    this.selectedColumn += val;
    this.updateErrorList();
    this.updateErrorPopup();
  }

  onTriggerCustomValidation() {
    if (this.customValidation) {
      if (this.customValidationList == null) {
        this.customValidationList = [];
        this.onAddNewCustomValidation();
      }
    }
  }

  onAddNewCustomValidation() {
    this.customValidationList.push({
      values: null,
      column: null
    });
  }

  onRemoveCustomValidation(idx) {
    this.customValidationList.splice(idx, 1);
  }

  onCustomValidationTagChange(item, event) {
    item.tag = event.target.value;
    this.rulesRecheck();
  }

  onFileUpload(file: File) {
    console.log(file);
    this.selectedFile = file;
    this.reloadDataAndValidate();
  }
}
