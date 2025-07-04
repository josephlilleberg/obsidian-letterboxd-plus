![version](https://img.shields.io/github/v/tag/josephlilleberg/obsidian-letterboxd-plus?label=version)
![license](https://img.shields.io/github/license/josephlilleberg/obsidian-letterboxd-plus)
[![obsidian](https://img.shields.io/badge/Obsidian-4E3A8C?style=flat&logo=obsidian&logoColor=white)](https://obsidian.md/)
![downloads](https://img.shields.io/github/downloads/josephlilleberg/obsidian-letterboxd-plus/latest/total)
[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/josephlilleberg)

# 🎞️ Letterboxd+

---

> ***Letterboxd+ is a minimal, local-first media tracker for films and series — designed for personal use in Obsidian, inspired by Letterboxd, and thoughtfully extended to support series.***

[Letterboxd](https://letterboxd.com) is a global platform for film discovery, where users log what they watch, compose reviews, and build themed lists — like Goodreads, but for films.

**Letterboxd+** brings that experience into Obsidian, giving you full control over how you log, explore, and reflect on what you watch. Whether you’re keeping a watchlist, logging rewatches, or collecting favorite quotes, everything stays local, customizable, and yours.

 With support for watchlists, diaries, and more, **Letterboxd+** is your personal media journal — a centralized, flexible system for capturing your evolving taste in both films and series.

> 💛 Enjoy using Letterboxd+? Consider supporting the project on [Ko-fi](https://ko-fi.com/josephlilleberg)


---
## 🚀 Setup Instructions

Follow these steps to install and configure `Letterboxd+` in your Obsidian vault.

---

### 1. Getting Started: Letterboxd+ Setup

1. Download the ZIP file containing the `Letterboxd+` system and CSS snippets.
	- The `Letterboxd+` folder contains the core tracking system.
	- The `snippets` folder includes the required CSS files that style the appearance and layout of the system. 

2. The `Letterboxd+` folder can be placed anywhere within your vault and should work seamlessly out of the box without any additional setup.

3. The `snippets` folder contains 3 css files. Two of the files — MCL Multi Column.css and MCL Wide Views.css — are part of the [Modular CSS Layout (MCL)](https://github.com/efemkay/obsidian-modular-css-layout) collection by **efemkay**.

> 📘 For a clear walkthrough on setting up CSS snippets, refer to the [official Obsidian documentation](https://help.obsidian.md/snippets).

---
### 2. 📦 Required Obsidian Plugins

Make sure the following **Community Plugins** are installed and enabled:

- [Charts](https://github.com/phibr0/obsidian-charts)
- [Dataview](https://blacksmithgu.github.io/obsidian-dataview/)
	- Enable Javascript queries
	- Enable inline Javascript queries
- [Iconize](https://github.com/FlorianWoelki/obsidian-iconize)
- [JS Engine](https://www.moritzjung.dev/obsidian-js-engine-plugin-docs/)
- [Meta Bind](https://github.com/mProjectsCode/obsidian-meta-bind-plugin)
	- Enable Javascript
- [Note Toolbar](https://github.com/chrisgurney/obsidian-note-toolbar)

> You can find these under **Settings → Community Plugins → Browse**.

---

### 3. 🔐 TMDb API Key Setup

This system fetches film and series metadata using [The Movie Database (TMDb)](https://www.themoviedb.org/). To use it:

1. Create a free TMDb account: [signup here](https://www.themoviedb.org/signup)
2. Request a personal API key: [TMDb API settings](https://www.themoviedb.org/settings/api)
3. That’s it — the system will prompt you for your API key the first time it’s required and securely save it in:

```
Letterboxd+/Core/Scripts/tmdb_key.json
```

with the following structure:

```json
{
  "apiKey": "YOUR_TMDB_API_KEY_HERE"
}
```

> ⚠️ This file contains a private API key and should not be committed to GitHub. Make sure it’s listed in your [.gitignore](https://docs.github.com/en/get-started/git-basics/ignoring-files).

```
# API Key
tmdb_key.json
```

---
### 4. ✨ Features ✨**

#### **4.1 🧭 Unified Navigation Header**
---
Every **film** and **series** page includes a clean, consistent navigation header that lets you move between core parts of the system:

- **Log Film/Series**: Quickly add a new film or series to your system
- **Profile**:  Provides a visual overview of your engagement — featuring a breakdown of favorites and likes, a recent activity feed, rating distribution graph, and total counts for entries across your Letterboxd+ library (e.g. reviews, quotes, lists, etc.).
- **Diary**: Browse your watch history chronologically
- **Lists**: Access or manage custom lists
- **Watchlist**: See what you plan to watch
- **Library**: Sync all films or series depending on the active mode (films or series), manage imports/exports, create backups, and pull data from your official Letterboxd account.
  
This keeps your tracking experience centralized, organized, and easy to navigate — no matter where you are in the system.

#### **4.2 🎥 Unified Film & Series Tracking**
---
- View and manage:
    - **Favorites**, **Likes**, **Watchlist**, and **Recent activity**
    - **Ratings graph** for visualizing rating distribution

---
#### **4.3 📊 Film & Series Dashboards**

Stay on top of your media journey with a dynamic, real-time dashboard that offers a clear snapshot of your film and series activity. Each dashboard offers a focused snapshot of your engagement, helping you track what you’ve watched, rewatched, logged, or added throughout the year— all in a streamlined view. 

---
##### **🔹 Series Overview**

- **Series:**
	- **0 / 0 | +0**
	- *Unique series watched this year / of those, released this year | New seasons released this year*

- **Diary:**
	- **0 / 0 | 0 / 0**
	- *Diary entries logged of series watched this year / of those, from seasons released this year | Diary entries logged of series rewatched this year / of those, from seasons released this year*

---
##### **🔹 Films Overview**

- **Films:**
    - **0 / 0**
    - *Films watched this year / of those, released this year*

- **Diary:**    
    - **0 / 0**
    - *Diary entries logged of films watch this year / of those, from films released this year*

> Note: Diary entries for films includes the initial watch and all respective rewatches

---
##### **🔹 Other Summaries**

- **Reviews**, **Lists**, **Watchlist**, **Likes**, **Favorites** show total counts. **Quotes**, on the other hand, shows an ggregate total quotes across all entries.

---
#### **4.4 🧾 Individual Entry Pages**
  
Whether it’s a film or series, each entry supports:
- **Rating**, **liking**, and **favoriting**
- **Syncing metadata** from TMDb
- **Logging watches**, **rewatches**, and **backlogs**
- **Writing reviews** and **adding memorable quotes**
- **Organizing entries into custom lists**
- **Assigning custom genres**

> 📺 For series, episodes can also track **status** (watching, waiting, on hold, etc.) and rewatches from any point in the series.

#### **4.5 🗂️ Custom Lists for Films & Series**
---
- Create personalized themed lists for both films and series — whether you’re building a “Best of 2024” collection, a “Comfort Shows” playlist, or a watchlist to revisit later.
    - Each media type has its own dedicated lists
    - Add entries directly from the film or series page, or from the list view itself
    - Lists display relevant metadata and link directly to each entry for quick access
    - Perfect for tracking moods, genres, rewatches, or curated collections

- Lists display relevant metadata and link directly to each entry
