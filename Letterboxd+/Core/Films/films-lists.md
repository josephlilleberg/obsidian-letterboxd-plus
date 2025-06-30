---
sortOption: Entries
sortOrder: asc
filterSearchQuery: ""
cssclasses:
  - hidefilename
  - letterboxd
  - wide-page
---

<!-- Note Toolbar -->
```js-engine
function convertFilePathToObsidianUri(filePath) {
    const vaultName = app.vault.getName();
    const encodedVault = encodeURIComponent(vaultName);
    const encodedFilePath = encodeURIComponent(filePath);
    return `obsidian://open?vault=${encodedVault}&file=${encodedFilePath}`;
}

function getParentPath(fullPath, targetFolder) {
    const index = fullPath.indexOf(targetFolder);
    if (index === -1) return null; // Target folder not found

    const subPath = fullPath.substring(0, index + targetFolder.length);
    return subPath;
}

const filePath = context.file.path;
const basePath = getParentPath(filePath, 'Letterboxd+');
const filmsBasePath = `${basePath}/Core/Films/`;
const seriesBasePath = `${basePath}/Core/Series/`;

// Pages: Films
const filmPages = ['profile', 'films', 'diary', 'watchlist', 'lists']

const filmsUris = Object.fromEntries(
    filmPages.map(page => [page, convertFilePathToObsidianUri(`${filmsBasePath}films-${page}.md`)])
);

// Pages: Series
const seriesPages = ['profile']

const seriesUris = Object.fromEntries(
    seriesPages.map(page => [page, convertFilePathToObsidianUri(`${seriesBasePath}series-${page}.md`)])
);

// Mobile
const isMobile = app.isMobile;

// Rewatch: Toggle
if (isMobile) {
    return engine.markdown.create(`
> [!note-toolbar|button-center-border]
> - [:LiCircleUser:](${filmsUris['profile']})
> - [:LiBookMarked:](${filmsUris['diary']})
> - [:LiList:]()
> - [:LiBookmark:](${filmsUris['watchlist']})
> - <hr/>
> - \`BUTTON[lists-button]\`
    `);
} else {
    return engine.markdown.create(`
> [!note-toolbar|button-center-border]
> - [:LiCircleUser: Profile](${filmsUris['profile']})
> - [:LiBookMarked: Diary](${filmsUris['diary']})
> - [:LiList: Lists]()
> - [:LiBookmark: Watchlist](${filmsUris['watchlist']})
> - <hr/>
> - \`BUTTON[lists-button]\`
    `);
}
```

# Lists

<br/>
<div class="divider"/>

<!-- Sorting -->
```meta-bind-js-view
{sortOption} as sortOption
---
// Sorting
const sorting = ['Activity', 'Title', 'Entries', 'Added']
const sortingOldestNewest = [['Oldest First', 'Newest First'], ["asc", "desc"]]
const sortingAlphaetical = [['A to Z', 'Z to A'], ["asc", "desc"]]
const sortingFewestMost = [['Fewest First', 'Most First'], ["asc", "desc"]]
const sortingEarliestLatest = [['Earliest First', 'Latest First'], ["asc", "desc"]]

const sortOptions = sorting.map(x => `option(${x})`).join(", ");
const sortingOldestNewestOptions = sortingOldestNewest[0]
    .map((x, i) => `option(${sortingOldestNewest[1][i]}, ${x})`) 
    .join(", ");
    
const sortingAlphaeticalOptions = sortingAlphaetical[0]
    .map((x, i) => `option(${sortingAlphaetical[1][i]}, ${x})`) 
    .join(", ");
    
const sortingFewestMostOptions = sortingFewestMost[0]
    .map((x, i) => `option(${sortingFewestMost[1][i]}, ${x})`) 
    .join(", ");

const sortingEarliestLatestOptions = sortingEarliestLatest[0]
    .map((x, i) => `option(${sortingEarliestLatest[1][i]}, ${x})`) 
    .join(", ");
    
let str = '';
if (context.bound.sortOption === 'Activity') {
    str = `\`INPUT[inlineSelect(${sortOptions}):sortOption]\` \`INPUT[inlineSelect(${sortingOldestNewestOptions}):sortOrder]\``
} else if (context.bound.sortOption === 'Title') {
    str = `\`INPUT[inlineSelect(${sortOptions}):sortOption]\` \`INPUT[inlineSelect(${sortingAlphaeticalOptions}):sortOrder]\``
} else if (context.bound.sortOption === 'Entries') {
    str = `\`INPUT[inlineSelect(${sortOptions}):sortOption]\` \`INPUT[inlineSelect(${sortingFewestMostOptions}):sortOrder]\``
} else if (context.bound.sortOption === 'Added') {
    str = `\`INPUT[inlineSelect(${sortOptions}):sortOption]\` \`INPUT[inlineSelect(${sortingEarliestLatestOptions}):sortOrder]\``
} 

return engine.markdown.create(str);
```

<!-- Query Search -->
`INPUT[text(placeholder(Search lists...)):filterSearchQuery]`

<!-- Display Show/Hidden Lists -->
```js-engine
const dv = engine.getPlugin("dataview")?.api;

function getParentPath(fullPath, targetFolder) {
    const index = fullPath.indexOf(targetFolder);
    if (index === -1) return null; // Target folder not found

    const subPath = fullPath.substring(0, index + targetFolder.length);
    return subPath;
}

const filePath = context.file.path;
const basePath = getParentPath(filePath, 'Letterboxd+');
const filmsBasePath = `${basePath}/Films`;
const filmsListsBasePath = `${basePath}/Core/Films/Lists`;

// Step 1: Initialize the listCount dictionary from list files
let listCount = {};
let listPages = dv.pages(`"${filmsListsBasePath}"`);
listPages.forEach(p => {
    if (p.title && !(p.title in listCount)) {
        listCount[p.title] = 0;
    }
});

// Step 2: Iterate over all film files and count list usage
let filmPages = dv.pages(`"${filmsBasePath}"`);
filmPages.forEach(p => {
    if (Array.isArray(p.lists)) {
        p.lists.forEach(list => {
            const title = list.title;
            if (title && title in listCount) {
                listCount[title]++;
            }
        });
    }
});

let shown = 0;
let hidden = 0;

for (const [title, count] of Object.entries(listCount)) {
    if (count > 0) {
        shown++;
    } else if (count === 0) {
        hidden++;
    }
}

let str = `\`VIEW[**Lists** · ${shown} shown · ${hidden} hidden][text(renderMarkdown)]\``

return engine.markdown.create(str);
```

<div class="divider"/>

<!-- Render Lists -->
```dataviewjs
function getObsidianURI(filePath) {
    const vaultName = app.vault.getName(); 
    const encodedFilePath = encodeURIComponent(filePath); // Encode file path

    return `obsidian://open?vault=${encodeURIComponent(vaultName)}&file=${encodedFilePath}`;
}

function sanitizeListName(str) {

  // Must start with alphanumeric
  if (!/^[a-zA-Z0-9]/.test(str)) {
    new Notice("Invalid name: must start with a letter or number.");
    return null;
  }

  // Normalize accents and strip diacritics
  str = str.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");

  // Convert to lowercase
  str = str.toLowerCase();

  // Replace illegal characters with space
  str = str.replace(/[/\\?%*:|"<>$\x00-\x1F]/g, ' ');

  // Collapse multiple spaces into a single hyphen
  str = str.trim().split(/\\s+/).join('-');

  // Reduce multiple hyphens to one
  str = str.replace(/-+/g, '-');

  // Trim leading/trailing hyphens
  str = str.replace(/^-+|-+$/g, '');

  return str;
}

function getParentPath(fullPath, targetFolder) {
    const index = fullPath.indexOf(targetFolder);
    if (index === -1) return null; // Target folder not found

    const subPath = fullPath.substring(0, index + targetFolder.length);
    return subPath;
}

const filePath = dv.current().file.path
const basePath = getParentPath(filePath, 'Letterboxd+')
const listFolderPath = `"${basePath}/Core/Films/Lists"`; 

// Build collections (poster arrays for each list)
let collections = {};

const films = dv.pages(`"${basePath}/Films"`);

films.forEach(s => {
    if (Array.isArray(s.lists)) {
        s.lists.forEach(list => {
            const listTitle = list.title?.toLowerCase(); // Normalize for consistent keys
            if (!listTitle) return;

            if (!collections[listTitle]) {
                collections[listTitle] = [];
            }
            collections[listTitle].push(s.poster);
        });
    }
});

// Metadata
const metadata = dv.current();

// Fetch list files
let pages = dv.pages(listFolderPath);

// Filter: Search Query
if (metadata.filterSearchQuery) {
    const query = metadata.filterSearchQuery.toLowerCase();
    pages = pages.filter(file => file.title.toLowerCase().includes(query));
}

// Sorting
const sortOrder = metadata.sortOrder;

console.log('pages: ', pages)
console.log('collections: ', collections)

if (metadata.sortOption === 'Activity') {
    pages = pages.sort(l => l.updated, sortOrder)
} else if (metadata.sortOption === 'Title') {
    pages = pages.sort(l => l.title, sortOrder)
} else if (metadata.sortOption === 'Entries') {
    pages = pages.filter(l => collections[l.title?.toLowerCase()]).sort(l => collections[l.title?.toLowerCase()].length, sortOrder)
} else if (metadata.sortOption === 'Added') {
    pages = pages.sort(l => l.created_on, sortOrder)
}

let listsTableDesktop = [];
let listsTableMobile = [];

pages.forEach(list => {


    const title = list.title?.toLowerCase()
    let posterUrls = collections[title] ? collections[title].reverse() : [];

    // Only show populated lists
    if (posterUrls.length === 0) {
        return;
    }

    // Fetch the first 5 poster urls
    let posterUrlsDesktop = posterUrls.slice(0, 5);
    let posterUrlsMobile = posterUrls.slice(0, 8);
    
    // Dynamically generate image elements
    if (posterUrlsDesktop.length > 0) {
        posterUrlsDesktop.unshift(posterUrlsDesktop[0]); // Prepend placeholder image
    }
    const imageElementsDesktop = posterUrlsDesktop.map(url => `<img src="${url}" alt="Poster">`).join('');
    const imageElementsMobile = posterUrlsMobile.map(url => `<img src="${url}" alt="Poster">`).join('');    

    const listFilePath = `${basePath}/Core/Films/Lists/${list.file.name}.md`
    const listObsidianURI = getObsidianURI(listFilePath)
    
    listsTableDesktop.push([
        `<a href="${listObsidianURI}" class="no-decoration">
            <div class="letterboxd-films-lists-item-container-desktop">
                <div class="letterboxd-films-lists-item-poster-container-desktop">
                    <div class="letterboxd-films-lists-item-poster-wrapper-desktop">
                        ${imageElementsDesktop}
                    </div>
                </div>
                <div class="letterboxd-films-lists-item-content-container-desktop">
                    <div class="letterboxd-films-lists-item-content-title-desktop no-decoration">${list.title}</div>
                    <div class="letterboxd-films-lists-item-content-details-desktop">${posterUrlsDesktop.length - 1} films</div>
                    <div class="letterboxd-films-lists-item-content-description-desktop"><span>${list.description ? list.description : ''}</span></div>
                </div>
            </div>
        </a>
        `
    ]);

    listsTableMobile.push([
        `<a href="${listObsidianURI}" class="no-decoration">
            <div class="letterboxd-films-lists-item-container-mobile">
                <div class="letterboxd-films-lists-item-content-mobile">
                    <div class="letterboxd-films-lists-item-content-title-mobile">${list.title}</div>
                    <div class="letterboxd-films-lists-item-content-count-mobile">${posterUrlsMobile.length - 1} films</div>
                </div>
                <div class="letterboxd-films-lists-item-posters-mobile">
                    ${imageElementsMobile}
                </div>
                <div class="letterboxd-films-lists-item-description-mobile">${list.description ? list.description : ''}</div>
            </div>
        </a>`
    ])

})

// Render the table
if (document.body.hasClass("is-mobile")) {
	dv.table([""], listsTableMobile);
} else {
	dv.table([""], listsTableDesktop);
}
```
---

<!-- Button: Lists -->
```js-engine
// First we get an instance of the Meta Bind plugin, then we access the API.
const mb = app.plugins.getPlugin('obsidian-meta-bind-plugin')?.api;

const label = app.isMobile ? '': 'Manage'

// We create the button. This will return something that inherits from `Mountable` and can be mounted to the DOM.
const button = mb.createButtonMountable(context.file.path, {
    // the button options
    declaration: {
        // the button config
        label: label,
        style: 'default',
        icon: 'cog',
        id: 'lists-button',
        hidden: true,
        action: {
            type: 'inlineJS',
            code: `
                (async () => {
                    function getFormattedLocalDate() {
                        let d = new Date();
                        return d.getFullYear() + '-' +
                               String(d.getMonth() + 1).padStart(2, '0') + '-' +
                               String(d.getDate()).padStart(2, '0') + 'T' +
                               String(d.getHours()).padStart(2, '0') + ':' +
                               String(d.getMinutes()).padStart(2, '0') + ':' +
                               String(d.getSeconds()).padStart(2, '0') + '.' +
                               String(d.getMilliseconds()).padStart(3, '0'); 
                    };

                    function sanitizeListName(str) {

                      // Must start with alphanumeric
                      if (!/^[a-zA-Z0-9]/.test(str)) {
                        new Notice("Invalid name: must start with a letter or number.");
                        return null;
                      }

                      // Normalize accents and strip diacritics
                      str = str.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");

                      // Convert to lowercase
                      str = str.toLowerCase();

                      // Replace illegal characters with space
                      str = str.replace(/[/\\?%*:|"<>$\x00-\x1F]/g, ' ');

                      // Collapse multiple spaces into a single hyphen
                      str = str.trim().split(/\\s+/).join('-');

                      // Reduce multiple hyphens to one
                      str = str.replace(/-+/g, '-');

                      // Trim leading/trailing hyphens
                      str = str.replace(/^-+|-+$/g, '');

                      return str;
                    }

                    const filePath = context.file.path;
                    const index = filePath.indexOf("Letterboxd+");

                    let basePath;
                    if (index !== -1) {
                        basePath = filePath.slice(0, index + "Letterboxd+".length);
                    } else {
                        new Notice("Path 'Letterboxd+' not found.");
                        return;
                    }

                    // --- Prompts ---
                    const listsOption = await engine.prompt.button({
                      title: 'Manage Lists',
                      content: 'Would you like to add, rename or remove lists?',
                      buttons: [
                          {
                              label: 'Add',
                              value: 'add',
                          },
                          {
                              label: 'Rename',
                              value: 'rename',
                          },
                          {
                              label: 'Remove',
                              value: 'remove',
                          },
                          {
                              label: 'Browse',
                              value: 'browse',
                          },
                          {
                              label: 'Cancel',
                              value: null,
                          }
                      ]
                    });

                    if (listsOption == 'add') {
                        const listName = await engine.prompt.text({
                            title: 'Please provide a list name.',
                            placeholder: 'List name...'
                        });

                        // Verify listName
                        if (!listName) {
                            new Notice('Error: Missing list name!')
                            return
                        }

                        // Second prompt
                        const listDescription = await engine.prompt.textarea({
                            title: 'Please provide a list description',
                            placeholder: 'List description...'
                        });

                         // ---  ---
                        const filmsListTemplatePath = basePath + "/Core/Templates/film-list-template.md";
                        const filmsListTemplateFile = await app.vault.getFileByPath(filmsListTemplatePath);
                        const newFilmsListPath = basePath + "/Core/Films/Lists/" + sanitizeListName(listName) + ".md"

                        // Create copy of films list template
                        await app.vault.copy(filmsListTemplateFile, newFilmsListPath)

                        // Fetch generated copy file
                        const newFilmsListFile = await app.vault.getFileByPath(newFilmsListPath);

                        // Update Frontmatter
                        const localDate = await getFormattedLocalDate()
                        await app.fileManager.processFrontMatter(newFilmsListFile, (fm) => {
                            fm['title'] = listName
                            fm['description'] = listDescription
                            fm['created_on'] = localDate
                            fm['updated'] = localDate
                        });

                        // Update Placeholder varaibles
                        await app.vault.process(newFilmsListFile, (content) => {
                            return content.replace(/{{film_list_title}}/g, listName);
                        });

                        new Notice(\`\${listName} successfully created!\`)

                        const leaf = app.workspace.getMostRecentLeaf()
                        await leaf.openFile(newFilmsListFile);
                        const view = leaf.view;
                        if (view?.setViewState) {
                          await view.setViewState({ ...view.getState(), mode: 'preview' });
                        }
                        
                        
                    } else if (listsOption == 'rename') {
                        filmsListsFolder = \`\${basePath}/Core/Films/Lists\`;
                        const filmsListFiles = app.vault.getFiles().filter(f => f.path.startsWith(filmsListsFolder + "/"));

                        const availableLists = filmsListFiles.map(file => {
                          const cache = app.metadataCache.getFileCache(file);
                          const fm = cache?.frontmatter;
                          const title = fm?.title ?? file.basename; // fallback to filename

                          return {
                            label: title,
                            value: file
                          };
                        });

                        const selectedListFile = await engine.prompt.suggester({
                          title: 'Rename List',
                          content: 'Which list would you like to rename?',
                          options: availableLists
                        });

                        if (!selectedListFile) {
                          new Notice("No list selected.");
                          return;
                        }

                        // Get Selected File's Frontmatter
                        const selectedFileFrontmatter = app.metadataCache.getFileCache(selectedListFile)?.frontmatter;
                          if (!selectedFileFrontmatter) {
                           return new Notice("No frontmatter found.");
                          }

                        // Ask for the new name
                        const newListName = await engine.prompt.text({
                          title: 'New List Name',
                          placeholder: 'Enter new name for the list'
                        });

                        if (!newListName) {
                          new Notice("No new name provided.");
                          return;
                        }

                        for (const list of availableLists) {
                            if (list.label == newListName) {
                                return new Notice('Conflict detected — list name already in use.')
                            }
                        }

                        await app.fileManager.processFrontMatter(selectedListFile, (fm) => {
                          fm.title = newListName;
                        });

                        const sanitized = sanitizeListName(newListName);
                        const newFilePath = \`\${filmsListsFolder}/\${sanitized}.md\`;

                        await app.vault.rename(selectedListFile, newFilePath);
                        new Notice(\`List renamed to "\${newListName}"\`);

                        // ───── Get All Series Files ─────
                        const filmsFolderPath = \`\${basePath}/Films\`;
                        const filmsFiles = app.vault.getFiles().filter(f => f.path.startsWith(filmsFolderPath + "/"));

                        // ───── Log Full Paths ─────
                        const fullPaths = filmsFiles.map(f => f.path);

                        for (const path of fullPaths) {
                          const file = app.vault.getAbstractFileByPath(path);
                          if (!file) {
                            return new Notice("No active file found.");
                            continue
                          }

                          const fileFrontmatter = app.metadataCache.getFileCache(file)?.frontmatter;
                          if (!fileFrontmatter) {
                           return new Notice("No frontmatter found.");
                           continue 
                          }

                          // Get the current list from frontmatter
                          const lists = fileFrontmatter.lists ?? [];

                          const updatedLists = lists.map(item => {
                            if (item.title === selectedFileFrontmatter.title) {
                              return {
                                  title: \`\${newListName}\`,
                                  path: \`\${newFilePath}\`,
                              };
                            }
                            return item;
                          });

                          await app.fileManager.processFrontMatter(file, (fm) => { 
                              fm.lists = updatedLists;
                          });
                        }

                    } else if (listsOption == 'remove') {
                        // Count how many films are associated with each list
                        const filmsFolder = basePath + "/Films/";
                        const filmsEntries = engine.query.files(file => file.path.startsWith(filmsFolder) ? file : undefined);

                        const listUsageCounts = {};
                        filmsEntries.forEach(file => {
                            const filmsFile = app.vault.getFileByPath(file.path);
                            const frontmatter = app.metadataCache.getFileCache(filmsFile)?.frontmatter;
                            if (!frontmatter?.lists) return;

                            const lists = Array.isArray(frontmatter.lists) ? frontmatter.lists : [frontmatter.lists];
                            lists.forEach(listName => {
                                listUsageCounts[listName.title] = (listUsageCounts[listName.title] ?? 0) + 1;
                            });
                        });

                        // Get all markdown files that represent films lists
                        const listFolder = basePath + "/Core/Films/Lists/";
                        const listFiles = engine.query.files(file => file.path.startsWith(listFolder) ? file : undefined);

                        // Build display options for prompt
                        const listOptions = listFiles.map(file => {
                            const listFile = app.vault.getFileByPath(file.path);
                            const frontmatter = app.metadataCache.getFileCache(listFile)?.frontmatter;
                            const listTitle = frontmatter?.title ?? 'Untitled';
                            const filmsCount = listUsageCounts[listTitle] ?? 0;

                            return {
                                label: \`\${listTitle} (\${filmsCount} films)\`,
                                value: file.path,
                                count: filmsCount
                            };
                        });

                        // Sort lists by number of films
                        listOptions.sort((a, b) => b.count - a.count);

                        // Let user pick a list to delete
                        const selectedListPath = await engine.prompt.suggester({
                            placeholder: 'Select a films list to delete',
                            options: listOptions.map(({ count, ...opt }) => opt),
                        });

                        if (!selectedListPath) {
                            new Notice('No list selected.');
                            return;
                        }

                        // Get selected list metadata
                        const selectedListFile = app.vault.getFileByPath(selectedListPath);
                        const selectedFrontmatter = app.metadataCache.getFileCache(selectedListFile)?.frontmatter;
                        const listTitle = selectedFrontmatter?.title ?? 'Untitled';
                        const filmsCount = listUsageCounts[listTitle] ?? 0;
                        const countLabel = \`\${filmsCount} films\${filmsCount === 1 ? '' : 's'}\`;

                        // Ask user for confirmation
                        const confirmed = await engine.prompt.confirm({
                            title: 'Confirm File Deletion',
                            content: \`Are you sure you want to permanently delete the films list “\${listTitle}” which contains \${countLabel}? This action is irreversible and will remove all associated data from your library.\`,
                        });

                        if (!confirmed) return;

                        // Delete the list file
                        await app.vault.delete(selectedListFile);

                        new Notice(\`\${listTitle} list succesfully deleted!\`);

                        // Remove deleted list from all films frontmatter
                        filmsEntries.forEach(file => {
                            app.fileManager.processFrontMatter(file, (frontmatter) => {
                                if (Array.isArray(frontmatter.lists)) {
                                    frontmatter.lists = frontmatter.lists.filter(name => name !== listTitle);
                                }
                            });
                        });

                        // Refresh Page
                        app.workspace.activeLeaf.rebuildView()
                    } else if (listsOption == 'browse') {
                        // Count how many films are associated with each list
                        const filmsFolder = basePath + "/Films/";
                        const filmsEntries = engine.query.files(file => file.path.startsWith(filmsFolder) ? file : undefined);

                        const listUsageCounts = {};
                        filmsEntries.forEach(file => {
                            const filmsFile = app.vault.getFileByPath(file.path);
                            const frontmatter = app.metadataCache.getFileCache(filmsFile)?.frontmatter;
                            if (!frontmatter?.lists) return;

                            const lists = Array.isArray(frontmatter.lists) ? frontmatter.lists : [frontmatter.lists];
                            lists.forEach(listName => {
                                listUsageCounts[listName.title] = (listUsageCounts[listName.title] ?? 0) + 1;
                            });
                        });

                        // Get all markdown files that represent films lists
                        const listFolder = basePath + "/Core/Films/Lists/";
                        const listFiles = engine.query.files(file => file.path.startsWith(listFolder) ? file : undefined);

                        // Build display options for prompt
                        const listOptions = listFiles.map(file => {
                            const listFile = app.vault.getFileByPath(file.path);
                            const frontmatter = app.metadataCache.getFileCache(listFile)?.frontmatter;
                            const listTitle = frontmatter?.title ?? 'Untitled';
                            const filmsCount = listUsageCounts[listTitle] ?? 0;

                            return {
                                label: \`\${listTitle} (\${filmsCount} films)\`,
                                value: file.path,
                                count: filmsCount
                            };
                        });

                        // Sort lists by number of films
                        listOptions.sort((a, b) => b.count - a.count);

                        // Let user pick a list to delete
                        const selectedListPath = await engine.prompt.suggester({
                            placeholder: 'Select a films list to delete',
                            options: listOptions.map(({ count, ...opt }) => opt),
                        });

                        if (!selectedListPath) {
                            new Notice('No list selected.');
                            return;
                        }

                        // Get selected list metadata
                        const selectedListFile = app.vault.getFileByPath(selectedListPath);
                        const leaf = app.workspace.getMostRecentLeaf()
                        await leaf.openFile(selectedListFile);
                        const view = leaf.view;
                        if (view?.setViewState) {
                          await view.setViewState({ ...view.getState(), mode: 'preview' });
                        }
                        
                    }

                })();
            `,
        },
    },
    isPreview: false,
});

// Mount the button to the DOM and make sure it gets unmounted when the component is destroyed.
mb.wrapInMDRC(button, container, component);
```