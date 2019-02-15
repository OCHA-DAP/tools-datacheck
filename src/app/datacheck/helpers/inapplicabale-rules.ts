import { Pattern } from 'hxl-preview-ng-lib';

export class InapplicableRulesProcessor {

  static rulePropertiesToCheck = [
    {
      key1: '#valid_tag',
      key2: '#valid_correlation'
    }
  ];

  private inapplicableRules = [];

  private missingHashtags: string[] = [];
  private removedRuleNames = [];

  constructor(private report: any, private rules: any[], private dataHxlTags: string[]) {
    for (let i = 0; i < rules.length; i++) {
      const rule = rules[i];
      let matches = true;
      for (let k = 0; matches && k < InapplicableRulesProcessor.rulePropertiesToCheck.length; k++) {
        const element = InapplicableRulesProcessor.rulePropertiesToCheck[k];
        if (rule[element.key1] && this.matchesAnyColumn(rule[element.key1], dataHxlTags) && rule[element.key2]) {
          matches = this.matchesAnyColumn(rule[element.key2], dataHxlTags);
        }
      }
      if (!matches) {
        this.inapplicableRules.push(rule);
      }
    }
  }

  private matchesAnyColumn(pattern: string, dataHxlTags: string[]): boolean {
    for (let j = 0; j < dataHxlTags.length; j++) {
      const dataHxlTag = dataHxlTags[j];
      const matches = Pattern.matchPatternToColumn(pattern, dataHxlTag);
      if (matches) {
        return true;
      }
    }
    return false;
  }

  private filterFlatErrors(): any[] {
    const flatErrors = [];
    for (let i = 0; i < this.report.flatErrors.length; i++) {
      const err = this.report.flatErrors[i];
      let matches = false;
      for (let j = 0; !matches && j < this.inapplicableRules.length; j++) {
        const rule = this.inapplicableRules[j];
        matches = rule['#description'] === err.type && Pattern.matchPatternToColumn(rule['#valid_tag'], err.hashtag);
        if (matches && !this.missingHashtags.includes(rule['#valid_correlation'])) {
          this.missingHashtags.push(rule['#valid_correlation']);
        }
        if (matches && !this.removedRuleNames.includes(rule['#description'])) {
          this.removedRuleNames.push(rule['#description']);
        }
      }
      if (!matches) {
        flatErrors.push(err);
      }
    }
    return flatErrors;
  }

  private filterIssues(): any[] {
    const issues = [];
    for (let i = 0; i < this.report.issues.length; i++) {
      const issue = this.report.issues[i];
      const clonedIssue = JSON.parse(JSON.stringify(issue));
      clonedIssue.locations = [];
      for (let k = 0; k < issue.locations.length; k++) {
        const err = issue.locations[k];
        let matches = false;
        for (let j = 0; !matches && j < this.inapplicableRules.length; j++) {
          const rule = this.inapplicableRules[j];
          matches =
            rule['#description'] === err.type && Pattern.matchPatternToColumn(rule['#valid_tag'], err.hashtag);
        }
        if (!matches) {
          clonedIssue.locations.push(err);
        }
      }
      if (clonedIssue.locations.length > 0) {
        issues.push(clonedIssue);
      }
    }
    return issues;
  }

  private generateError(type: string) {
    const missingHashtags = this.missingHashtags.join(', ');
    return {
      type: type,
      fake: true
    };
  }

  private generateIssue() {
    const missingHashtags = this.missingHashtags.join(', ');
    const regex = /\[[a-z]\]/;
    const groupCodes = [];
    for (let i = 0; i < this.removedRuleNames.length; i++) {
      const regexMatch = regex.exec(this.removedRuleNames[i]);
      if (regexMatch.length > 0) {
        const groupCode = regexMatch[0];
        if (!groupCodes.includes(groupCode)) {
          groupCodes.push(groupCode);
        }
      }
    }
    const groupCodesString = groupCodes.join(', ');
    const description
        = `Some rules of type ${groupCodesString} could not be applied because of missing HXL tags: ${missingHashtags}`;
    return {
      description: description,
      locations: [this.generateError(description)]
    };
  }

  private _generateNewReport(): any {
    const flatErrors = this.filterFlatErrors();
    const issues = this.filterIssues();
    const newReport = {
      flatErrors: flatErrors,
      issues: issues,
      stats: {}
    };

    newReport.stats['total'] = newReport.flatErrors.length;
    if (this.missingHashtags.length > 0) {
      newReport.issues.splice(0, 0, this.generateIssue());
    }

    return newReport;
  }

  public generateNewReport(): any {
    if (this.inapplicableRules.length === 0) {
      return this.report;
    } else {
      return this._generateNewReport();
    }
  }


}
