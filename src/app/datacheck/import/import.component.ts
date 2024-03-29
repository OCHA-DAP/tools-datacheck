import { RecipeService, RULE_TYPE_TAG, RuleType } from './../services/recipe.service';
import { COUNTRIES } from './../helpers/constants';
import { ConfigService } from './../config.service';
import { HxlproxyService } from './../services/hxlproxy.service';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { Component, ElementRef, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { AnalyticsService } from '../../common/analytics.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';
import Handsontable from 'handsontable';
import { HotTableRegisterer } from '@handsontable/angular';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { CustomValidationItem } from './custom-validation-item';
import { InapplicableRulesProcessor } from '../helpers/inapplicabale-rules';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';

const DEFAULT_RECIPE = 'https://docs.google.com/spreadsheets/d/1NaASPAFoxVtKBiai9bbZqeenMfGrkLkmNiV0FoSoZms/edit#gid=0';

class ImportComponentPersistent {
  dataSource: string;
  _selectedUrl: string;
  _selectedRecipeUrl: string;
  customValidation: boolean;
  customValidationList: Array<CustomValidationItem>;
  ruleTypesMap: Map<string, RuleType>;
  _ruleTypeSelection: any;
  embedded: boolean;

  constructor() {
    this.dataSource = 'sample';
    this._selectedUrl = '';
    this._selectedRecipeUrl = null;
    this.customValidation = false;
    this.customValidationList = null;
    this.ruleTypesMap = null;
    this.embedded = false;
  }

  toJSON() {
    const copy: any = Object.assign({}, this);
    copy._ruleTypeSelection = {};
    this.ruleTypesMap.forEach((value, key) => {
      copy._ruleTypeSelection[key] = value.enabled;
    });
    return copy;
  }
}

@Component({
  selector: 'app-import',
  templateUrl: './import.component.html',
  styleUrls: ['./import.component.less']
})
export class ImportComponent extends ImportComponentPersistent implements OnInit  {

  hxlCheckError: any = null;
  selectedFile: File = null;

  recipeTemplate: any[] = [];

  tableSettings: any;
  tableId = 'table1';
  data: any[] = Handsontable.helper.createSpreadsheetData(10, 10);
  errorList: any[];

  sampleData = [
    {
      'id': 'c7fb99a5-43ec-4b3f-b8db-935640c75aeb',
      'name': 'Sample data with name, p-code, and data type errors',
      'description': 'Lorem ipsum ... ',
      'url': 'https://docs.google.com/spreadsheets/d/1NXG_M2yTrdk5LS7FgUBVHbo6ZdMt3Wmo6jE0oVws2vA/export?format=csv',
      'org': 'HDX',
      'recipe': 'https://raw.githubusercontent.com/OCHA-DAP/tools-datacheck-validation/prod/pcodes/validation-schema-pcodes-sle.json'
    }
  ];

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
  urlToIso3Map = {};
  showRecipeDropdown = true;
  showLoadingOverlay = false;
  loadingOverlayText = '';

  private savedCustomValidationList: Array<CustomValidationItem> = [new CustomValidationItem(null, null)];

  @ViewChild('hotTable')
  private hotTableEl: ElementRef;

  @ViewChild('shareTextArea')
  private shareTextArea: ElementRef;

  private lastRecipeUrl: string = null;
  public dataTitle: string[];
  public dataHXLTags: string[];
  public showLoadingDots = false;
  modalRef: BsModalRef;
  dataCheckDemoUrl: SafeResourceUrl = null;
  public shareURL: string;
  private maxColumnWidth: number;


  constructor(private router: Router, private route: ActivatedRoute,
              private analyticsService: AnalyticsService,
              httpClient: HttpClient, private sanitizer: DomSanitizer,
              private hotRegisterer: HotTableRegisterer,
              private hxlProxyService: HxlproxyService,
              private configService: ConfigService,
              private recipeService: RecipeService,
              private elRef: ElementRef,
              private modalService: BsModalService) {
    super();

    const BASE_URL = 'https://raw.githubusercontent.com/OCHA-DAP/tools-datacheck-validation/prod';
    this.countries = COUNTRIES.map(c => {
      return {
        name: c.name,
        url: `${BASE_URL}/pcodes/validation-schema-pcodes-${c.iso3}.json`,
        iso3: c.iso3
      };
    });
    this.countries.push({
      name: 'No country',
      url: `${BASE_URL}/basic-validation-schema.json`,
      iso3: 'none'
    });
    this.countries.forEach(c => this.urlToIso3Map[c.url] = c.iso3);
  }

  get selectedUrl(): string {
    return this._selectedUrl;
  }

  set selectedUrl(selectedUrl: string) {
    this._selectedUrl = selectedUrl ? selectedUrl.trim() : selectedUrl;
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
    this.maxColumnWidth = window.innerWidth - 500 > 300 ? window.innerWidth - 500 : 300;
    this.changeSampleUrl(this.sampleData[0].url, this.sampleData[0].recipe, true);
    this.route.paramMap.subscribe((params: ParamMap) => {
      const urlParam = params.get('url');
      if (urlParam) {
        this._selectedUrl = urlParam;
        this.dataSource = 'url';
      }
      const recipeUrlParam = params.get('recipeUrl');
      if (recipeUrlParam) {
        this._selectedRecipeUrl = recipeUrlParam;
      }

      const showRecipeDropdown = params.get('recipeDropdown');
      if (showRecipeDropdown === 'false') {
        this.showRecipeDropdown = false;
      }

      const config = params.get('config');
      if (config) {
        const configuration: ImportComponentPersistent = JSON.parse(config);
        Object.assign(this, configuration);
        this.ruleTypesMap = null;
      }

      this.reloadDataAndValidate();
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
      height: '400px',
      // disableVisualSelection: ['area'],
      dragToScroll: false,
      afterSelection: afterSelection,
      afterRenderer: (td, row, col, prop, value, cellProperties) => {
        if (value && value.length > 45) {
          td.setAttribute('title', value);
          td.setAttribute('data-toogle', 'tooltip');
        }
      },
      modifyColWidth: (width, col) => {
        if (width > this.maxColumnWidth) {
          return this.maxColumnWidth;
        }
      },
      wordWrap: true,
      beforeKeyDown: beforeKeyDown,
      cells: function (row, col, prop) {
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
      this.hotInstance.scrollViewportTo(nextRow, nextCol, true, false);
    } else {
      if (nextCol !== undefined) {
        this.hotInstance.selectColumns(nextCol);
        this.hotInstance.scrollViewportTo(1, nextCol, true, false);
      }
    }

  }

  protected reloadDataAndValidate() {
    this.loadingOverlayText = 'Loading data and running checks';
    this.showLoadingDots = true;
    this.showLoadingOverlay = true;
    this.errorsXY = {};
    this.hxlCheckError = null;
    this.selectedRow = null;
    this.selectedColumn = null;
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
    const iso3 = this.urlToIso3Map[this.selectedRecipeUrl];
    const analyticsInfo = {
      datasourceType: this.dataSource,
      datasourceUrl: this.dataSource === 'upload' ? this.selectedFile.name : this.selectedUrl,
      validations: this.getSelectedRuleTypes(),
      locations: iso3 ? [iso3] : []
    };

    this.showLoadingOverlay = true;
    this.generateShareURL();
    this.resetErrors();
    const selectedRules = this.selectedRules.slice(0);
    if (this.customValidationList) {
      analyticsInfo.validations.push('Custom lists');
      this.customValidationList.forEach((val, idx) => {
        if (val.values && val.tag) {
          const values = val.values.replace(/,/g, '|');
          const index = idx + 1;
          selectedRules.push({
            '#valid_tag': val.tag + '!',
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
    if (selectedRules && selectedRules.length > 0) {
      if (this.dataSource === 'upload' && this.selectedFile) {
        validationObs = this.recipeService.validateData(null, this.selectedFile, JSON.stringify(selectedRules));
      } else {
        validationObs = this.recipeService.validateData(this.selectedUrl, null, JSON.stringify(selectedRules));
      }
    } else {
      /**
       * If there's no rule selected we just simulate returning a report with no errors
       */
      validationObs = of(null);
    }
    validationObs.subscribe(report => {
      let errNum = 0;

      if (report) {
        this.data = report.dataset;

        const dataTitleRow = this.data[0].slice(0);
        const dataHxlRow = this.data[1].slice(0);

        const dataTitleTmp = [];
        const dataHxlTagsTmp = [];

        for (let i = 0; i < this.data[0].length; i++) {
          if (dataHxlRow[i].startsWith('#')) {
            dataTitleTmp.push(dataTitleRow[i]);
            dataHxlTagsTmp.push(dataHxlRow[i]);
          }
        }

        this.dataTitle = dataTitleTmp;
        this.dataHXLTags = dataHxlTagsTmp;

        this.numberOfColumns = this.data[0].length;

        const inapplicableRulesProcessor = new InapplicableRulesProcessor(report, selectedRules, this.dataHXLTags);
        report = inapplicableRulesProcessor.generateNewReport();

        this.errorReport = report;
        errNum = this.errorReport.stats.total;

        report.flatErrors.forEach((val, index) => {
          let errorsX = this.errorsXY[val.col];
          if (errorsX === undefined) {
            errorsX = {};
            this.errorsXY[val.col] = errorsX;
          }
          errorsX[val.row] = val.row;
        });
      }
      this.analyticsService.trackDataCheck(analyticsInfo.datasourceType, analyticsInfo.datasourceUrl,
        analyticsInfo.validations, analyticsInfo.locations, errNum);
      console.log('showing errors');
      this.hotInstance.render();
      this.hotInstance.loadData(this.data);
      this.updateErrorList();
      this.showLoadingOverlay = false;
    }, (error) => {
      const baseErrorMsg = '. If the problem persists, try again later or drop us a line at hdx@un.org';
      this.loadingOverlayText = 'Something went wrong' + baseErrorMsg;
      this.showLoadingDots = false;
      if (error.source_status_code === 404) {
        this.hxlCheckError = 'The provided data source couldn\'t be found or read, please verify it is correct'
          + baseErrorMsg;
      } else if (error.status === 403) {
        this.hxlCheckError = error.message + baseErrorMsg;
      } else if (error.status === 500 && error.error === 'UnicodeDecodeError') {
        this.hxlCheckError =
          'The provided data source is not a csv, xls or xlsx or couldn\'t be read. Please verify your data source'
          + baseErrorMsg;
      } else if (error.status === 500 && error.error === 'AttributeError') {
        this.hxlCheckError = 'Please check that you selected an URL or uploaded a file' + baseErrorMsg;
      } else if (error.status === 500 && error.error === 'HXLTagsNotFoundException') {
        this.hxlCheckError = 'HXL tags not found in first 25 rows of the data' + baseErrorMsg;
      } else if (error.isTrusted === true && error.type === 'error') {
        this.hxlCheckError = 'Validation timed out, dataset may be too large. Please verify your data source' + baseErrorMsg;
      }
      if (!this.hxlCheckError) {
        this.hxlCheckError =
          'Sorry, an unexpected error has occurred! Please pass this error report to our support team: '
          + JSON.stringify(error) + baseErrorMsg;
      }
    });
  }

  private fetchRecipeTemplate(recipeUrl: string): Observable<any[]> {
    let recipeObs: Observable<any[]> = null;
    if (this.lastRecipeUrl === recipeUrl && this.recipeTemplate) {
      recipeObs = of(this.recipeTemplate);
    } else {
      recipeObs = this.recipeService.fetchRecipeTemplate(recipeUrl)
        .pipe(
          map(recipe => {
            this.recipeTemplate = recipe;
            this.ruleTypesMap = this.recipeService.extractListOfTypes(recipe);
            if (this._ruleTypeSelection) {
              Object.keys(this._ruleTypeSelection).forEach(key => {
                const ruleType = this.ruleTypesMap.get(key);
                if (ruleType) {
                  ruleType.enabled = this._ruleTypeSelection[key];
                }
              });
            }
            return recipe;
          })
        );
    }

    return recipeObs;
  }

  getSelectedRuleTypes(): string[] {
    const selectedRuleTypes: string[] = [];
    this.ruleTypesMap.forEach(ruleType => {
      if (ruleType.enabled) {
        selectedRuleTypes.push(ruleType.name);
      }
    });
    return selectedRuleTypes;
  }

  protected onRuleTypeChange(ruleType: RuleType) {
    // console.log(this.ruleTypesMap);
    this.rulesRecheck();
  }

  protected rulesRecheck() {
    this.validateData();
    this.selectedColumn = null;
    this.selectedRow = null;
  }

  public onSelectDeselectRuleTypes(selected: boolean) {
    this.ruleTypes.forEach(ruleType => ruleType.enabled = selected);
    this.rulesRecheck();
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
    if (this.dataSource === 'sample') {
      // "Sierra Leone"
      // - https://raw.githubusercontent.com/OCHA-DAP/tools-datacheck-validation/prod/pcodes/validation-schema-pcodes-sle.json
      // tslint:disable-next-line:max-line-length
      this._selectedRecipeUrl = 'https://raw.githubusercontent.com/OCHA-DAP/tools-datacheck-validation/prod/pcodes/validation-schema-pcodes-sle.json';
    } else {
      // "No country" - https://raw.githubusercontent.com/OCHA-DAP/tools-datacheck-validation/prod/basic-validation-schema.json
      this._selectedRecipeUrl = 'https://raw.githubusercontent.com/OCHA-DAP/tools-datacheck-validation/prod/basic-validation-schema.json';
    }
    this.hxlCheckError = null;
    this._selectedUrl = null;
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
    this.hxlCheckError = null;
    this.errorReport = null;
    this.errorsXY = {};
    this.errorList = [];
  }

  private updateColumnSelection(){
    this.tableJumpTo(this.selectedColumn, this.selectedRow);
    this.updateErrorList();
    this.updateErrorPopup();
  }

  reviewErrors() {
    this.selectedColumn = 0;
    this.selectedRow = undefined;
    this.updateColumnSelection();
  }

  incrementColumn(val: number) {
    this.selectedColumn += val;
    this.selectedRow = undefined;
    this.updateColumnSelection();
  }

  onTriggerCustomValidation() {
    if (this.customValidation) {
      this.customValidationList = this.savedCustomValidationList;
      this.rulesRecheck();
    } else {
      this.savedCustomValidationList = this.customValidationList;
      this.customValidationList = [];
      this.rulesRecheck();
    }
  }

  onAddNewCustomValidation() {
    this.customValidationList.push(new CustomValidationItem(null, null));
  }

  onRemoveCustomValidation(idx) {
    this.customValidationList.splice(idx, 1);
  }

  onCustomValidationTagChange(item: CustomValidationItem, event) {
    item.tag = event.target.value;
    this.rulesRecheck();
  }

  onFileUpload(file: File) {
    console.log(file);
    this.selectedFile = file;
    this.reloadDataAndValidate();
  }

  openModal(template: TemplateRef<any>) {
    const config = {
      animated: false
    };
    this.dataCheckDemoUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
      'https://docs.google.com/presentation/d/e/2PACX-1vQmqK3qgUchHmZ5YQ8M-ktJ0UccIDeBeuqAqjIAbZ2HIXfmZ5OdqFRb7A' +
      'M1YJI6N1vmimBAbOVa7QMe/embed?start=false&loop=false&delayms=3000');
    this.modalRef = this.modalService.show(template, config);
  }

  private generateShareURL() {
    const icp: ImportComponentPersistent = new ImportComponentPersistent();
    Object.keys(icp).map(key => {
      icp[key] = this[key];
    });
    const icpStr = JSON.stringify(icp);
    const icpEncStr = encodeURIComponent(icpStr)
      .replace(/\(/g, '%28')
      .replace(/\)/g, '%29');
    const shareURL = window.location + ';config=' + icpEncStr;
    this.shareURL = shareURL;
  }

  public setSelectionRange() {
    this.shareTextArea.nativeElement.setSelectionRange(0, 0);
    this.shareTextArea.nativeElement.setSelectionRange(0, this.shareTextArea.nativeElement.value.length);
  }
}
