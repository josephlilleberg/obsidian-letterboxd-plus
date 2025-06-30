---
cssclasses:
  - hidefilename
  - letterboxd
  - cards
  - cards-cols-8
  - wide-page
genres_list:
  - Drama
  - Crime
  - Animation
  - Comedy
  - Mystery
  - Sci-Fi & Fantasy
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
const filmPages = ['profile']

const filmsUris = Object.fromEntries(
    filmPages.map(page => [page, convertFilePathToObsidianUri(`${filmsBasePath}films-${page}.md`)])
);

// Pages: Series
const seriesPages = ['profile', 'series', 'diary', 'watchlist', 'lists']

const seriesUris = Object.fromEntries(
    seriesPages.map(page => [page, convertFilePathToObsidianUri(`${seriesBasePath}series-${page}.md`)])
);

// Mobile
const isMobile = app.isMobile;

// Rewatch: Toggle
if (isMobile) {
    return engine.markdown.create(`
> [!note-toolbar|button-center-noborder]
> - [:LiClapperboard: Film →](${filmsUris['profile']})

> [!note-toolbar|button-center-border]
> - \`BUTTON[log-series]\`
> - <hr/>
> - [:LiCircleUser:]()
> - [:LiBookMarked:](${seriesUris['diary']})
> - [:LiList:](${seriesUris['lists']})
> - [:LiBookmark:](${seriesUris['watchlist']})
> - <hr/>
> - \`BUTTON[library]\`
    `);
} else {
    return engine.markdown.create(`
> [!note-toolbar|button-center-noborder]
> - [:LiClapperboard: Film →](${filmsUris['profile']})

> [!note-toolbar|button-center-border]
> - \`BUTTON[log-series]\`
> - <hr/>
> - [:LiCircleUser: Profile]()
> - [:LiBookMarked: Diary](${seriesUris['diary']})
> - [:LiList: Lists](${seriesUris['lists']})
> - [:LiBookmark: Watchlist](${seriesUris['watchlist']})
> - <hr/>
> - \`BUTTON[library]\`
    `);
}
```

<!-- Button: Log Series -->
```js-engine
const mb = app.plugins.getPlugin('obsidian-meta-bind-plugin')?.api;

const label = app.isMobile ? '' : 'Log';

const button = mb.createButtonMountable(context.file.path, {
    declaration: {
        label: label,
        style: 'default',
        icon: 'ticket-plus',
        id: 'log-series',
        hidden: true,
        action: {
            type: 'inlineJS',
            code: `
                (async () => {
                    // Get the base "Letterboxd+" directory from the full file path
                    function getParentPath(fullPath, targetFolder) {
                        const index = fullPath.indexOf(targetFolder);
                        return index === -1 ? null : fullPath.substring(0, index + targetFolder.length);
                    }

                    const basePath = getParentPath(context.file.path, "Letterboxd+");
                    if (!basePath) return new Notice("Could not resolve Letterboxd+ path.");

                    const scriptPath = basePath + "/Core/Scripts/letterboxd.js"
                    const secretsPath = basePath + "/Core/Scripts/api_keys.json";

                    const lib = await engine.importJs(scriptPath);
                    const tmdbKey = await lib.getApiKey(secretsPath, 'tmdb');

                    // ───── Prompt for Series ─────
                    const query = await engine.prompt.text({ title: 'Series to log?', placeholder: 'Series name...' });
                    if (!query) return new Notice("No query entered for series.");

                    // ───── Search TMDB ─────
                    const results = await lib.searchTMDB('series', tmdbKey, query);
                    if (!results?.length) return new Notice("No results found.");

                    const listOptions = await Promise.all(
                        results.map(async result => ({
                            label: await lib.createSeriesLabelFromResult(result),
                            value: result
                        }))
                    );

                    const choice = await engine.prompt.suggester({
                        placeholder: 'Select a series',
                        options: listOptions
                    });
                    if (!choice) return new Notice("No series selected.");

                    await lib.addSeriesToLibrary(basePath, choice.id, tmdbKey)

                })();
            `,
        },
    },
    isPreview: false,
});

mb.wrapInMDRC(button, container, component);
```

<!-- Button: Settings -->
```js-engine
const mb = app.plugins.getPlugin('obsidian-meta-bind-plugin')?.api;

const label = app.isMobile ? '' : 'Library';

const button = mb.createButtonMountable(context.file.path, {
    declaration: {
        label: label,
        style: 'default',
        icon: 'library-square',
        id: 'library',
        hidden: true,
        action: {
            type: 'inlineJS',
            code: `
                (async () => {
                    // Get the base "Letterboxd+" directory from the full file path
                    function getParentPath(fullPath, targetFolder) {
                        const index = fullPath.indexOf(targetFolder);
                        return index === -1 ? null : fullPath.substring(0, index + targetFolder.length);
                    }

                    const basePath = getParentPath(context.file.path, "Letterboxd+");
                    if (!basePath) return new Notice("Could not resolve Letterboxd+ path.");

                    const scriptPath = basePath + "/Core/Scripts/letterboxd.js"
                    const secretsPath = basePath + "/Core/Scripts/api_keys.json";

                    const lib = await engine.importJs(scriptPath);
                    const tmdbKey = await lib.getApiKey(secretsPath, 'tmdb');

                    // ───── Prompt for Setting Option ─────
                    const settingsOptions = [
                      { label: 'Sync All Series', value: 'syncAllSeries' },
                      { label: 'Sync Entire Library (Films & Series)', value: 'syncLibrary' },
                      { label: 'Import Library (Letterboxd+)', value: 'importLibrary' },
                      { label: 'Export Library (Letterboxd+)', value: 'exportLibrary' },
                    ];

                    const selectedSetting = await engine.prompt.suggester({ placeholder: 'What would you like to do?', options: settingsOptions });
                    if (!selectedSetting) return new Notice("No action selected.");

                    switch (selectedSetting) {
                        case 'syncAllSeries':
                            await lib.syncAllSeries(basePath, tmdbKey);
                            break;
                        case 'syncLibrary':
                            await lib.syncLibrary(basePath, tmdbKey);
                            break;
                        case 'importLibrary':
                            // Retrieve available Letterboxd+ export folders and prompt user to select one for import
                            const letterboxdPlusExports = await lib.fetchLetterboxdPlusJsonExports(basePath)

                            if (!letterboxdPlusExports) {
                                return;
                            }

                            const letterboxdPlusExportOptions = letterboxdPlusExports.map(fullPath => {
                              const parts = fullPath.split('/');
                              const fileName = parts[parts.length - 1]; // Get last segment of path
                              return {
                                label: fileName,
                                value: fullPath
                              };
                            });

                            const selectedLetterboxdPlusExport = await engine.prompt.suggester({
                              placeholder: 'Select a Letterboxd+ export file to import from:',
                              options: letterboxdPlusExportOptions,
                            });

                            if (!selectedLetterboxdPlusExport) {
                              new Notice("No export file selected.");
                              return;
                            }

                            await lib.importLibrary(basePath, selectedLetterboxdPlusExport);
                            break;
                        case 'exportLibrary':
                            const jsonPath = await lib.generateLetterboxdPlusJsonPath(basePath)
                            const jsonFile = await app.vault.getFileByPath(jsonPath)

                            if (jsonFile) {
                                const replaceExportFile = await engine.prompt.yesNo({
                                    title: "Replace existing export file?",
                                    content: "An export file already exists. Do you want to replace it with a new one?"
                                });

                                if (!replaceExportFile) return new Notice("No export folder selected.");
                            }

                            await lib.exportLibrary(basePath);
                            const fileName = jsonPath.split('/').pop();
                            new Notice("Letterboxd library exported as " + fileName + " in Core/Scripts.");
                            break;
                        default:
                            return new Notice("Unknown action selected.");
                    }
                })();
            `,
        },
    },
    isPreview: false,
});

mb.wrapInMDRC(button, container, component);
```

# Series Profile

<br/>
<div class="divider" />

<!-- Currently Watching -->
```js-engine
return engine.markdown.create(`
<div class="profile-non-link">
    <div>Currently Watching</div>
</div>

`);
```

```dataviewjs
function getParentPath(fullPath, targetFolder) {
    const index = fullPath.indexOf(targetFolder);
    if (index === -1) return null; // Target folder not found

    const subPath = fullPath.substring(0, index + targetFolder.length);
    return subPath;
}

const filePath = dv.current().file.path
const basePath = getParentPath(filePath, 'Letterboxd+')

// Generate folderPath
const folderPath = `${basePath}/Series`

// Use DataviewJS to query the "Series" folder
let series = dv.pages(`"${folderPath}"`)
    .where(page => page.poster && page.status === 'Watching')
    .sort(page => page.last_watched, 'desc')
    .slice(0,4);

const isMobile = window.app.isMobile;
if (isMobile) {
    series = series.slice(0, 4);
} else {
    series = series.slice(0, 8);
}

// Create the table with only the Poster as a link to the series title
dv.table(["Poster"], series.map(s => [
    `[![Poster](${s.poster})](${s.file.name})`
]));
```

<div class="divider" />

<!-- Favorites -->
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
const seriesFavoritesFilePath = `${basePath}/Core/Series/series-favorites.md`
const seriesFavoritesUri = convertFilePathToObsidianUri(seriesFavoritesFilePath)

return engine.markdown.create(`
<a href="${seriesFavoritesUri}" class="profile-link">
    <div>Favorites</div>
</a>

`);
```

```dataviewjs
// Section: Favorite Series
function getParentPath(fullPath, targetFolder) {
    const index = fullPath.indexOf(targetFolder);
    if (index === -1) return null; // Target folder not found

    const subPath = fullPath.substring(0, index + targetFolder.length);
    return subPath;
}

const filePath = dv.current().file.path
const basePath = getParentPath(filePath, 'Letterboxd+')

// Generate folderPath
const folderPath = `${basePath}/Series`

// Use DataviewJS to query the "Series" folder
let series = dv.pages(`"${folderPath}"`)
    .where(page => page.poster && page.status !== 'Watchlist' && page.favorite)
    .sort(() => Math.random() - 0.5)

const isMobile = window.app.isMobile;
if (isMobile) {
    series = series.slice(0, 4);
} else {
    series = series.slice(0, 8);
}

// Create the table with only the Poster as a link to the series title
dv.table(["Poster"], series.map(s => [
    `[![Poster](${s.poster})](${s.file.name})`
]));
```

<div class="divider" />

<!-- Likes -->
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
const seriesLikesFilePath = `${basePath}/Core/Series/series-likes.md`
const seriesLikesUri = convertFilePathToObsidianUri(seriesLikesFilePath)

return engine.markdown.create(`
<a href="${seriesLikesUri}" class="profile-link">
    <div>Likes</div>
</a>

`);
```

```dataviewjs
function getParentPath(fullPath, targetFolder) {
    const index = fullPath.indexOf(targetFolder);
    if (index === -1) return null; // Target folder not found

    const subPath = fullPath.substring(0, index + targetFolder.length);
    return subPath;
}

const filePath = dv.current().file.path
const basePath = getParentPath(filePath, 'Letterboxd+')

// Generate folderPath
const folderPath = `${basePath}/Series`

// Use DataviewJS to query the "Series" folder
let series = dv.pages(`"${folderPath}"`)
    .where(page => page.poster && page.status !== 'Watchlist' && page.like)
    .sort(() => Math.random() - 0.5)

const isMobile = window.app.isMobile;
if (isMobile) {
    series = series.slice(0, 4);
} else {
    series = series.slice(0, 8);
}

// Create the table with only the Poster as a link to the series title
dv.table(["Poster"], series.map(s => [
    `[![Poster](${s.poster})](${s.file.name})`
]));
```

<div class="divider" />

<!-- Recent Activity -->
```js-engine
return engine.markdown.create(`
<div class="profile-non-link">
    <div>Recent Activity</div>
</div>

`);
```

```dataviewjs
function getParentPath(fullPath, targetFolder) {
    const index = fullPath.indexOf(targetFolder);
    if (index === -1) return null; 
    return fullPath.substring(0, index + targetFolder.length);
}

const filePath = dv.current().file.path;
const basePath = getParentPath(filePath, 'Letterboxd+');
const folderPath = `${basePath}/Series`;

let series = dv.pages(`"${folderPath}"`)
    .where(s => s.poster).
    sort(s => s.last_updated, "desc")

const isMobile = window.app.isMobile;
if (isMobile) {
    series = series.slice(0, 4);
} else {
    series = series.slice(0, 8);
}

// Now display with correct file links
dv.table(["Poster"], series.map(s => [
    `[![Poster](${s.poster})](${s.file.name})`
]));
```

<div class="divider" />

<!-- Ratings -->
```dataviewjs
function getParentPath(fullPath, targetFolder) {
    const index = fullPath.indexOf(targetFolder);
    if (index === -1) return null; // Target folder not found

    const subPath = fullPath.substring(0, index + targetFolder.length);
    return subPath;
}

const filePath = dv.current().file.path;
const basePath = getParentPath(filePath, 'Letterboxd+');
const folderPath = `${basePath}/Series`;

let pages = dv.pages(`"${folderPath}"`).where(p => typeof p.rating === "number" && !isNaN(p.rating) && p.status !== "Watchlist");

// Initialize an array to track counts (index 0 → rating 0, index 10 → rating 5)
let ratingCounts = Array(11).fill(0);

// Count occurrences of each rating for watched series only
pages.forEach(p => {
    let index = Math.round(p.rating * 2); // Convert rating to array index
    if (index >= 0 && index <= 10) ratingCounts[index]++;
});

// Calculate total reviews
let totalReviews = ratingCounts.reduce((sum, count) => sum + count, 0);

// Convert counts to proportions (proportions should sum to 1)
let ratingProportions = ratingCounts.map(count => (totalReviews > 0 ? count / totalReviews : 0));

// Labels for each rating (0 to 5 in steps of 0.5)
let labels = Array.from({ length: 11 }, (_, i) => (i / 2).toFixed(1));

// Custom labels for 0 and 5 (first and last rows)
labels[0] = "★";    // Custom label for rating 0
labels[10] = "★★★★★";   // Custom label for rating 5

// Chart configuration for proportions
const chartData = { 
    type: 'bar', 
    data: { 
        labels: labels, // X-axis: Ratings
        datasets: [{ 
            label: 'Proportion of Reviews', 
            data: ratingProportions, // Y-axis: Proportions
            backgroundColor: 'rgba(75, 85, 100, 0.5)', 
            borderColor: 'rgba(75, 85, 100, 1)', 
            borderWidth: 1,
            minBarLength: 1,
            categoryPercentage: 0.95, // Controls the space taken by the entire category (group of bars)
            barPercentage: 1  // Controls the width of the individual bars in each category (group)
        }] 
    },
    options: { 
        responsive: true, 
        maintainAspectRatio: false,  
        scales: { 
            x: { 
                title: { display: false }, // Hide the X-axis title
                ticks: { 
                    autoSkip: false,
                    minRotation: 0,
                    maxRotation: 0,
                    callback: function(value, index) {
                        // Show only the labels for the first (0) and last (5) ratings
                        return index === 0 || index === 10 ? this.getLabelForValue(value) : '';
                    },
                    font: {
                        size: 12
                    }
                },
                grid: { display: false }  // Hide grid lines on the x-axis
            }, 
            y: { 
                title: { display: false }, // Hide the Y-axis title
                ticks: { display: false }, // Hide the Y-axis labels
                beginAtZero: true,
                max: 1, // Ensures Y-axis is between 0 and 1
                grid: { display: false }  // Hide grid lines on the y-axis
            }  
        }, 
        plugins: { 
            legend: { display: false }, // Hide legend
            tooltip: { enabled: true } // Enable tooltips for proportions
        }
    } 
}; 

// Apply a CSS class if needed
this.container.classList.add("letterboxd-series-chart-height");

// Render the chart inside the container
window.renderChart(chartData, this.container);
```

<!-- Navigation -->
```dataviewjs
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

const filePath = dv.current().file.path
const basePath = getParentPath(filePath, 'Letterboxd+')

// Generate folderPath
const seriesFolderPath = `${basePath}/Series`
let series = dv.pages(`"${seriesFolderPath}"`).where(s => s.poster && s.status !== 'Watchlist')

let menus = [[]]
menus[0].push([])

// Get the current year
let currentYear = new Date().getFullYear(); 

// Section: Series
let seriesFilePath = `${basePath}/Core/Series/series-series.md`
let seriesObsidianURI = convertFilePathToObsidianUri(seriesFilePath)

// Find all series with watch_dates in the current year
let uniqueSeriesWatchedThisYear = dv.pages(`"${seriesFolderPath}"`)
    .filter(f => f.status != 'Watchlist' && Array.isArray(f.watch_dates) && f.watch_dates.some(sublist => 
        Array.isArray(sublist) && 
        sublist.some(date => new Date(date).getFullYear() === currentYear)
    ));

// Find how many of these series have a first_air_date in the current year
let uniqueSeriesWatchedAndReleasedThisYear = uniqueSeriesWatchedThisYear
    .filter(f => f.status != 'Watchlist' && f.season_air_dates[0] && new Date(f.season_air_dates[0]).getFullYear() === currentYear);

// Find only series that had a new season this year and check if those seasons have been watched
let uniqueSeriesWithNewSeasonsWatchedThisYear = uniqueSeriesWatchedThisYear.filter(f => {
    // Find seasons that are released in the current year
    let newSeasonsThisYear = f.season_air_dates.filter(seasonDate => new Date(seasonDate).getFullYear() === currentYear);
    
    // Check if the user has watched any episodes from the new season(s)
    return newSeasonsThisYear.some(seasonDate => {
        // Find the index of the season based on the air date
        let seasonIndex = f.season_air_dates.indexOf(seasonDate);
        // Check if any episode from this season has been watched in the current year
        return Array.isArray(f.watch_dates[seasonIndex]) && f.watch_dates[seasonIndex].some(episodeDate => new Date(episodeDate).getFullYear() === currentYear);
    });
});

// Count the series with new seasons watched this year
let newSeasonsWatchedThisYearCount = uniqueSeriesWithNewSeasonsWatchedThisYear.length;

// Find how many of these series have a first_air_date in the current year
let uniqueSeriesWatchedAndReleasedThisYearCount = uniqueSeriesWatchedAndReleasedThisYear.length;

// Push to menu
menus[0].push([
    `<a href="${seriesObsidianURI}" class="letterboxd-series-menu-item">
        <div class="letterboxd-series-menu-item-text">Series</div>
        <div class="letterboxd-series-menu-item-data">
            <span class="letterboxd-series-menu-item-data-stats"> ${uniqueSeriesWatchedThisYear.length}/${uniqueSeriesWatchedAndReleasedThisYearCount}</span> | 
            <span class="letterboxd-series-menu-item-data-stats">+${newSeasonsWatchedThisYearCount}</span> new seasons watched this year 
            <span class="letterboxd-series-menu-item-bracket">›</span>
        </div>
    </a>`
]);
// Section: Diary
let diary = series

let totalWatchEpisodesThisYear = 0;
let watchEpisodesThisYearFromNewSeasons = 0;

let totalRewatchEpisodesThisYear = 0;
let rewatchEpisodesThisYearFromNewSeasons = 0;

for (let page of diary) {
    // Calculate Watch Episodes for this year
    if (page.watch_dates) {
        page.watch_dates.forEach((season, seasonIndex) => {
            season.forEach((date) => {
                const watchDate = new Date(date);
                if (watchDate.getFullYear() === currentYear) {
                    totalWatchEpisodesThisYear++; // Total watch episodes this year
                    
                    // Check if the season aired this year (2025)
                    if (new Date(page.season_air_dates[seasonIndex]).getFullYear() === currentYear) {
                        watchEpisodesThisYearFromNewSeasons++; // Watch episodes from new seasons
                    }
                }
            });
        });
    }

    // Calculate Rewatch Episodes for this year
    if (page.rewatch_dates) {
        page.rewatch_dates.forEach((rewatch) => {
            rewatch.forEach((season, seasonIndex) => {
                season.forEach((date) => {
                    const rewatchDate = new Date(date);
                    if (rewatchDate.getFullYear() === currentYear) {
                        totalRewatchEpisodesThisYear++; // Total rewatch episodes this year
                        
                        // Check if the rewatched season aired this year (2025)
                        if (new Date(page.season_air_dates[seasonIndex]).getFullYear() === currentYear) {
                            rewatchEpisodesThisYearFromNewSeasons++; // Rewatch episodes from new seasons
                        }
                    }
                });
            });
        });
    }
}

let diaryFilePath = `${basePath}/Core/Series/series-diary.md`
let diaryObsidianURI = convertFilePathToObsidianUri(diaryFilePath)

menus[0].push([
	`<a href="${diaryObsidianURI}" class="letterboxd-series-menu-item">
		<div class="letterboxd-series-menu-item-text">Diary</div>
		<div class="letterboxd-series-menu-item-data"><span class="letterboxd-series-menu-item-data-stats">${totalWatchEpisodesThisYear}/${watchEpisodesThisYearFromNewSeasons}</span> | <span class="letterboxd-series-menu-item-data-stats">${totalRewatchEpisodesThisYear}/${rewatchEpisodesThisYearFromNewSeasons}</span> this year <span class="letterboxd-series-menu-item-bracket">›</span></div>
	</a>`
])


// Section: Reviews
let reviewCount = dv.pages(`"${seriesFolderPath}"`)
    .where(s => s.poster && s.status !== 'Watchlist' && s.review && s.review.trim().length > 0).length;

let reviewsFilePath = `${basePath}/Core/Series/series-reviews.md`
let reviewsObsidianURI = convertFilePathToObsidianUri(reviewsFilePath)    
    
menus[0].push([
	`<a href="${reviewsObsidianURI}" class="letterboxd-series-menu-item">
		<div class="letterboxd-series-menu-item-text">Reviews</div>
		<div class="letterboxd-series-menu-item-data">${reviewCount} <span class="letterboxd-series-menu-item-bracket">›</span></div>
	</a>`
])

// Section: Quotes
let quotesFilePath = `${basePath}/Core/Series/series-quotes.md`
let quotesObsidianURI = convertFilePathToObsidianUri(quotesFilePath);  

let totalQuotes = 0;

for (let page of dv.pages(`"${seriesFolderPath}"`)) {
    if (page.poster && page.status !== 'Watchlist' && Array.isArray(page.quotes)) {
        totalQuotes += page.quotes.length;
    }
}
    
menus[0].push([
	`<a href="${quotesObsidianURI}" class="letterboxd-series-menu-item">
		<div class="letterboxd-series-menu-item-text">Quotes</div>
		<div class="letterboxd-series-menu-item-data">${totalQuotes} <span class="letterboxd-series-menu-item-bracket">›</span></div>
	</a>`
])

// Section: Lists
 function getParentPath(fullPath, targetFolder) {
    const index = fullPath.indexOf(targetFolder);
    if (index === -1) return null;
    return fullPath.substring(0, index + targetFolder.length);
}

async function getListFileCount(basePath) {
    try {
        const listFolderPath = `${basePath}/Core/Series/Lists`;
        const files = app.vault.getFiles().filter(file => file.path.startsWith(listFolderPath));
        return files.length; // Return the file count
    } catch (error) {
        console.error("Error fetching file count:", error);
        return 0; // Return 0 in case of an error
    }
}

const listCount = await getListFileCount(basePath);

let listsFilePath = `${basePath}/Core/Series/series-lists.md`
let listsObsidianURI = convertFilePathToObsidianUri(listsFilePath)  

menus[0].push([
	`<a href="${listsObsidianURI}" class="letterboxd-series-menu-item">
		<div class="letterboxd-series-menu-item-text">Lists</div>
		<div class="letterboxd-series-menu-item-data">${listCount} <span class="letterboxd-series-menu-item-bracket">›</span></div>
	</a>`
])

// Section: Watchlist
let watchlistSeriesCount = dv.pages(`"${seriesFolderPath}"`).where(s => s.status === 'Watchlist').length; ; 

let watchlistFilePath = `${basePath}/Core/Series/series-watchlist.md`
let watchlistObsidianURI = convertFilePathToObsidianUri(watchlistFilePath) 

menus[0].push([
	`<a href="${watchlistObsidianURI}" class="letterboxd-series-menu-item">
		<div class="letterboxd-series-menu-item-text">Watchlist</div>
		<div class="letterboxd-series-menu-item-data">${watchlistSeriesCount} <span class="letterboxd-series-menu-item-bracket">›</span></div>
	</a>`
])

// Section: Likes
let likedSeriesCount = series.where(s => s.like).length

let likesFilePath = `${basePath}/Core/Series/series-likes.md`
let likesObsidianURI = convertFilePathToObsidianUri(likesFilePath)

menus[0].push([
	`<a href="${likesObsidianURI}" class="letterboxd-series-menu-item">
		<div class="letterboxd-series-menu-item-text">Likes</div>
		<div class="letterboxd-series-menu-item-data">${likedSeriesCount} <span class="letterboxd-series-menu-item-bracket">›</span></div>
	</a>`
])

// Favorites
let favoriteSeriesCount = series.where(s => s.favorite).length

let favoritesFilePath = `${basePath}/Core/Series/series-favorites.md`
let favoritesObsidianURI = convertFilePathToObsidianUri(favoritesFilePath)

menus[0].push([
	`<a href="${favoritesObsidianURI}" class="letterboxd-series-menu-item">
		<div class="letterboxd-series-menu-item-text">Favorites</div>
		<div class="letterboxd-series-menu-item-data">${favoriteSeriesCount} <span class="letterboxd-series-menu-item-bracket">›</span></div>
	</a>`
])

dv.table([], menus)
```
