![version](https://img.shields.io/github/v/tag/josephlilleberg/obsidian-letterboxd-plus?label=version)
![license](https://img.shields.io/github/license/josephlilleberg/obsidian-letterboxd-plus)
[![obsidian](https://img.shields.io/badge/Obsidian-4E3A8C?style=flat&logo=obsidian&logoColor=white)](https://obsidian.md/)
![downloads](https://img.shields.io/github/downloads/josephlilleberg/obsidian-letterboxd-plus/latest/total)

# 🎞️ Letterboxd+

---

  
> ***Letterboxd+ is a minimal, local-first media tracker for films and series, designed for personal use in Obsidian — inspired by Letterboxd and thoughtfully expanded to embrace series.***

[Letterboxd](https://letterboxd.com) is a global platform for film discovery, where users log what they watch, share reviews, and build themed lists — like Goodreads, but for films.

**Letterboxd+** brings that experience to Obsidian — reimagined for personal use and expanded to include series. It’s a local-first, Markdown-based system for tracking both films and TV shows, tailored entirely to your preferences.

 With support for watchlists, diaries, and more, **Letterboxd+** is your personal media journal — a centralized, flexible system for capturing your evolving taste in both films and series.

---

## 🚀 Setup Instructions

Follow these steps to install and configure `obsidian-letterboxd-plus` in your Obsidian vault.

---

### 1. 📦 Required Obsidian Plugins

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

### 2. 🔐 TMDb API Key Setup

This system fetches movie metadata using [The Movie Database (TMDb)](https://www.themoviedb.org/). To use it:

1. Create a free TMDb account: [signup here](https://www.themoviedb.org/signup)
2. Request a personal API key: [TMDb API settings](https://www.themoviedb.org/settings/api)
3. Store your key in the following location inside your Letterboxd+ directory:

```
Letterboxd+/Core/Scripts/api_keys.json
```

> ⚠️ This file must not be shared or pushed to GitHub. Use `.gitignore` to exclude it from version control.

---

### 3. 📄 `api_keys.json` Format

Here’s the required structure for your API key file:

```json
{
  "tmdb": "YOUR_TMDB_API_KEY_HERE"
}
```

**Example:**

```json
{
  "tmdb": "83fcae16194d8924e78ef8003f15c3a8"
}
```

---

## 📝 Features (Preview)

- Track watched films, ratings, and reviews
- Create watchlists, genre filters, and visual dashboards using Dataview and Charts
- Fully local and customizable inside your Obsidian vault
