import * as vscode from 'vscode';
import * as path from 'path';

export class MigrationSuggestion {
  constructor(public readonly lineNumber: number, public readonly suggestion: string) {}
}

export class Folder {
  public totalSuggestions: number = 0;
  public folders: Folder[] = [];
  public files: File[] = [];

  constructor(public readonly folderPath: string, public readonly parent: Folder | null) {}
}

export class File {
  public suggestions: MigrationSuggestion[] = [];

  constructor(public readonly filePath: string, public readonly parent: Folder) {}
}

export class FolderItem extends vscode.TreeItem {
  constructor(public readonly folder: Folder) {
    const label = path.basename(folder.folderPath);

    super(label, vscode.TreeItemCollapsibleState.Collapsed);
    this.description = this.folder.totalSuggestions.toString();
  }

  iconPath = {
    light: path.join(__filename, '..', '..', 'resources', 'light', 'folder.svg'),
    dark: path.join(__filename, '..', '..', 'resources', 'dark', 'folder.svg'),
  };
}

export class FileItem extends vscode.TreeItem {
  constructor(public readonly file: File) {
    const label = path.basename(file.filePath);
    super(label, vscode.TreeItemCollapsibleState.Collapsed);
    this.description = this.file.suggestions.length.toString();
  }

  iconPath = {
    light: path.join(__filename, '..', '..', 'resources', 'light', 'document.svg'),
    dark: path.join(__filename, '..', '..', 'resources', 'dark', 'document.svg'),
  };
}

export class MigrationSuggestionItem extends vscode.TreeItem {
  constructor(public readonly suggestion: MigrationSuggestion) {
    super(suggestion.suggestion, vscode.TreeItemCollapsibleState.None);
    this.description = `Line ${suggestion.lineNumber}`;
  }

  iconPath = {
    light: path.join(__filename, '..', '..', 'resources', 'light', 'edit.svg'),
    dark: path.join(__filename, '..', '..', 'resources', 'dark', 'edit.svg'),
  };
}

export type Item = FolderItem | FileItem | MigrationSuggestionItem;