import * as vscode from 'vscode';

import { FileItem, FolderItem, SuggestionItem, SuggestionType } from './types';
import type { IntegrationTreeViewItem } from './types';
import { SuggestionsService } from './suggestion-service';

export class SuggestionsTreeProvider implements vscode.TreeDataProvider<IntegrationTreeViewItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<
    IntegrationTreeViewItem | undefined | null | void
  > = new vscode.EventEmitter<IntegrationTreeViewItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<IntegrationTreeViewItem | undefined | null | void> =
    this._onDidChangeTreeData.event;

  constructor(
    private workspaceRoot: string,
    private readonly suggestionService: SuggestionsService,
    public readonly suggestionType: SuggestionType
  ) {}

  getTreeItem(element: IntegrationTreeViewItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: IntegrationTreeViewItem): Promise<IntegrationTreeViewItem[]> {
    if (!this.workspaceRoot) {
      vscode.window.showInformationMessage('No files in empty workspace');
      return Promise.resolve([]);
    }

    if (!element) {
      const rootFolder = this.suggestionService.folderPathToFolderMap.get(this.workspaceRoot);
      return rootFolder
        ? this.getChildrenForFolder(new FolderItem(rootFolder, this.suggestionType))
        : [];
    }

    if (element instanceof FolderItem) {
      return this.getChildrenForFolder(element);
    } else if (element instanceof FileItem) {
      return this.getChilderForFile(element);
    } else if (element instanceof SuggestionItem) {
      return this.getChildrenForSuggestion(element);
    }

    return [];
  }

  refresh(): void {
    console.log('calling refresh on integration suggestions tree provider');
    this._onDidChangeTreeData.fire();
  }

  private getChilderForFile(fileItem: FileItem): IntegrationTreeViewItem[] {
    return fileItem.file.suggestions
      .filter((suggestion) => suggestion.suggestionType === this.suggestionType)
      .map((suggestion) => new SuggestionItem(suggestion));
  }

  private getChildrenForFolder(folderItem: FolderItem): IntegrationTreeViewItem[] {
    const folder = folderItem.folder;

    const folders = folder.folders
      .filter((folder) => folder.totalSuggestions[this.suggestionType] > 0)
      .map((folder) => new FolderItem(folder, this.suggestionType));

    const files = folder.files
      .filter(
        (file) =>
          file.suggestions.filter((suggestion) => suggestion.suggestionType === this.suggestionType)
            .length > 0
      )
      .map((file) => new FileItem(file, this.suggestionType));
    return [...folders, ...files];
  }

  private getChildrenForSuggestion(suggestionItem: SuggestionItem): IntegrationTreeViewItem[] {
    return [];
  }
}
