import * as vscode from 'vscode';

import { FileItem, FolderItem, MigrationSuggestionItem } from './types';
import type { Item } from './types';
import { SuggestionsService } from '../suggestion-service';

export class IntegrationSuggestionsTreeProvider implements vscode.TreeDataProvider<Item> {
  private _onDidChangeTreeData: vscode.EventEmitter<Item | undefined | null | void> =
    new vscode.EventEmitter<Item | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<Item | undefined | null | void> =
    this._onDidChangeTreeData.event;

  constructor(
    private workspaceRoot: string,
    private readonly suggestionService: SuggestionsService
  ) {}

  getTreeItem(element: Item): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: Item): Promise<Item[]> {
    if (!this.workspaceRoot) {
      vscode.window.showInformationMessage('No files in empty workspace');
      return Promise.resolve([]);
    }

    if (!element) {
      const rootFolder = this.suggestionService.folderPathToFolderMap.get(this.workspaceRoot);
      return rootFolder ? this.getChildrenForFolder(new FolderItem(rootFolder)) : [];
    }

    if (element instanceof FolderItem) {
      return this.getChildrenForFolder(element);
    } else if (element instanceof FileItem) {
      return this.getChilderForFile(element);
    } else if (element instanceof MigrationSuggestionItem) {
      return this.getChildrenForSuggestion(element);
    }

    return [];
  }

  refresh(): void {
    console.log('calling refresh on integration suggestions tree provider');
    this._onDidChangeTreeData.fire();
  }

  private getChilderForFile(fileItem: FileItem): Item[] {
    return fileItem.file.suggestions.map((suggestion) => new MigrationSuggestionItem(suggestion));
  }

  private getChildrenForFolder(folderItem: FolderItem): Item[] {
    const folder = folderItem.folder;
    const folders = folder.folders.map((folder) => new FolderItem(folder));
    const files = folder.files.map((file) => new FileItem(file));
    return [...folders, ...files];
  }

  private getChildrenForSuggestion(suggestionItem: MigrationSuggestionItem): Item[] {
    return [];
  }
}
