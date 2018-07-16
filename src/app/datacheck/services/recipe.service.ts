import { throwError as observableThrowError,  Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { HxlproxyService, PostParam } from './hxlproxy.service';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export const RULE_TYPE_TAG = '#rule_type';
export const RULE_TYPE_DESCRIPTION_TAG = '#rule_type_description';
@Injectable()
export class RecipeService {

  constructor(private httpClient: HttpClient, private hxlProxyService: HxlproxyService) { }

  public fetchRecipeTemplate(url): Observable<any[]> {
    return this.httpClient.get(url).pipe(catchError(err => this.handleError(err)));
  }

  public extractListOfTypes(recipe: any[]): Map<string, RuleType> {
    const types: Map<string, RuleType> = new Map<string, RuleType>();
    for (let i = 0; i < recipe.length; i++) {
      const validationRule = recipe[i];
      const name: string = validationRule[RULE_TYPE_TAG];
      let description: string = validationRule[RULE_TYPE_DESCRIPTION_TAG];
      if (name && name.trim()) {
        description = description && description.trim() ? description : null;
        let ruleType = types.get(name);
        if (!ruleType) {
          ruleType = new RuleType(name, true, description);
          types.set(name, ruleType);
        } else if (description) {
          ruleType.description = description;
        }
      }
    }
    return types;
  }

  public validateData(selectedUrl: string, selectedFile: File, recipeTemplate: string,
                  recipeParams?: { [s: string]: string; }): Observable<any> {

    const params = [];
    const postParams: PostParam[] = [
      {
        key: 'schema_content',
        value: recipeTemplate,
        type: 'json-as-file'
      },
      {
        key: 'include_dataset',
        value: 'true',
        type: 'text'
      }
    ];
    if (selectedFile) {
      postParams.push({
          key: 'content',
          value: selectedFile,
          type: 'file'
      });
    } else if (selectedUrl) {
      postParams.push({
        key: 'url',
        value: selectedUrl,
        type: 'text'
      });
    }
    const validationResult = this.hxlProxyService.makeValidationCall(params, postParams);
    return validationResult;
  }

  private handleError (error: any, errorHandler?: () => Observable<any>) {
    let errMsg: string;
    if (error.error && error.status != null) {
      errMsg = `${error.status} - ${error.statusText || ''} ${error.error || error}`;
    } else {
      errMsg = error.message ? error.message : error.toString();
    }
    console.error('ERR! ' + errMsg);
    const retValue = errorHandler ? errorHandler() : observableThrowError(errMsg);
    return retValue;
  }
}

export class RuleType {
  constructor(public name: string, public enabled: boolean, public description) {}
}
