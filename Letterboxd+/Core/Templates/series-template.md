---
cssclasses:
  - letterboxd
  - hidefilename
---



<!-- text: series-name-heading -->
```meta-bind-js-view
{series_name} as series_name
---
let str = '';

if (context.bound.series_name) {
  str += `## ${context.bound.series_name}`;
}

return engine.markdown.create(str);
```

<!-- text: last-modified-header -->
```meta-bind-js-view
{last_updated} as last_updated
{last_synced} as last_synced
---

function formatDateDesktop(dateString) {
  const date = new Date(dateString);
  const options = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  };
  return new Intl.DateTimeFormat('en-US', options).format(date);
}

function formatDateMobile(dateString) {
  const date = new Date(dateString);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12; // convert to 12-hour format

  return `${yyyy}-${mm}-${dd} @ ${hours}:${minutes}${ampm}`;
}

const isMobile = app.isMobile;

function formatResponsive(dateString) {
  return isMobile
    ? formatDateMobile(dateString)
    : formatDateDesktop(dateString);
}

let parts = [];

if (context.bound.last_updated) {
  parts.push(`✏️ ${formatResponsive(context.bound.last_updated)}`);
}

if (context.bound.last_synced) {
  parts.push(`🔄 ${formatResponsive(context.bound.last_synced)}`);
}

let output = `<div class="meta-info-footer">${parts.join(" · ")}</div>`;

return engine.markdown.create(output);
```

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

// Mobile
const isMobile = app.isMobile;

const filePath = context.file.path;
const basePath = getParentPath(filePath, 'Letterboxd+');
const seriesBasePath = `${basePath}/Core/Series/`;

// Pages: Series
const seriesPages = ['profile', 'films', 'diary', 'watchlist', 'lists']

const seriesUris = Object.fromEntries(
    seriesPages.map(page => [page, convertFilePathToObsidianUri(`${seriesBasePath}series-${page}.md`)])
);

// Rewatch: Toggle
if (isMobile) {
    return engine.markdown.create(`
> [!note-toolbar|button-center-border]
> - [:LiCircleUser:](${seriesUris['profile']})
> - <hr/>
> - \`BUTTON[rating-button]\`
> - \`BUTTON[like-button]\`
> - \`BUTTON[favorite-button]\`
> - <hr/>
> - \`BUTTON[edit-button]\`
> - \`BUTTON[sync-series]\`

\`VIEW[{poster}][image]\`
    `);
} else {
    return engine.markdown.create(`
> [!note-toolbar|button-center-border]
> - [:LiCircleUser:Profile](${seriesUris['profile']})
> - <hr/>
> - \`BUTTON[rating-button]\`
> - \`BUTTON[like-button]\`
> - \`BUTTON[favorite-button]\`
> - <hr/>
> - \`BUTTON[edit-button]\`
> - \`BUTTON[sync-series]\`

\`VIEW[{banner}][image(class(series-banner))]\`
    `);
}
```

<!-- button: rating (config) -->
```meta-bind-js-view
{rating} as rating
---
const mb = app.plugins.getPlugin('obsidian-meta-bind-plugin')?.api;

const label = context.bound.rating ? `${context.bound.rating}` : '';
const icon = context.bound.rating ? 'star' : 'star-off';

const button = mb.createButtonMountable(context.file.path, {
  declaration: {
    label: label,
    style: 'default',
    icon: icon,
    id: 'rating-button',
    hidden: true,
    action: {
      type: 'inlineJS',
      code: `
      (async () => {

        // ──────────────── Fetch Active File & Metadata ────────────────
        const file = app.workspace.getActiveFile();
        if (!file) return new Notice("No active file to sync.");

        const ratingOptions = [
          ...Array.from({ length: 10 }, (_, i) => {
            const value = (10 - i) * 0.5; // 5.0 down to 0.5
            const fullStars = Math.floor(value);
            const hasHalf = value % 1 !== 0;

            const stars = '★'.repeat(fullStars) + (hasHalf ? ' ½' : '');

            return {
              label: stars,
              value: value,
            };
          }),
          {
            label: 'No Rating', // Or 'No Rating'
            value: null,
          },
        ];

        let ratingOption = await engine.prompt.suggester({
            title: 'Add Genre',
            content: 'Which genre would you like to assign to this film?',
            options: ratingOptions
        })


        await app.fileManager.processFrontMatter(file, fm => {
          fm.rating = ratingOption;
        });
      })();
      `,
    },
  },
  isPreview: false,
});

mb.wrapInMDRC(button, container, component);
```

<!-- button: like (config) -->
```meta-bind-js-view
{like} as like
---
// First we get an instance of the Meta Bind plugin, then we access the API.
const mb = app.plugins.getPlugin('obsidian-meta-bind-plugin')?.api;

const label = app.isMobile ? '': 'Like'
const filled = context.bound.like ? 'filled-icon' : ''

// We create a button configuration object.
const buttonConfig = {
    label: label,
    style: 'default',
    class: filled,
    icon: 'thumbs-up',
    id: 'like-button',
    hidden: true,
    action: {
        type: 'updateMetadata',
        bindTarget: 'like',
        evaluate: true,
        value: "!x",
    },
};

// We specify the button options.
const buttonOptions = {
    declaration: buttonConfig,
    isPreview: false,
};

// We create the button. This will return something that inherits from `Mountable` and can be mounted to the DOM.
const button = mb.createButtonMountable(context.file.path, buttonOptions);

// Mount the button to the DOM and make sure it gets unmounted when the component is destroyed.
mb.wrapInMDRC(button, container, component);
```

<!-- button: favorite (config) -->
```meta-bind-js-view
{favorite} as favorite
---
// First we get an instance of the Meta Bind plugin, then we access the API.
const mb = app.plugins.getPlugin('obsidian-meta-bind-plugin')?.api;

const label = app.isMobile ? '': 'Favorite'
const filled = context.bound.favorite ? 'filled-icon' : ''

// We create a button configuration object.
const buttonConfig = {
    label: label,
    style: 'default',
    class: filled,
    icon: 'heart',
    id: 'favorite-button',
    hidden: true,
    action: {
        type: 'updateMetadata',
        bindTarget: 'favorite',
        evaluate: true,
        value: "!x",
    },
};

// We specify the button options.
const buttonOptions = {
    declaration: buttonConfig,
    isPreview: false,
};

// We create the button. This will return something that inherits from `Mountable` and can be mounted to the DOM.
const button = mb.createButtonMountable(context.file.path, buttonOptions);

// Mount the button to the DOM and make sure it gets unmounted when the component is destroyed.
mb.wrapInMDRC(button, container, component);
```

<!-- button: edit (config) -->
```meta-bind-js-view
{edit} as edit
---
// First we get an instance of the Meta Bind plugin, then we access the API.
const mb = app.plugins.getPlugin('obsidian-meta-bind-plugin')?.api;

const label = app.isMobile ? '' : (context.bound.edit ? 'Edit' : 'Reading');
const icon = context.bound.edit ? 'square-pen' : 'book-open'

// We create a button configuration object.
const buttonConfig = {
    label: label,
    style: 'default',
    icon: icon,
    id: 'edit-button',
    hidden: true,
    action: {
        type: 'updateMetadata',
        bindTarget: 'edit',
        evaluate: true,
        value: "!x",
    },
};

// We specify the button options.
const buttonOptions = {
    declaration: buttonConfig,
    isPreview: false,
};

// We create the button. This will return something that inherits from `Mountable` and can be mounted to the DOM.
const button = mb.createButtonMountable(context.file.path, buttonOptions);

// Mount the button to the DOM and make sure it gets unmounted when the component is destroyed.
mb.wrapInMDRC(button, container, component);
```

<!-- button: sync (config) -->
```js-engine
const mb = app.plugins.getPlugin('obsidian-meta-bind-plugin')?.api;

const label = app.isMobile ? '': 'Sync'

const button = mb.createButtonMountable(context.file.path, {
  declaration: {
    label: label,
    style: 'default',
    icon: 'refresh-ccw',
    id: 'sync-series',
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

            // ───── Ensure Letterboxd+ Script ─────
            const scriptPath = basePath + "/Core/Scripts/letterboxd.js"
            const lib = await engine.importJs(scriptPath);
            if (!lib) return new Notice("Failed to load core script.");

            // ───── Ensure TMDB API Key ─────
            if (!(await lib.tmdbKeyFileExists(basePath))) {
                const apiKey = await engine.prompt.text({ title: 'Enter Your TMDB API Key', content: 'This is required to fetch film and series data from TMDB.\\nYour key will be stored locally and never shared.', placeholder: 'Paste your TMDB key here...' });

                if (!apiKey) return new Notice("TMDB API key is required to continue. Please enter a valid key to enable film and series data fetching.");
                
                await lib.createTmdbKeyFile(basePath, apiKey)
            }

            const secretsPath = basePath + "/Core/Scripts/tmdb_key.json";
            const tmdbKey = await lib.getApiKey(secretsPath, 'apiKey');

            // ───── Metadata ─────
            const file = app.workspace.getActiveFile();
            if (!file) return new Notice("No active file to sync.");

            const metadata = app.metadataCache.getFileCache(file);
            const name = metadata.frontmatter?.series_name;
            const seriesId = metadata.frontmatter?.series_id;
            const currentGenres = metadata.frontmatter?.genres ?? [];

            // ───── Validate Metadata ─────
            if (!name) return new Notice("Missing series_name in frontmatter.");
            if (!seriesId) return new Notice("Missing series_id in frontmatter.");

            // ───── Prompt for Sync ─────
            const choice = await engine.prompt.yesNo({
              title: 'Sync Series',
              content: \`"\${name}" will be updated with the latest details from TMDb. Proceed?\`
            });
            if (!choice) return;

            // ───── Fetch Series Details ─────
            try {
                const seriesDetails = await lib.fetchDetailsById('series', seriesId, tmdbKey);
                const fetchedGenres = seriesDetails.genres?.map(g => g.name) ?? [];

                // ───── Merge existing and fetched genres ─────
                const mergedGenres = Array.from(new Set([...currentGenres, ...fetchedGenres]));

                // ───── Timestamp ─────
                const now = await lib.getFormattedLocalDateTime();

                // ───── Sync Metadata ─────
                const updatedMetadata = await lib.syncSeriesMetadata(seriesDetails, now, mergedGenres);
                await app.fileManager.processFrontMatter(file, fm => Object.assign(fm, updatedMetadata));

                // ───── Notify Success ─────
                new Notice(\`"\${name}" successfully synced.\`);
            } catch (err) {
                console.error(err);
                return new Notice(\`Unable to sync series: \${err.message}\`);
            }
        })(); 
      `,
    },
  },
  isPreview: false,
});

mb.wrapInMDRC(button, container, component);
```

<!-- button: homepage (render) -->
```meta-bind-js-view
{homepage} as homepage
---
// Button: Homepage
let str = ''
if (context.bound.homepage) {
    return engine.markdown.create(`\`BUTTON[homepage]\``)
}
```

<!-- button: homepage (config) -->
```js-engine
// First we get an instance of the Meta Bind plugin, then we access the API.
const mb = app.plugins.getPlugin('obsidian-meta-bind-plugin')?.api;

const file = app.workspace.getActiveFile();
const frontmatter = app.metadataCache.getFileCache(file)?.frontmatter;

const homepageUrl = frontmatter?.homepage

// We create a button configuration object.
const buttonConfig = {
    label: 'Homepage',
    id: 'homepage',
    icon: 'clapperboard',
    style: 'primary',
    class: 'homepage-button',
    hidden: true,
    action: {
        type: 'open',
        link: homepageUrl,
    },
};

// We specify the button options.
const buttonOptions = {
    declaration: buttonConfig,
    isPreview: false,
};

// We create the button. This will return something that inherits from `Mountable` and can be mounted to the DOM.
const button = mb.createButtonMountable(context.file.path, buttonOptions);

// Mount the button to the DOM and make sure it gets unmounted when the component is destroyed.
mb.wrapInMDRC(button, container, component);
```

<!-- text: tagline-overview -->
```meta-bind-js-view
{series_tagline} as series_tagline
{series_overview} as series_overview
---
let str = '';

if (context.bound.series_tagline) {
  str += `**${context.bound.series_tagline}**\n\n`;
}

if (context.bound.series_overview) {
  str += `${context.bound.series_overview}`;
}

return engine.markdown.create(str);
```

<br/>

<!-- text: genre-tags -->
```meta-bind-js-view
{genres} as genres
---

let str = ''
if (context.bound.genres) {
  const genres = context.bound.genres
    .map(genre => `<div>${genre}</div>`)
    .join('');

  str = `<div class="letterboxd-genre-container">${genres}</div>`;
  return engine.markdown.create(str);
}
```

<!-- button: genre-tags (render) -->
```meta-bind-js-view
{edit} as edit
---

let str = ''
if (context.bound.edit) {
  str = `\`BUTTON[tags-button]\``;
}

return engine.markdown.create(str);
```

<!-- button: genre-tags (config) -->
```js-engine
const mb = app.plugins.getPlugin('obsidian-meta-bind-plugin')?.api;

const button = mb.createButtonMountable(context.file.path, {
  declaration: {
    label: '',
    style: 'primary',
    icon: 'tag',
    id: 'tags-button',
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

        // ──────────────── Fetch Active File & Metadata ────────────────
        const file = app.workspace.getActiveFile();
        if (!file) return new Notice("No active file to sync.");

        const frontmatter = app.metadataCache.getFileCache(file)?.frontmatter;
        if (!frontmatter) return new Notice("No frontmatter found.");
        
        // ──────────────── Get Available Lists ────────────────
        const currentGenres = frontmatter?.genres ?? [];
        
        const tagsOption = await engine.prompt.button({
          title: 'Genres',
          content: 'Would you like to add or remove genres?',
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

        if (!tagsOption) return new Notice('Genre editing canceled. No genres were changed.');

        if (tagsOption == 'add') {
          const availableGenres = await lib.getAvailableGenresByType(basePath, 'Series', currentGenres)

        const genreOptions = [
            ...availableGenres.map(genre => ({
                label: genre,
                value: genre
            })),
            {
              label: '🆕 New Entry',
              value: '__new_entry__',
            }
          ];

          let genreOption = await engine.prompt.suggester({
              title: 'Add Genre',
              content: 'Which genre would you like to assign to this film?',
              options: genreOptions
          })

          if (!genreOption) return;

          if (genreOption == '__new_entry__') {
            genreOption = await engine.prompt.text({
              title: 'Add New Genre',
              content: 'What genre would you like to add?',
              placeholder: 'e.g. Drama, Sci-Fi, Animation'
            });

            if (!genreOption?.trim()) {
              new Notice('No genre was provided.');
              return;
            }

            // Capitalize first letter of each word
            genreOption = genreOption
              .trim()
              .split(' ')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
              .join(' ');
            }

            await app.fileManager.processFrontMatter(file, fm => {
              fm.genres.push(genreOption)
            });
          } else if (tagsOption == 'remove') {
            if (currentGenres.length === 0) {
              new Notice("Genre list is empty. Add genres before attempting deletion.");
              return;
            }

            // Turn each genre string into an object for the suggester
            const genreOptions = currentGenres.map(genre => ({
              label: genre,
              value: genre
            }));

            const genreOption = await engine.prompt.suggester({
              title: 'Remove Genre',
              content: 'Select a genre to remove from this film:',
              options: genreOptions
            });

            if (!genreOption) return;

            // Remove the selected genre from the frontmatter
            await app.fileManager.processFrontMatter(file, fm => {
              fm.genres = (fm.genres ?? []).filter(g => g !== genreOption);
            });
          }
        
      })();
      `,
    },
  },
  isPreview: false,
});

mb.wrapInMDRC(button, container, component);
```

<br/>

## Logging Series
---

<!-- input: status -->
`INPUT[inlineSelect(option('Watchlist'), option('Watching'), option('Waiting'), option('On Hold'), option('Completed'), option('Dropped'), defaultValue('Watchlist')):status]`

<!-- text: series-watch-progress -->
```meta-bind-js-view
{watch_dates} as watch_dates
{season_breakdown} as season_breakdown
{status} as status
---

if (context.bound.status === 'Watchlist') {
  return '';
}

const watch = context.bound.watch_dates ?? [];
const breakdown = context.bound.season_breakdown ?? [];

for (let s = 0; s < breakdown.length; s++) {
  const totalEpisodes = breakdown[s];
  const seasonArr = watch[s] ?? [];

  for (let e = 0; e < totalEpisodes; e++) {
    if (!seasonArr[e]) {
      const str = `\`VIEW[Season: ${s + 1}][text(renderMarkdown)]\` \`VIEW[Episode: ${e + 1}][text(renderMarkdown)]\``;
      return engine.markdown.create(str);
    }
  }
}

// If all episodes are watched
return engine.markdown.create("`VIEW[All episodes watched][text(renderMarkdown)]`");
```

<!-- button: log-episode (render) -->
```meta-bind-js-view
{status} as status
---
let str = ''
if (context.bound.status == 'Watching') {
    str = `\`BUTTON[log-episode]\``
}

return engine.markdown.create(str)
```

<!-- button: log-episode (config)-->
```js-engine
const mb = app.plugins.getPlugin('obsidian-meta-bind-plugin')?.api;

const button = mb.createButtonMountable(context.file.path, {
  declaration: {
    label: 'Next Episode',
    style: 'primary',
    icon: 'monitor-play',
    id: 'log-episode',
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

        // ──────────────── Fetch Active File & Metadata ────────────────
        const file = app.workspace.getActiveFile();
        if (!file) return new Notice("No active file to sync.");

        const formattedLocalDate = await lib.getFormattedLocalDateTime();

        app.fileManager.processFrontMatter(file, (frontmatter) => {

          // ───── Ensure Required Properties ─────
          if (!Array.isArray(frontmatter['watch_dates'])) frontmatter['watch_dates'] = [];
          if (!Array.isArray(frontmatter['season_breakdown'])) frontmatter['season_breakdown'] = [];

          const seasonsWatched = frontmatter['watch_dates'];
          const maxEpisodesPerSeason = frontmatter['season_breakdown'];

          let currentSeasonIndex = seasonsWatched.length - 1;

          // ───── First-Time Logging (Initialize Season 1) ─────
          if (currentSeasonIndex < 0) {
            if (maxEpisodesPerSeason.length > 0) {
              frontmatter['watch_dates'].push([formattedLocalDate]);
              frontmatter['watch_season'] = 1;
              new Notice("First episode of Season 1 logged.");
            } else {
              new Notice("Error: season_breakdown is empty. Cannot log episode.");
            }
            return;
          }

          const currentSeason = seasonsWatched[currentSeasonIndex];
          const maxEpisodes = maxEpisodesPerSeason[currentSeasonIndex] || 0;

          // ───── Log Episode in Current Season ─────
          if (currentSeason.length < maxEpisodes) {
            currentSeason.push(formattedLocalDate);
            frontmatter['watch_season'] = currentSeasonIndex + 1;
            new Notice(\`Episode \${currentSeason.length} logged in Season \${currentSeasonIndex + 1}.\`);
          }

          // ───── Start New Season if Current is Full ─────
          else if (currentSeasonIndex + 1 < maxEpisodesPerSeason.length) {
            frontmatter['watch_dates'].push([formattedLocalDate]);
            frontmatter['watch_season'] = currentSeasonIndex + 2;
            new Notice(\`Season \${currentSeasonIndex + 2} started. Episode 1 logged.\`);
          }

          // ───── No More Seasons Available ─────
          else {
            new Notice("All seasons are full. No more episodes can be logged.");
          }

        });

      })();
      `,
    },
  },
  isPreview: false,
});

mb.wrapInMDRC(button, container, component);
```

<!-- text: watch-rewatch-divider -->
```meta-bind-js-view
{rewatch_session_active} as rewatch_session_active
{status} as status
---

if (context.bound.status == 'Watchlist') {
  return null;
}

let str = `<div class="log-section-divider"/>`

return engine.markdown.create(str)
```

<!-- text: series-watch-progress -->
```meta-bind-js-view
{rewatch_dates} as rewatch_dates
{season_breakdown} as season_breakdown
{rewatch_session_active} as rewatch_session_active
{status} as status
---

const rewatch = context.bound.rewatch_dates?.at(-1) ?? [];
const breakdown = context.bound.season_breakdown ?? [];

// Determine current season (0-based index)
let seasonIdx = rewatch.length - 1;
let episodeArr = rewatch[seasonIdx] ?? [];

// Determine next episode to watch
let episodeIdx = episodeArr.length;

// If current season is fully watched, move to next
if (episodeIdx >= (breakdown[seasonIdx] ?? 0)) {
  seasonIdx++;
  episodeIdx = 0;
}

// If all seasons are completed
if (seasonIdx >= breakdown.length) {
  return engine.markdown.create("`Rewatch complete`");
}

// Output: 1-based season and episode numbers
if (context.bound.rewatch_session_active && context.bound.status != 'Watchlist') {
  return engine.markdown.create(
    `\`VIEW[Rewatch][text(renderMarkdown)]\` \n\n \`VIEW[Season: ${seasonIdx + 1}][text(renderMarkdown)]\` \`VIEW[Episode: ${episodeIdx + 1}][text(renderMarkdown)]\``
  );
}

```

<!-- button: rewatch-management (render) -->
```meta-bind-js-view
{rewatch_session_active} as rewatch_session_active
{status} as status
---

let str = ''
if (context.bound.rewatch_session_active && context.bound.status != 'Watchlist') {
  str = `\`BUTTON[log-rewatch, end-rewatch]\``
} else if  (context.bound.status != 'Watchlist') {
  str = `\`BUTTON[start-rewatch]\``
}

return engine.markdown.create(str)
```
<!-- button: start-rewatch (config) -->
```js-engine
const mb = app.plugins.getPlugin('obsidian-meta-bind-plugin')?.api;

const button = mb.createButtonMountable(context.file.path, {
  declaration: {
    label: 'Rewatch',
    style: 'primary',
    icon: 'list-plus',
    id: 'start-rewatch',
    hidden: true,
    action: {
      type: 'inlineJS',
      code: `
      (async () => {
        const o = engine.getObsidianModule();
        const { Modal, Setting, Notice } = o;

        const file = app.workspace.getActiveFile();
        if (!file) return new Notice("No active file.");

        const fmCache = app.metadataCache.getFileCache(file)?.frontmatter;
        if (!fmCache) return new Notice("No frontmatter found.");

        const seasonBreakdown = Array.isArray(fmCache['season_breakdown']) ? fmCache['season_breakdown'] : [];
        if (seasonBreakdown.length === 0) return new Notice("No season_breakdown found.");

        const action = await engine.prompt.button({
          title: 'Rewatch Controller',
          content: 'Choose an action:',
          buttons: [
            { label: 'Start Rewatch', value: 'start' },
            { label: 'Log Single Episode', value: 'log' },
            { label: 'Cancel', value: 'cancel' },
          ]
        });

        if (action === 'cancel' || !action) {
          return new Notice('Action cancelled.');
        }

        function saveFrontmatter(fm) {
          app.fileManager.processFrontMatter(file, (frontmatter) => {
            Object.assign(frontmatter, fm);
          });
        }

        function getFormattedLocalDate() {
          const d = new Date();
          return d.toISOString().split('T')[0];
        }

        // ───── Modal for Season/Episode Picker ─────
        class SeasonEpisodePickerModal extends Modal {
          constructor(app, seasonBreakdown, onSubmit, defaultSeason = 1, defaultEpisode = 1) {
            super(app);
            this.seasonBreakdown = seasonBreakdown;
            this.onSubmit = onSubmit;
            this.defaultSeason = defaultSeason;
            this.defaultEpisode = defaultEpisode;
            this.setTitle("When did this quote happen?");
          }

          onOpen() {
            const { contentEl } = this;
            const container = contentEl.createDiv({ cls: "season-episode-container" });

            const createDropdown = (max, label, selectedValue) => {
              const wrapper = container.createDiv({ cls: "season-episode-dropdown-wrapper" });

              const lbl = document.createElement("label");
              lbl.textContent = label;
              wrapper.appendChild(lbl);

              const select = document.createElement("select");
              for (let i = 1; i <= max; i++) {
                const option = document.createElement("option");
                option.value = i.toString();
                option.textContent = i.toString();
                if (i === selectedValue) option.selected = true;
                select.appendChild(option);
              }

              wrapper.appendChild(select);
              return select;
            };

            let seasonSelect = createDropdown(this.seasonBreakdown.length, "Season", this.defaultSeason);
            let episodeSelect = createDropdown(this.seasonBreakdown[this.defaultSeason - 1], "Episode", this.defaultEpisode);

            // Update episode dropdown when season changes
            seasonSelect.addEventListener("change", () => {
              const selectedSeason = parseInt(seasonSelect.value);
              const episodeCount = this.seasonBreakdown[selectedSeason - 1];

              // Clear and repopulate episode dropdown
              episodeSelect.innerHTML = "";
              for (let i = 1; i <= episodeCount; i++) {
                const option = document.createElement("option");
                option.value = i.toString();
                option.textContent = i.toString();
                episodeSelect.appendChild(option);
              }

              // Reset selected episode to 1 if current exceeds new max
              const newDefaultEpisode = selectedSeason === this.defaultSeason ? this.defaultEpisode : 1;
              episodeSelect.value = Math.min(newDefaultEpisode, episodeCount).toString();
            });

            const buttons = contentEl.createDiv({ cls: "season-episode-buttons" });

            const submit = buttons.createEl("button", {
              text: "Submit",
              cls: "mod-cta",
            });
            submit.onclick = () => {
              const result = {
                season: parseInt(seasonSelect.value),
                episode: parseInt(episodeSelect.value),
              };
              this.close();
              this.onSubmit(result);
            };
          }

          onClose() {
            this.contentEl.empty();
          }
        }

        // ────────────── Season/Episode Prompt Function ──────────────
        function promptSeasonEpisode(app, seasonBreakdown, defaultSeason = 1, defaultEpisode = 1) {
          return new Promise((resolve) => {
            new SeasonEpisodePickerModal(app, seasonBreakdown, resolve, defaultSeason, defaultEpisode).open();
          });
        }

        let initialSeason = 1;
        let initialEpisode = 1;

        if (action === 'start') {
          const startOption = await engine.prompt.button({
            title: 'Start Rewatch',
            content: 'Start rewatch from beginning or choose season & episode?',
            buttons: [
              { label: 'From Beginning', value: 'beginning' },
              { label: 'Choose Episode', value: 'choose' },
              { label: 'Cancel', value: 'cancel' },
            ]
          });

          if (startOption === 'cancel' || !startOption) {
            return new Notice('Rewatch start cancelled.');
          }

          if (!Array.isArray(fmCache['rewatch_dates'])) {
            fmCache['rewatch_dates'] = [];
          }

          if (startOption === 'beginning') {
            fmCache['rewatch_dates'].push([[]]);
            saveFrontmatter({
              rewatch_dates: fmCache['rewatch_dates'],
              rewatch_session_active: true,
              rewatch_season: 1,
              rewatch_episode: 1,
            });
            return new Notice('Rewatch started from the beginning.');

          } else if (startOption === 'choose') {
            const selection = await promptSeasonEpisode(app, seasonBreakdown, initialSeason, initialEpisode);
            season = selection.season;
            episode = selection.episode;

            const startSeason = parseInt(season);
            const startEpisode = parseInt(episode);

            const newRewatch = [];
            for (let s = 0; s < startSeason; s++) {
              let seasonArr = [];
              if (s === startSeason - 1) {
                for (let e = 0; e < startEpisode - 1; e++) seasonArr.push(null);
              }
              newRewatch.push(seasonArr);
            }

            fmCache['rewatch_dates'].push(newRewatch);
            saveFrontmatter({
              rewatch_dates: fmCache['rewatch_dates'],
              rewatch_session_active: true,
              rewatch_season: startSeason,
              rewatch_episode: startEpisode,
            });
            return new Notice(\`Rewatch started from Season \${startSeason}, Episode \${startEpisode}.\`);
          }

        } else if (action === 'log') {
          const selection = await promptSeasonEpisode(app, seasonBreakdown, initialSeason, initialEpisode);
          season = selection.season;
          episode = selection.episode;
          const seasonNum = parseInt(season);
          const episodeNum = parseInt(episode);

          // ✅ Create a new rewatch session for this single episode log
          const newRewatch = [];
          for (let s = 0; s < seasonNum; s++) {
            const seasonLength = seasonBreakdown[s];
            const seasonArr = [];
            if (s === seasonNum - 1) {
              for (let e = 0; e < episodeNum - 1; e++) seasonArr.push(null);
              seasonArr.push(getFormattedLocalDate());
            }
            newRewatch.push(seasonArr);
          }

          if (!Array.isArray(fmCache['rewatch_dates'])) {
            fmCache['rewatch_dates'] = [];
          }

          fmCache['rewatch_dates'].push(newRewatch);
          saveFrontmatter({
            rewatch_dates: fmCache['rewatch_dates'],
            rewatch_season: seasonNum,
            rewatch_episode: episodeNum,
          });

          return new Notice(\`Rewatch session started and logged Season \${seasonNum}, Episode \${episodeNum}.\`);
        }
      })();
      `,
    },
  },
  isPreview: false,
});

mb.wrapInMDRC(button, container, component);
```

<!-- button: log-rewatch (config) -->
```js-engine
const mb = app.plugins.getPlugin('obsidian-meta-bind-plugin')?.api;

const button = mb.createButtonMountable(context.file.path, {
  declaration: {
    label: 'Next',
    style: 'primary',
    icon: 'monitor-play',
    id: 'log-rewatch',
    hidden: true,
    action: {
      type: 'inlineJS',
      code: `
      (async () => {
        const today = new Date().toISOString().split("T")[0];

        const file = app.workspace.getActiveFile();
        if (!file) {
          new Notice("No active file.");
          return;
        }

        app.fileManager.processFrontMatter(file, (fm) => {
          fm.rewatch_dates ??= [];
          fm.season_breakdown ??= [];
          fm.rewatch_season ??= 1;
          fm.rewatch_episode ??= 1;

          const breakdown = fm.season_breakdown;
          const rewatch = fm.rewatch_dates;

          const seasonIndex = fm.rewatch_season - 1;
          const episodeIndex = fm.rewatch_episode - 1;

          if (seasonIndex >= breakdown.length) {
            new Notice("No more seasons available.");
            return;
          }

          const maxEpisodes = breakdown[seasonIndex];
          if (episodeIndex >= maxEpisodes) {
            new Notice("No more episodes in this season.");
            return;
          }

          // Get or create the current rewatch session
          let session = rewatch.at(-1);
          if (!session) {
            session = [];
            rewatch.push(session);
          }

          // Ensure seasons exist in session
          while (session.length <= seasonIndex) {
            session.push([]);
          }

          const seasonArr = session[seasonIndex];

          // Avoid duplicate logging
          if (seasonArr[episodeIndex]) {
            new Notice("Episode already logged.");
            return;
          }

          // Fill missing episodes as null
          while (seasonArr.length < episodeIndex) {
            seasonArr.push(null);
          }

          seasonArr[episodeIndex] = today;

          // Advance to next episode or season
          if (episodeIndex + 1 < maxEpisodes) {
            fm.rewatch_episode += 1;
          } else if (seasonIndex + 1 < breakdown.length) {
            fm.rewatch_season += 1;
            fm.rewatch_episode = 1;
          } else {
            new Notice("No more episodes to log.");
          }

          new Notice(\`Logged Season \${seasonIndex + 1}, Episode \${episodeIndex + 1}.\`);
        });
      })();
      `,
    },
  },
  isPreview: false,
});

mb.wrapInMDRC(button, container, component);
```

<!-- button: end-rewatch (config) -->
```js-engine
const mb = app.plugins.getPlugin('obsidian-meta-bind-plugin')?.api;

const button = mb.createButtonMountable(context.file.path, {
  declaration: {
    label: 'End',
    style: 'primary',
    icon: 'monitor-x',
    id: 'end-rewatch',
    hidden: true,
    action: {
      type: 'inlineJS',
      code: `
      (async () => {

        // ──────────────── Fetch Active File & Metadata ────────────────
        const file = app.workspace.getActiveFile();
        if (!file) return new Notice("No active file to sync.");

        // Ask the user if they want to confirm an action.

        const confirm = await engine.prompt.confirm({
          title: 'End Rewatch Session',
          content: 'Are you sure you want to end the current rewatch session?',
        });

        if (!confirm) {
          return new Notice("Rewatch end cancelled.");
        }

        app.fileManager.processFrontMatter(file, (fm) => {
          fm.rewatch_session_active = false;
        });

        new Notice("Rewatch session ended.");

        await app.fileManager.processFrontMatter(file, (fm) => {   
          fm.rewatch_session_active = false;
        });
      })();
      `,
    },
  },
  isPreview: false,
});

mb.wrapInMDRC(button, container, component);
```

---

<br/>

## Lists
---

<!-- text: lists -->
```meta-bind-js-view
{lists} as lists
---
const mb = app.plugins.getPlugin('obsidian-meta-bind-plugin')?.api;
if (!mb) throw new Error("Meta Bind API not found");

// ──────────────── Fetch Active File & Metadata ────────────────
const file = app.workspace.getActiveFile();
const frontmatter = app.metadataCache.getFileCache(file)?.frontmatter;

if (context.bound.lists.length > 0) {
    const currentList = context.bound.lists

    // ──────────────── Button Container Styling ────────────────
    const containerDiv = document.createElement('div');
    containerDiv.classList.add('letterboxd-lists-buttons');
    container.appendChild(containerDiv);

    // ──────────────── Create Buttons for Each List Item ────────────────
    for (const { title, path } of currentList) {
      if (!title || !path) continue;

      const button = mb.createButtonMountable(context.file.path, {
        declaration: {
          label: title,
          icon: 'list-video',
          style: 'default',
          action: {
            type: 'open',
            link: path,
          },
        },
        isPreview: false,
      });

      const buttonWrapper = document.createElement('div');
      containerDiv.appendChild(buttonWrapper);
      mb.wrapInMDRC(button, buttonWrapper, component);
    }
} else {
    let str = `\`VIEW[No available lists.][text(renderMarkdown)]\``
    return engine.markdown.create(str)
}
```

<!-- button: lists (render) -->
```meta-bind-js-view
{edit} as edit
---

let str = ''
if (context.bound.edit) {
  str = `\`BUTTON[lists-button]\``;
}

return engine.markdown.create(str);
```

<!-- button: lists (config) -->
```js-engine
const mb = app.plugins.getPlugin('obsidian-meta-bind-plugin')?.api;

const button = mb.createButtonMountable(context.file.path, {
  declaration: {
    label: '',
    style: 'primary',
    icon: 'list-plus',
    id: 'lists-button',
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

        // ──────────────── Fetch Active File & Metadata ────────────────
        const file = app.workspace.getActiveFile();
        if (!file) return new Notice("No active file to sync.");

        const frontmatter = app.metadataCache.getFileCache(file)?.frontmatter;
        if (!frontmatter) return new Notice("No frontmatter found.");
        
        // ──────────────── Get Available Lists ────────────────
        const currentList = frontmatter?.lists ?? [];

        // Prompt the user with a true/false question.
        const promptOption = await engine.prompt.button({
          title: 'Manage Lists',
          content: 'Do you want to add or remove this series from a list?',
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

        if (!promptOption) return new Notice('No lists changed.');

        if (promptOption == 'add') {

          const availableLists = await lib.getAvailableListsByType(basePath, 'Series', currentList)

          const listOptions = [
              ...availableLists.map(({ title, path }) => ({
                  label: title,
                  value: {title: title, path: path}
              }))
          ];

          const listOption = await engine.prompt.suggester({
              title: '...',
              content: '...',
              options: listOptions
          })

          if (!listOption) return;

          await app.fileManager.processFrontMatter(file, fm => {
            fm.lists.push(listOption)
          });

        } else if (promptOption == 'remove') {
          if (currentList.length === 0) {
            new Notice("This film is not currently part of any list.");
            return;
          }

          const listOptions = [
              ...currentList.map(({ title, path }) => ({
                  label: title,
                  value: {title: title, path: path}
              }))
          ];

          const listOption = await engine.prompt.suggester({
              title: '...',
              content: '...',
              options: listOptions
          })

          if (!listOption) return;

          await app.fileManager.processFrontMatter(file, fm => {
            fm.lists = (fm.lists ?? []).filter(l =>
              !(l.title === listOption.title && l.path === listOption.path)
            );
          });
        }

        
      })();
      `,
    },
  },
  isPreview: false,
});

mb.wrapInMDRC(button, container, component);
```

---

<br/>

## Review
---

<!-- text: review -->
```meta-bind-js-view
{review} as review
---

let str = ''
if (context.bound.review?.trim()) {
    str = `${context.bound.review}`
} else {
    str = `\`VIEW[No available review.][text(renderMarkdown)]\``
}

return engine.markdown.create(str)
```

<!-- button: review (render) -->
```meta-bind-js-view
{edit} as edit
---

let str = ''
if (context.bound.edit) {
  str = `\`BUTTON[review-button]\``;
}

return engine.markdown.create(str);
```

<!-- button: review (config) -->
```js-engine
const mb = app.plugins.getPlugin('obsidian-meta-bind-plugin')?.api;

const button = mb.createButtonMountable(context.file.path, {
  declaration: {
    label: '',
    style: 'primary',
    icon: 'square-pen',
    id: 'review-button',
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

        // ──────────────── Fetch Active File & Metadata ────────────────
        const file = app.workspace.getActiveFile();
        if (!file) return new Notice("No active file to sync.");

        const frontmatter = app.metadataCache.getFileCache(file)?.frontmatter;
        if (!frontmatter) return new Notice("No frontmatter found.");

        // ──────────────── Prompt: Review Entry ────────────────
        let review;
        if (frontmatter.review.trim().length > 0) {
          review = await engine.prompt.textarea({
            title: 'Log Your Review',
            content: 'What did you think?',
            initialValue: frontmatter.review,
            placeholder: 'Share your thoughts, impressions, or critique...',
          });
        } else {
          review = await engine.prompt.textarea({
            title: 'Log Your Review',
            content: 'What did you think?',
            placeholder: 'Share your thoughts, impressions, or critique...',
          });
        }
        

        const review_date = await lib.getFormattedLocalDateTime();
        await app.fileManager.processFrontMatter(file, fm => {
          fm.review = review ?? '';
          fm.review_date = review_date ?? null;

        });

      })();
      `,
    },
  },
  isPreview: false,
});

mb.wrapInMDRC(button, container, component);
```

---

<br/>

## Quotes
---

<!-- text: quotes -->
```meta-bind-js-view
{quotes} as quotes
---

let quotes = context.bound.quotes ?? [];
let output = [];

for (let i = 0; i < quotes.length; i++) {
  const q = quotes[i];

  // Skip empty or invalid entries
  if (!q?.quote?.trim()) continue;

  // Format blockquote
  let formatted = q.quote.split('\n').map(line => `> ${line}`).join('\n');

  // First metadata line: character and actor
  let line1 = [];
  if (q.character?.trim()) line1.push(`**${q.character}**`);
  if (q.actor?.trim()) line1.push(`(<i>${q.actor}</i>)`);

  // Second metadata line: season, episode, timestamp
  let line2 = [];
  if (q.season && q.episode) line2.push(`Season ${q.season} · Episode ${q.episode}`);
  if (q.timestamp?.trim()) line2.push(`· ${q.timestamp}`);

  // Combine both lines (with line breaks if they exist)
  let metadata = '';
  if (line1.length) metadata += `\n>\n> — ${line1.join(' ')}`;
  if (line2.length) metadata += `\n> ${line2.join(' ')}`;

  // Final quote block
  output.push(`${i === 0 ? '' : '---\n'}${formatted}${metadata}`);
}

// Output or fallback
let str = output.length
  ? output.join('\n\n')
  : '`VIEW[No quotes to display.][text(renderMarkdown)]`';

return engine.markdown.create(str);
```

<!-- button: quotes (render) -->
```meta-bind-js-view
{edit} as edit
---

let str = ''
if (context.bound.edit) {
  str = `\`BUTTON[quotes-button]\``;
}

return engine.markdown.create(str);
```

<!-- button: quotes (config) -->
```js-engine
const mb = app.plugins.getPlugin('obsidian-meta-bind-plugin')?.api;

const button = mb.createButtonMountable(context.file.path, {
  declaration: {
    label: '',
    style: 'primary',
    icon: 'square-pen',
    id: 'quotes-button',
    hidden: true,
    action: {
      type: 'inlineJS',
      code: `
        (async () => {
          const o = engine.getObsidianModule();
          const { Modal, Setting, Notice } = o;

          // ───── Modal for Season/Episode Picker ─────
          class SeasonEpisodePickerModal extends Modal {
            constructor(app, seasonBreakdown, onSubmit, defaultSeason = 1, defaultEpisode = 1) {
              super(app);
              this.seasonBreakdown = seasonBreakdown;
              this.onSubmit = onSubmit;
              this.defaultSeason = defaultSeason;
              this.defaultEpisode = defaultEpisode;
              this.setTitle("When did this quote happen?");
            }

            onOpen() {
              const { contentEl } = this;
              const container = contentEl.createDiv({ cls: "season-episode-container" });

              const createDropdown = (max, label, selectedValue) => {
                const wrapper = container.createDiv({ cls: "season-episode-dropdown-wrapper" });

                const lbl = document.createElement("label");
                lbl.textContent = label;
                wrapper.appendChild(lbl);

                const select = document.createElement("select");
                for (let i = 1; i <= max; i++) {
                  const option = document.createElement("option");
                  option.value = i.toString();
                  option.textContent = i.toString();
                  if (i === selectedValue) option.selected = true;
                  select.appendChild(option);
                }

                wrapper.appendChild(select);
                return select;
              };

              let seasonSelect = createDropdown(this.seasonBreakdown.length, "Season", this.defaultSeason);
              let episodeSelect = createDropdown(this.seasonBreakdown[this.defaultSeason - 1], "Episode", this.defaultEpisode);

              // Update episode dropdown when season changes
              seasonSelect.addEventListener("change", () => {
                const selectedSeason = parseInt(seasonSelect.value);
                const episodeCount = this.seasonBreakdown[selectedSeason - 1];

                // Clear and repopulate episode dropdown
                episodeSelect.innerHTML = "";
                for (let i = 1; i <= episodeCount; i++) {
                  const option = document.createElement("option");
                  option.value = i.toString();
                  option.textContent = i.toString();
                  episodeSelect.appendChild(option);
                }

                // Reset selected episode to 1 if current exceeds new max
                const newDefaultEpisode = selectedSeason === this.defaultSeason ? this.defaultEpisode : 1;
                episodeSelect.value = Math.min(newDefaultEpisode, episodeCount).toString();
              });

              const buttons = contentEl.createDiv({ cls: "season-episode-buttons" });

              const submit = buttons.createEl("button", {
                text: "Submit",
                cls: "mod-cta",
              });
              submit.onclick = () => {
                const result = {
                  season: parseInt(seasonSelect.value),
                  episode: parseInt(episodeSelect.value),
                };
                this.close();
                this.onSubmit(result);
              };
            }

            onClose() {
              this.contentEl.empty();
            }
          }

          // ───────────────── Time Slider Modal ─────────────────
          class TimeSliderModal extends Modal {
              constructor(app, maxMinutes, onSubmit) {
                super(app);
                this.setTitle("Select Time");

                const maxSeconds = maxMinutes * 60;
                let seconds = 0;

                const timeDisplay = document.createElement("div");
                timeDisplay.classList.add("time-modal-display");
                timeDisplay.textContent = formatTime(seconds);

                const slider = document.createElement("input");
                slider.type = "range";
                slider.classList.add("time-modal-slider");
                slider.min = "0";
                slider.max = \`\${maxSeconds}\`;
                slider.step = "1";
                slider.value = "0";

                slider.oninput = () => {
                  seconds = parseInt(slider.value, 10);
                  timeDisplay.textContent = formatTime(seconds);
              };

              const container = new Setting(this.contentEl)
              .setName("Time")
              .setDesc(\`0 to \${maxMinutes} minutes\`)
              .controlEl;

              container.appendChild(slider);
              container.appendChild(timeDisplay);

              const buttonRow = this.contentEl.createDiv({ cls: "time-modal-buttons" });

              const submitBtn = buttonRow.createEl("button", {
                  text: "Submit",
                  cls: "mod-cta time-submit-btn",
                  });
                  submitBtn.onclick = () => {
                      this.close();
                      onSubmit(formatTime(seconds));
                  };

                  const skipBtn = buttonRow.createEl("button", {
                      text: "Skip",
                      cls: "mod-cta time-skip-btn",
                      });
                      skipBtn.onclick = () => {
                          this.close();
                          onSubmit(null);
                      };
                  }

                  onClose() {
                    this.contentEl.empty();
                }
            }

            function formatTime(totalSeconds) {
            const hrs = Math.floor(totalSeconds / 3600);
            const mins = Math.floor((totalSeconds % 3600) / 60);
            const secs = totalSeconds % 60;
            return [hrs, mins, secs]
              .map(unit => unit.toString().padStart(2, '0'))
              .join(':');
          }

          // ────────────── Time Slider Prompt Function ──────────────

          function promptForTime(app, maxMinutes) {
              return new Promise((resolve) => {
                new TimeSliderModal(app, maxMinutes, (result) => {
                  resolve(result);  // Returns result to the awaiting caller
                }).open();
              });
            }

          // ────────────── Season/Episode Prompt Function ──────────────
          function promptSeasonEpisode(app, seasonBreakdown, defaultSeason = 1, defaultEpisode = 1) {
            return new Promise((resolve) => {
              new SeasonEpisodePickerModal(app, seasonBreakdown, resolve, defaultSeason, defaultEpisode).open();
            });
          }

          // ─────────────── Resolve Letterboxd+ Base Path ───────────────
          function getParentPath(fullPath, targetFolder) {
            const index = fullPath.indexOf(targetFolder);
            return index === -1 ? null : fullPath.substring(0, index + targetFolder.length);
          }

          const basePath = getParentPath(context.file.path, "Letterboxd+");
          if (!basePath) return new Notice("Could not resolve Letterboxd+ path.");

          // ───── Ensure Letterboxd+ Script ─────
          const scriptPath = basePath + "/Core/Scripts/letterboxd.js"
          const lib = await engine.importJs(scriptPath);
          if (!lib) return new Notice("Failed to load core script.");

          // ──────────────── Fetch Active File & Metadata ────────────────
          const file = app.workspace.getActiveFile();
          if (!file) return new Notice("No active file to sync.");

          const frontmatter = app.metadataCache.getFileCache(file)?.frontmatter;
          if (!frontmatter) return new Notice("No frontmatter found.");

          if (!Array.isArray(frontmatter.season_breakdown) || frontmatter.season_breakdown.length === 0) {
            return new Notice("Season breakdown data is missing or invalid.");
          }

          // Safely quotes
          const quotes = Array.isArray(frontmatter.quotes) ? frontmatter.quotes : [];

          // ──────────────── Extract Existing Quote Metadata ────────────────
          const quoteMetadata = lib.extractQuoteMetadata(quotes);

          // ──────────────── Quotes Prompt ────────────────

          const promptOption = await engine.prompt.button({
            title: 'Manage Quotes',
            content: 'Do you want to add or remove a quote?',
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

          if (promptOption == 'add') {
            // ──────────────── Prompt: Quote Content ────────────────
            const content = await engine.prompt.textarea({
              title: 'Log a Quote',
              content: 'Add the line that stuck with you.',
              placeholder: '“Here’s looking at you, kid.”',
            });

            if (!content?.trim()) {
                new Notice('No quote was provided.');
                return;
            }

            // ──────────────── Prompt: Character & Actor Selector ────────────────
            const quoteOptions = [
              ...quoteMetadata.combined.map(({ character, actor }) => ({
                label: character + " ( " + actor + " )",
                value: character + "|" + actor,
              })),
              {
                label: '🆕 New Entry',
                value: '__new_entry__',
              },
            ];

            const quoteOption = await engine.prompt.suggester({
              title: 'Character & Actor',
              content: 'Pick who delivered the quote.',
              options: quoteOptions,
            });

            // ──────────────── Prompt: New Character/Actor Entry ────────────────
            let character, actor;
            if (quoteOption == '__new_entry__') {

              // ─────────── Character Selection Prompt ───────────
              character = await engine.prompt.text({ title: 'Character Name', content: 'Who said it?', placeholder: 'e.g. Mrs. Doubtfire' });

              if (!character?.trim()) {
                new Notice('No character was provided.');
                return;
              }
              
              // ─────────── Actor Selection Prompt ───────────
              const actors = await lib.getQuoteActors(basePath);

              const actorOptions = [
                ...actors.map(actor => ({
                  label: actor,
                  value: actor,
                })),
                {
                  label: '🆕 New Actor',
                  value: '__new_entry__',
                },
                {
                  label: '⏭️ Skip Actor',
                  value: '__skip__',
                },
              ];

              const actorOption = await engine.prompt.suggester({
                title: 'Actor Name',
                content: 'Pick the actor who delivered the quote.',
                options: actorOptions,
              });

              if (actorOption == '__new_entry__') {
                  actor = await engine.prompt.text({ title: 'Actor Name', content: 'Who played them?', placeholder: 'e.g. Robin Williams' });

                  if (!actor?.trim()) {
                    new Notice('No actor was provided.');
                    return;
                  }
              } else if (actorOption == '__skip__') {
                actor = null;
              } else {
                  actor = actorOption;
              }

            } else {
              [character, actor] = quoteOption.split('|');

              // Convert "null" string back to actual null
              if (actor === 'null') {
                actor = null;
              }

            }

            // ──────────────── Function: Fetch Current Watch Season/Episode ────────────────
            function getCurrentWatchSeasonEpisode(watch_dates, season_breakdown) {
              const watch = watch_dates ?? [];
              const breakdown = season_breakdown ?? [];

              let currentSeason = 1;
              let currentEpisode = 1;
              let found = false;

              for (let s = 0; s < breakdown.length; s++) {
                const totalEpisodes = breakdown[s];
                const seasonArr = watch[s] ?? [];

                for (let e = 0; e < totalEpisodes; e++) {
                  if (!seasonArr[e]) {
                    currentSeason = s + 1;
                    currentEpisode = e + 1;
                    found = true;
                    break;
                  }
                }

                if (found) break;
              }

              // If all episodes are watched
              if (!found && breakdown.length > 0) {
                currentSeason = breakdown.length;
                currentEpisode = breakdown[breakdown.length - 1];
              }

              return { season: currentSeason, episode: currentEpisode };
            }

            // ──────────────── Function: Fetch Current Rewatch Season/Episode ────────────────
            function getCurrentRewatchSeasonEpisode(rewatch_dates, season_breakdown) {
              const rewatch = rewatch_dates?.at(-1) ?? [];
              const breakdown = season_breakdown ?? [];

              if (rewatch.length === 0 || breakdown.length === 0) {
                return { season: 1, episode: 1, done: false };
              }

              let seasonIdx = rewatch.length - 1;
              let episodeArr = rewatch[seasonIdx] ?? [];
              let episodeIdx = episodeArr.length;

              // Advance to next season if current season is complete
              if (episodeIdx >= (breakdown[seasonIdx] ?? 0)) {
                seasonIdx++;
                episodeIdx = 0;
              }

              // All seasons rewatched
              if (seasonIdx >= breakdown.length) {
                return { season: breakdown.length, episode: breakdown[breakdown.length - 1], done: true };
              }

              // Return 1-based season and episode
              return {
                season: seasonIdx + 1,
                episode: episodeIdx + 1
              };
            }

            const watchDates = frontmatter.watch_dates
            const rewatchDates = frontmatter.rewatch_dates
            const seasonBreakdown = frontmatter.season_breakdown
            const rewatchSessionActive = frontmatter.rewatch_session_active
            const status = frontmatter.status

            let initialSeason = 1;
            let initialEpisode = 1;

            if (status === 'Watchlist') {
              // No prior progress — use S1E1
              // Do nothing — default values already set
            } else if (status === 'Watching') {
              const progress = await getCurrentWatchSeasonEpisode(watchDates, seasonBreakdown);
              initialSeason = progress.season;
              initialEpisode = progress.episode;
            } else if (rewatchSessionActive && rewatchDates.length > 0) {
              const progress = await getCurrentRewatchSeasonEpisode(rewatchDates, seasonBreakdown, rewatchSessionActive);
              initialSeason = progress.season;
              initialEpisode = progress.episode;
            } 
            // else → other status + no rewatch session → use default (S1E1)

            const selection = await promptSeasonEpisode(app, seasonBreakdown, initialSeason, initialEpisode);
            season = selection.season;
            episode = selection.episode;

            // ──────────────── Prompt: Optional Timestamp Selection ────────────────
            let timestamp = await promptForTime(app, 150);

            if (timestamp === '00:00:00') {
              timestamp = null;
            }

            const newQuote = {
              quote: content,
              character: character,
              actor: actor,
              season: season,
              episode: episode,
              timestamp: timestamp
            }

            const newQuotes = await lib.addAndSortQuotes(quotes, newQuote)

            await app.fileManager.processFrontMatter(file, fm => {
                fm.quotes = newQuotes;
              });
          } else if (promptOption == 'remove') {
            const quoteOptions = quotes.map((q, idx) => {
              const hasTimestamp = q.timestamp?.trim();

              const label = \`\${hasTimestamp ? '[' + q.timestamp + '] ' : ''}\${q.character}: “\${q.quote.slice(0, 60)}\${q.quote.length > 60 ? '…' : ''}”\`;

              return {
                label,
                value: idx,
              };
            });

            const selectedIdx = await engine.prompt.suggester({
              title: 'Delete a Quote',
              content: 'Select the quote you want to review for deletion.',
              options: quoteOptions,
            });

            if (selectedIdx != null) {
              const selectedQuote = quotes[selectedIdx];

              const confirmed = await engine.prompt.confirm({
                title: 'Confirm Deletion',
                content: \`“\${selectedQuote.quote}” — \${selectedQuote.character} @ \${selectedQuote.timestamp}\`,
              });

              if (!confirmed) return new Notice("Quote deletion canceled.");

              quotes.splice(selectedIdx, 1);
              await app.fileManager.processFrontMatter(file, fm => {
                  fm.quotes = quotes;
              });

              new Notice("Quote deleted.");
            }
          }
          
        })();
      `,
    },
  },
  isPreview: false,
});

mb.wrapInMDRC(button, container, component);
```

---

<!-- logic: meta-bind state manager -->
```js-engine
const mb = engine.getPlugin('obsidian-meta-bind-plugin').api;

// ======================================
// ---------- Helper Functions ----------
// ======================================

const getFormattedLocalDate = () => {
    let d = new Date();
    return d.getFullYear() + '-' +
           String(d.getMonth() + 1).padStart(2, '0') + '-' +
           String(d.getDate()).padStart(2, '0') + 'T' +
           String(d.getHours()).padStart(2, '0') + ':' +
           String(d.getMinutes()).padStart(2, '0') + ':' +
           String(d.getSeconds()).padStart(2, '0') + '.' +
           String(d.getMilliseconds()).padStart(3, '0'); 
};

const incrementFormattedLocalDate = (formattedDate, ms = 1) => {
    const date = new Date(formattedDate); // Parse your custom format
    date.setMilliseconds(date.getMilliseconds() + ms);

    // Return in same format as getFormattedLocalDate
    return date.getFullYear() + '-' +
           String(date.getMonth() + 1).padStart(2, '0') + '-' +
           String(date.getDate()).padStart(2, '0') + 'T' +
           String(date.getHours()).padStart(2, '0') + ':' +
           String(date.getMinutes()).padStart(2, '0') + ':' +
           String(date.getSeconds()).padStart(2, '0') + '.' +
           String(date.getMilliseconds()).padStart(3, '0'); 
};

// ======================================
// -------------- Bindings --------------
// ======================================


const path = context.file.path;
const bindTargets = {
    favorite: mb.createBindTarget('frontmatter', path, ['favorite']),
    favoriteDate: mb.createBindTarget('frontmatter', path, ['favorite_date']),
    like: mb.createBindTarget('frontmatter', path, ['like']),
    likeDate: mb.createBindTarget('frontmatter', path, ['like_date']),
    rating: mb.createBindTarget('frontmatter', path, ['rating']),
    ratingDate: mb.createBindTarget('frontmatter', path, ['rating_date']),
    genres: mb.createBindTarget('frontmatter', path, ['genres']),
    status: mb.createBindTarget('frontmatter', path, ['status']),
    seasonBreakdown: mb.createBindTarget('frontmatter', path, ['season_breakdown']),
    watchDates: mb.createBindTarget('frontmatter', path, ['watch_dates']),
    rewatchDates: mb.createBindTarget('frontmatter', path, ['rewatch_dates']),
    lists: mb.createBindTarget('frontmatter', path, ['lists']),
    review: mb.parseBindTarget('review', path),
    reviewDate: mb.parseBindTarget('review_date', path),
    quotes: mb.parseBindTarget('quotes', path),
    lastUpdated: mb.createBindTarget('frontmatter', path, ['last_updated']),
};

// ======================================
// --------- First Render Flags ---------
// ======================================

const isFirstRenderMap = {
    favorite: true,
    like: true,
    rating: true,
    genres: true,
    status: true,
    seasonBreakdown: true,
    watchDates: true,
    rewatchDates: true,
    lists: true,
    review: true,
    quotes: true
};

// ======================================
// ------------ Subscriptions -----------
// ======================================

const subscriptions = [];

// Favorite
subscriptions.push(
    mb.subscribeToMetadata(bindTargets.favorite, component, (value) => {
        if (isFirstRenderMap.favorite) {
            isFirstRenderMap.favorite = false;
            return;
        }

        const now = getFormattedLocalDate();

        if (value === true) {
            mb.setMetadata(bindTargets.favoriteDate, now);
            mb.setMetadata(bindTargets.lastUpdated, now);
        } else {
            mb.setMetadata(bindTargets.favoriteDate, null);
            mb.setMetadata(bindTargets.lastUpdated, now);
        }
    })
);

// Like
subscriptions.push(
    mb.subscribeToMetadata(bindTargets.like, component, (value) => {
        if (isFirstRenderMap.like) {
            isFirstRenderMap.like = false;
            return;
        }

        const now = getFormattedLocalDate();

        if (value === true) {
            mb.setMetadata(bindTargets.likeDate, now);
            mb.setMetadata(bindTargets.lastUpdated, now);
        } else {
            mb.setMetadata(bindTargets.likeDate, null);
            mb.setMetadata(bindTargets.lastUpdated, now);
        }
    })
);

// Rating
subscriptions.push(
    mb.subscribeToMetadata(bindTargets.rating, component, (value) => {
        if (isFirstRenderMap.rating) {
            isFirstRenderMap.rating = false;
            return;
        }

        if (value) {
            const now = getFormattedLocalDate();
            mb.setMetadata(bindTargets.ratingDate, now);
            mb.setMetadata(bindTargets.lastUpdated, now);
        }
    })
);

// Genres
subscriptions.push(
    mb.subscribeToMetadata(bindTargets.genres, component, (value) => {
        if (isFirstRenderMap.genres) {
            isFirstRenderMap.genres = false;
            return;
        }

        mb.setMetadata(bindTargets.lastUpdated, getFormattedLocalDate());
    })
);

// Status
subscriptions.push(
    mb.subscribeToMetadata(bindTargets.status, component, (value) => {
        if (isFirstRenderMap.status) {
            isFirstRenderMap.status = false;
            return;
        }

        mb.setMetadata(bindTargets.lastUpdated, getFormattedLocalDate());
    })
);

// Season Breakdown
subscriptions.push(
    mb.subscribeToMetadata(bindTargets.seasonBreakdown, component, (value) => {
        if (isFirstRenderMap.seasonBreakdown) {
            isFirstRenderMap.seasonBreakdown = false;
            return;
        }

        mb.setMetadata(bindTargets.lastUpdated, getFormattedLocalDate());
    })
);

// Watch Dates
subscriptions.push(
    mb.subscribeToMetadata(bindTargets.watchDates, component, (value) => {
        if (isFirstRenderMap.watchDates) {
            isFirstRenderMap.watchDates = false;
            return;
        }

        mb.setMetadata(bindTargets.lastUpdated, getFormattedLocalDate());
    })
);

// Rewatch Dates
subscriptions.push(
    mb.subscribeToMetadata(bindTargets.rewatchDates, component, (value) => {
        if (isFirstRenderMap.rewatchDates) {
            isFirstRenderMap.rewatchDates = false;
            return;
        }

        mb.setMetadata(bindTargets.lastUpdated, getFormattedLocalDate());
    })
);

// Lists
subscriptions.push(
    mb.subscribeToMetadata(bindTargets.lists, component, (value) => {
        if (isFirstRenderMap.lists) {
            isFirstRenderMap.lists = false;
            return;
        }

        mb.setMetadata(bindTargets.lastUpdated, getFormattedLocalDate());
    })
);

// Review
subscriptions.push(
    mb.subscribeToMetadata(bindTargets.review, component, (value) => {
        if (isFirstRenderMap.review) {
            isFirstRenderMap.review = false;
            return;
        }

        const now = getFormattedLocalDate();

        if (value) {
            mb.setMetadata(bindTargets.reviewDate, now);
        } else {
            mb.setMetadata(bindTargets.reviewDate, null);
        }

        mb.setMetadata(bindTargets.lastUpdated, now);
    })
);

// Quotes
subscriptions.push(
    mb.subscribeToMetadata(bindTargets.quotes, component, (value) => {
        if (isFirstRenderMap.quotes) {
            isFirstRenderMap.quotes = false;
            return;
        }

        mb.setMetadata(bindTargets.lastUpdated, getFormattedLocalDate());
    })
);

// ======================================
// ----------- Cleanup on Close ---------
// ======================================

component.onunload(() => {
    for (const sub of subscriptions) {
        sub.unsubscribe();
    }
});
```