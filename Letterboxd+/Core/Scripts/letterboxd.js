// =====================================================
// 📄 TMDB Utility Library for Letterboxd+
// =====================================================

//
// 📁 API Key Management
// ─────────────────────────────────────────────────────
// - getApiKey
//

//
// 🔍 TMDB Requests
// ─────────────────────────────────────────────────────
// - fetchDetailsById
// - fetchFromTMDB
// - searchTMDB
//

//
// 🧾 Format Helpers
// ─────────────────────────────────────────────────────
// - createFilmLabelFromResult
// - createSeriesLabelFromResult
// - formatFileName
// - formatTMDBLabel
// - mergeDictionariesByKey
// - replaceIllegalFileNameCharactersInString
// - timestampToSeconds
//

//
// 📦 Metadata Construction
// ─────────────────────────────────────────────────────
// - addAndSortQuotes
// - buildFilmMetadata
// - buildSeriesMetadata
// - extractQuoteMetadata 
// - getQuoteActors
// - syncFilmMetadata
// - syncSeriesMetadata
//

//
// 🎬 Film Utilities
// ─────────────────────────────────────────────────────
// - getAvailableFilmGenres
// - getAvailableFilmLists
//

//
// 📺 Film & Series Utilities
// ─────────────────────────────────────────────────────
// - fetchFilmDetailsByQuery
// - getAvailableGenresByType
// - getAvailableListsByType
//

//
// 📤 Import & Export Utilities
// ─────────────────────────────────────────────────────
// - addFilmToLibrary
// - exportLibrary
// - fetchLetterboxdExportFolders
// - generateLetterboxdPlusJsonPath
// - importLibrary
// - parseCSV
// - parseCSVLine
// - parseLetterboxdExport
//

//
// 🔄 Sync Utilities
// ─────────────────────────────────────────────────────
// - delay
// - syncAllFilms
// - syncAllSeries
// - syncLibrary
//

//
// 🕒 Date Utilities
// ─────────────────────────────────────────────────────
// - getFormattedLocalDateTime
//

// =====================================================


// =====================================================
// 📁 API Key Management
// =====================================================

/**
 * Retrieves an API key from a local secrets file in the vault.
 * @param {string} secretFilePath - Path to the secrets JSON file in the vault.
 * @param {string} apiKeyName - Key name to retrieve from the secrets file.
 * @returns {Promise<string>}
 */
export async function getApiKey(secretFilePath, apiKeyName) {
  try {
    if (!(await app.vault.adapter.exists(secretFilePath))) {
      throw new Error(`Secrets file not found: ${secretFilePath}`);
    }

    const secrets = JSON.parse(await app.vault.adapter.read(secretFilePath));
    const key = secrets[apiKeyName];

    if (!key) {
      throw new Error(`API key '${apiKeyName}' not found in ${secretFilePath}`);
    }

    return key;
  } catch (err) {
    console.error(`Error fetching API key "${apiKeyName}":`, err.message);
    throw err;
  }
}


// =====================================================
// 🔍 TMDB Requests
// =====================================================

/**
 * Fetches details for a specific movie or series from TMDB by ID.
 * @param {'film'|'series'} type - Media type.
 * @param {string|number} id - TMDB ID.
 * @param {string} apiKey - TMDB API key.
 * @returns {Promise<Object>} Detailed media data.
 */
export async function fetchDetailsById(type, id, apiKey) {
  if (!id || !apiKey) {
    throw new Error("Missing ID or API key.");
  }

  const endpoints = {
    film: "https://api.themoviedb.org/3/movie/",
    series: "https://api.themoviedb.org/3/tv/",
  };

  const baseUrl = endpoints[type];
  if (!baseUrl) {
    throw new Error(`Unsupported type "${type}". Expected "film" or "series".`);
  }

  return await fetchFromTMDB(`${baseUrl}${id}`, {
    api_key: apiKey,
  }, `Failed to fetch ${type} details for ID ${id}`);
}

/**
 * Performs a GET request to the given TMDB endpoint with query parameters.
 * @param {string} url - TMDB endpoint URL.
 * @param {Object} params - Query parameters (must include `api_key`).
 * @param {string} [errorMessage] - Custom error message on failure.
 * @returns {Promise<Object>} JSON response.
 */
export async function fetchFromTMDB(url, params, errorMessage = "Failed to fetch data") {
  if (!url || !params?.api_key) {
    throw new Error("Missing URL or required API parameters.");
  }

  const fullUrl = new URL(url);
  fullUrl.search = new URLSearchParams(params).toString();

  const response = await fetch(fullUrl.href);

  if (!response.ok) {
    new Notice(`Error: ${errorMessage}`);
    throw new Error(`HTTP ${response.status} — ${errorMessage}`);
  }

  return response.json();
}

/**
 * Searches TMDB for a movie or TV series.
 * @param {'film'|'series'} type - The media type to search.
 * @param {string} apiKey - TMDB API key.
 * @param {string} query - Search query.
 * @returns {Promise<Array>} List of results.
 */
export async function searchTMDB(type, apiKey, query) {
  if (!query?.trim()) {
    throw new Error("Search query is empty.");
  }

  const endpoints = {
    film: "https://api.themoviedb.org/3/search/movie",
    series: "https://api.themoviedb.org/3/search/tv",
  };

  const url = endpoints[type];
  if (!url) {
    throw new Error(`Unsupported TMDB search type: "${type}"`);
  }

  const data = await fetchFromTMDB(url, {
    api_key: apiKey,
    query: query.trim(),
  }, `TMDB ${type} search failed.`);

  return data.results;
}

// =====================================================
// 🧾 Format Helpers
// =====================================================

/**
 * Creates a human-readable film label from a TMDB film search result.
 * Format: "Title (Year)"
 *
 * @param {Object} result - A TMDB film result object containing at least `title` and `release_date`.
 * @param {string} [result.title] - The title of the film.
 * @param {string} [result.release_date] - The release date in "YYYY-MM-DD" format.
 * @returns {Promise<string>} A string label formatted as "Title (Year)".
 */
export async function createFilmLabelFromResult(result) {
  const title = result.title || "Untitled";
  const year = result.release_date?.split("-")[0] || "?";
  return `${title} (${year})`;
}

/**
 * Creates a human-readable series label from a TMDB series search result.
 * Format: "Name (Year)"
 *
 * @param {Object} result - A TMDB series result object containing at least `name` and `first_air_date`.
 * @param {string} [result.name] - The name of the series.
 * @param {string} [result.first_air_date] - The first air date in "YYYY-MM-DD" format.
 * @returns {Promise<string>} A string label formatted as "Name (Year)".
 */
export async function createSeriesLabelFromResult(result) {
  const name = result.name || "Untitled";
  const year = result.first_air_date?.split("-")[0] || "?";
  return `${name} (${year})`;
}

/**
 * Formats a title string into a URL-safe, lowercase slug.
 * @param {string} title
 * @returns {Promise<string>}
 */
export async function formatFileName(title = "") {
  const cleaned = await replaceIllegalFileNameCharactersInString(title);
  return cleaned.toLowerCase().split(" ").join("-");
}

/**
 * Formats a TMDB movie result as "Title (Year)".
 * @param {Object} result - TMDB result object.
 * @returns {string}
 */
export function formatTMDBLabel(result) {
  const title = result.title || "Untitled";
  const year = result.release_date?.split("-")[0] || "?";
  return `${title} (${year})`;
}

/**
 * Merges an array of dictionaries by their top-level keys and unifies all possible subkeys.
 * If a key is missing in an entry, it will be initialized with `null`.
 *
 * @param {Array<Object<string, Object>>} dicts - An array of dictionaries to merge.
 * @returns {Object<string, Object>} A merged dictionary containing all unique keys with complete subkeys.
 */
function mergeDictionariesByKey(dicts) {
  const merged = {};

  // Collect all unique keys used across all entries
  const allKeys = new Set();
  for (const dict of dicts) {
    for (const [key, value] of Object.entries(dict)) {
      for (const subKey of Object.keys(value)) {
        allKeys.add(subKey);
      }
    }
  }

  // Merge entries by top-level key
  for (const dict of dicts) {
    for (const [key, value] of Object.entries(dict)) {
      if (!(key in merged)) {
        // Start with null for all known keys
        merged[key] = {};
        for (const k of allKeys) {
          merged[key][k] = null;
        }
      }

      // Fill in actual values
      for (const [subKey, subVal] of Object.entries(value)) {
        merged[key][subKey] = subVal;
      }
    }
  }

  return merged;
}

/**
 * Removes characters from a string that are illegal in filenames.
 * @param {string} string
 * @returns {Promise<string>}
 */
export async function replaceIllegalFileNameCharactersInString(string) {
  return string.replace(/[\\,#%&{}/*<>$'"@:]/g, '');
}

/**
 * Converts a timestamp string (in "HH:MM:SS" format) to total seconds.
 *
 * @param {string} timestamp - A string representing a timestamp (e.g., "01:23:45").
 * @returns {number|null} The total number of seconds, or null if the format is invalid.
 */
function timestampToSeconds(timestamp) {
  if (!timestamp) return null;

  const parts = timestamp.split(":");
  if (parts.length !== 3) return null;

  const [hours, minutes, seconds] = parts.map(Number);
  if ([hours, minutes, seconds].some(isNaN)) return null;

  return hours * 3600 + minutes * 60 + seconds;
}

// =====================================================
// 📦 Metadata Construction
// =====================================================

/**
 * Adds a new quote to a list and returns the list sorted by season, episode, and timestamp.
 * Quotes without a valid timestamp are placed at the end of their season-episode group.
 *
 * @param {Array<{season: number, episode: number, timestamp?: string}>} list - Existing list of quotes.
 * @param {{season: number, episode: number, timestamp?: string}} quote - Quote object to insert.
 * @returns {Array} Sorted array of quotes including the newly added quote.
 */
export async function addAndSortQuotes(list, quote) {
  const updatedList = [...list, quote];

  updatedList.sort((a, b) => {
    // Compare season
    if (a.season !== b.season) {
      return a.season - b.season;
    }

    // Compare episode
    if (a.episode !== b.episode) {
      return a.episode - b.episode;
    }

    // Compare timestamp
    const timeA = timestampToSeconds(a.timestamp);
    const timeB = timestampToSeconds(b.timestamp);

    // Push null timestamps to the end
    if (timeA === null && timeB === null) return 0;
    if (timeA === null) return 1;
    if (timeB === null) return -1;

    return timeA - timeB;
  });

  return updatedList;
}

/**
 * Builds a metadata object for a TMDB film.
 * @param {Object} film - TMDB film object.
 * @param {string} date - ISO timestamp to use for date_added and last_updated.
 * @returns {Promise<Object>}
 */
export async function buildFilmMetadata(film, date) {
  return {
    date_added: date,
    last_updated: date,
    last_synced: null,
    film_id: film.id ?? null,
    film_title: film.title ? film.title.replace(/[\\,#%&{}/*<>$'"@:]/g, '') : null,
    film_tagline: film.tagline,
    film_overview: film.overview,
    imdb_id: film.imdb_id ?? null,
    release_date: film.release_date ?? null,
    release_year: film.release_date?.split("-")[0] ?? null,
    genres: film.genres?.map(g => g.name) ?? [],
    runtime: film.runtime ?? null,
    original_language: film.original_language ?? null,
    homepage: film.homepage ?? null,
    collections: film.belongs_to_collections?.map(c => c.id) ?? [],
    watched: false,
    watch_date: null,
    rewatch_enabled: false,
    rewatch_dates: [],
    favorite: false,
    favorite_date: null,
    like: false,
    like_date: null,
    rating: null,
    rating_date: null,
    lists: [],
    review: "",
    review_date: null,
    quotes: [],
    banner: film.backdrop_path ? `https://image.tmdb.org/t/p/original/${film.backdrop_path}` : null,
    poster: film.poster_path ? `https://image.tmdb.org/t/p/w1280${film.poster_path}` : null,
    cssclasses: ['hidefilename', 'letterboxd'],
  };
}

/**
 * Builds a metadata object for a TMDB series.
 * @param {Object} series - TMDB series object.
 * @param {string} date - ISO timestamp to use for date_added and last_updated.
 * @returns {Promise<Object>}
 */
export async function buildSeriesMetadata(series, date) {
    // Episode counts per season (excluding specials)
    const episodeCounts = (series.seasons || [])
        .filter(season => season.season_number > 0)
        .map(season => season.episode_count);

    const trimmedEpisodeCounts = episodeCounts.slice(0, episodeCounts.findLastIndex(count => count !== 0) + 1);

    // Air dates per season (excluding specials)
    const seasonAirDates = (series.seasons || [])
        .filter(season => season.season_number > 0)
        .map(season => season.air_date);

    const trimmedSeasonAirDates = seasonAirDates.slice(0, seasonAirDates.findLastIndex(date => date) + 1);

    // Ensure equal length between counts and dates
    const minLength = Math.min(trimmedEpisodeCounts.length, trimmedSeasonAirDates.length);
    const finalEpisodeCounts = trimmedEpisodeCounts.slice(0, minLength);
    const finalSeasonAirDates = trimmedSeasonAirDates.slice(0, minLength);

    return {
        date_added: date,
        last_updated: date,
        last_synced: null,
        series_id: series.id ?? null,
        series_name: series.name ? series.name.replace(/[\\,#%&{}/*<>$'"@:]/g, '') : null,   
        series_tagline: series.tagline,
        series_overview: series.overview,     
        release_date: series.first_air_date ?? null,
        release_year: series.first_air_date?.split("-")[0] ?? null,
        genres: series.genres?.map(g => g.name) ?? [],
        original_language: series.original_language ?? null,
        homepage: series.homepage ?? null,
        favorite: false,
        favorite_date: null,
        like: false,
        like_date: null,
        rating: null,
        rating_date: null,
        status: 'Watchlist',
        series_logged: false,
        watch_season: 1,
        watch_episode: 1,
        watch_season_finale: false,
        watch_dates: [],
        rewatch_toggle: false,
        rewatch_session_active: false,
        rewatch_session_season_start: null,
        rewatch_session_episode_start: null,
        rewatch_season: 1,
        rewatch_episode: 1,
        rewatch_season_finale: false,
        rewatch_dates: [],
        season_breakdown: finalEpisodeCounts,
        season_air_dates: finalSeasonAirDates,
        lists: [],
        review: "",
        reviewEdit: false,
        review_date: null,
        quote_track_current_episode: false,
        quote_content: null,
        quote_season: null,
        quote_episode: null,
        quote_author: null,
        banner: series.backdrop_path ? `https://image.tmdb.org/t/p/original/${series.backdrop_path}` : null,
        poster: series.poster_path ? `https://image.tmdb.org/t/p/w1280${series.poster_path}` : null,
        cssclasses: ['hidefilename', 'letterboxd'],
    };
}

/**
 * Extracts and organizes metadata from an array of quotes, including unique actors,
 * characters, and a sorted combination of both.
 *
 * @param {Array<{character?: string, actor?: string}>} quotes - List of quote objects.
 * @returns {{
 *   actors: string[],              // Sorted list of unique actor names
 *   characters: string[],          // Sorted list of unique character names
 *   combined: { character: string, actor: string|null }[] // Sorted list of character-actor pairs
 * }}
 */
export function extractQuoteMetadata(quotes) {
  const actors = new Set();
  const characters = new Set();
  const combined = new Map(); // key: 'character|actor', value: { character, actor }

  for (const quote of quotes) {
    const actor = quote.actor?.trim?.() || null;
    const character = quote.character?.trim?.() || null;

    if (actor) actors.add(actor);
    if (character) characters.add(character);

    if (character) {
      const key = `${character}|${actor ?? ''}`;
      if (!combined.has(key)) {
        combined.set(key, { character, actor }); // actor may be null
      }
    }
  }

  return {
    actors: Array.from(actors).sort(),
    characters: Array.from(characters).sort(),
    combined: Array.from(combined.values()).sort((a, b) => {
      const labelA = a.actor ? `${a.character} (${a.actor})` : a.character;
      const labelB = b.actor ? `${b.character} (${b.actor})` : b.character;
      return labelA.localeCompare(labelB);
    }),
  };
}

/**
 * Scans all film and series files to collect a unique list of actors from quote metadata.
 *
 * @param {string} basePath - The root directory containing the `Films` and `Series` folders.
 * @returns {Promise<string[]>} Sorted list of unique actor names found in quotes.
 */
export async function getQuoteActors(basePath) {
    const filmsDirectory = `${basePath}/Films`
    const seriesDirectory = `${basePath}/Series`


    const filmFiles = await app.vault.getFiles().filter(f => f.path.startsWith(filmsDirectory));
    const seriesFiles = await app.vault.getFiles().filter(f => f.path.startsWith(seriesDirectory));
    const allFiles = [...filmFiles, ...seriesFiles];
    
    const actorSet = new Set();

    for (const file of allFiles) {
        const content = await app.vault.read(file);
        const frontmatter = app.metadataCache.getFileCache(file)?.frontmatter;

        if (!frontmatter || !frontmatter.quotes) continue;

        for (const quote of frontmatter.quotes) {
          if (quote.actor) {
            actorSet.add(quote.actor);
          }
        }
    }

    return Array.from(actorSet).sort();
}

/**
 * Updates metadata fields of an existing film entry with the latest data from TMDB.
 * Intended to refresh only the relevant fields that may change over time, such as title, poster, or release details.
 *
 * @param {Object} film - TMDB film object containing updated metadata.
 * @param {string} date - ISO timestamp used for last_updated and last_synced fields.
 * @returns {Object} A partial metadata object containing only the fields that are refreshed from TMDB.
 */
export async function syncFilmMetadata(film, date) {
    return {
        last_updated: date,
        last_synced: date,
        film_id: film.id ?? null,
        film_title: film.title ? film.title.replace(/[\\,#%&{}/*<>$'"@:]/g, '') : null,
        film_tagline: film.tagline,
        film_overview: film.overview, 
        imdb_id: film.imdb_id ?? null,
        release_date: film.release_date ?? null,
        release_year: film.release_date?.split("-")[0] ?? null,
        runtime: film.runtime ?? null,
        original_language: film.original_language ?? null,
        homepage: film.homepage ?? null,
        collections: film.belongs_to_collections?.map(c => c.id) ?? [],
        banner: film.backdrop_path ? `https://image.tmdb.org/t/p/original/${film.backdrop_path}` : null,
        poster: film.poster_path ? `https://image.tmdb.org/t/p/w1280${film.poster_path}` : null,
    };
}

/**
 * Updates metadata fields of an existing TV series entry with the latest data from TMDB.
 * Filters and synchronizes season episode counts and air dates, excluding special seasons (season 0).
 * Also trims out trailing seasons with no data to maintain clean and relevant metadata.
 *
 * @param {Object} series - TMDB series object containing updated series metadata.
 * @param {string} date - ISO timestamp used for last_updated and last_synced fields.
 * @returns {Object} A partial metadata object for the series, formatted for storage and display.
 */
export async function syncSeriesMetadata(series, date) {
    // Get episode counts per season (excluding specials)
    const episodeCounts = (series.seasons || [])
        .filter(season => season.season_number > 0)
        .map(season => season.episode_count);

    const trimmedEpisodeCounts = episodeCounts.slice(0, episodeCounts.findLastIndex(count => count !== 0) + 1);

    // Get air dates per season (excluding specials)
    const seasonAirDates = (series.seasons || [])
        .filter(season => season.season_number > 0)
        .map(season => season.air_date);

    const trimmedSeasonAirDates = seasonAirDates.slice(0, seasonAirDates.findLastIndex(date => date) + 1);

    // Trim both lists to the same length
    const minLength = Math.min(trimmedEpisodeCounts.length, trimmedSeasonAirDates.length);
    const finalEpisodeCounts = trimmedEpisodeCounts.slice(0, minLength);
    const finalSeasonAirDates = trimmedSeasonAirDates.slice(0, minLength);

    return {
        last_updated: date,
        last_synced: date,
        series_id: series.id ?? null,
        series_name: series.name ? series.name.replace(/[\\,#%&{}/*<>$'"@:]/g, '') : null,
        series_tagline: series.tagline,
        series_overview: series.overview,  
        release_date: series.first_air_date ?? null,
        release_year: series.first_air_date?.split("-")[0] ?? null,
        original_language: series.original_language ?? null,
        homepage: series.homepage ?? null,
        season_breakdown: finalEpisodeCounts,
        season_air_dates: finalSeasonAirDates,
        banner: series.backdrop_path ? `https://image.tmdb.org/t/p/original/${series.backdrop_path}` : null,
        poster: series.poster_path ? `https://image.tmdb.org/t/p/w1280${series.poster_path}` : null,
    };
}

// =====================================================
// 📤 Film Utilities
// =====================================================

/**
 * Gathers all genres found in film notes, excluding those already assigned.
 *
 * @param {string} basePath - The base path to your media vault.
 * @param {string[]} [currentGenres=[]] - List of genres already selected.
 * @returns {Promise<string[]>} Array of available film genres.
 */
export async function getAvailableFilmGenres(basePath, currentGenres = []) {
  const directory = `${basePath}/Film`;
  const files = app.vault.getFiles().filter(f => f.path.startsWith(directory));

  const allGenres = new Set();

  for (const file of files) {
    const frontmatter = app.metadataCache.getFileCache(file)?.frontmatter;
    if (!frontmatter || !Array.isArray(frontmatter.genres)) continue;

    for (const genre of frontmatter.genres) {
      if (genre && typeof genre === 'string') {
        allGenres.add(genre.trim());
      }
    }
  }

  const currentGenreSet = new Set(
    Array.isArray(currentGenres) ? currentGenres.map(g => g?.trim()) : []
  );

  // Filter out genres already in currentGenres
  const availableGenres = [...allGenres].filter(g => !currentGenreSet.has(g));

  return availableGenres;
}

/**
 * Retrieves all film list notes not currently associated with the given item.
 *
 * @param {string} basePath - The base path to your media vault.
 * @param {{title: string}[]} [currentLists=[]] - List of already linked film lists to exclude.
 * @returns {Promise<{title: string, path: string}[]>} Array of available film lists.
 */
export async function getAvailableFilmLists(basePath, currentLists = []) {
  const directory = `${basePath}/Core/Films/Lists`;
  const files = app.vault.getFiles().filter(f => f.path.startsWith(directory));

  // Ensure currentLists is an array of objects with a `title` key
  const currentTitles = new Set(
    Array.isArray(currentLists) ? currentLists.map(l => l?.title).filter(Boolean) : []
  );

  const availableLists = [];

  for (const file of files) {
    const frontmatter = app.metadataCache.getFileCache(file)?.frontmatter;
    if (!frontmatter || !frontmatter.title) continue;

    if (currentTitles.has(frontmatter.title)) continue;

    availableLists.push({
      title: frontmatter.title,
      path: file.path,
    });
  }

  return availableLists;
}

// =====================================================
// 📤 Film & Series Utilities
// =====================================================

/**
 * Searches TMDB for a film by query (and optionally year), returning full details of the best match.
 *
 * @param {string} query - Film title or keywords to search.
 * @param {string} apiKey - TMDB API key.
 * @param {number|null} [year=null] - Optional release year to narrow search.
 * @returns {Promise<object>} Full TMDB film details of the best match.
 * @throws {Error} If the query is invalid or no results are found.
 */
export async function fetchFilmDetailsByQuery(query, apiKey, year = null) {
  if (!query || !apiKey) {
    throw new Error("Missing query or API key.");
  }

  // Use the extended searchTMDB function with optional year
  const results = await searchTMDB("film", apiKey, query, year ? { year } : undefined);

  if (!results || results.length === 0) {
    throw new Error(`No film found for query "${query}"${year ? ` in ${year}` : ''}.`);
  }

  // Pick the first match (most relevant)
  const bestMatch = results[0];
  return await fetchDetailsById("film", bestMatch.id, apiKey);
}

/**
 * Retrieves all genres used across either film or series files in the vault,
 * excluding any genres already assigned to the current item.
 *
 * @param {string} basePath - The base path to your media vault.
 * @param {'Films'|'Series'} type - Whether to scan for film or series genres.
 * @param {string[]} [currentGenres=[]] - Genres already assigned to the current item.
 * @returns {Promise<string[]>} List of unused genre names available for assignment.
 */
export async function getAvailableGenresByType(basePath, type, currentGenres = []) {
  const listPath = type === 'Series' 
    ? `${basePath}/Series`
    : `${basePath}/Films`;
  const directory = `${basePath}/${type}`;
  const files = app.vault.getFiles().filter(f => f.path.startsWith(directory));

  const allGenres = new Set();

  for (const file of files) {
    const frontmatter = app.metadataCache.getFileCache(file)?.frontmatter;
    if (!frontmatter || !Array.isArray(frontmatter.genres)) continue;

    for (const genre of frontmatter.genres) {
      if (genre && typeof genre === 'string') {
        allGenres.add(genre.trim());
      }
    }
  }

  const currentGenreSet = new Set(
    Array.isArray(currentGenres) ? currentGenres.map(g => g?.trim()) : []
  );

  const availableGenres = [...allGenres].filter(g => !currentGenreSet.has(g));

  return availableGenres;
}

/**
 * Retrieves available list notes (film or series) that are not already linked to the current item.
 *
 * @param {string} basePath - The base path to your media vault.
 * @param {'Films'|'Series'} type - The media type to search lists for.
 * @param {{title: string}[]} [currentLists=[]] - List of already assigned lists to exclude by title.
 * @returns {Promise<{title: string, path: string}[]>} Array of available list metadata.
 */
export async function getAvailableListsByType(basePath, type, currentLists = []) {
  const listPath = type === 'Series' 
    ? `${basePath}/Core/Series/Lists`
    : `${basePath}/Core/Films/Lists`;

  const files = app.vault.getFiles().filter(f => f.path.startsWith(listPath));

  const currentTitles = new Set(
    Array.isArray(currentLists) ? currentLists.map(l => l?.title).filter(Boolean) : []
  );

  const availableLists = [];

  for (const file of files) {
    const frontmatter = app.metadataCache.getFileCache(file)?.frontmatter;
    if (!frontmatter || !frontmatter.title) continue;
    if (currentTitles.has(frontmatter.title)) continue;

    availableLists.push({
      title: frontmatter.title,
      path: file.path,
    });
  }

  return availableLists;
}


// =====================================================
// 📤 Import & Export Utilities
// =====================================================

/**
 * Creates a new film note in the library using TMDB data and a template.
 *
 * @param {string} basePath - The base path to your media vault.
 * @param {string|number} id - TMDB film ID.
 * @param {string} apiKey - Your TMDB API key.
 * @param {boolean} [openAfterCreate=true] - Whether to open the created note in preview mode.
 * @param {boolean} [showNotice=true] - Whether to show completion or error notices.
 * @returns {Promise<{status: 'created'|'skipped'|'error', filePath: string|null, message: string}>} Status and details of the operation.
 */
export async function addFilmToLibrary(basePath, id, apiKey, openAfterCreate = true, showNotice = true) {
  try {
    const filmDetails = await fetchDetailsById('film', id, apiKey);
    const safeTitleSlug = await formatFileName(filmDetails.title);
    const releaseYear = filmDetails.release_date?.split('-')[0] ?? null;
    const finalFileName = releaseYear ? `${safeTitleSlug}-${releaseYear}` : safeTitleSlug;
    const finalFilmFilePath = `${basePath}/Films/${finalFileName}.md`;

    const templatePath = `${basePath}/Core/Templates/film-template.md`;
    const templateFile = await app.vault.getFileByPath(templatePath);
    if (!templateFile) {
      const message = `🔴 Template not found at ${templatePath}`;
      error(message);
      return { status: "error", filePath: null, message };
    }

    if (await app.vault.adapter.exists(finalFilmFilePath)) {
      const message = `🟡 "${filmDetails.title}" already exists.`;
      if (showNotice) new Notice(message);
      return { status: "skipped", filePath: finalFilmFilePath, message };
    }

    await app.vault.copy(templateFile, finalFilmFilePath);
    const createdFile = await app.vault.getFileByPath(finalFilmFilePath);
    const now = await getFormattedLocalDateTime();

    const metadata = await buildFilmMetadata(filmDetails, now);
    await app.fileManager.processFrontMatter(createdFile, fm => Object.assign(fm, metadata));

    const replacements = {
      "{{film_title}}": filmDetails.title,
      "{{film_tagline}}": filmDetails.tagline,
      "{{film_overview}}": filmDetails.overview
    };

    await app.vault.process(createdFile, content => {
      for (const [key, val] of Object.entries(replacements)) {
        content = content.replace(new RegExp(key, 'g'), val ?? "");
      }
      return content;
    });

    if (openAfterCreate) {
      const leaf = app.workspace.getLeaf();
      await leaf.openFile(createdFile);
      const view = leaf.view;
      if (view?.setViewState) {
        await view.setViewState({ ...view.getState(), mode: 'preview' });
      }
    }

    const message = `🟢 "${filmDetails.title}" was added to your library.`;
    if (showNotice) new Notice(message);

    return { status: "created", filePath: finalFilmFilePath, message };

  } catch (err) {
    const message = `🔴 Failed to add film: ${err.message}`;
    error(message);
    return { status: "error", filePath: null, message };
  }
}

/**
 * Adds a series to the local library from TMDB data using a template.
 * If the series file already exists, it will be skipped.
 * @param {string} basePath - Base directory path for the library.
 * @param {string|number} id - TMDB ID of the series.
 * @param {string} apiKey - TMDB API key.
 * @param {boolean} [openAfterCreate=true] - Whether to open the note after creation.
 * @param {boolean} [showNotice=true] - Whether to show user-facing notifications.
 * @returns {Promise<{status: 'created'|'skipped'|'error', filePath: string|null, message: string}>}
 */
export async function addSeriesToLibrary(basePath, id, apiKey, openAfterCreate = true, showNotice = true) {
  try {
    const seriesDetails = await fetchDetailsById('series', id, apiKey);
    const safeTitleSlug = await formatFileName(seriesDetails.name);
    const releaseYear = seriesDetails.first_air_date?.split('-')[0] ?? null;
    const finalFileName = releaseYear ? `${safeTitleSlug}-${releaseYear}` : safeTitleSlug;
    const finalSeriesFilePath = `${basePath}/Series/${finalFileName}.md`;

    const templatePath = `${basePath}/Core/Templates/series-template.md`;
    const templateFile = await app.vault.getFileByPath(templatePath);
    if (!templateFile) {
      const message = `🔴 Template not found at ${templatePath}`;
      error(message);
      return { status: "error", filePath: null, message };
    }

    if (await app.vault.adapter.exists(finalSeriesFilePath)) {
      const message = `🟡 "${seriesDetails.name}" already exists.`;
      if (showNotice) new Notice(message);
      return { status: "skipped", filePath: finalSeriesFilePath, message };
    }

    await app.vault.copy(templateFile, finalSeriesFilePath);
    const createdFile = await app.vault.getFileByPath(finalSeriesFilePath);
    const now = await getFormattedLocalDateTime();

    const metadata = await buildSeriesMetadata(seriesDetails, now);
    await app.fileManager.processFrontMatter(createdFile, fm => Object.assign(fm, metadata));

    const replacements = {
      "{{series_name}}": seriesDetails.name,
      "{{series_tagline}}": seriesDetails.tagline,
      "{{series_overview}}": seriesDetails.overview
    };

    await app.vault.process(createdFile, content => {
      for (const [key, val] of Object.entries(replacements)) {
        content = content.replace(new RegExp(key, 'g'), val ?? "");
      }
      return content;
    });

    if (openAfterCreate) {
      const leaf = app.workspace.getLeaf();
      await leaf.openFile(createdFile);
      const view = leaf.view;
      if (view?.setViewState) {
        await view.setViewState({ ...view.getState(), mode: 'preview' });
      }
    }

    const message = `🟢 "${seriesDetails.name}" was added to your library.`;
    if (showNotice) new Notice(message);

    return { status: "created", filePath: finalSeriesFilePath, message };

  } catch (err) {
    const message = `🔴 Failed to add series: ${err.message}`;
    error(message);
    return { status: "error", filePath: null, message };
  }
}


/**
 * Exports frontmatter metadata from film and series notes into a single JSON file.
 * Includes both main items and list entries.
 *
 * @param {string} basePath - The base path to your media vault.
 * @returns {Promise<void>}
 */
export async function exportLibrary(basePath) {

    const outputJsonPath = await generateLetterboxdPlusJsonPath(basePath);

    const metadataCache = app.metadataCache;
    let letterboxdData = {};

    const types = ['Films', 'Series'];

    for (const type of types) {
        const folderPath = `${basePath}/${type}`;
        const files = app.vault.getFiles().filter(f => f.path.startsWith(folderPath));

        for (const file of files) {
            const metadata = metadataCache.getFileCache(file);

            if (metadata?.frontmatter) {
                const fileNameWithoutExt = file.name.replace(/\.md$/, '');
                const typeKey = type === 'Films' ? 'films' : 'series';

                letterboxdData[file.name] = {
                    frontmatter: metadata.frontmatter,
                    type: type === 'Films' ? 'film' : 'series',
                    list: false,
                };
            }
        }

        const listsDirectoryPath = `${basePath}/Core/${type}/Lists`;
        const listFiles = app.vault.getFiles().filter(f => f.path.startsWith(listsDirectoryPath));

        for (const listFile of listFiles) {
            const metadata = metadataCache.getFileCache(listFile);

            if (metadata?.frontmatter) {
                const fileNameWithoutExt = listFile.name.replace(/\.md$/, '');
                const typeKey = type === 'Films' ? 'films' : 'series';

                letterboxdData[listFile.name] = {
                    frontmatter: metadata.frontmatter,
                    type: type === 'Films' ? 'film' : 'series',
                    list: true,
                };
            }
        }
    }

    // Save the updated library data to the JSON file
    try {
        const jsonString = JSON.stringify(letterboxdData, null, 2);
        await app.vault.adapter.write(outputJsonPath, jsonString);
    } catch (err) {
        new Notice("Error saving JSON file: " + err.message);
    }
}

/**
 * Finds and returns a list of folder paths matching the `letterboxd-*-utc` naming pattern
 * under the Scripts directory, excluding subfolders.
 *
 * @param {string} basePath - The base path to your media vault.
 * @returns {Promise<string[]|undefined>} Array of matching export folder paths or undefined if none found.
 */
export async function fetchLetterboxdExportFolders(basePath) {
  const scriptsPath = `${basePath}/Core/Scripts`;

  const allFiles = app.vault.getFiles();

  const letterboxdFolders = Array.from(
    new Set(
      allFiles
        .map(f => f.path)
        .filter(p =>
          p.startsWith(scriptsPath + "/letterboxd-") &&
          p.includes("-utc/") // only deeper paths that help locate the parent
        )
        .map(p => {
          // Extract just the parent folder ending with -utc
          const match = p.match(/(.*letterboxd-[^\/]+-utc)\//);
          return match ? match[1] : null;
        })
        .filter(folder => folder !== null)
    )
  );

  if (!letterboxdFolders.length) {
    new Notice("No Letterboxd folders found in Scripts.");
    return;
  }

  return letterboxdFolders;
}

/**
 * Generates a timestamped file path for a Letterboxd Plus export JSON.
 *
 * Format: letterboxd-plus-YYYY-MM-DD-HH-MM-utc.json
 *
 * @param {string} basePath - The base path to your media vault.
 * @returns {string} Full path to the timestamped JSON file.
 */
export async function generateLetterboxdPlusJsonPath(basePath) {
  const now = new Date();
  const pad = (n) => n.toString().padStart(2, '0');

  const year = now.getUTCFullYear();
  const month = pad(now.getUTCMonth() + 1);
  const day = pad(now.getUTCDate());
  const hours = pad(now.getUTCHours());
  const minutes = pad(now.getUTCMinutes());

  const timestamp = `${year}-${month}-${day}-${hours}-${minutes}-utc`;
  return `${basePath}/Core/Scripts/letterboxd-plus-${timestamp}.json`;
}

/**
 * Imports notes from a previously exported `letterboxd-library.json` file into your vault.
 * Uses predefined templates for films, series, and lists.
 *
 * @param {string} basePath - The base path to your media vault.
 * @returns {Promise<void>}
 */
export async function importLibrary(basePath, file) {
    const paths = {
        library: file,
        filmTemplate: `${basePath}/Core/Templates/film-template.md`,
        seriesTemplate: `${basePath}/Core/Templates/series-template.md`,
        filmListTemplate: `${basePath}/Core/Templates/film-list-template.md`,
        seriesListTemplate: `${basePath}/Core/Templates/series-list-template.md`,
    };

    const libraryFile = app.vault.getFileByPath(paths.library);
    if (!libraryFile) {
        new Notice(`No export json file found in ${paths.json}`);
        return;
    }
    
    new Notice("📂 Starting Letterboxd+ import...\nParsing JSON & preparing data.", 5000);

    let letterboxdData;
    try {
        const jsonString = await app.vault.read(libraryFile);
        letterboxdData = JSON.parse(jsonString);
    } catch (error) {
        new Notice("Failed to read or parse JSON.");
        return;
    }
    

    const totalFiles = Object.keys(letterboxdData).length;
    if (totalFiles === 0) {
        new Notice(`No files to import from 'letterboxd-library.json'`);
        return;
    }

    const fileExists = async (path) => {
        const file = await app.vault.getFileByPath(path);
        return file !== null;
    };

    const createNoteFromTemplate = async (targetPath, templatePath, frontmatter) => {
        const templateFile = await app.vault.getFileByPath(templatePath);
        await app.vault.copy(templateFile, targetPath);
        const newFile = await app.vault.getFileByPath(targetPath);
        await app.fileManager.processFrontMatter(newFile, (fm) =>
            Object.assign(fm, frontmatter)
        );
    };

    let processedFiles = 0;
    const progressInterval = totalFiles <= 50
        ? 10
        : totalFiles <= 500
            ? Math.max(1, Math.floor(totalFiles / 10))
            : Math.max(1, Math.floor(totalFiles / 20));

    for (const [filename, { frontmatter, type, list }] of Object.entries(letterboxdData)) {

      if (type === 'film') {
          if (!list) {
              const filmPath = `${basePath}/Films/${filename}`;
              if (!(await fileExists(filmPath))) {
                  await createNoteFromTemplate(filmPath, paths.filmTemplate, frontmatter);
              } // else: file exists, still count it
          } else {
              const targetPath = `${basePath}/Core/Films/Lists/${filename}`;
              if (!(await fileExists(targetPath))) {
                  await createNoteFromTemplate(targetPath, paths.filmListTemplate, frontmatter);
              } // else: file exists, still count it
          }
      } else if (type === 'series') {
          if (!list) {
              const seriesPath = `${basePath}/Series/${filename}`;
              if (!(await fileExists(seriesPath))) {
                  await createNoteFromTemplate(seriesPath, paths.seriesTemplate, frontmatter);
              } // else: file exists, still count it
          } else {
              const targetPath = `${basePath}/Core/Series/Lists/${filename}`;
              if (!(await fileExists(targetPath))) {
                  await createNoteFromTemplate(targetPath, paths.seriesListTemplate, frontmatter);
              } // else: file exists, still count it
          }
      }

      processedFiles++;
      if (processedFiles % progressInterval === 0 || processedFiles === totalFiles) {
          new Notice(`Progress: ${Math.round((processedFiles / totalFiles) * 100)}% (${processedFiles}/${totalFiles})`);
      }
  }

  new Notice("📥 Import complete! All files processed successfully.");
}

/**
 * Parses a CSV string into an object, filtering out unused fields and handling duplicates appropriately.
 *
 * @param {string} csvText - The raw CSV text.
 * @param {string} csvType - Type of CSV (`watched`, `reviews`, `ratings`, etc.) to influence field handling.
 * @returns {Record<string, object>} Parsed entries indexed by film name.
 */
function parseCSV(csvText, csvType = 'watched') {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim() !== '');
  const result = {};

  if (lines.length < 2) return result;

  const rawHeaders = parseCSVLine(lines[0]);
  const headers = rawHeaders.map(h => h.toLowerCase());

  const dateKeyMapping = {
    watched: 'watched_date',
    watchlist: 'watchlist_date',
    ratings: 'rating_date',
    reviews: 'review_date',
    diary: 'diary_dates',
    likes: 'like_date'
  };
  const newDateKey = dateKeyMapping[csvType] || 'date';

  for (let i = 1; i < lines.length; i++) {
    const row = parseCSVLine(lines[i]);
    if (row.length !== headers.length) continue;

    const entry = {};
    for (let j = 0; j < headers.length; j++) {
      const header = headers[j];

      // Skip fields to ignore
      const skipFields = ['letterboxd uri', 'tags', 'rewatch'];
      if (csvType === 'reviews') skipFields.push('watched date');
      if (skipFields.includes(header)) continue;

      const key = header === 'date' ? newDateKey : header;
      entry[key] = row[j];
    }

    const name = entry['name'];
    const dateValue = entry[newDateKey];
    if (!name) continue;

    if (
      ['watched', 'diary', 'watchlist', 'likes', 'ratings', 'reviews'].includes(csvType) &&
      !dateValue
    ) {
      continue;
    }

    if (csvType === 'diary') {
      if (!(name in result)) result[name] = { diary_dates: [] };
      result[name].diary_dates.push(dateValue);
    } else if (csvType === 'reviews') {
      result[name] = entry; // use most recent review
    } else if (!(name in result)) {
      result[name] = entry;
    }
  }

  return result;
}

/**
 * Splits a single line of CSV into an array of fields, correctly handling quoted values and escaped characters.
 *
 * @param {string} line - One row of a CSV file.
 * @returns {string[]} Array of fields parsed from the line.
 */
function parseCSVLine(line) {
  const fields = [];
  let field = '';
  let insideQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      // Check if this is a double quote escaped inside quotes
      if (insideQuotes && line[i + 1] === '"') {
        field += '"'; // Add one quote
        i++; // Skip next quote
      } else {
        insideQuotes = !insideQuotes; // Toggle quote status
      }
    } else if (char === ',' && !insideQuotes) {
      // End of field
      fields.push(field);
      field = '';
    } else {
      field += char;
    }
  }
  // Push last field
  fields.push(field);
  
  return fields;
}

/**
 * Parses all supported CSV files from a Letterboxd export folder and merges their contents into a single object.
 * Shows progress notices throughout the process.
 *
 * @param {string} folderPath - The path to the Letterboxd export folder.
 * @param {string} apiKey - TMDB API key.
 * @returns {Promise<Record<string, object>>} Merged result of all parsed film data.
 */
export async function parseLetterboxdExport(folderPath, apiKey) {
  if (!apiKey) {
    throw new Error("Missing ID or API key.");
  }

  new Notice("📂 Starting Letterboxd import...\nParsing folder contents, preparing data.", 5000);
  const fileNames = {
    watchlist: "watchlist.csv",
    watched: "watched.csv",
    reviews: "reviews.csv",
    ratings: "ratings.csv",
    diary: "diary.csv",
    likes: "likes/films.csv"
  };

  let watchlist = {}, watched = {}, reviews = {}, ratings = {}, diary = {}, likes = {};

  for (const [key, filename] of Object.entries(fileNames)) {
    const fullFilePath = folderPath + "/" + filename;
    const file = app.vault.getAbstractFileByPath(fullFilePath);
    if (!file) {
      console.warn(`⚠️ Missing ${filename} in ${mostRecentFolderPath}`);
      continue;
    }

    const content = await app.vault.read(file);

    switch (key) {
      case 'watchlist':
        watchlist = parseCSV(content, 'watchlist');
        break;
      case 'watched':
        watched = parseCSV(content, 'watched');
        break;
      case 'reviews':
        reviews = parseCSV(content, 'reviews');
        break;
      case 'ratings':
        ratings = parseCSV(content, 'ratings');
        break;
      case 'diary':
        diary = parseCSV(content, 'diary');
        break;
      case 'likes':
        likes = parseCSV(content, 'likes');
        break;
    }
  }

  new Notice("🧩 Merging film data across files...", 5000);
  return mergeDictionariesByKey([watchlist, watched, reviews, ratings, diary, likes]); 
}

// =====================================================
// 🧼 Sync Utilities
// =====================================================

/**
 * Returns a promise that resolves after a specified delay.
 * Primarily used to respect API rate limits.
 *
 * @param {number} ms - Duration to wait in milliseconds.
 * @returns {Promise<void>} A promise that resolves after the delay.
 */
export async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Syncs all film files in the library with the latest data from TMDB.
 * Updates frontmatter metadata such as genres, release date, and overview.
 * Respects TMDB rate limits by introducing a delay between requests.
 *
 * @param {string} basePath - The base path of the Obsidian vault.
 * @param {string} tmdbKey - TMDB API key.
 * @param {boolean} [showNotice=true] - Whether to show user-facing notices during the process.
 * @returns {Promise<{synced: string[], failed: string[]}>} Object containing lists of successfully synced and failed film files.
 */
export async function syncAllFilms(basePath, tmdbKey, showNotice = true) {
  const filmFolder = basePath + "/Films";
  const filmFiles = app.vault.getMarkdownFiles().filter(f => f.path.startsWith(filmFolder));

  if (!filmFiles.length) {
    if (showNotice) new Notice("No film files found to sync.");
    return { synced: [], failed: [] };
  }

  const synced = [];
  const failed = [];

  for (const file of filmFiles) {
    try {
      const metadata = app.metadataCache.getFileCache(file);
      const title = metadata?.frontmatter?.film_title;
      const filmId = metadata?.frontmatter?.film_id;
      const currentGenres = metadata?.frontmatter?.genres ?? [];

      if (!title || !filmId) {
        failed.push(file.name);
        continue;
      }

      // Respect TMDB rate limit
      await delay(250);  // 4 requests per second

      const filmDetails = await fetchDetailsById('film', filmId, tmdbKey);
      const fetchedGenres = filmDetails.genres?.map(g => g.name) ?? [];
      const mergedGenres = Array.from(new Set([...currentGenres, ...fetchedGenres]));
      const now = await getFormattedLocalDateTime();
      let updatedMetadata = await syncFilmMetadata(filmDetails, now, mergedGenres);
      
      await app.fileManager.processFrontMatter(file, fm => Object.assign(fm, updatedMetadata));
      synced.push(file.name);
    } catch (err) {
      console.error("Sync failed for", file.path, err);
      failed.push(file.name);
    }
  }

  if (showNotice) {
    const summary = `🟢 Synced: ${synced.length} | 🔴 Failed: ${failed.length}`;
    new Notice(summary, 8000);

    if (failed.length) {
      console.warn("🔴 Failed to sync the following film files:");
      failed.forEach(name => console.warn("- " + name));
    }
  }

  return { synced, failed };
}

/**
 * Syncs all series files in the library with the latest data from TMDB.
 * Updates frontmatter metadata such as genres, air dates, and overview.
 * Respects TMDB rate limits by introducing a delay between requests.
 *
 * @param {string} basePath - The base path of the Obsidian vault.
 * @param {string} tmdbKey - TMDB API key.
 * @param {boolean} [showNotice=true] - Whether to show user-facing notices during the process.
 * @returns {Promise<{synced: string[], failed: string[]}>} Object containing lists of successfully synced and failed series files.
 */
export async function syncAllSeries(basePath, tmdbKey, showNotice = true) {
  const seriesFolder = basePath + "/Series";
  const seriesFiles = app.vault.getMarkdownFiles().filter(f => f.path.startsWith(seriesFolder));

  if (!seriesFiles.length) {
    if (showNotice) new Notice("No series files found to sync.");
    return { synced: [], failed: [] };
  }

  const synced = [];
  const failed = [];

  for (const file of seriesFiles) {
    try {
      const metadata = app.metadataCache.getFileCache(file);
      const name = metadata?.frontmatter?.series_name;
      const seriesId = metadata?.frontmatter?.series_id;
      const currentGenres = metadata?.frontmatter?.genres ?? [];

      if (!name || !seriesId) {
        failed.push(file.name);
        continue;
      }

      // Respect TMDB rate limit
      await delay(250);  // 4 requests per second

      const seriesDetails = await fetchDetailsById('series', seriesId, tmdbKey);
      const fetchedGenres = seriesDetails.genres?.map(g => g.name) ?? [];
      const mergedGenres = Array.from(new Set([...currentGenres, ...fetchedGenres]));
      const now = await getFormattedLocalDateTime();
      const updatedMetadata = await syncSeriesMetadata(seriesDetails, now, mergedGenres);

      await app.fileManager.processFrontMatter(file, fm => Object.assign(fm, updatedMetadata));
      synced.push(file.name);
    } catch (err) {
      console.error("Sync failed for", file.path, err);
      failed.push(file.name);
    }
  }

  if (showNotice) {
    const summary = `🟢 Synced: ${synced.length} | 🔴 Failed: ${failed.length}`;
    new Notice(summary, 8000);

    if (failed.length) {
      console.warn("🔴 Failed to sync the following series files:");
      failed.forEach(name => console.warn("- " + name));
    }
  }

  return { synced, failed };
}

/**
 * Syncs both film and series libraries with TMDB data.
 * Invokes `syncAllFilms` and `syncAllSeries`, then reports an aggregated result.
 *
 * @param {string} basePath - The base path of the Obsidian vault.
 * @param {string} tmdbKey - TMDB API key.
 * @returns {Promise<{synced: string[], failed: string[]}>} Object with combined results of synced and failed items from both films and series.
 */
export async function syncLibrary(basePath, tmdbKey) {
  const filmResults = await syncAllFilms(basePath, tmdbKey, false);
  const seriesResults = await syncAllSeries(basePath, tmdbKey, false);

  const filmSynced = filmResults.synced.length;
  const filmFailed = filmResults.failed.length;

  const seriesSynced = seriesResults.synced.length;
  const seriesFailed = seriesResults.failed.length;

  const totalSynced = filmSynced + seriesSynced;
  const totalFailed = filmFailed + seriesFailed;

  const summary = [
    `📚 Library Sync Summary`,
    `🎬 Films:   🟢 ${filmSynced} | 🔴 ${filmFailed}`,
    `📺 Series:  🟢 ${seriesSynced} | 🔴 ${seriesFailed}`,
    `—`.repeat(20),
    `🧾 Total:   🟢 ${totalSynced} | 🔴 ${totalFailed}`,
  ].join('\n');

  new Notice(summary, 10000);

  if (filmFailed || seriesFailed) {
    console.warn("🔴 Sync errors:");
    if (filmFailed) {
      console.warn("🎬 Failed films:");
      filmResults.failed.forEach(name => console.warn("- " + name));
    }
    if (seriesFailed) {
      console.warn("📺 Failed series:");
      seriesResults.failed.forEach(name => console.warn("- " + name));
    }
  }

  return {
    synced: [...filmResults.synced, ...seriesResults.synced],
    failed: [...filmResults.failed, ...seriesResults.failed],
  };
}

// =====================================================
// 🕒 Date Utilities
// =====================================================

/**
 * Returns a formatted local timestamp in ISO format with milliseconds (24-hour).
 * Example: 2025-05-04T15:03:22.001
 * @param {Date} date
 * @returns {string}
 */
export function getFormattedLocalDateTime() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  const hours = String(date.getHours()).padStart(2, '0'); // 24-hour
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  const milliseconds = String(date.getMilliseconds()).padStart(3, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}`;
}

// --- 

/**
 * Finds and returns a list of JSON file paths matching the
 * `letterboxd-plus-YYYY-MM-DD-HH-MM-utc.json` naming pattern
 * under the Scripts directory.
 *
 * @param {string} basePath - The base path to your media vault.
 * @returns {Promise<string[]|undefined>} Array of matching JSON file paths or undefined if none found.
 */
export async function fetchLetterboxdPlusJsonExports(basePath) {
  const scriptsPath = `${basePath}/Core/Scripts`;

  // Regex pattern for files like: letterboxd-plus-2025-06-20-03-21-utc.json
  const pattern = /^letterboxd-plus-\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-utc\.json$/;

  const matchingJsonFiles = app.vault
    .getFiles()
    .filter(file => {
      return file.path.startsWith(scriptsPath) &&
             pattern.test(file.name);
    })
    .map(file => file.path);

  if (matchingJsonFiles.length === 0) {
    new Notice("No matching Letterboxd JSON exports found.");
    return;
  }

  return matchingJsonFiles;
}

