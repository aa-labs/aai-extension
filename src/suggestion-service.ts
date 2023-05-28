import { readdir, lstat } from 'node:fs/promises';
import ignore, { Ignore } from 'ignore';
import type { Stats } from 'fs';
import * as path from 'path';
import * as fs from 'fs';

import { File, Folder, Suggestion, SuggestionType } from './types';

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

  async buildFolderStructureAndGenerateSuggestions(
    folder: Folder
  ): Promise<typeof folder.totalSuggestions> {
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
      for (const suggestion of file.suggestions) {
        folder.totalSuggestions[suggestion.suggestionType] += 1;
      }
    }

    // Create the folder objects and recurse
    for (const childFolder of folder.folders) {
      const totalSuggestions = await this.buildFolderStructureAndGenerateSuggestions(childFolder);
      folder.totalSuggestions[SuggestionType.migration] +=
        totalSuggestions[SuggestionType.migration];
      folder.totalSuggestions[SuggestionType.batching] += totalSuggestions[SuggestionType.batching];
      folder.totalSuggestions[SuggestionType.product] += totalSuggestions[SuggestionType.product];
    }

    return folder.totalSuggestions;
  }

  private async fetchSuggestionsForFile(file: File): Promise<Suggestion[]> {
    ++this.count;

    const suggestions: Suggestion[] = new Array(this.count).fill(0).map(
      (_, i) =>
        new Suggestion(
          file,
          (i + 1) * 5,
          "Converting from Ethers to Biconomy SDK involves replacing the Ethers transaction calls with the Biconomy SDK's sendTx method, which facilitates gasless transactions and enhances user experience on Ethereum-based DApps",
          `// Initialize the Smart Account
           // All values are optional except networkConfig only in the case of gasless dappAPIKey is required
            let options = {
              activeNetworkId: ChainId.GOERLI,
              supportedNetworksIds: [ChainId.GOERLI, ChainId.POLYGON_MAINNET, ChainId.POLYGON_MUMBAI],
              networkConfig: [
                {
                  chainId: ChainId.POLYGON_MUMBAI,
                  // Dapp API Key you will get from new Biconomy dashboard that will be live soon
                  // Meanwhile you can use the test dapp api key mentioned above
                  dappAPIKey: <DAPP_API_KEY>,
                  providerUrl: <YOUR_PROVIDER_URL>
                },
                {
                  chainId: ChainId.POLYGON_MAINNET,
                  // Dapp API Key you will get from new Biconomy dashboard that will be live soon
                  // Meanwhile you can use the test dapp api key mentioned above
                  dappAPIKey: <DAPP_API_KEY>,
                  providerUrl: <YOUR_PROVIDER_URL>
                }
              ]
            } 
            
            // this provider is from the social login which we created in previous setup
            let smartAccount = new SmartAccount(provider, options);
            smartAccount = await smartAccount.init();
          `,
          SuggestionType.migration
        )
    );

    suggestions.push(
      new Suggestion(
        file,
        25,
        'Approve and Swap can be batched together to save gas',
        'NA',
        SuggestionType.batching
      )
    );

    suggestions.push(
      new Suggestion(file, 30, 'Social login makes sense here', 'NA', SuggestionType.product)
    );

    return await new Promise((resolve) => {
      setTimeout(() => {
        resolve(suggestions);
      }, 500);
    });
  }
}
