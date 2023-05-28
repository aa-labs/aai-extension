import * as vscode from 'vscode';
import type { SuggestionsService } from './suggestion-service';
import { BAAI_APPLY_SUGGESTION_COMMAND_ID } from './identifier';
import { Suggestion } from './types';

export class CodeLensProvider implements vscode.CodeLensProvider {
  constructor(private readonly suggestionService: SuggestionsService) {}

  public provideCodeLenses(
    document: vscode.TextDocument,
    token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.CodeLens[]> {
    const file = this.suggestionService.filePathToFileMap.get(document.fileName);
    if (!file) {
      return [];
    }

    return file.suggestions.map((suggestion) => {
      const line = document.lineAt(suggestion.lineNumber);
      const range = new vscode.Range(line.range.start, line.range.end);
      return new vscode.CodeLens(range, {
        title: `🟠 BSDK ${suggestion.suggestionType} Hint 🟠`,
        command: BAAI_APPLY_SUGGESTION_COMMAND_ID,
        arguments: [suggestion],
      });
    });
  }
}
