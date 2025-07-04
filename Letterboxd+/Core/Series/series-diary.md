---
enableFilters: false
filterRewatches: false
filterLimitResults: 
cssclasses:
  - hidefilename
  - letterboxd
  - wide-page
---

<!-- ui: series-nav-toolbar (render) -->
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
> [!note-toolbar|button-center-border]
> - [:LiCircleUser:](${seriesUris['profile']})
> - [:LiBookMarked:]()
> - [:LiList:](${seriesUris['lists']})
> - [:LiBookmark:](${seriesUris['watchlist']})
    `);
} else {
    return engine.markdown.create(`
> [!note-toolbar|button-center-border]
> - [:LiCircleUser: Profile](${seriesUris['profile']})
> - [:LiBookMarked: Diary]()
> - [:LiList: Lists](${seriesUris['lists']})
> - [:LiBookmark: Watchlist](${seriesUris['watchlist']})
    `);
}
```

# Diary

<br/>
<div class="divider"/>

<!-- Filters -->
`VIEW[Filters][text(renderMarkdown)]` `INPUT[toggle:enableFilters]`

<!-- input: rewatch-status-filter -->
```meta-bind-js-view
{enableFilters} as enableFilters
---
// Filter: Rewatch Status

const filterRewatchStatus = ['All', 'First time watch', 'Rewatch']
const filterRewatchStatusOptions = filterRewatchStatus.map(x => `option(${x})`)

let str = '';
if (context.bound.enableFilters) {
    str = `\`VIEW[Rewatches][text(renderMarkdown)]\` \`INPUT[toggle:filterRewatches]\``;
}

// Create the markdown view with the reactive bindings
return engine.markdown.create(str);
```

<!-- input: limit-filter -->
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

<!-- input: reset-filters -->
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

<!-- input: reset-filters -->
```meta-bind-button
label: "Reset Filters"
hidden: true
id: "reset-filters"
style: default
icon: "list-restart"
actions:
  - type: updateMetadata
    bindTarget: filterRewatches
    evaluate: false
    value: false
  - type: updateMetadata
    bindTarget: filterLimitResults
    evaluate: false
    value: 200
```

<div class="divider"/>

<!-- dashboard: diary-entires -->
```dataviewjs
const iconWidth = 24;
const iconHeight = 24;

// Extracts the month
function getMonthFromDate(date) {
    const d = new Date(date);
    if (isNaN(d)) return null;
    return new Intl.DateTimeFormat('en', { month: 'short' }).format(d);
}

// Extracts the long version of month
function getLongMonthFromDate(date) {
    const d = new Date(date);
    if (isNaN(d)) return null;
    return new Intl.DateTimeFormat('en', { month: 'long' }).format(d).toUpperCase();
}

// Converts numerical rating into a star rating
function getRating(rating) {
    const isMobile = app.isMobile;

    // Define all star SVGs based on device type
    const full_star_svg = isMobile
        ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width=".75em" height=".75em" fill="currentColor"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M8.243 7.34l-6.38 .925l-.113 .023a1 1 0 0 0 -.44 1.684l4.622 4.499l-1.09 6.355l-.013 .11a1 1 0 0 0 1.464 .944l5.706 -3l5.693 3l.1 .046a1 1 0 0 0 1.352 -1.1l-1.091 -6.355l4.624 -4.5l.078 -.085a1 1 0 0 0 -.633 -1.62l-6.38 -.926l-2.852 -5.78a1 1 0 0 0 -1.794 0l-2.853 5.78z" /></svg>`
        : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="1.25em" height="1.25em" fill="currentColor"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M8.243 7.34l-6.38 .925l-.113 .023a1 1 0 0 0 -.44 1.684l4.622 4.499l-1.09 6.355l-.013 .11a1 1 0 0 0 1.464 .944l5.706 -3l5.693 3l.1 .046a1 1 0 0 0 1.352 -1.1l-1.091 -6.355l4.624 -4.5l.078 -.085a1 1 0 0 0 -.633 -1.62l-6.38 -.926l-2.852 -5.78a1 1 0 0 0 -1.794 0l-2.853 5.78z" /></svg>`;

    const half_star_svg = isMobile
        ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width=".75em" height=".75em" fill="currentColor"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 1a.993 .993 0 0 1 .823 .443l.067 .116l2.852 5.781l6.38 .925c.741 .108 1.08 .94 .703 1.526l-.07 .095l-.078 .086l-4.624 4.499l1.09 6.355a1.001 1.001 0 0 1 -1.249 1.135l-.101 -.035l-.101 -.046l-5.693 -3l-5.706 3c-.105 .055 -.212 .09 -.32 .106l-.106 .01a1.003 1.003 0 0 1 -1.038 -1.06l.013 -.11l1.09 -6.355l-4.623 -4.5a1.001 1.001 0 0 1 .328 -1.647l.113 -.036l.114 -.023l6.379 -.925l2.853 -5.78a.968 .968 0 0 1 .904 -.56zm0 3.274v12.476a1 1 0 0 1 .239 .029l.115 .036l.112 .05l4.363 2.299l-.836 -4.873a1 1 0 0 1 .136 -.696l.07 -.099l.082 -.09l3.546 -3.453l-4.891 -.708a1 1 0 0 1 -.62 -.344l-.073 -.097l-.06 -.106l-2.183 -4.424z" /></svg>`
        : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="1.25em" height="1.25em" fill="currentColor"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 1a.993 .993 0 0 1 .823 .443l.067 .116l2.852 5.781l6.38 .925c.741 .108 1.08 .94 .703 1.526l-.07 .095l-.078 .086l-4.624 4.499l1.09 6.355a1.001 1.001 0 0 1 -1.249 1.135l-.101 -.035l-.101 -.046l-5.693 -3l-5.706 3c-.105 .055 -.212 .09 -.32 .106l-.106 .01a1.003 1.003 0 0 1 -1.038 -1.06l.013 -.11l1.09 -6.355l-4.623 -4.5a1.001 1.001 0 0 1 .328 -1.647l.113 -.036l.114 -.023l6.379 -.925l2.853 -5.78a.968 .968 0 0 1 .904 -.56zm0 3.274v12.476a1 1 0 0 1 .239 .029l.115 .036l.112 .05l4.363 2.299l-.836 -4.873a1 1 0 0 1 .136 -.696l.07 -.099l.082 -.09l3.546 -3.453l-4.891 -.708a1 1 0 0 1 -.62 -.344l-.073 -.097l-.06 -.106l-2.183 -4.424z" /></svg>`;

    const empty_star_svg = isMobile
        ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width=".5em" height=".5em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 17.75l-6.172 3.245l1.179 -6.873l-5 -4.867l6.9 -1l3.086 -6.253l3.086 6.253l6.9 1l-5 4.867l1.179 6.873z" /></svg>`
        : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="1.25em" height="1.25em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 17.75l-6.172 3.245l1.179 -6.873l-5 -4.867l6.9 -1l3.086 -6.253l3.086 6.253l6.9 1l-5 4.867l1.179 6.873z" /></svg>`;

    let star_rating = '';
    const full_stars = Math.trunc(rating);
    const hasRemainder = rating % 1 !== 0;
    const empty_stars = 5 - Math.ceil(rating);

    for (let i = 0; i < full_stars; i++) {
        star_rating += full_star_svg;
    }

    if (hasRemainder) {
        star_rating += half_star_svg;
    }

    for (let i = 0; i < empty_stars; i++) {
        star_rating += empty_star_svg;
    }

    return star_rating;
}

function getHeartIcon(page) {

    let mobileFavorite = '<svg xmlns="http://www.w3.org/2000/svg"  viewBox="0 0 24 24" width=".75em" height=".75em" class="letterboxd-series-series-icon-favorite letterboxd-series-series-icon-mobile-like-favorite" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-heart"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>'
    let desktopFavorite = '<svg xmlns="http://www.w3.org/2000/svg"  viewBox="0 0 24 24" width="1.5em" height="1.5em" class="letterboxd-series-series-icon-favorite letterboxd-series-series-icon-desktop-like-favorite" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-heart"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>'

    let mobileLike = '<svg xmlns="http://www.w3.org/2000/svg"  viewBox="0 0 24 24" width=".75em" height=".75em" class="letterboxd-series-series-icon-like letterboxd-series-series-icon-mobile-like-favorite" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-heart"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>'
    let desktopLike = '<svg xmlns="http://www.w3.org/2000/svg"  viewBox="0 0 24 24" width="1.5em" height="1.5em" class="letterboxd-series-series-icon-like letterboxd-series-series-icon-desktop-like-favorite" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-heart"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>'

    let mobileBase = '<svg xmlns="http://www.w3.org/2000/svg"  viewBox="0 0 24 24" width=".75em" height=".75em" class="letterboxd-series-series-icon-base letterboxd-series-series-icon-mobile-like-favorite" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-heart"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>'
    let desktopBase = '<svg xmlns="http://www.w3.org/2000/svg"  viewBox="0 0 24 24" width="1.5em" height="1.5em" class="letterboxd-series-series-icon-base letterboxd-series-series-icon-desktop-like-favorite" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-heart"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>'

    if (app.isMobile) {
        return page.favorite ? mobileFavorite : page.like ? mobileLike : mobileBase
    } else {
        return page.favorite ? desktopFavorite : page.like ? desktopLike : desktopBase
    }
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
const folderPath = `${basePath}/Series`

function getSeriesWatch(folderPath) {
  return dv.pages(`"${folderPath}"`)
    .filter(page => page.status !== 'Watchlist' && page.watch_dates)
    .flatMap(page => {
      return (page.watch_dates || []).flatMap((seasonBatch, seasonIndex) => { 
        return (seasonBatch || []).flatMap((watch_date, episodeIndex) => {
          if (watch_date === null) return []; // Ignore placeholders

          return {
            ...page,

            // Like Icons for Mobile and Desktop
            heartIcon: getHeartIcon(page),
            
            // Additional Data
            link: page.file.path,
            rating: getRating(page.rating),
            watch_date: watch_date,
            day: new Date(watch_date).getDate(),
            month: new Date(watch_date).getMonth() + 1,
            shortMonth: getMonthFromDate(watch_date), 
            year: new Date(watch_date).getFullYear(),
            longMonth: getLongMonthFromDate(watch_date),

            // Season and Episode Information
            season: seasonIndex + 1,
            episode: episodeIndex + 1,
            isRewatch: false,

            // Eye Icon
            icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></svg>'
          };
        });
      });
    });
}

function getSeriesRewatch(folderPath) {
    return dv.pages(`"${folderPath}"`)
        .filter(page => page.status !== 'Watchlist' && page.rewatch_dates) 
        .flatMap(page => {
            return (page.rewatch_dates || []).flatMap((rewatchBatch, rewatchCount) => { 
                return (rewatchBatch || []).flatMap((season, seasonIndex) => { 
                    return (season || []).flatMap((watch_date, episodeIndex) => {
                        if (watch_date === null) return []; // Ignore placeholders

                        return [{
                            ...page,
                            heartIcon: getHeartIcon(page),
                            rating: getRating(page.rating),

                            // Store rewatch-specific data
                            watch_date: watch_date,
                            day: new Date(watch_date).getDate(),
                            month: new Date(watch_date).getMonth() + 1,
                            shortMonth: getMonthFromDate(watch_date),
                            year: new Date(watch_date).getFullYear(),
                            longMonth: getLongMonthFromDate(watch_date),

                            // Track season and episode
                            season: seasonIndex + 1,
                            episode: episodeIndex + 1,  
                            rewatchCount: rewatchCount + 1, 
                            isRewatch: true,
                            icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-rotate-ccw"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>'
                        }];
                    });
                });
            });
        });
}

// Create an empty object to hold the grouped series
let groupedSeries = {};

let seriesWatch = getSeriesWatch(folderPath)

// Group series by year and month
seriesWatch.forEach(page => {
    const key = `${page.year}-${page.month}`;

    // Initialize the array if this key doesn't exist
    if (!groupedSeries[key] && page.watch_date) {
        groupedSeries[key] = [];
    }

    // Add the current series to the correct group
    if (page.watch_date) {
	    groupedSeries[key].push(page);
    }
});

let seriesRewatch;
if (dv.current().filterRewatches) {
	seriesRewatch = getSeriesRewatch(folderPath)

	seriesRewatch.forEach(page => {
	    const key = `${page.year}-${page.month}`;
	
	    // Initialize the array if this key doesn't exist
	    if (!groupedSeries[key] && page.watch_date) {
	        groupedSeries[key] = [];
	    }
	
	    // Add the current series to the correct group
	    if (page.watch_date) {
		    groupedSeries[key].push(page);
	    }
	});
}

let tableDataMobile = [];
let tableDataDesktop = [];

/*
new Date("YYYY-MM") behaves inconsistently across platforms (especially in Safari on iOS).
Sorting can be done numerically without needing a Date object.
*/
let sortedKeys = Object.keys(groupedSeries)
    .map(key => {
        let [year, month] = key.split('-').map(Number); // Convert both to numbers
        return { key, sortValue: year * 100 + month }; // Convert to sortable number
    })
    .sort((a, b) => b.sortValue - a.sortValue) // Sort numerically (newest first)
    .map(item => item.key);

// Process series in the sorted order of keys
sortedKeys.forEach(key => {

	// Sort keys
    const seriesInGroup = groupedSeries[key].sort((a, b) => new Date(b.watch_date) - new Date(a.watch_date));
    
    seriesInGroup.forEach((series, index) => {

		// Append seperator before first item
        const isMostRecent = index === 0;

		// Adds 'YYYY-MM' seperator 
		if (isMostRecent) {
			tableDataMobile.push([
				`<div class="letterboxd-series-diary-date-seperator"></div>`,
				`<div class="letterboxd-series-diary-date-content">${series.longMonth} ${series.year}
				</div>`,
				`<div></div>`,
				`<div></div>`
			]);
		}

        tableDataMobile.push([
            `<div class="letterboxd-diary-mobile-wrapper">
	            <div class="letterboxd-diary-mobile-content">
		            <div class="letterboxd-diary-mobile-day">${series.day}</div>
	            </div>
            </div>`,
            `<div class="letterboxd-diary-mobile-wrapper">
	            <img src="${series.poster}" alt="Poster" class="letterboxd-diary-poster-mobile">
	        </div>`, 
            `<div class="letterboxd-diary-mobile-content-wrapper">
	            <div class="letterboxd-diary-mobile-content-row">
		            <div>
			            <a href="${series.link}" class="internal-link letterboxd-diary-mobile-title">${series.series_name} (S${series.season}E${series.episode})</a> 
		            </div>
	            </div>
	            <div class="letterboxd-diary-mobile-content-row">
		            <div class="letterboxd-diary-mobile-rating">${series.rating}</div>
		            <div class="letterboxd-diary-icon">${series.heartIcon}</div>		        
	            </div>
	        </div>`,
	        `<div>
		            ${series.icon}  ${series.isRewatch ? series.rewatchCount : ""}
	        </div>`
        ]);
        tableDataDesktop.push([
            isMostRecent ? 
            `<div>
	            <div class="letterboxd-diary-desktop-month-year-wrapper">
		            <div class="stacked-div"></div>
		            <div class="stacked-div"></div>
		            <div class="stacked-div letterboxd-diary-desktop-month-year-content">
			            <div class="letterboxd-dairy-desktop-month">${series.month}</div>
			            <div class="letterboxd-dairy-desktop-year">${series.year}</div>
		            </div>
	            </div>
            </div>` : '',
            `<div>
	            <div class="letterboxd-diary-desktop-day">${series.day}</div>
	        </div>`,
            `<div class="letterboxd-series-diary-desktop-wrapper">
	            <img src="${series.poster}" alt="Poster" class="letterboxd-diary-poster-desktop">
	        </div>`, // Always show the poster
            `<div class="letterboxd-diary-desktop-content-wrapper">
				<div>
					<a href="${series.link}" class="internal-link">
					   <div class="letterboxd-series-diary-desktop-title">${series.series_name}</div>
					</a>
					<div class="letterboxd-series-diary-desktop-season">Season ${series.season} • Episode ${series.episode}</div>
					
				</div>
			</div>`, // Only show year for the most recent movie in the group
            `<div class="letterboxd-series-diary-desktop-rating-wrapper letterboxd-series-diary-desktop-rating">${series.rating}</div>`,
            `<div class="letterboxd-series-diary-desktop-wrapper series-diary-icon">${series.heartIcon}</div>`,
            `<div>${series.icon} ${series.isRewatch ? series.rewatchCount : ""} </div>`
        ]);
    });
});

const metadata = dv.current();

// Filter: Limit Results
if (metadata.filterLimitResults) {
	tableDataMobile = tableDataMobile.slice(0, metadata.filterLimitResults)
	tableDataDesktop = tableDataDesktop.slice(0, metadata.filterLimitResults)
}

// Render the table
if (document.body.hasClass("is-mobile")) {
	dv.table(["", "", "", "", ""], tableDataMobile);
} else {
	dv.table(["", "", "","","","", "", ""], tableDataDesktop);
}
```
