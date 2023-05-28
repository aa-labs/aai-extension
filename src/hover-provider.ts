import * as vscode from 'vscode';
import type { SuggestionsService } from './suggestion-service';

export class HoverProvider implements vscode.HoverProvider {
  constructor(private readonly suggestionService: SuggestionsService) {}

  public provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.Hover> {
    const file = this.suggestionService.filePathToFileMap.get(document.fileName);
    if (!file) {
      return null;
    }
    const lineNumber = position.line;
    const suggestion = file.suggestions.find((suggestion) => suggestion.lineNumber === lineNumber);
    if (!suggestion) {
      return null;
    }

    const markdown = new vscode.MarkdownString();
    markdown.isTrusted = true;
    markdown.appendMarkdown(suggestion.suggestion);
    // Show the documentation link
    markdown.appendMarkdown('\n\n[Visit the Documentation](' + suggestion.documentationLink + ')');
    markdown.appendCodeblock(suggestion.codeBlock, 'typescript');
    return new vscode.Hover(markdown);
  }
}
