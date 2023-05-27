import * as vscode from 'vscode';
import { SuggestionsService } from './integration-suggestions/suggestion-service';
import { IntegrationSuggestionsTreeProvider } from './integration-suggestions/integration-suggestions-tree-provider';
import { Folder } from './integration-suggestions/types';
import { BAAI_INTEGRATION_SUGGESTIONS_VIEW_ID, BAAI_REFRESH_COMMAND_ID } from './identifier';

export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "baai" is now active!');

  const rootPath =
    vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0
      ? vscode.workspace.workspaceFolders[0].uri.fsPath
      : undefined;

  if (!rootPath) {
    throw new Error('No workspace root path');
  }

  const rootFolder = new Folder(rootPath, null);
  const suggestionService = new SuggestionsService(rootPath);
  const provider = new IntegrationSuggestionsTreeProvider(rootPath, suggestionService);

  const generateSuggestions = () => {
    suggestionService.buildFolderStructureAndGenerateSuggestions(rootFolder).then(() => {
      provider.refresh();
    });
  };

  vscode.window.registerTreeDataProvider(BAAI_INTEGRATION_SUGGESTIONS_VIEW_ID, provider);
  context.subscriptions.push(
    vscode.commands.registerCommand(BAAI_REFRESH_COMMAND_ID, () => generateSuggestions())
  );
  context.subscriptions.push(
    vscode.commands.registerCommand('baai.openFile', (filePath: string, lineNumber: number) => {
      const uri = vscode.Uri.file(filePath);
      const options: vscode.TextDocumentShowOptions = {
        selection: new vscode.Range(lineNumber, 0, lineNumber, 0),
      };

      vscode.workspace.openTextDocument(uri).then((doc) => {
        vscode.window.showTextDocument(doc, options);
      });
    })
  );

  generateSuggestions();
}

// This method is called when your extension is deactivated
export function deactivate() {}
