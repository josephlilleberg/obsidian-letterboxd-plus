---
cssclasses:
  - letterboxd
  - hidefilename
---

<!-- text: film-title-heading -->
```meta-bind-js-view
{film_title} as film_title
---
let str = '';

if (context.bound.film_title) {
  str += `## ${context.bound.film_title}`;
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

<!-- ui: film-nav-toolbar (render) -->
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
const filmsBasePath = `${basePath}/Core/Films/`;
const seriesBasePath = `${basePath}/Core/Series/`;

// Pages: Films
const filmPages = ['profile', 'films', 'diary', 'watchlist', 'lists']

const filmsUris = Object.fromEntries(
    filmPages.map(page => [page, convertFilePathToObsidianUri(`${filmsBasePath}films-${page}.md`)])
);

// Rewatch: Toggle
if (isMobile) {
    return engine.markdown.create(`
> [!note-toolbar|button-center-border]
> - [:LiCircleUser:](${filmsUris['profile']})
> - <hr/>
> - \`BUTTON[rating-button]\`
> - \`BUTTON[like-button]\`
> - \`BUTTON[favorite-button]\`
> - <hr/>
> - \`BUTTON[edit-button]\`
> - \`BUTTON[sync-film]\`

\`VIEW[{poster}][image]\`
    `);
} else {
    return engine.markdown.create(`
> [!note-toolbar|button-center-border]
> - [:LiCircleUser: Profile](${filmsUris['profile']})
> - <hr/>
> - \`BUTTON[rating-button]\`
> - \`BUTTON[like-button]\`
> - \`BUTTON[favorite-button]\`
> - <hr/>
> - \`BUTTON[edit-button]\`
> - \`BUTTON[sync-film]\`

\`VIEW[{banner}][image(class(film-banner))]\`
    `);
}
```

<!-- button: rating -->
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

<!-- button: like -->
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

<!-- button: favorite -->
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

<!-- button: edit -->
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

<!-- button: sync -->
```js-engine
const mb = app.plugins.getPlugin('obsidian-meta-bind-plugin')?.api;

const label = app.isMobile ? '': 'Sync'

const button = mb.createButtonMountable(context.file.path, {
  declaration: {
    label: '',
    style: 'default',
    icon: 'refresh-ccw',
    id: 'sync-film',
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
            if (!tmdbKey) return new Notice("TMDB API key not found.");

            // ───── Metadata ─────
            const file = app.workspace.getActiveFile();
            if (!file) return new Notice("No active file to sync.");

            const metadata = app.metadataCache.getFileCache(file);
            const title = metadata.frontmatter?.film_title;
            const filmId = metadata.frontmatter?.film_id;
            const currentGenres = metadata.frontmatter?.genres ?? [];

            // ───── Validate Metadata ─────
            if (!title) return new Notice("Missing film_title in frontmatter.");
            if (!filmId) return new Notice("Missing film_id in frontmatter.");

            // ───── Prompt for Sync ─────
            const choice = await engine.prompt.yesNo({
              title: 'Sync Film',
              content: \`"\${title}" will be updated with the latest details from TMDb. Proceed?\`
            });
            if (!choice) return;

            // ───── Fetch Film Details ─────
            try {
                const filmDetails = await lib.fetchDetailsById('film', filmId, tmdbKey);
                const fetchedGenres = filmDetails.genres?.map(g => g.name) ?? [];

                // ───── Merge existing and fetched genres ─────
                const mergedGenres = Array.from(new Set([...currentGenres, ...fetchedGenres]));

                // ───── Timestamp ─────
                const now = await lib.getFormattedLocalDateTime();

                // ───── Sync Metadata ─────
                const updatedMetadata = await lib.syncFilmMetadata(filmDetails, now, mergedGenres);
                await app.fileManager.processFrontMatter(file, fm => Object.assign(fm, updatedMetadata));

                // ───── Notify Success ─────
                new Notice(\`"\${title}" successfully synced.\`);
            } catch (err) {
                console.error(err);
                return new Notice(\`Unable to sync film: \${err.message}\`);
            }
        })(); 
      `,
    },
  },
  isPreview: false,
});

mb.wrapInMDRC(button, container, component);
```

<!-- button: homepage-imdb (render) -->
```meta-bind-js-view
{imdb_id} as imdb_id
{homepage} as homepage
---
// Button: Homepage
let str = ''
if (context.bound.imdb_id && context.bound.homepage) {
    return engine.markdown.create(`\`BUTTON[imdb]\` \`BUTTON[homepage]\``)
} else if (context.bound.imdb_id && !context.bound.homepage){
    return engine.markdown.create(`\`BUTTON[imdb]\``)
} else if (!context.bound.imdb_id && context.bound.homepage) {
    return engine.markdown.create(`\`BUTTON[homepage]\``)
}
```

<!-- button: imdb (config) -->
```js-engine
// First we get an instance of the Meta Bind plugin, then we access the API.
const mb = app.plugins.getPlugin('obsidian-meta-bind-plugin')?.api;

const file = app.workspace.getActiveFile();
const frontmatter = app.metadataCache.getFileCache(file)?.frontmatter;

const imdbId = frontmatter?.imdb_id
const imdbUrl = `https://www.imdb.com/title/${imdbId}/`;


// We create a button configuration object.
const buttonConfig = {
    label: 'IMDB',
    id: 'imdb',
    icon: 'clapperboard',
    style: 'primary',
    class: 'imdb-button',
    hidden: true,
    action: {
        type: 'open',
        link: imdbUrl,
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

<!-- Homepage Button: Config -->
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
{film_tagline} as film_tagline
{film_overview} as film_overview
---
let str = '';

if (context.bound.film_tagline) {
  str += `**${context.bound.film_tagline}**\n\n`;
}

if (context.bound.film_overview) {
  str += `${context.bound.film_overview}`;
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
          const availableGenres = await lib.getAvailableGenresByType(basePath, 'Films', currentGenres)

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

## Logging Film
---

<!-- text: watched-boolean -->
```meta-bind-js-view
{watched} as watched
---
// Watch: Status
const square_checked = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-square-check-big"><path d="M21 10.5V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h12.5"/><path d="m9 11 3 3L22 4"/></svg>'

const square = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-square"><rect width="18" height="18" x="3" y="3" rx="2"/></svg>'

return engine.markdown.create(`<div class="letterboxd-film-watch-history-container"><div>Logged</div><div>${context.bound.watched ? square_checked : square}</div></div>`)
```

<!-- text: film-watch-progress -->
```meta-bind-js-view
{watched} as watched
{watch_date} as watch_date
---

function formatTimestampReadable(input) {
  const date = new Date(input);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const month = monthNames[date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();

  return `${month} ${day}, ${year}`;
}

let str = ''
if (context.bound.watched) {
  const time = formatTimestampReadable(context.bound.watch_date)
  str = `\`VIEW[${time}][text(renderMarkdown)]\``
}
return engine.markdown.create(str)
```

<!-- button: log-film (render) -->
```meta-bind-js-view
{watched} as watched
---

let str = ''
if (!context.bound.watched) {
  str = `\`BUTTON[log-film]\`` 
} else {
  str = `<div class="section-divider"/>` 
}

return engine.markdown.create(str)
```

<!-- button: log-film (config)-->
```js-engine
const mb = app.plugins.getPlugin('obsidian-meta-bind-plugin')?.api;

const label = app.isMobile ? '' : 'Sync';

const button = mb.createButtonMountable(context.file.path, {
  declaration: {
    label: 'Log',
    style: 'primary',
    icon: 'clapperboard',
    id: 'log-film',
    hidden: true,
    action: {
      type: 'inlineJS',
      code: `
        (async () => {       
          const o = engine.getObsidianModule();
          const { Modal, Setting, Notice } = o;

          // ───── Modal for Year Picker ─────
          class DatePickerModal extends Modal {
            constructor(app, onSubmit, {
              minYear = 1950,
              defaultDate = new Date(),
            } = {}) {
              super(app);
              this.onSubmit = onSubmit;
              this.today = new Date();
              this.minYear = minYear;

              this.defaultYear = defaultDate.getFullYear();
              this.defaultMonth = defaultDate.getMonth() + 1;
              this.defaultDay = defaultDate.getDate();

              this.setTitle("When did this happen?");
            }

            onOpen() {
              const { contentEl } = this;
              const container = contentEl.createDiv({ cls: "date-picker-container" });

              const createDropdown = (options, label, selectedValue) => {
                const wrapper = container.createDiv({ cls: "date-dropdown-wrapper" });
                const lbl = document.createElement("label");
                lbl.textContent = label;
                wrapper.appendChild(lbl);

                const select = document.createElement("select");
                options.forEach(({ value, label }) => {
                  const option = document.createElement("option");
                  option.value = value.toString();
                  option.textContent = label;
                  if (parseInt(value) === selectedValue) option.selected = true;
                  select.appendChild(option);
                });
                wrapper.appendChild(select);
                return select;
              };

              const monthNames = [
                "January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December"
              ];

              const getMaxYear = () => this.today.getFullYear();
              const getMaxMonth = (year) =>
                year === this.today.getFullYear() ? this.today.getMonth() + 1 : 12;
              const getMaxDay = (year, month) => {
                if (year === this.today.getFullYear() && month === this.today.getMonth() + 1)
                  return this.today.getDate();
                return new Date(year, month, 0).getDate(); // day 0 of next month = last day of current
              };

              const buildYearOptions = () => {
                const years = [];
                for (let y = getMaxYear(); y >= this.minYear; y--) {
                  years.push({ value: y, label: y.toString() });
                }
                return years;
              };

              const buildMonthOptions = (year) =>
                monthNames
                  .slice(0, getMaxMonth(year))
                  .map((name, i) => ({ value: i + 1, label: name }));

              const buildDayOptions = (year, month) => {
                const maxDay = getMaxDay(year, month);
                return Array.from({ length: maxDay }, (_, i) => ({
                  value: i + 1,
                  label: (i + 1).toString(),
                }));
              };

              // ─── Create in month → day → year order ───
              let yearSelect = null;
              let monthSelect = null;
              let daySelect = null;

              const initSelectors = () => {
                monthSelect = createDropdown(
                  buildMonthOptions(this.defaultYear),
                  "Month",
                  this.defaultMonth
                );
                daySelect = createDropdown(
                  buildDayOptions(this.defaultYear, this.defaultMonth),
                  "Day",
                  this.defaultDay
                );
                yearSelect = createDropdown(
                  buildYearOptions(),
                  "Year",
                  this.defaultYear
                );
              };

              initSelectors();

              const updateDays = () => {
                const y = parseInt(yearSelect.value);
                const m = parseInt(monthSelect.value);
                const dayOptions = buildDayOptions(y, m);
                const currentDay = parseInt(daySelect.value) || this.defaultDay;

                daySelect.innerHTML = "";
                dayOptions.forEach(opt => {
                  const option = document.createElement("option");
                  option.value = opt.value;
                  option.textContent = opt.label;
                  if (opt.value === currentDay || opt.value === 1) option.selected = true;
                  daySelect.appendChild(option);
                });

                daySelect.value = Math.min(currentDay, dayOptions.length).toString();
              };

              const updateMonthsAndDays = () => {
                const y = parseInt(yearSelect.value);

                const monthOptions = buildMonthOptions(y);
                const currentMonth = parseInt(monthSelect.value) || this.defaultMonth;

                monthSelect.innerHTML = "";
                monthOptions.forEach(opt => {
                  const option = document.createElement("option");
                  option.value = opt.value;
                  option.textContent = opt.label;
                  if (opt.value === currentMonth) option.selected = true;
                  monthSelect.appendChild(option);
                });

                updateDays();
              };

              yearSelect.addEventListener("change", updateMonthsAndDays);
              monthSelect.addEventListener("change", updateDays);

              const buttons = contentEl.createDiv({ cls: "date-picker-buttons" });
              const submit = buttons.createEl("button", { text: "Submit", cls: "mod-cta" });

              submit.onclick = () => {
                const result = {
                  year: parseInt(yearSelect.value),
                  month: parseInt(monthSelect.value),
                  day: parseInt(daySelect.value),
                };
                this.close();
                this.onSubmit(result);
              };
            }

            onClose() {
              this.contentEl.empty();
            }
          }

          function promptDate(app, options = {}) {
            return new Promise((resolve) => {
              new DatePickerModal(app, resolve, options).open();
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

          // ──────────────── Quotes Prompt ────────────────

          const promptOption = await engine.prompt.button({
            title: 'Log Film',
            content: 'Did you just watch this film, or are you backlogging it?',
            buttons: [
              {
                label: 'Log',
                value: 'log',
              },
              {
                label: 'Backlog',
                value: 'backlog',
              },
              {
                label: 'Cancel',
                value: null,
              }
            ]
          });

          if (promptOption === 'log') {
            const formattedLocalDate = await lib.getFormattedLocalDateTime();
            await app.fileManager.processFrontMatter(file, fm => {
              fm.watched = true
              fm.watch_date = formattedLocalDate
              fm.last_updated = formattedLocalDate
            });
          } else if (promptOption == 'backlog') {
            const { year, month, day } = await promptDate(app);
// Example result: { year: 2025, month: 5, day: 29 }
            await app.fileManager.processFrontMatter(file, fm => {
              const formattedLocalDate = year + '-' + month.toString().padStart(2, '0') + '-' + day.toString().padStart(2, '0') + 'T00:00:00.000';
              fm.watched = true
              fm.watch_date = formattedLocalDate
              fm.last_updated = formattedLocalDate
            });

          } else {
            return new Notice('No option selected.')
          }

          
        })();
      `,
    },
  },
  isPreview: false,
});

mb.wrapInMDRC(button, container, component);
```

<!-- text: film-rewatch-progress (render) -->
```meta-bind-js-view
{watched} as watched
{rewatch_dates} as rewatch_dates
---
// Rewatch: Status
let str = ''
if (context.bound.watched) {
    return engine.markdown.create(`<div class="letterboxd-film-watch-history-container"><div>Rewatches</div><div>${context.bound.rewatch_dates ? context.bound.rewatch_dates.length : 0}</div></div>`)
}
```

<!-- button: log-rewatch (render) -->
```meta-bind-js-view
{watched} as watched

---
// Rewatch: Buttons
let str = ''
if (context.bound.watched) {
    return engine.markdown.create(`\`BUTTON[log-film-rewatch]\``)
}
```

<!-- button: log-rewatch (config) -->
```js-engine
const mb = app.plugins.getPlugin('obsidian-meta-bind-plugin')?.api;

const button = mb.createButtonMountable(context.file.path, {
  declaration: {
    label: 'Log',
    style: 'primary',
    icon: 'clapperboard',
    id: 'log-film-rewatch',
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
        await app.fileManager.processFrontMatter(file, fm => {
          // Ensure watch_dates exists and is a list of lists
          if (!Array.isArray(fm.rewatch_dates)) {
            fm.rewatch_dates = [];
          }

          // Append rewatch
          fm.rewatch_dates.push(formattedLocalDate)
          fm.last_updated = formattedLocalDate

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

          const availableLists = await lib.getAvailableListsByType(basePath, 'Films', currentList)

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

  // Second metadata line: timestamp
  let line2 = [];
  if (q.timestamp?.trim()) line2.push(`@ \`${q.timestamp}\``);

  // Combine both lines
  let metadata = '';
  if (line1.length) metadata += `\n>\n> — ${line1.join(' ')}`;
  if (line2.length) metadata += `\n> ${line2.join(' ')}`;

  // Combine everything
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

const label = app.isMobile ? '' : 'Sync';

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

          // Safely quotes
          const runtime = Number(frontmatter.runtime);
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
              label: actor ? \`\${character} (\${actor})\` : character,
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

          // ──────────────── Prompt: Optional Timestamp Selection ────────────────
          let timestamp = await promptForTime(app, runtime); 

          if (timestamp === '00:00:00') {
            timestamp = null;
          }

          const newQuote = {
            quote: content,
            character: character,
            actor: actor,
            timestamp: timestamp
          }

          const newQuotes = await lib.addAndSortQuotes(quotes, newQuote)

          await app.fileManager.processFrontMatter(file, fm => {
              fm.quotes = newQuotes;
            });
          } else if (promptOption == 'remove') {
            // ──────────────── Prompt: Character & Actor Selector ────────────────

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
    watchDate: mb.createBindTarget('frontmatter', path, ['watch_date']),
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
    watchDate: true,
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

// Watch Date
subscriptions.push(
    mb.subscribeToMetadata(bindTargets.watchDate, component, (value) => {
        if (isFirstRenderMap.watchDate) {
            isFirstRenderMap.watchDate = false;
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