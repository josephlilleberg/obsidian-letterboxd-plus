---
enableFilters: false
filterRewatches: false
filterLimitResults: 200
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
> - [:LiBookMarked:]()
> - [:LiList:](${filmsUris['lists']})
> - [:LiBookmark:](${filmsUris['watchlist']})
    `);
} else {
    return engine.markdown.create(`
> [!note-toolbar|button-center-border]
> - [:LiCircleUser: Profile](${filmsUris['profile']})
> - [:LiBookMarked: Diary]()
> - [:LiList: Lists](${filmsUris['lists']})
> - [:LiBookmark: Watchlist](${filmsUris['watchlist']})
    `);
}
```

# Diary

<br/>
<div class="divider"/>

<!-- Filters -->
`VIEW[Filters][text(renderMarkdown)]` `INPUT[toggle:enableFilters]`

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
    bindTarget: filterRewatches
    evaluate: false
    value: false
  - type: updateMetadata
    bindTarget: filterLimitResults
    evaluate: false
    value: 200
```

<div class="divider"/>

<!-- Render Diary -->
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
    const full_star_svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${iconWidth} ${iconHeight}" fill="currentColor"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M8.243 7.34l-6.38 .925l-.113 .023a1 1 0 0 0 -.44 1.684l4.622 4.499l-1.09 6.355l-.013 .11a1 1 0 0 0 1.464 .944l5.706 -3l5.693 3l.1 .046a1 1 0 0 0 1.352 -1.1l-1.091 -6.355l4.624 -4.5l.078 -.085a1 1 0 0 0 -.633 -1.62l-6.38 -.926l-2.852 -5.78a1 1 0 0 0 -1.794 0l-2.853 5.78z" /></svg>`;
    const half_star_svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${iconWidth} ${iconHeight}" fill="currentColor"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 1a.993 .993 0 0 1 .823 .443l.067 .116l2.852 5.781l6.38 .925c.741 .108 1.08 .94 .703 1.526l-.07 .095l-.078 .086l-4.624 4.499l1.09 6.355a1.001 1.001 0 0 1 -1.249 1.135l-.101 -.035l-.101 -.046l-5.693 -3l-5.706 3c-.105 .055 -.212 .09 -.32 .106l-.106 .01a1.003 1.003 0 0 1 -1.038 -1.06l.013 -.11l1.09 -6.355l-4.623 -4.5a1.001 1.001 0 0 1 .328 -1.647l.113 -.036l.114 -.023l6.379 -.925l2.853 -5.78a.968 .968 0 0 1 .904 -.56zm0 3.274v12.476a1 1 0 0 1 .239 .029l.115 .036l.112 .05l4.363 2.299l-.836 -4.873a1 1 0 0 1 .136 -.696l.07 -.099l.082 -.09l3.546 -3.453l-4.891 -.708a1 1 0 0 1 -.62 -.344l-.073 -.097l-.06 -.106l-2.183 -4.424z" /></svg>`;
    const empty_star_svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${iconWidth} ${iconHeight}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 17.75l-6.172 3.245l1.179 -6.873l-5 -4.867l6.9 -1l3.086 -6.253l3.086 6.253l6.9 1l-5 4.867l1.179 6.873z" /></svg>`;

    let star_rating = '';
    const full_stars = Math.trunc(rating);
    const hasRemainder = rating % 1 !== 0;
    const empty_stars = 5 - Math.ceil(rating);

    // Generate the full stars
    for (let i = 0; i < full_stars; i++) {
        star_rating += full_star_svg;
    }
    if (hasRemainder) {
        star_rating += half_star_svg;
    }
    // Generate the empty stars
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

    console.log('inside heart: page - ', page)

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
const folderPath = `${basePath}/Films`

// Get all notes in the "Films" directory
let films = dv.pages(`"${folderPath}"`)
    .filter(page => page.watched)
    .map(page => {
        // Parse date once to avoid repeating operations
        const WatchDate = new Date(page.watch_date);
        const month = getMonthFromDate(WatchDate);
        const longMonth = getLongMonthFromDate(WatchDate);
        const watchDay = WatchDate.getDate();
        const watchMonth = WatchDate.getMonth() + 1;  // Months are 0-based
        const watchYear = WatchDate.getFullYear();

        return {
            title: page.film_title,
            link: page.file.path,
            
            // Like Icons for Mobile and Desktop
            heartIcon: getHeartIcon(page),

            rating: getRating(page.rating),
            watched: page.watched,
            rewatch_dates: page.rewatch_dates,
            releaseYear: page.release_year,
            watch_day: watchDay,
            watch_month: watchMonth,
            watch_year: watchYear,
            watch_month_string: month,
            watch_long_month_string: longMonth,
            poster: page.poster,
            watch_date: page.watch_date,
            isRewatch: false,
            icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-eye"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/></svg>'
        };
    });

// Create an empty object to hold the grouped films
let groupedFilms = {};

// Group films by year and month
films.forEach(film => {
    const key = `${film.watch_year}-${film.watch_month}`;

    // Initialize the array if this key doesn't exist
    if (!groupedFilms[key] && film.watched) {
        groupedFilms[key] = [];
    }

    // Add the current film to the correct group
    if (film.watched) {
	    groupedFilms[key].push(film);
    }

	// Rewatches
	if (film.rewatch_dates.length > 0 && dv.current().filterRewatches) {
		film.rewatch_dates.forEach((date_string, rewatchCount) => {
			const RewatchDate = new Date(date_string);
			const rewatch_year = RewatchDate.getFullYear();
			const rewatch_month = RewatchDate.getMonth() + 1
			const rewatch_day = RewatchDate.getDate()
			
			const rewatch_key = `${rewatch_year}-${rewatch_month}`;
			
			let rewatch_film = { ...film }
			rewatch_film.watch_date = RewatchDate
			rewatch_film.watch_day = rewatch_day
			rewatch_film.watch_month = rewatch_month
			rewatch_film.watch_year = rewatch_year
			rewatch_film.watch_month_string = getMonthFromDate(RewatchDate)
			rewatch_film.watch_long_month_string = getLongMonthFromDate(RewatchDate)
			rewatch_film.rewatchCount = rewatchCount + 1
			rewatch_film.isRewatch = true
			rewatch_film.icon = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-rotate-ccw"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>'
			
			
			if (!groupedFilms[rewatch_key] && film.watched) {
		        groupedFilms[rewatch_key] = [];
		    }
			
			// Add the current film to the correct group
		    if (film.watched) {
			    groupedFilms[rewatch_key].push(rewatch_film);
		    }
		})	
	}
});

let tableDataMobile = [];
let tableDataDesktop = [];

/*
new Date("YYYY-MM") behaves inconsistently across platforms (especially in Safari on iOS).
Sorting can be done numerically without needing a Date object.
*/

let sortedKeys = Object.keys(groupedFilms)
    .map(key => {
        let [year, month] = key.split('-').map(Number); // Convert both to numbers
        return { key, sortValue: year * 100 + month }; // Convert to sortable number
    })
    .sort((a, b) => b.sortValue - a.sortValue) // Sort numerically (newest first)
    .map(item => item.key);

// Process films in the sorted order of keys
sortedKeys.forEach(key => {

	// For each 'YYYY-MM'
    const filmsInGroup = groupedFilms[key].sort((a, b) => {
		return new Date(b.watch_date) - new Date(a.watch_date);
	});
    
    filmsInGroup.forEach((film, index) => {

		// Append seperator before first item
        const isMostRecent = index === 0;

		// Adds 'YYYY-MM' seperator 
		if (isMostRecent) {
			tableDataMobile.push([
				`<div class="letterboxd-diary-date-seperator"></div>`,
				`<div class="letterboxd-diary-date-content">${film.watch_long_month_string} ${film.watch_year}
				<div/>`,
				`<div/>`,
                `<div/>`
			]);
		}

        tableDataMobile.push([
            `<div class="letterboxd-diary-mobile-wrapper">
	            <div class="letterboxd-diary-mobile-content">
		            <div class="letterboxd-diary-mobile-day">${film.watch_day}</div>
	            </div>
            </div>`,
            `<div class="letterboxd-diary-mobile-wrapper">
	            <a href="${film.link}" class="internal-link"><img src="${film.poster}" alt="Poster" class="letterboxd-diary-poster-mobile"></a>
	        </div>`, 
            `<div class="letterboxd-diary-mobile-content-wrapper">
	            <div class="letterboxd-diary-mobile-content-row">
		            <div>
			            <a href="${film.link}" class="internal-link letterboxd-diary-mobile-title">${film.title}</a> 
			            <span class="letterboxd-diary-mobile-releaseYear">${film.releaseYear}</span>
		            </div>
	            </div>
	            <div class="letterboxd-diary-mobile-content-row">
		            <div class="letterboxd-diary-mobile-rating">${film.rating}</div>
		            <div class="letterboxd-films-diary-icon">${film.heartIcon}</div>
	            </div>
	        </div>`,
	        `<div>${film.icon} ${film.isRewatch ? film.rewatchCount : ""} </div>`
        ]);
        tableDataDesktop.push([
            isMostRecent ? 
            `<div>
	            <div class="letterboxd-diary-desktop-month-year-wrapper">
		            <div class="stacked-div"></div>
		            <div class="stacked-div"></div>
		            <div class="stacked-div letterboxd-diary-desktop-month-year-content">
			            <div class="letterboxd-dairy-desktop-month">${film.watch_month_string}</div>
			            <div class="letterboxd-dairy-desktop-year">${film.watch_year}</div>
		            </div>
	            </div>
            </div>` : '',
            `<div class="letterboxd-diary-desktop-wrapper">
	            <div class="letterboxd-diary-desktop-day">${film.watch_day}</div>
	        </div>`,
            `<div class="letterboxd-diary-desktop-wrapper">
	            <a href="${film.link}" class="internal-link"><img src="${film.poster}" alt="Poster" class="letterboxd-diary-poster-desktop"><a/>
	        </div>`, 
            `<div>
				<div>
					<a href="${film.link}" class="internal-link letterboxd-diary-desktop-title">${film.title}</a>
				</div>
			</div>`, 
            `<div class="letterboxd-diary-desktop-wrapper letterboxd-diary-desktop-releaseYear">${film.releaseYear}</div>`,
            `<div class="letterboxd-diary-desktop-rating-wrapper letterboxd-diary-desktop-rating">${film.rating}</div>`,
            `<div class="letterboxd-diary-desktop-wrapper">${film.heartIcon}</div>`,
            `<div>${film.icon} ${film.isRewatch ? film.rewatchCount : ""} </div>`    
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
	dv.table(["", "", "", ""], tableDataMobile);
} else {
	dv.table(["", "", "","","","","", ""], tableDataDesktop);
}
```
