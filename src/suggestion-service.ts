import { readdir, lstat } from 'node:fs/promises';
import ignore, { Ignore } from 'ignore';
import type { Stats } from 'fs';
import * as path from 'path';
import * as fs from 'fs';

import { File, Folder, MigrationSuggestion } from './integration-suggestions/types';

export class SuggestionsService {
  private readonly staticFilters = [
    '.git',
    '.vscode',
    'node_modules',
    '*.json',
    '*.lock',
    '*.md',
    '.gitignore',
  ];
  private readonly ig: Ignore;
  private readonly filter: (pathname: string) => boolean;

  public filePathToFileMap: Map<string, File> = new Map();
  public folderPathToFolderMap: Map<string, Folder> = new Map();

  public count = 0;

  constructor(private readonly workspaceRoot: string) {
    try {
      const rules = fs
        .readFileSync(path.join(this.workspaceRoot, '.gitignore'), 'utf-8')
        .split('\n');
      this.ig = ignore().add(rules).add(this.staticFilters);
    } catch (e) {
      console.error(`Error reading .gitignore: ${e}`);
      this.ig = ignore();
    }

    this.filter = this.ig.createFilter();
  }

  async buildFolderStructureAndGenerateSuggestions(folder: Folder): Promise<number> {
    console.log(`Building folder structure for ${folder.folderPath}`);

    this.folderPathToFolderMap.set(folder.folderPath, folder);

    const items = await readdir(folder.folderPath);
    const paths = items.filter(this.filter).map((item) => path.join(folder.folderPath, item));
    const stats: [string, Stats][] = await Promise.all(
      paths.map(async (item) => [item, await lstat(item)])
    );

    folder.files = stats
      .filter(([, stat]) => stat.isFile())
      .map(([filePath]) => new File(filePath, folder));
    folder.folders = stats
      .filter(([, stat]) => stat.isDirectory())
      .map(([folderPath]) => new Folder(folderPath, folder));

    // Generate suggestions for the files
    for (const file of folder.files) {
      this.filePathToFileMap.set(file.filePath, file);
      file.suggestions = await this.fetchSuggestionsForFile(file);
      folder.totalSuggestions += file.suggestions.length;
    }

    // Create the folder objects and recurse
    for (const childFolder of folder.folders) {
      folder.totalSuggestions += await this.buildFolderStructureAndGenerateSuggestions(childFolder);
    }

    return folder.totalSuggestions;
  }

  private async fetchSuggestionsForFile(file: File): Promise<MigrationSuggestion[]> {
    ++this.count;

    const suggestions: MigrationSuggestion[] = new Array(this.count)
      .fill(0)
      .map(
        (_, i) =>
          new MigrationSuggestion(
            file,
            (i + 1) * 5,
            "Converting from Ethers to Biconomy SDK involves replacing the Ethers transaction calls with the Biconomy SDK's sendTx method, which facilitates gasless transactions and enhances user experience on Ethereum-based DApps"
          )
      );

    return await new Promise((resolve) => {
      setTimeout(() => {
        resolve(suggestions);
      }, 500);
    });
  }
}
