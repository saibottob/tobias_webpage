# Frontmatter für Blogposts

Neue Beiträge liegen unter `src/blog/YYYY-MM-DD-slug.md`.

```yaml
---
layout: layouts/blogpost.html
title: Titel des Beitrags
date: 2026-10-25
updated: 2026-11-02
description: Ein bis zwei Sätze für Suche, Social Cards und den Feed.
permalink: "/blog/slug/"
image: /assets/images/blogposts/bild.jpg
# imageWidth: 2000
# imageHeight: 1333
tags: blog
kategorie: technik
---
```

## Felder

- **title**, **date**, **permalink**, **tags: blog** — nötig, damit der Beitrag im Blog und im Feed erscheint. `date` ist das Veröffentlichungsdatum (`article:published_time`, JSON-LD `datePublished`).
- **description** — Meta-Description, Open Graph, Twitter, JSON-LD und Feed-Zusammenfassung. Fehlt sie, gibt der Build eine Warnung aus.
- **image** — Pfad ab der Site-Wurzel, zum Beispiel `/assets/images/blogposts/bild.jpg`. Wird als Hero, `og:image`/`twitter:image` und JSON-LD-Bild verwendet. Fehlt das Feld, warnt der Build; ausgegeben wird dann `/assets/images/hero-image.jpg`.
- **updated** — optional, letzte inhaltliche Änderung als `YYYY-MM-DD`. Setzt `article:modified_time`, JSON-LD `dateModified` und `lastmod` in der Sitemap. Ohne Feld gilt `date`.
- **imageWidth** und **imageHeight** — optional. Nur gemeinsam gesetzt überschreiben sie die Bildgrösse, die der Build sonst aus der Datei liest (`og:image:width` / `og:image:height`). Ist die Datei nicht lesbar und keine Masse angegeben, entfallen die beiden Tags; der Build bricht nicht ab.
- **kategorie** — optional. Wird wie die Anzeige im Blog normalisiert und als `article:section` ausgegeben: erster Buchstabe gross, übrige klein. `Politik` wird zu `Gesellschaft` (auch bei anderer Gross-/Kleinschreibung).

Der Atom-Feed steht unter `/feed.xml`. Jede Seite verlinkt ihn im Head mit `<link rel="alternate" type="application/atom+xml">`.
