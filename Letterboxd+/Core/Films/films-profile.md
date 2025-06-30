---
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
> [!note-toolbar|button-center-noborder]
> - [:LiTv: Series →](${seriesUris['profile']})

> [!note-toolbar|button-center-border]
> - \`BUTTON[log-film]\`
> - <hr/>
> - [:LiCircleUser:]()
> - [:LiBookMarked:](${filmsUris['diary']})
> - [:LiList:](${filmsUris['lists']})
> - [:LiBookmark:](${filmsUris['watchlist']})
> - <hr/>
> - \`BUTTON[library]\`
    `);
} else {
    return engine.markdown.create(`
> [!note-toolbar|button-center-noborder]
> - [:LiTv: Series →](${seriesUris['profile']})

> [!note-toolbar|button-center-border]
> - \`BUTTON[log-film]\`
> - <hr/>
> - [:LiCircleUser: Profile]()
> - [:LiBookMarked: Diary](${filmsUris['diary']})
> - [:LiList: Lists](${filmsUris['lists']})
> - [:LiBookmark: Watchlist](${filmsUris['watchlist']})
> - <hr/>
> - \`BUTTON[library]\`
    `);
}
```

<!-- Button: Log Film -->
```js-engine
const mb = app.plugins.getPlugin('obsidian-meta-bind-plugin')?.api;

const label = app.isMobile ? '' : 'Log';

const button = mb.createButtonMountable(context.file.path, {
    declaration: {
        label,
        style: 'default',
        icon: 'ticket-plus',
        id: 'log-film',
        class: '',
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
                    if (!basePath) return error("Could not resolve Letterboxd+ path.");

                    const scriptPath = basePath + "/Core/Scripts/letterboxd.js"
                    const secretsPath = basePath + "/Core/Scripts/api_keys.json";

                    const lib = await engine.importJs(scriptPath);
                    const tmdbKey = await lib.getApiKey(secretsPath, 'tmdb');

                    // ───── Prompt for Film ─────
                    const query = await engine.prompt.text({ title: 'Film to log?', placeholder: 'Film name...' });
                    if (!query) return error("No query entered for film.");

                    // ───── Search TMDB ─────
                    const results = await lib.searchTMDB('film', tmdbKey, query);
                    if (!results?.length) return error("No results found.");

                    const listOptions = await Promise.all(
                        results.map(async result => ({
                            label: await lib.createFilmLabelFromResult(result),
                            value: result
                        }))
                    );

                    const choice = await engine.prompt.suggester({
                        placeholder: 'Select a film',
                        options: listOptions
                    });
                    if (!choice) return error("No film selected.");

                    await lib.addFilmToLibrary(basePath, choice.id, tmdbKey)
                })();
            `,
        },
    },
    isPreview: false,
});

mb.wrapInMDRC(button, container, component);
```

<!-- Button: Sync -->
```js-engine
const mb = app.plugins.getPlugin('obsidian-meta-bind-plugin')?.api;

const label = app.isMobile ? '' : 'Sync';

const button = mb.createButtonMountable(context.file.path, {
  declaration: {
    label: label,
    style: 'default',
    icon: 'refresh-ccw',
    id: 'sync-films',
    hidden: true,
    action: {
      type: 'inlineJS',
      code: `
        (async () => {
            function getParentPath(fullPath, targetFolder) {
                const index = fullPath.indexOf(targetFolder);
                return index === -1 ? null : fullPath.substring(0, index + targetFolder.length);
            }

            const basePath = getParentPath(context.file.path, "Letterboxd+");
            if (!basePath) return new Notice("Could not resolve Letterboxd+ path.");

            const scriptPath = basePath + "/Core/Scripts/letterboxd.js";
            const secretsPath = basePath + "/Core/Scripts/api_keys.json";

            const lib = await engine.importJs(scriptPath);
            if (!lib) return new Notice("Failed to load core script.");

            const tmdbKey = await lib.getApiKey(secretsPath, 'tmdb');
            if (!tmdbKey) return new Notice("TMDB API key not found.");

            await lib.syncAllFilms(basePath, tmdbKey)
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
                    if (!basePath) return error("Could not resolve Letterboxd+ path.");

                    const scriptPath = basePath + "/Core/Scripts/letterboxd.js"
                    const secretsPath = basePath + "/Core/Scripts/api_keys.json";

                    const lib = await engine.importJs(scriptPath);
                    const tmdbKey = await lib.getApiKey(secretsPath, 'tmdb');

                    // ───── Prompt for Setting Option ─────
                    const settingsOptions = [
                      { label: 'Sync All Films', value: 'syncAllFilms' },
                      { label: 'Sync Entire Library (Films & Series)', value: 'syncLibrary' },
                      { label: 'Import from Letterboxd (Offical)', value: 'importOffical' },
                      { label: 'Import Library (Letterboxd+)', value: 'importLibrary' },
                      { label: 'Export Library (Letterboxd+)', value: 'exportLibrary' },
                    ];

                    const selectedSetting = await engine.prompt.suggester({ placeholder: 'What would you like to do?', options: settingsOptions });
                    if (!selectedSetting) return new Notice("No action selected.");

                    switch (selectedSetting) {
                        case 'syncAllFilms':
                            await lib.syncAllFilms(basePath, tmdbKey);
                            break;
                        case 'syncLibrary':
                            await lib.syncLibrary(basePath, tmdbKey);
                            break;
                        case 'importOffical': 

                            // Retrieve available Letterboxd+ export folders and prompt user to select one for import
                            const letterboxdExports = await lib.fetchLetterboxdExportFolders(basePath)

                            const letterboxdExportOptions = letterboxdExports.map(fullPath => {
                              const parts = fullPath.split('/');
                              const folderName = parts[parts.length - 1]; // Get last segment of path
                              return {
                                label: folderName,
                                value: fullPath
                              };
                            });

                            const selectedLetterboxdExportFolder = await engine.prompt.suggester({
                              placeholder: 'Select a Letterboxd+ export folder to import from:',
                              options: letterboxdExportOptions,
                            });

                            // Parse Letterboxd export folder into a unified dataset
                            const mergedLetterboxdExportData = await lib.parseLetterboxdExport(selectedLetterboxdExportFolder, tmdbKey);

                            const films = Object.keys(mergedLetterboxdExportData);

                            // Initialize counters for import progress tracking
                            let added = 0;
                            let skipped = 0;
                            let failed = 0;
                            let processedFiles = 0;
                            const totalFiles = films.length
                            const addedFilms = [];
                            const skippedFilms = [];
                            const failedFilms = [];

                            const progressInterval = totalFiles <= 50
                            ? 10
                            : totalFiles <= 500
                                ? Math.max(1, Math.floor(totalFiles / 5))
                                : Math.max(1, Math.floor(totalFiles / 10));

                            new Notice("📦 Importing " + totalFiles + " films from Letterboxd export...", 5000);

                            // Loop through each film entry, fetch TMDB details, and add to library
                            for (const [key, entry] of Object.entries(mergedExportData)) {
                              const film = await lib.fetchFilmDetailsByQuery(entry.name, tmdbKey, entry.year)
                              const result = await lib.addFilmToLibrary(basePath, film.id, tmdbKey, openAfterCreate = false, showNotice = false)

                              switch (result.status) {
                                case 'created':
                                  added++;
                                  addedFilms.push(film.title);
                                  break;
                                case 'skipped':
                                  skipped++;
                                  skippedFilms.push(film.title);
                                  break;
                                case 'error':
                                  failed++;
                                  failedFilms.push(\`\${film.title} — \${result.message}\`);
                                  break;
                              }

                              // Show progress at intervals and delay between TMDB requests
                              processedFiles++;
                              if (processedFiles % progressInterval === 0 || processedFiles === totalFiles) {
                                new Notice(\`Progress: \${Math.round((processedFiles / totalFiles) * 100)}% (\${processedFiles}/\${totalFiles})\`, 5000);
                              }

                              await lib.delay(250);
                            }

                            new Notice("✅ Letterboxd import complete!\\nGenerating summary...");

                            const summaryNotice = 
                                "📚 Letterboxd Import Summary (Official)\\n" +
                                "-".repeat(40) + "\\n" +
                                "🎬 Films: 🟢 " + added.toString().padEnd(3) + " | 🟡 " + skipped.toString().padEnd(3) + " | 🔴 " + failed.toString().padEnd(3) + "\\n"

                            const summaryConsole = 
                                "📚 Letterboxd Import Summary (Official)\\n" +
                                "-".repeat(25) + "\\n" +
                                "🎬 Films: 🟢 " + added.toString().padEnd(3) + " | 🟡 " + skipped.toString().padEnd(3) + " | 🔴 " + failed.toString().padEnd(3) + "\\n"

                            new Notice(summaryNotice, 8000); 
                            console.log(summaryConsole);
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
                              placeholder: 'Select a Letterboxd+ export folder to import from:',
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

# Films Profile

<br/>
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
const filmsFavoritesFilePath = `${basePath}/Core/Films/films-favorites.md`
const filmsFavoritesUri = convertFilePathToObsidianUri(filmsFavoritesFilePath)

return engine.markdown.create(`
<a href="${filmsFavoritesUri}" class="profile-link">
	<div>Favorite Films</div>
</a>

`);
```

```dataviewjs
// Section: Favorite Films
function getParentPath(fullPath, targetFolder) {
    const index = fullPath.indexOf(targetFolder);
    if (index === -1) return null; // Target folder not found

    const subPath = fullPath.substring(0, index + targetFolder.length);
    return subPath;
}

const filePath = dv.current().file.path
const basePath = getParentPath(filePath, 'Letterboxd+')

// Generate folderPath
const folderPath = `${basePath}/Films`

// Use DataviewJS to query the "Films" folder
let films = dv.pages(`"${folderPath}"`)
    .where(film => film.poster && film.watched && film.favorite)
    .sort(() => Math.random() - 0.5)

const isMobile = window.app.isMobile;
if (isMobile) {
	films = films.slice(0, 4);
} else {
	films = films.slice(0, 8);
}

// Create the table with only the Poster as a link to the film title
dv.table(["Poster"], films.map(film => [
    `[![Poster](${film.poster})](${film.file.name})`
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
const filmsLikesFilePath = `${basePath}/Core/Films/films-likes.md`
const filmsLikesUri = convertFilePathToObsidianUri(filmsLikesFilePath)

return engine.markdown.create(`
<a href="${filmsLikesUri}" class="profile-link">
	<div class="profile-link">Recent Likes</div>
</a>
`);
```

```dataviewjs
// Section: Recent Likes
function getParentPath(fullPath, targetFolder) {
    const index = fullPath.indexOf(targetFolder);
    if (index === -1) return null; // Target folder not found

    const subPath = fullPath.substring(0, index + targetFolder.length);
    return subPath;
}

const filePath = dv.current().file.path
const basePath = getParentPath(filePath, 'Letterboxd+')

// Generate folderPath
const folderPath = `${basePath}/Films`

// Use DataviewJS to query the "Films" folder
let films = dv.pages(`"${folderPath}"`)
    .where(film => film.poster && film.watched && film.like)
    .sort(film => film.mday, 'desc')

const isMobile = window.app.isMobile;
if (isMobile) {
	films = films.slice(0, 4);
} else {
	films = films.slice(0, 8);
}


// Create the table with only the Poster as a link to the film title
dv.table(["Poster"], films.map(film => [
    `[![Poster](${film.poster})](${film.file.name})`
]));
```

<div class="divider" />

<!-- Recent Activity -->
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
const filmsRecentActivityFilePath = `${basePath}/Core/Films/films-activity.md`
const filmsRecentActivityUri = convertFilePathToObsidianUri(filmsRecentActivityFilePath)

return engine.markdown.create(`
<a href="${filmsRecentActivityUri}" class="profile-link">
	<div class="profile-link">Recent Activity</div>
</a>
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
const folderPath = `${basePath}/Films`;

let films = dv.pages(`"${folderPath}"`)
    .where(f => f.poster).
    sort(f => f.last_updated, "desc")

const isMobile = window.app.isMobile;
if (isMobile) {
    films = films.slice(0, 4);
} else {
    films = films.slice(0, 8);
}

// Now display with correct file links
dv.table(["Poster"], films.map(f => [
    `[![Poster](${f.poster})](${f.file.name})`
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

const filePath = dv.current().file.path
const basePath = getParentPath(filePath, 'Letterboxd+')
const folderPath = `${basePath}/Films`

let pages = dv.pages(`"${folderPath}"`).where(p => p.rating !== undefined && p.rating !== null && !isNaN(p.rating) && p.watched === true);

// Initialize an array to track counts (index 0 → rating 0, index 10 → rating 5)
let ratingCounts = Array(11).fill(0);

// Count occurrences of each rating for watched films only
[...pages].forEach(p => {
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
this.container.classList.add("letterboxd-film-chart-height");
    
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
const filmsFolderPath = `${basePath}/Films`
const films = dv.pages(`"${filmsFolderPath}"`)
    .where(p => p.poster && p.watched)

// Initialize menu list
let menus = [[]]
menus[0].push([])

// Current Year
let currentYear = new Date().getFullYear(); // Get the current year

// Films
let uniqueFilmsWatchedThisYear = films
	.where(f => f.watch_date && new Date(f.watch_date).getFullYear() === currentYear)

let uniqueFilmsWatchedAndReleasedThisYear = uniqueFilmsWatchedThisYear.filter(f => Number(f.release_year) === currentYear)

let filmsFilePath = `${basePath}/Core/Films/films-films.md`
let filmsObsidianURI = convertFilePathToObsidianUri(filmsFilePath)

menus[0].push([
	`<a href="${filmsObsidianURI}" class="letterboxd-films-menu-item">
		<div class="letterboxd-films-menu-item-text">Films</div>
		<div class="letterboxd-films-menu-item-data">${uniqueFilmsWatchedThisYear.length}/${uniqueFilmsWatchedAndReleasedThisYear.length} this year <span class="letterboxd-films-menu-item-bracket">›</span></div>
	</a>`
])

// Diary
let totalFilms = films.length; 

let allDiaryDatesThisYear = films
    .flatMap(f => {
        let dates = [];

        // Include watch_date if it exists and is from this year
        if (f.watch_date && new Date(f.watch_date).getFullYear() === currentYear) {
            dates.push(f.watch_date);
        }

        // Include all rewatch_dates from this year
        if (Array.isArray(f.rewatch_dates)) {
            dates.push(...f.rewatch_dates.filter(date => new Date(date).getFullYear() === currentYear));
        }

        return dates;
    }).length;

let allDiaryDatesThisYearReleased = films
    .flatMap(f => {
        let dates = [];

        // Include watch_date if the film's release date and watch_date are from this year
        if (f.watch_date && f.release_date && new Date(f.watch_date).getFullYear() === currentYear && new Date(f.release_date).getFullYear() === currentYear) {
            dates.push(f.watch_date);
        }

        // Include all rewatch_dates if the film's release date is from this year
        if (Array.isArray(f.rewatch_dates) && f.release_date && new Date(f.release_date).getFullYear() === currentYear) {
            dates.push(...f.rewatch_dates.filter(date => new Date(date).getFullYear() === currentYear));
        }

        return dates;
    }).length;


let diaryFilePath = `${basePath}/Core/Films/films-diary.md`
let diaryObsidianURI = convertFilePathToObsidianUri(diaryFilePath)

menus[0].push([
	`<a href="${diaryObsidianURI}" class="letterboxd-films-menu-item">
		<div class="letterboxd-films-menu-item-text">Diary</div>
		<div class="letterboxd-films-menu-item-data">${allDiaryDatesThisYear}/${allDiaryDatesThisYearReleased} this year <span class="letterboxd-films-menu-item-bracket">›</span></div>
	</a>`
])


// Reviews
let reviewCount = films
    .where(p => p.review && p.review.trim().length > 0).length;
    
let reviewsFilePath = `${basePath}/Core/Films/films-reviews.md`
let reviewsObsidianURI = convertFilePathToObsidianUri(reviewsFilePath)    
    
menus[0].push([
	`<a href="${reviewsObsidianURI}" class="letterboxd-films-menu-item">
		<div class="letterboxd-films-menu-item-text">Reviews</div>
		<div class="letterboxd-films-menu-item-data">${reviewCount} <span class="letterboxd-films-menu-item-bracket">›</span></div>
	</a>`
])

// Quotes
let quotesFilePath = `${basePath}/Core/Films/films-quotes.md`
let quotesObsidianURI = convertFilePathToObsidianUri(quotesFilePath);  

let totalQuotes = 0;

for (let page of dv.pages(`"${filmsFolderPath}"`)) {
    if (page.poster && page.status !== 'Watchlist' && Array.isArray(page.quotes)) {
        totalQuotes += page.quotes.length;
    }
}
    
menus[0].push([
	`<a href="${quotesObsidianURI}" class="letterboxd-films-menu-item">
		<div class="letterboxd-films-menu-item-text">Quotes</div>
		<div class="letterboxd-films-menu-item-data">${totalQuotes} <span class="letterboxd-films-menu-item-bracket">›</span></div>
	</a>`
])

// Lists
 function getParentPath(fullPath, targetFolder) {
    const index = fullPath.indexOf(targetFolder);
    if (index === -1) return null;
    return fullPath.substring(0, index + targetFolder.length);
}

async function getListFileCount(basePath) {
    try {
        const listFolderPath = `${basePath}/Core/Films/Lists`;
        const files = app.vault.getFiles().filter(file => file.path.startsWith(listFolderPath));
        return files.length; // Return the file count
    } catch (error) {
        console.error("Error fetching file count:", error);
        return 0; // Return 0 in case of an error
    }
}

const listCount = await getListFileCount(basePath);

let listsFilePath = `${basePath}/Core/Films/films-lists.md`
let listsObsidianURI = convertFilePathToObsidianUri(listsFilePath) 

menus[0].push([
	`<a href="${listsObsidianURI}" class="letterboxd-films-menu-item">
		<div class="letterboxd-films-menu-item-text">Lists</div>
		<div class="letterboxd-films-menu-item-data">${listCount} <span class="letterboxd-films-menu-item-bracket">›</span></div>
	</a>`
])

// Watchlist
let watchlistFilmsCount = dv.pages(`"${filmsFolderPath}"`).where(f => !f.watched).length; 

let watchlistFilePath = `${basePath}/Core/Films/films-watchlist.md`
let watchlistObsidianURI = convertFilePathToObsidianUri(watchlistFilePath) 

menus[0].push([
	`<a href="${watchlistObsidianURI}" class="letterboxd-films-menu-item">
		<div class="letterboxd-films-menu-item-text">Watchlist</div>
		<div class="letterboxd-films-menu-item-data">${watchlistFilmsCount} <span class="letterboxd-films-menu-item-bracket">›</span></div>
	</a>`
])

// Likes
let likedFilmsCount = films.where(f => f.like).length;

let likesFilePath = `${basePath}/Core/films/films-likes.md`
let likesObsidianURI = convertFilePathToObsidianUri(likesFilePath)

menus[0].push([
	`<a href="${likesObsidianURI}" class="letterboxd-films-menu-item">
		<div class="letterboxd-films-menu-item-text">Likes</div>
		<div class="letterboxd-films-menu-item-data">${likedFilmsCount} <span class="letterboxd-films-menu-item-bracket">›</span></div>
	</a>`
])

// Favorites
let favoriteFilmsCount = films.where(f => f.favorite).length;

let favoritesFilePath = `${basePath}/Core/films/films-favorites.md`
let favoritesObsidianURI = convertFilePathToObsidianUri(favoritesFilePath)

menus[0].push([
	`<a href="${favoritesObsidianURI}" class="letterboxd-films-menu-item">
		<div class="letterboxd-films-menu-item-text">Favorites</div>
		<div class="letterboxd-films-menu-item-data">${favoriteFilmsCount} <span class="letterboxd-films-menu-item-bracket">›</span></div>
	</a>`
])

dv.table([], menus)
```
