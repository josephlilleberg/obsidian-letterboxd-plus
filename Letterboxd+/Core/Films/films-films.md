---
sortOption: Rewatch Count
sortOrder: asc
enableFilters: false
filterDecade: Any
filterYear: Any
filterRewatchStatus: All
filterSearchQuery: ""
filterRatingMin:
filterRatingMax:
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
  - cards
  - cards-cols-8
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

# Films

<br/>
<div class="divider"/>

<!-- Sorting -->
```meta-bind-js-view
{sortOption} as sortOption
---
// Sorting
const sorting = ['Film Name', 'Shuffle', 'When Added', 'Release Date', 'Rating', 'Film Length', 'Rewatch Count']
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
} else if (context.bound.sortOption === 'Shuffle') {
	str = `\`INPUT[inlineSelect(${sortOptions}):sortOption]\``
} else if (context.bound.sortOption === 'When Added') {
	str = `\`INPUT[inlineSelect(${sortOptions}):sortOption]\` \`INPUT[inlineSelect(${sortingNewestEarliestOptions}):sortOrder]\``
} else if (context.bound.sortOption === 'Release Date') {
	str = `\`INPUT[inlineSelect(${sortOptions}):sortOption]\` \`INPUT[inlineSelect(${sortingNewestEarliestOptions}):sortOrder]\``
} else if (context.bound.sortOption === 'Rating') {
	str = `\`INPUT[inlineSelect(${sortOptions}):sortOption]\` \`INPUT[inlineSelect(${sortingHighestLowestOptions}):sortOrder]\``
} else if (context.bound.sortOption === 'Film Length') {
	str = `\`INPUT[inlineSelect(${sortOptions}):sortOption]\` \`INPUT[inlineSelect(${sortingShortestLongestOptions}):sortOrder]\``
} else if (context.bound.sortOption === 'Rewatch Count') {
	str = `\`INPUT[inlineSelect(${sortOptions}):sortOption]\` \`INPUT[inlineSelect(${sortingHighestLowestOptions}):sortOrder]\``
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
pages = pages.filter(p => p.poster && p.status !== 'Watchlist' && p.rating)

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

<!-- Render Films -->
```dataviewjs
function getRating(rating) {
    // Calculate full, half, and empty stars based on rating
    const full_stars = Math.trunc(rating); 
    const hasRemainder = rating % 1 !== 0;
    const empty_stars = Math.trunc(5 - rating);  

    // SVG icons for full, half, and empty stars
    const full_star_svg = '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="currentColor"  class="icon icon-tabler icons-tabler-filled icon-tabler-star"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M8.243 7.34l-6.38 .925l-.113 .023a1 1 0 0 0 -.44 1.684l4.622 4.499l-1.09 6.355l-.013 .11a1 1 0 0 0 1.464 .944l5.706 -3l5.693 3l.1 .046a1 1 0 0 0 1.352 -1.1l-1.091 -6.355l4.624 -4.5l.078 -.085a1 1 0 0 0 -.633 -1.62l-6.38 -.926l-2.852 -5.78a1 1 0 0 0 -1.794 0l-2.853 5.78z" /></svg>'
	const half_star_svg = '<svg  xmlns="http://www.w3.org/2000/svg"  viewBox="0 0 24 24"  fill="currentColor"  class="icon icon-tabler icons-tabler-filled icon-tabler-star-half"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 1a.993 .993 0 0 1 .823 .443l.067 .116l2.852 5.781l6.38 .925c.741 .108 1.08 .94 .703 1.526l-.07 .095l-.078 .086l-4.624 4.499l1.09 6.355a1.001 1.001 0 0 1 -1.249 1.135l-.101 -.035l-.101 -.046l-5.693 -3l-5.706 3c-.105 .055 -.212 .09 -.32 .106l-.106 .01a1.003 1.003 0 0 1 -1.038 -1.06l.013 -.11l1.09 -6.355l-4.623 -4.5a1.001 1.001 0 0 1 .328 -1.647l.113 -.036l.114 -.023l6.379 -.925l2.853 -5.78a.968 .968 0 0 1 .904 -.56zm0 3.274v12.476a1 1 0 0 1 .239 .029l.115 .036l.112 .05l4.363 2.299l-.836 -4.873a1 1 0 0 1 .136 -.696l.07 -.099l.082 -.09l3.546 -3.453l-4.891 -.708a1 1 0 0 1 -.62 -.344l-.073 -.097l-.06 -.106l-2.183 -4.424z" /></svg>'
	const empty_star_svg = '<svg  xmlns="http://www.w3.org/2000/svg"    viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-star"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 17.75l-6.172 3.245l1.179 -6.873l-5 -4.867l6.9 -1l3.086 -6.253l3.086 6.253l6.9 1l-5 4.867l1.179 6.873z" /></svg>'

    let star_rating = '';
    for (let i = 0; i < full_stars; i++) star_rating += full_star_svg;
    if (hasRemainder) star_rating += half_star_svg;
    for (let i = 0; i < empty_stars; i++) star_rating += empty_star_svg;

    return star_rating;
}

function getHeartIcon(page) {

    let mobileFavorite = '<svg xmlns="http://www.w3.org/2000/svg"  viewBox="0 0 24 24" width=".75em" height=".75em" class="letterboxd-series-series-icon-favorite letterboxd-series-series-icon-mobile-like-favorite" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-heart"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>'
    let desktopFavorite = '<svg xmlns="http://www.w3.org/2000/svg"  viewBox="0 0 24 24" width="1.25em" height="1.25em" class="letterboxd-series-series-icon-favorite letterboxd-series-series-icon-desktop-like-favorite" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-heart"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>'

    let mobileLike = '<svg xmlns="http://www.w3.org/2000/svg"  viewBox="0 0 24 24" width=".75em" height=".75em" class="letterboxd-series-series-icon-like letterboxd-series-series-icon-mobile-like-favorite" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-heart"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>'
    let desktopLike = '<svg xmlns="http://www.w3.org/2000/svg"  viewBox="0 0 24 24" width="1.25em" height="1.25em" class="letterboxd-series-series-icon-like letterboxd-series-series-icon-desktop-like-favorite" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-heart"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>'

    let mobileBase = '<svg xmlns="http://www.w3.org/2000/svg"  viewBox="0 0 24 24" width=".75em" height=".75em" class="letterboxd-series-series-icon-base letterboxd-series-series-icon-mobile-like-favorite" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-heart"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>'
    let desktopBase = '<svg xmlns="http://www.w3.org/2000/svg"  viewBox="0 0 24 24" width="1.25em" height="1.25em" class="letterboxd-series-series-icon-base letterboxd-series-series-icon-desktop-like-favorite" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-heart"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>'

    if (app.isMobile) {
        return page.favorite ? mobileFavorite : page.like ? mobileLike : mobileBase
    } else {
        return page.favorite ? desktopFavorite : page.like ? desktopLike : desktopBase
    }
}

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
    .filter(p => p.poster && p.watched);

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
	pages = pages.filter(file => file.rewatched_dates && file.rewatched_dates.length === 0)
} else if (rewatchStatus === 'Rewatch') {
	pages = pages.filter(file => file.rewatched_dates && file.rewatched_dates.length > 0)
}

// Filter: Search Query
if (metadata.filterSearchQuery) {
    let films = pages.map(f => f.film_title.toLowerCase()); // Normalize for case-insensitivity
    pages = pages.filter(file => 
        file.film_title.toLowerCase().includes(metadata.filterSearchQuery.toLowerCase()) &&
        films.includes(file.film_title.toLowerCase()) // Ensure it exists in the list
    );
}

// Filter: Genres
if (selectedGenres.length > 0) {
    pages = pages.filter(page => page.genres && page.genres.some(genre => selectedGenres.includes(genre)));
}

// Sorting
const sortOrder = metadata.sortOrder;

if (metadata.sortOption === 'Film Name') {
    pages = pages.sort(file => file.film_title, sortOrder);
} else if (metadata.sortOption === 'Shuffle') {
	pages = pages.sort(() => Math.random() - 0.5);
} else if (metadata.sortOption === 'When Added') {
	pages = pages.sort(file => file.date_added, sortOrder);
} else if (metadata.sortOption === 'Release Date') {
	pages = pages.sort(file => file.release_date, sortOrder);
} else if (metadata.sortOption === 'Rating') {
	pages = pages.sort(file => file.rating, sortOrder);
} else if (metadata.sortOption === 'Film Length') {
	pages = pages.sort(file => file.runtime, sortOrder);
} else if (metadata.sortOption === 'Rewatch Count') {
	pages = pages.sort(file => file.rewatched_dates ? file.rewatched_dates.length : 0, sortOrder);
}

// Filter: Limit Results
if (metadata.filterLimitResults) {
	pages = pages.slice(0, metadata.filterLimitResults)
}

// Generate and display the table based on device type
const isMobile = document.body.hasClass("is-mobile");
dv.table(["Poster", "Title"], 
    pages.map(p => [
        `<div class="letterboxd-films-films-${isMobile ? 'mobile' : 'desktop'}-wrapper">
            <a href="${p.file.path}" class="internal-link">
                <img src="${p.poster}" alt="${p.title}" style="border-radius: 5px;" loading="lazy">
            </a>
        </div>`,
        `<div class="letterboxd-films-films-${isMobile ? 'mobile' : 'desktop'}-wrapper">
            <div class="letterboxd-films-films-${isMobile ? 'mobile' : 'desktop'}-rating">${getRating(p.rating)}</div>
            <div class="letterboxd-films-films-${isMobile ? 'mobile' : 'desktop'}-like">${getHeartIcon(p)}</div>
        </div>`
    ])
);
```