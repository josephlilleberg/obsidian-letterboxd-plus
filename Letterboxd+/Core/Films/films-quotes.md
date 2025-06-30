---
sortOption: Film Name
sortOrder: asc
enableFilters: false
filterDecade: Any
filterYear: Any
filterSearchQuery: ""
filterLimitResults: 200
genres_list:
  - Drama
  - Horror
  - Fantasy
  - Action
  - Crime
selected: []
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
> - [:LiList:](${filmsUris['lists']})
> - [:LiBookmark:](${filmsUris['watchlist']})
    `);
} else {
    return engine.markdown.create(`
> [!note-toolbar|button-center-border]
> - [:LiCircleUser: Profile](${filmsUris['profile']})
> - [:LiBookMarked: Diary](${filmsUris['diary']})
> - [:LiList: Lists](${filmsUris['lists']})
> - [:LiBookmark: Watchlist](${filmsUris['watchlist']})
    `);
}
```

# Quotes

<br/>
<div class="divider"/>

<!-- Sorting -->
```meta-bind-js-view
{sortOption} as sortOption
---
// Sorting
const sorting = ['Films Name', 'Quote Date', 'Author', 'Release Date']
const sortingAlphaetical = [['A to Z', 'Z to A'], ["asc", "desc"]]
const sortingNewestEarliest = [["Newest", "Earliest"], ["desc", "asc"]] // desc, asc

const sortOptions = sorting.map(x => `option(${x})`).join(", ");
const sortingAlphaeticalOptions = sortingAlphaetical[0]
	.map((x, i) => `option(${sortingAlphaetical[1][i]}, ${x})`) 
	.join(", ");

const sortingNewestEarliestOptions = sortingNewestEarliest[0]
	.map((x, i) => `option(${sortingNewestEarliest[1][i]}, ${x})`)  
	.join(", ");
	
let str = '';
if (context.bound.sortOption === 'Films Name') {
	str = `\`INPUT[inlineSelect(${sortOptions}):sortOption]\` \`INPUT[inlineSelect(${sortingAlphaeticalOptions}):sortOrder]\``
} else if (context.bound.sortOption === 'Quote Date') {
	str = `\`INPUT[inlineSelect(${sortOptions}):sortOption]\` \`INPUT[inlineSelect(${sortingNewestEarliestOptions}):sortOrder]\``
} else if (context.bound.sortOption === 'Author') {
	str = `\`INPUT[inlineSelect(${sortOptions}):sortOption]\` \`INPUT[inlineSelect(${sortingAlphaeticalOptions}):sortOrder]\``
} else if (context.bound.sortOption === 'Release Date') {
	str = `\`INPUT[inlineSelect(${sortOptions}):sortOption]\` \`INPUT[inlineSelect(${sortingNewestEarliestOptions}):sortOrder]\``
} 	

return engine.markdown.create(str);
```

<!-- Filters -->
`VIEW[Filters][text(renderMarkdown)]` `INPUT[toggle:enableFilters]`

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
	 str = `\`INPUT[text(placeholder(Search films...)):filterSearchQuery]\``;
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
    bindTarget: filterDecade
    evaluate: false
    value: "Any"
  - type: updateMetadata
    bindTarget: filterYear
    evaluate: false
    value: "Any"
  - type: updateMetadata
    bindTarget: filterLimitResults
    evaluate: false
    value: 200
  - type: updateMetadata
    bindTarget: filterSearchQuery
    evaluate: false
    value: ""
```

<!-- Genres -->
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
const folderPath = `${basePath}/Films`

let pages = dv.pages(`"${folderPath}"`);

// Filter pages 
pages = pages.filter(p => p => p.poster && p.watched && p.rating)

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
        
    }, 100); // 500ms delay before re-rendering
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
```

<div class="divider"/>

<!-- Render Quotes -->
```dataviewjs
const mb = app.plugins.getPlugin('obsidian-meta-bind-plugin')?.api;

function getParentPath(fullPath, targetFolder) {
    const index = fullPath.indexOf(targetFolder);
    if (index === -1) return null;
    return fullPath.substring(0, index + targetFolder.length);
}

function toDateOnly(isoString) {
    return new Date(isoString).toISOString().split('T')[0];
}

const filePath = dv.current().file.path;
const basePath = getParentPath(filePath, 'Letterboxd+');
const folderPath = `${basePath}/Films`;

// Metadata
const metadata = dv.current();

// Get the selected genres from the frontmatter of the current file
const selectedGenres = metadata.selected || [];

// Retrieve pages from the target folder
let pages = dv.pages(`"${folderPath}"`)

// Filter pages 
pages = pages.filter(p => p.poster && p.watched && p.quotes)

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

// Filter: Rewatch status
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

// Sort Order
const sortOrder = metadata.sortOrder;

if (metadata.sortOption === 'Films Name') {
    pages = pages.sort(file => file.film, sortOrder);
} else if (metadata.sortOption === 'Quote Date') {
	pages = pages.sort(file => file.date, sortOrder);
} else if (metadata.sortOption === 'Author') {
	pages = pages.sort(file => `${file.film}-${file.author}`, sortOrder);
} else if (metadata.sortOption === 'Release Date') {
	pages = pages.sort(file => file.first_air_date, sortOrder);
} 

// Filter: Limit Results
if (metadata.filterLimitResults) {
	pages = pages.slice(0, metadata.filterLimitResults)
}

let quote_items = []
if (pages) {
	pages.forEach((page, index) => {
        page.quotes.forEach((quote, index) => {

            let attribution;
            if (quote.character) {
              // Only add actor if it exists
              const actorPart = quote.actor ? ` <i>(${quote.actor})</i>` : '';
              attribution = `<b>${quote.character}</b>${actorPart} in <i>${page.film_title}</i>`;
            } else {
              attribution = `<i>${page.film_title}</i>`;
            }
    
            quote_items.push([
                `<div class="letterboxd-quotes-item-wrapper">
                    <a href="${page.file.link.path}" class="internal-link">
                        <img src="${page.poster}" alt="Poster" class="letterboxd-quotes-quotes-poster">
                    </a>
                    <div class="letterboxd-quotes-wrapper">
                        <div class="letterboxd-quotes-date">${quote.timestamp ? quote.timestamp : ''}</div>
                        <div class="letterboxd-quotes-content-wrapper">
                            <div class="letterboxd-quotes-content">“${quote.quote}”</div>
                            <div class="letterboxd-quotes-attribution">— ${attribution} </div>
                        </div>
                    </div>
                </div>`
            ])
        })
	})
	
	dv.table([], quote_items)
}
```