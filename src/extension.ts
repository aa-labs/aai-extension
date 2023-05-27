import * as vscode from 'vscode';
import { SuggestionsService } from './integration-suggestions/suggestion-service';
import { IntegrationSuggestionsTreeProvider } from './integration-suggestions/integration-suggestions-tree-provider';
import { Folder } from './integration-suggestions/types';

const BAAI_VIEW_CONTAINER_ID = 'baai-view-container';
const BAAI_INTEGRATION_SUGGESTIONS_VIEW_ID = 'baai-integration-view';

export function activate(context: vscode.ExtensionContext) {
  console.log('Congratulations, your extension "baai" is now active!');

  const rootPath =
    vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0
      ? vscode.workspace.workspaceFolders[0].uri.fsPath
      : undefined;

  if (!rootPath) {
    throw new Error('No workspace root path');
  }

  const suggestionService = new SuggestionsService(rootPath);

  vscode.window.registerTreeDataProvider(
    BAAI_INTEGRATION_SUGGESTIONS_VIEW_ID,
    new IntegrationSuggestionsTreeProvider(rootPath, suggestionService)
  );

  suggestionService.buildFolderStructureAndGenerateSuggestions(new Folder(rootPath, null));
}

// This method is called when your extension is deactivated
export function deactivate() {}
