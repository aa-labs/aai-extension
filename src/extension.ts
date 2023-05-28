import * as vscode from 'vscode';
import { SuggestionsService } from './integration-suggestions/suggestion-service';
import { IntegrationSuggestionsTreeProvider } from './integration-suggestions/integration-suggestions-tree-provider';
import { Folder, MigrationSuggestion } from './integration-suggestions/types';
import {
  BAAI_APPLY_SUGGESTION_COMMAND_ID,
  BAAI_INTEGRATION_SUGGESTIONS_VIEW_ID,
  BAAI_OPEN_FILE_COMMAND_ID,
  BAAI_REFRESH_COMMAND_ID,
} from './identifier';
import { IntegrationSuggestionsCodeLensProvider } from './integration-suggestions/code-lens-provider';

export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "baai" is now active!');

  const languageSelector = [
    { language: 'javascript' },
    { language: 'typescript' },
    { language: 'typescriptreact' },
    { language: 'javascriptreact' },
  ];

  const rootPath =
    vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0
      ? vscode.workspace.workspaceFolders[0].uri.fsPath
      : undefined;

  if (!rootPath) {
    throw new Error('No workspace root path');
  }

  // Integration Suggestions
  const rootFolder = new Folder(rootPath, null);
  const suggestionService = new SuggestionsService(rootPath);
  const provider = new IntegrationSuggestionsTreeProvider(rootPath, suggestionService);

  const generateSuggestions = () => {
    suggestionService
      .buildFolderStructureAndGenerateSuggestions(rootFolder)
      .then(() => {
        provider.refresh();
      })
      .catch((e) => {
        console.error(`Error generating suggestions: ${e}`);
      });
  };

  vscode.window.registerTreeDataProvider(BAAI_INTEGRATION_SUGGESTIONS_VIEW_ID, provider);
  context.subscriptions.push(
    vscode.commands.registerCommand(BAAI_REFRESH_COMMAND_ID, () => generateSuggestions())
  );
  context.subscriptions.push(
    vscode.commands.registerCommand(
      BAAI_OPEN_FILE_COMMAND_ID,
      (filePath: string, lineNumber: number) => {
        const uri = vscode.Uri.file(filePath);
        const options: vscode.TextDocumentShowOptions = {
          selection: new vscode.Range(lineNumber, 0, lineNumber, 0),
        };
        vscode.workspace.openTextDocument(uri).then((doc) => {
          vscode.window.showTextDocument(doc, options);
        });
      }
    )
  );
  context.subscriptions.push(
    vscode.languages.registerCodeLensProvider(
      languageSelector,
      new IntegrationSuggestionsCodeLensProvider(suggestionService)
    )
  );
  context.subscriptions.push(
    vscode.commands.registerCommand(
      BAAI_APPLY_SUGGESTION_COMMAND_ID,
      (suggestion: MigrationSuggestion) => {
        vscode.window
          .showInformationMessage(suggestion.suggestion, 'Visit the documentation')
          .then((option) => {
            vscode.env.openExternal(vscode.Uri.parse(suggestion.documentationLink));
          });
      }
    )
  );
}

// This method is called when your extension is deactivated
export function deactivate() {}
