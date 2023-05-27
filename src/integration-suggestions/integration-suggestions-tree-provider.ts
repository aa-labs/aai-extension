import * as vscode from 'vscode';

import { FileItem, FolderItem, MigrationSuggestionItem } from './types';
import type { Item } from './types';
import { SuggestionsService } from './suggestion-service';

export class IntegrationSuggestionsTreeProvider implements vscode.TreeDataProvider<Item> {
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
      return [];
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

  getChilderForFile(fileItem: FileItem): Item[] {
    return fileItem.file.suggestions.map((suggestion) => new MigrationSuggestionItem(suggestion));
  }

  getChildrenForFolder(folderItem: FolderItem): Item[] {
    const folder = folderItem.folder;
    const folders = folder.folders.map((folder) => new FolderItem(folder));
    const files = folder.files.map((file) => new FileItem(file));
    return [...folders, ...files];
  }

  getChildrenForSuggestion(suggestionItem: MigrationSuggestionItem): Item[] {
    return [];
  }
}
