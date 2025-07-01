![version](https://img.shields.io/github/v/tag/josephlilleberg/obsidian-letterboxd-plus?label=version)
![license](https://img.shields.io/github/license/josephlilleberg/obsidian-letterboxd-plus)
[![obsidian](https://img.shields.io/badge/Obsidian-4E3A8C?style=flat&logo=obsidian&logoColor=white)](https://obsidian.md/)
![downloads](https://img.shields.io/github/downloads/josephlilleberg/obsidian-letterboxd-plus/latest/total)

# 🎞️ Letterboxd+

---

> ***Letterboxd+ is a minimal, local-first media tracker for films and series — designed for personal use in Obsidian, inspired by Letterboxd, and thoughtfully extended to support series.***

[Letterboxd](https://letterboxd.com) is a global platform for film discovery, where users log what they watch, compose reviews, and build themed lists — like Goodreads, but for films.

**Letterboxd+** brings that experience into Obsidian, giving you full control over how you log, explore, and reflect on what you watch. Whether you’re keeping a watchlist, logging rewatches, or collecting favorite quotes, everything stays local, customizable, and yours.

 With support for watchlists, diaries, and more, **Letterboxd+** is your personal media journal — a centralized, flexible system for capturing your evolving taste in both films and series.

---
## 🚀 Setup Instructions

Follow these steps to install and configure `Letterboxd+` in your Obsidian vault.

---

### 1. Getting Started: Letterboxd+ Setup

1. Download the ZIP file containing the `Letterboxd+` system and CSS snippets.
	- The `Letterboxd+` folder contains the core tracking system.o style the apperance.
	- The `snippets` folder includes the required CSS files that style the appearance and layout of the system. 

2. The `Letterboxd+` folder can be placed anywhere within your vault and it should work seamlessly out of the box without any additional setup.

3. The `snippets` folder should contain 3 css files:
	- `Letterboxd.css`
	- `MCL Multi Column.css`
	- `MCL Wide Views.css`

> The latter two files — MCL Multi Column.css and MCL Wide Views.css — are part of the [Modular CSS Layout (MCL)](https://github.com/efemkay/obsidian-modular-css-layout) system by **efemkay**.
>
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

#### **🧭 Unified Navigation Header**
---
Every **film** and **series** page includes a clean, consistent navigation header that lets you move between core parts of the system:

- **Log Film/Series**: Quickly add a new film or series to your system
- **Profile**: View stats and activity at a glance
- **Diary**: Browse your watch history chronologically
- **Lists**: Access or manage custom lists
- **Watchlist**: See what you plan to watch
- **Library**: Sync all films or series depending on the active mode (films or series), manage imports/exports, create backups, and pull data from your official Letterboxd account.
  
> This keeps your tracking experience centralized, organized, and easy to navigate — no matter where you are in the system.

#### **🎥 Unified Film & Series Tracking**
---
- View and manage:
    - **Favorites**, **Likes**, **Watchlist**, and **Recent activity**
    - **Ratings graph** for visualizing rating distribution

---
#### **📊 Quick-Access Dashboards**

Get an at-a-glance overview of your media activity, with live summary stats organized by media type:

---
##### **🔹 Series Overview**

- **Series:**
	- **0 / 0 | +0**
	- *Unique series watched this year / of those, released this year | New seasons released this year*

- **Diary:**
	- **0 / 0 | 0 / 0**
	- *Diary entries of episodes watched this year / of those, from new seasons | Diary entries of episodes rewatched this year / of those, from new seasons*

---
##### **🔹 Films Overview**

- **Films:**
    - **0 / 0**
    - *Films watched this year / of those, from films released this year*

- **Diary:**    
    - **0 / 0**
    - *Diary entries this year / of those, from films released this year*

---
#### **🔹 Other Summaries**

- **Reviews**, **Lists**, **Watchlist**, **Likes**, **Favorites:** Show total counts
- **Quotes:** Aggregate total quotes across all entries

---
#### **🧾 Individual Entry Pages**
  
Whether it’s a film or an episode, each entry supports:
- **Rating**, **Liking**, and **Favoriting**
- **Syncing metadata** from TMDb
- **Logging watches** and **rewatches**, including **backlogs**.
- **Writing reviews** and **adding quotes**
- **Adding to custom lists**
- **External links** to IMDb or official sites when available

> 📺 For series, episodes can also track **status** (watching, waiting, on hold, etc.) and rewatches from any point in the series.

#### **🗂️ Custom Lists**
---
- Create personalized themed lists for:
    - **Films** (e.g., “Best of 2024”, “Cozy Horror”)        
    - **Series** (e.g., “Comfort Shows”, “To Finish Watching”)

- Lists display relevant metadata and link directly to each entry
