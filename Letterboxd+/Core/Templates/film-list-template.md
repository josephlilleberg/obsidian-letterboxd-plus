---
title:
description:
created_on:
updated:
sortOption: Film Name
sortOrder: asc
enableFilters: false
filterStatus: All
filterDecade: Any
filterYear: Any
filterRewatchStatus: All
filterSearchQuery: ""
filterRatingMin:
filterRatingMax:
filterLimitResults: 200
genres_list: []
selected: []
cssclasses:
  - cards
  - cards-cols-8
  - cards-cover
  - hidefilename
  - letterboxd
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
> - [:LiList:](${filmsUris['lists']})
> - [:LiBookmark:](${filmsUris['watchlist']})
> - <hr/>
> - \`BUTTON[manage-list]\`
    `);
} else {
    return engine.markdown.create(`
> [!note-toolbar|button-center-border]
> - [:LiCircleUser: Profile](${filmsUris['profile']})
> - [:LiBookMarked: Diary](${filmsUris['diary']})
> - [:LiList: Lists](${filmsUris['lists']})
> - [:LiBookmark: Watchlist](${filmsUris['watchlist']})
> - <hr/>
> - \`BUTTON[manage-list]\`
    `);
}
```


```meta-bind-js-view
{title} as title
---

let str = ''
if (context.bound.title) {
    str = `# ${context.bound.title}`
}

// Create the markdown view with the reactive bindings
return engine.markdown.create(str);
```

<br/>
<div class="divider"/>

```meta-bind-js-view
{sortOption} as sortOption
---
// Sorting
const sorting = ['Film Name', 'Release Date', 'Rating', 'Rewatch Count']
const sortingAlphaetical = [['A to Z', 'Z to A'], ["asc", "desc"]]
const sortingNewestEarliest = [["Newest", "Earliest"], ["desc", "asc"]] // desc, asc
const sortingHighestLowest = [['Highest first', 'Lowest first'], ["desc", "asc"]] // desc, asc
const sortingShortestLongest = [['Shortest first', 'Longest first'], ["asc", "desc"]] // asc, desc

const sortOptions = sorting.map(x => `option(${x})`).join(", ");
const sortingAlphaeticalOptions = sortingAlphaetical[0]
    .map((x, i) => `option(${sortingAlphaetical[1][i]}, ${x})`) 
    .join(", ");

const sortingNewestEarliestOptions = sortingNewestEarliest[0]
    .map((x, i) => `option(${sortingNewestEarliest[1][i]}, ${x})`)  
    .join(", ");
    
const sortingHighestLowestOptions = sortingHighestLowest[0]
    .map((x, i) => `option(${sortingHighestLowest[1][i]}, ${x})`) 
    .join(", ");
    
const sortingShortestLongestOptions = sortingShortestLongest[0]
    .map((x, i) => `option(${sortingShortestLongest[1][i]}, ${x})`)  
    .join(", ");
    
let str = '';
if (context.bound.sortOption === 'Film Name') {
    str = `\`INPUT[inlineSelect(${sortOptions}):sortOption]\` \`INPUT[inlineSelect(${sortingAlphaeticalOptions}):sortOrder]\``
} else if (context.bound.sortOption === 'Release Date') {
    str = `\`INPUT[inlineSelect(${sortOptions}):sortOption]\` \`INPUT[inlineSelect(${sortingNewestEarliestOptions}):sortOrder]\``
} else if (context.bound.sortOption === 'Rating') {
    str = `\`INPUT[inlineSelect(${sortOptions}):sortOption]\` \`INPUT[inlineSelect(${sortingHighestLowestOptions}):sortOrder]\``
} else if (context.bound.sortOption === 'Rewatch Count') {
    str = `\`INPUT[inlineSelect(${sortOptions}):sortOption]\` \`INPUT[inlineSelect(${sortingHighestLowestOptions}):sortOrder]\``
}   

return engine.markdown.create(str);
```

`VIEW[Filters][text(renderMarkdown)]` `INPUT[toggle:enableFilters]`

```meta-bind-js-view
{enableFilters} as enableFilters
---
// Filter: Status
let str = '';
if (context.bound.enableFilters) {
    str = `\`VIEW[Status][text(renderMarkdown)]\` \`INPUT[inlineSelect(option('All', 'All'), option('Watched', 'Watched'), option('Watchlist', 'Watchlist')):filterStatus]\``;
}

// Create the markdown view with the reactive bindings
return engine.markdown.create(str);
```

```meta-bind-js-view
{enableFilters} as enableFilters
{filterDecade} as filterDecade
{filterYear} as filterYear
---
// Decades & Year
// Function to generate the decades list
function generateDecades(startYear = 1870, endYear = new Date().getFullYear()) {
    return ['Any', ...Array.from(
        { length: Math.floor((endYear - startYear) / 10) + 1 }, 
        (_, i) => startYear + i * 10
    ).reverse()];
}

// Function to generate the years for a given decade
function generateDecadeYears(decade) {
    const startYear = parseInt(decade, 10);
    if (isNaN(startYear) || startYear % 10 !== 0) {
        throw new Error("Invalid decade. Provide a year like '1990' or '2000'.");
    }
    return ['Any', ...Array.from({ length: 10 }, (_, i) => startYear + i).reverse()];
}

// Creating filterDecades options
const filterDecades = generateDecades().map((x) => x === 'Any' ? `option(${x}, ${x})` : `option(${x}, ${x}s)`).join(", ");

let str = '';
if (context.bound.enableFilters) {
    // When filterDecade is selected
    if (context.bound.filterDecade === 'Any') {
        str = `\`VIEW[Year][text(renderMarkdown)]\` \`INPUT[inlineSelect(${filterDecades}):filterDecade]\``;
    } else {
        // Generating filterYears based on filterDecade
        let filterYears = generateDecadeYears(context.bound.filterDecade).map((x) => x === 'Any' ? `option(${x}, ${x})` : `option(${x}, ${x})`).join(", ");
        context.bound.filterDecade = 'Any'; // Reset filterDecade to 'Any'
        filterYears += `,defaultValue(${filterYears[0]})`; // Adding the default value for the filterYear input

        // Bind filterYear to change dynamically based on filterDecade
        str = `\`VIEW[Year][text(renderMarkdown)]\` \`INPUT[inlineSelect(${filterDecades}):filterDecade]\` \`INPUT[inlineSelect(${filterYears}):filterYear]\``;
    }
}

// Create the markdown view with the reactive bindings
return engine.markdown.create(str);
```

```meta-bind-js-view
{enableFilters} as enableFilters
---
// Filter: Rating
let str = '';
if (context.bound.enableFilters) {
    str = `\`VIEW[Rating][text(renderMarkdown)]\` \`INPUT[number(placeholder(min), class('rating-input')):filterRatingMin]\` \`INPUT[number(placeholder(max), class('rating-input')):filterRatingMax]\``;
}

// Create the markdown view with the reactive bindings
return engine.markdown.create(str);
```

```meta-bind-js-view
{enableFilters} as enableFilters
---
// Filter: Rewatch Status
const filterRewatchStatus = ['All', 'First time watch', 'Rewatch']
const filterRewatchStatusOptions = filterRewatchStatus.map(x => `option(${x})`)

let str = '';
if (context.bound.enableFilters) {
    str = `\`VIEW[Rewatch Status][text(renderMarkdown)]\` \`INPUT[inlineSelect(${filterRewatchStatusOptions}):filterRewatchStatus]\``;
}

// Create the markdown view with the reactive bindings
return engine.markdown.create(str);
```

```meta-bind-js-view
{enableFilters} as enableFilters
---
// Filter: Limit Results
let str = '';
if (context.bound.enableFilters) {
     str = `\`VIEW[Limit][text(renderMarkdown)]\` \`INPUT[number(placeholder(max), defaultValue(200), class('limit-results-input')):filterLimitResults]\``;
}

return engine.markdown.create(str)
```

```meta-bind-js-view
{enableFilters} as enableFilters
---
// Filter: Search Query
let str = '';
if (context.bound.enableFilters) {
     str = `\`INPUT[text(placeholder(Search series...)):filterSearchQuery]\``;
}

return engine.markdown.create(str)
```

```meta-bind-js-view
{enableFilters} as enableFilters
---
// Filter: Reset
let str = '';
if (context.bound.enableFilters) {
     str = `\`BUTTON[reset-filters]\``;
}

return engine.markdown.create(str)
```

```meta-bind-button
label: "Reset Filters"
hidden: true
id: "reset-filters"
style: default
icon: "list-restart"
actions:
  - type: updateMetadata
    bindTarget: filterStatus
    evaluate: false
    value: "All"
  - type: updateMetadata
    bindTarget: filterDecade
    evaluate: false
    value: "Any"
  - type: updateMetadata
    bindTarget: filterYear
    evaluate: false
    value: "Any"
  - type: updateMetadata
    bindTarget: filterRatingMin
    evaluate: true
    value: null
  - type: updateMetadata
    bindTarget: filterRatingMax
    evaluate: true
    value: null
  - type: updateMetadata
    bindTarget: filterRewatchStatus
    evaluate: false
    value: "All"
  - type: updateMetadata
    bindTarget: filterLimitResults
    evaluate: false
    value: 200
  - type: updateMetadata
    bindTarget: filterSearchQuery
    evaluate: false
    value: ""
```

```js-engine
// Update genres_list

// Efficiently updates the frontmatter in a single call instead of making multiple updates.
// This reduces redundant operations, ensuring better performance and preventing race conditions.
const mb = engine.getPlugin('obsidian-meta-bind-plugin').api;
const dv = engine.getPlugin("dataview")?.api;

function getParentPath(fullPath, targetFolder) {
    const index = fullPath.indexOf(targetFolder);
    if (index === -1) return null; // Target folder not found

    const subPath = fullPath.substring(0, index + targetFolder.length);
    return subPath;
}

const filePath = dv.page(context.file.path).file.path
const basePath = getParentPath(filePath, 'Letterboxd+')

// Generate folderPath
const folderPath = `${basePath}/Film`

let pages = dv.pages(`"${folderPath}"`);

// Filter pages 
pages = pages.filter(p => p.poster && p.status !== 'Watchlist')

const uniqueGenres = Array.from(
    new Set(pages.flatMap(p => p.genres || [])) // Flatten and remove duplicates
);

// Write the unique genres list to the frontmatter of the current file
let file = app.workspace.getActiveFile();

app.fileManager.processFrontMatter(file, (frontmatter) => {
    frontmatter['genres_list'] = uniqueGenres
});

```

```js-engine
// inlineListSuggester for Genres
const mb = engine.getPlugin('obsidian-meta-bind-plugin').api;
const dv = engine.getPlugin("dataview")?.api;

const comp = new obsidian.Component(component);
const bindTarget = mb.createBindTarget('frontmatter', context.file.path, ['selected']);

// Function to dynamically get unselected items
function getUnselected(metadata) {
    if (!metadata) {
        console.error("Failed to retrieve metadata.");
        return [];
    }

    let all = metadata.genres_list || [];
    let selected = metadata.selected || [];

    return all.filter(item => !selected.includes(item));
}

// Timer variable to prevent unnecessary rapid re-renders
let renderTimeout;

// Render function to create the input field
function render(selectedValues) {
    if (renderTimeout) {
        clearTimeout(renderTimeout); // Clear any existing timeout to avoid multiple redundant updates
    }

    // Introduce a delay to allow metadata updates to be processed before re-rendering
    renderTimeout = setTimeout(() => {
        comp.unload();
        comp.load();
        container.empty();

        // Retrieve fresh metadata every time we render
        let metadata = dv.page(context.file.path);
        let unselected = getUnselected(metadata);

        const declaration = {
            inputFieldType: 'inlineListSuggester',
            bindTarget: bindTarget,
            arguments: unselected.map(x => ({
                name: 'option',
                value: [x.toString()],
            })),
        };

        const options = {
            declaration: declaration,
            renderChildType: 'block',
        };
        
        const inputField = mb.createInputFieldMountable(context.file.path, options);

        mb.wrapInMDRC(inputField, container, comp);
   
    }, 100); 
}

// Create a reactive component
const reactive = engine.reactive(render, mb.getMetadata(bindTarget));

// Subscribe to updates in `selected`, ensuring the UI refreshes when the list changes
const subscription = mb.subscribeToMetadata(
    bindTarget,
    component,
    (value) => {
        // Delay the refresh to ensure metadata updates are fully applied
        setTimeout(() => {
            reactive.refresh(value);
        }, 100);
    }
);

return reactive;
```

<div class="divider"/>

```dataviewjs
// Extract the parent path of a given folder
function getParentPath(fullPath, targetFolder) {
    const index = fullPath.indexOf(targetFolder);
    return index === -1 ? null : fullPath.substring(0, index + targetFolder.length);
}

// Get the base path dynamically
const filePath = dv.current().file.path;
const basePath = getParentPath(filePath, 'Letterboxd+');
const folderPath = `${basePath}/Films`;

// Retrieve current metadata
const metadata = dv.current();
const selectedGenres = metadata.selected || [];

// Fetch pages from the films folder
let pages = dv.pages(`"${folderPath}"`)
    .filter(p => p.poster)
    .where(p =>
        Array.isArray(p.lists) &&
        p.lists.some(list => list.title && list.title.toLowerCase() === metadata.title.toLowerCase())
    );

// Filter: Status
let status = metadata.filterStatus
if (status !== 'All') {
    if (status === 'Watched') {
        pages = pages.filter(p => p.watched)
    } else {
        pages = pages.filter(p => !p.watched)
    }
}

// Filter: Decade & Year
let filterDecadeOption = metadata.filterDecade;
let filterYearOption = metadata.filterYear;

if (filterDecadeOption !== 'Any') {
    const decadeStart = parseInt(filterDecadeOption, 10); // Get decade as integer
    const decadeEnd = decadeStart + 9; // End of decade

    if (filterYearOption !== 'Any') {
        // Filter by specific year within the decade
        const targetYear = parseInt(filterYearOption, 10);
        pages = pages.filter(p => {
            const year = p.release_year ? parseInt(p.release_year, 10) : null;
            return year !== null && year === targetYear;
        });
    } else {
        // Filter by decade range
        pages = pages.filter(p => {
            const year = p.release_year ? parseInt(p.release_year, 10) : null;
            return year !== null && year >= decadeStart && year <= decadeEnd;
        });
    }
}

// Filter: Rating
pages = pages.filter(p => {
    const numValue = p.rating || 0;
    return (!metadata.filterRatingMin || numValue >= metadata.filterRatingMin) &&
           (!metadata.filterRatingMax || numValue <= metadata.filterRatingMax);
});

// Filter: Rewatch Status
let rewatchStatus = metadata.filterRewatchStatus
if (rewatchStatus === 'First time watch') {
    pages = pages.filter(file => file.watch_dates && file.rewatch_dates.length === 0)
} else if (rewatchStatus === 'Rewatch') {
    pages = pages.filter(file => file.rewatch_dates && file.rewatch_dates.length > 0)
}

// Filter: Search Query
if (metadata.filterSearchQuery) {
    let query = metadata.filterSearchQuery.toLowerCase();

    pages = pages.filter(file =>
        file.film_title && file.film_title.toLowerCase().includes(query)
    );
}

// Filter: Genres
if (selectedGenres.length > 0) {
    pages = pages.filter(page => page.genres && page.genres.some(genre => selectedGenres.includes(genre)));
}

// Sorting
const sortOrder = metadata.sortOrder;

if (metadata.sortOption === 'Film Name') {
    pages = pages.sort(file => file.series_name, sortOrder);
} else if (metadata.sortOption === 'Release Date') {
    pages = pages.sort(file => file.release_year, sortOrder);
} else if (metadata.sortOption === 'Rating') {
    pages = pages.sort(file => file.rating, sortOrder);
} else if (metadata.sortOption === 'Rewatch Count') {
    pages = pages.sort(file => file.rewatch_dates && file.rewatch_dates.length > 0, sortOrder);
}

// Filter: Limit Results
if (metadata.filterLimitResults) {
    pages = pages.slice(0, metadata.filterLimitResults)
}

// Create the table with Poster as a $link to the film title
dv.table(
    ["Poster"], 
    pages.map(p => [
        `[![Poster](${p.poster})](${p.file.name})`
    ])
);
```

<!-- Manage List -->
```js-engine
const mb = app.plugins.getPlugin('obsidian-meta-bind-plugin')?.api;

const label = app.isMobile ? '': 'Manage'

const button = mb.createButtonMountable(context.file.path, {
  declaration: {
    label: label,
    style: 'default',
    icon: 'cog',
    id: 'manage-list',
    hidden: true,
    action: {
      type: 'inlineJS',
      code: `
        (async () => {
            // ───── Helper ─────
            function getParentPath(fullPath, targetFolder) {
                const index = fullPath.indexOf(targetFolder);
                return index === -1 ? null : fullPath.substring(0, index + targetFolder.length);
            }

            // ───── Resolve Base Path ─────
            const basePath = getParentPath(context.file.path, "Letterboxd+");
            if (!basePath) return new Notice("Could not resolve Letterboxd+ path.");

            // ───── Script & Secrets Paths ─────
            const scriptPath = basePath + "/Core/Scripts/letterboxd.js";

            // ───── Load External Dependencies ─────
            const lib = await engine.importJs(scriptPath);
            if (!lib) return new Notice("Failed to load core script.");

            // ───── Metadata ─────
            const file = app.workspace.getActiveFile();
            if (!file) return new Notice("No active file to sync.");

            const metadata = app.metadataCache.getFileCache(file);
            const listTitle = metadata.frontmatter?.title;

            // ───── Validate Metadata ─────
            if (!listTitle) return new Notice("Missing title in frontmatter.");

            // Get all markdown files that represent films lists
            const filmsPath = basePath + "/Films/";
            const films = engine.query.files(file => file.path.startsWith(filmsPath) ? file : undefined);

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
                      label: 'Remove',
                      value: 'remove',
                  },
                  {
                      label: 'Cancel',
                      value: null,
                  }
              ]
            });

            if (listsOption == 'add') {
                // Build display options for prompt
                const filmOptions = films.filter(f => {
                    const filmFile = app.vault.getFileByPath(f.path);
                    const frontmatter = app.metadataCache.getFileCache(filmFile)?.frontmatter;
                    const lists = frontmatter?.lists;

                    // Only include if 'lists' does NOT contain the current list by value
                    const alreadyInList = lists?.some(l => l.title === listTitle && l.path === file.path);
                    return !alreadyInList;
                }).map(f => {
                    const filmFile = app.vault.getFileByPath(f.path);
                    const frontmatter = app.metadataCache.getFileCache(filmFile)?.frontmatter;
                    const title = frontmatter?.film_title ?? 'Untitled';

                    return {
                        label: \`\${title}\`,
                        value: {filmPath: filmFile.path, listTitle: listTitle, listPath: file.path},
                    };
                });

                // Sort lists by number of films
                filmOptions.sort((a, b) => a.label.localeCompare(b.label));

                // Let user pick a film to add
                const selectedFilm = await engine.prompt.suggester({
                    placeholder: 'Select a film to add to the list',
                    options: filmOptions,
                });

                if (!selectedFilm) {
                    new Notice('No film selected.');
                    return;
                }

                // Get selected list metadata
                const selectedFilmFile = app.vault.getFileByPath(selectedFilm.filmPath);

                app.fileManager.processFrontMatter(selectedFilmFile, (frontmatter) => {
                    if (!frontmatter.lists.includes(listTitle)) {
                        frontmatter.lists.push({title: selectedFilm.listTitle, path: selectedFilm.listPath});
                    }
                });
            } else if (listsOption == 'remove') {
                // Build display options for prompt
                const filmOptions = films.filter(s => {
                    const filmFile = app.vault.getFileByPath(f.path);
                    const frontmatter = app.metadataCache.getFileCache(filmFile)?.frontmatter;
                    const lists = frontmatter?.lists;

                    // Only include if 'lists' does NOT contain the current list by value
                    const alreadyInList = lists?.some(l => l.title === listTitle && l.path === file.path);
                    return alreadyInList;
                }).map(s => {
                    const filmFile = app.vault.getFileByPath(f.path);
                    const frontmatter = app.metadataCache.getFileCache(filmFile)?.frontmatter;
                    const title = frontmatter?.film_title ?? 'Untitled';

                    return {
                        label: \`\${title}\`,
                        value: {filmPath: filmFile.path, listTitle: listTitle, listPath: file.path},
                    };
                });

                // Sort lists by number of films
                filmOptions.sort((a, b) => a.label.localeCompare(b.label));

                // Let user pick a film to add
                const selectedFilm = await engine.prompt.suggester({
                    placeholder: 'Select a film to add to the list',
                    options: filmOptions,
                });

                if (!selectedFilm) {
                    new Notice('No film selected.');
                    return;
                }

                // Get selected list metadata
                const selectedFilmFile = app.vault.getFileByPath(selectedFilm.filmPath);

                app.fileManager.processFrontMatter(selectedFilmFile, (frontmatter) => {
                    frontmatter.lists = (frontmatter.lists || []).filter(
                        l => !(l.title === selectedFilm.listTitle && l.path === selectedFilm.listPath)
                    );
                });

            } else if (listsOption == 'remove') {
                new Notice('No film selected.')
            }
            
        })(); 
      `,
    },
  },
  isPreview: false,
});

mb.wrapInMDRC(button, container, component);
```