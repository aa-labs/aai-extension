import * as vscode from 'vscode';
import { SuggestionsService } from './suggestion-service';
import { SuggestionsTreeProvider } from './suggestions-tree-provider';
import { Folder, Suggestion, SuggestionType } from './types';
import {
  BAAI_APPLY_SUGGESTION_COMMAND_ID,
  BAAI_BATCHING_SUGGESTIONS_VIEW_ID,
  BAAI_INTEGRATION_SUGGESTIONS_VIEW_ID,
  BAAI_OPEN_FILE_COMMAND_ID,
  BAAI_PRODUCT_SUGGESTIONS_VIEW_ID,
  BAAI_REFRESH_COMMAND_ID,
} from './identifier';
import { CodeLensProvider } from './code-lens-provider';
import { HoverProvider } from './hover-provider';

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

  const rootFolder = new Folder(rootPath, null);
  const suggestionService = new SuggestionsService(rootPath);
  const migrationTreeProvider = new SuggestionsTreeProvider(
    rootPath,
    suggestionService,
    SuggestionType.migration
  );
  const batchingTreeProvider = new SuggestionsTreeProvider(
    rootPath,
    suggestionService,
    SuggestionType.batching
  );
  const productTreeProvider = new SuggestionsTreeProvider(
    rootPath,
    suggestionService,
    SuggestionType.product
  );

  const generateSuggestions = () => {
    suggestionService
      .buildFolderStructureAndGenerateSuggestions(rootFolder)
      .then(() => {
        migrationTreeProvider.refresh();
        batchingTreeProvider.refresh();
        productTreeProvider.refresh();
      })
      .catch((e) => {
        console.error(`Error generating suggestions: ${e}`);
      });
  };

  vscode.window.registerTreeDataProvider(
    BAAI_INTEGRATION_SUGGESTIONS_VIEW_ID,
    migrationTreeProvider
  );
  vscode.window.registerTreeDataProvider(BAAI_BATCHING_SUGGESTIONS_VIEW_ID, batchingTreeProvider);
  vscode.window.registerTreeDataProvider(BAAI_PRODUCT_SUGGESTIONS_VIEW_ID, productTreeProvider);
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
      new CodeLensProvider(suggestionService)
    )
  );
  context.subscriptions.push(
    vscode.commands.registerCommand(BAAI_APPLY_SUGGESTION_COMMAND_ID, (suggestion: Suggestion) => {
      vscode.window
        .showInformationMessage(suggestion.suggestion, 'Visit the documentation')
        .then((option) => {
          vscode.env.openExternal(vscode.Uri.parse(suggestion.documentationLink));
        });
    })
  );
  context.subscriptions.push(
    vscode.languages.registerHoverProvider(
      {
        scheme: 'file',
      },
      new HoverProvider(suggestionService)
    )
  );
}

// This method is called when your extension is deactivated
export function deactivate() {}
