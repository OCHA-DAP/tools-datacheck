import { HxlproxyService } from './hxlproxy.service';
import { Observable } from 'rxjs/Observable';
import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';

@Injectable()
export class RecipeService {

  constructor(private http: Http, private hxlProxyService: HxlproxyService) { }

  public fetchRecipeTemplate(url): Observable<any[]> {
    return this.http.get(url).map( response => response.json()).catch(err => this.handleError(err));
  }

  public extractListOfTypes(recipe: any[]): Set<RuleType> {
    const types: Set<RuleType> = new Set();
    for (let i = 0; i < recipe.length; i++) {
      const validationRule = recipe[i];
      const ruleType = new RuleType(validationRule['#description'], true);
      types.add(ruleType);
    }
    return types;
  }

  public validateData(selectedUrl: string, recipeTemplate: string,
                  recipeParams?: { [s: string]: string; }): Observable<any> {

    const url = selectedUrl;
    // const schemaUrl = this.selectedRecipeUrl;
    const params = [
      {
        key: 'url',
        value: url
      }
    ];
    const postParams = [
      {
        key: 'schema_content',
        value: recipeTemplate
      }
    ];
    const validationResult = this.hxlProxyService.makeValidationCall(params, postParams);
    return validationResult;
  }

  private handleError (error: Response | any, errorHandler?: () => Observable<any>) {
    let errMsg: string;
    if (error instanceof Response) {
      try {
        const body = error.json() || '';
        const err = body.error || JSON.stringify(body);
        errMsg = `${error.status} - ${error.statusText || ''} ${err}`;
      } catch (e) {
        errMsg = e.toString();
      }
    } else {
      errMsg = error.message ? error.message : error.toString();
    }
    console.error('ERR! ' + errMsg);
    const retValue = errorHandler ? errorHandler() : Observable.throw(errMsg);
    return retValue;
  }

}

export class RuleType {
  constructor(public name: string, public enabled: boolean) {}
}
