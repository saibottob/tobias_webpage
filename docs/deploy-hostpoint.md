# Deploy auf Hostpoint

Ein Push auf `main`, der Dateien unter `webseite_2024/` oder den Deploy-Workflow ändert, baut die Seite und lädt nur den Build-Output per FTPS hoch. Derselbe Ablauf lässt sich unter **Actions** manuell starten. Änderungen nur an dieser Anleitung lösen keinen Deploy aus.

## Build

Im Ordner `webseite_2024`:

```bash
npm ci
npm run build
```

`npm run build` führt Eleventy aus. Der Output steht in `webseite_2024/dist` (in `.eleventy.js` als `output: "dist"` festgelegt). Dieser Ordner steht in `.gitignore` und ist nicht im Repository. `npm start` ist nur der lokale Dev-Server.

Node ist im Workflow auf Version 22 gesetzt. Eleventy 3.1.2 verlangt Node 18 oder neuer. Installiert wird exakt über `package-lock.json` (`npm ci`).

## Secrets eintragen

Repository **saibottob/tobias_webpage** → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**.

Vier Secrets, genau diese Namen:

| Name | Wert |
| --- | --- |
| `FTP_SERVER` | `sl1737.web.hostpoint.ch` |
| `FTP_USERNAME` | `tobias@cfmag.ch` |
| `FTP_PASSWORD` | FTP-Passwort aus dem Hostpoint Control Panel |
| `FTP_SERVER_DIR` | Zielordner, wie er nach dem FTP-Login sichtbar ist. Siehe unten. |

Das Passwort gehört in kein File und in keinen Commit. Die Werte stehen nur in den GitHub-Secrets; der Workflow liest sie zur Laufzeit.

## Zielordner

Im Repository gibt es keinen hinterlegten Pfad der Live-Seite.

Bei Hostpoint ist das Home dieses Hostings `/home/axesotis/`. Das Document-Root einer Domain liegt üblicherweise hier:

- Website ab September 2007: `/home/axesotis/www/tobias-gatschet.ch/`
- ältere Website: `/home/axesotis/public_html/`

Den Ordnernamen kann man im Control Panel unter **Websites** ändern. Er muss also nicht zwingend `tobias-gatschet.ch` heissen.

`tobias@cfmag.ch` ist ein zusätzlicher FTP-Benutzer. Solche Konten sehen nach dem Login oft nicht das ganze Home, sondern nur einen freigegebenen Unterordner. `FTP_SERVER_DIR` ist deshalb der Pfad **relativ zu dem, was FileZilla direkt nach dem Login anzeigt**, nicht automatisch `/home/axesotis/...`.

So den Ordner bestimmen:

1. In FileZilla mit **explizitem FTP über TLS**, Port 21, auf `sl1737.web.hostpoint.ch` verbinden.
2. Den Ordner suchen, in dem die Live-Seite liegt. Erkennbar an `index.html` und zum Beispiel `blog/batteriekongress-2026/index.html`.
3. Diesen Pfad als `FTP_SERVER_DIR` eintragen.
   - Die Seite liegt direkt im Login-Ordner: `/` oder `.`
   - Nach dem Login sieht man `www`: zum Beispiel `www/tobias-gatschet.ch/`

Der Workflow wechselt mit `cd` in diesen Ordner. Gibt es ihn nicht, bricht der Lauf ab und legt nichts an.

## Dry-Run

**Actions** → **Website bauen und zu Hostpoint deployen** → **Run workflow** → **Dry-Run** anhaken.

Der Lauf baut die Seite, verbindet sich und listet die Dateien samt Zielpfad. Er schreibt nichts. Zugangsdaten erscheinen nicht im Log. Ein Push auf `main` ist immer ein echter Upload.

Sichere Reihenfolge beim ersten Mal:

1. Diesen Pull Request mergen, solange die vier Secrets noch fehlen. Der automatische Lauf stoppt dann vor dem Upload.
2. Die Secrets anlegen.
3. Den Workflow manuell mit Dry-Run starten und die Dateiliste prüfen.
4. Danach einmal manuell ohne Dry-Run starten, oder auf den nächsten Push warten.

Wenn die Secrets schon vor dem Merge existieren, lädt der Merge sofort wirklich hoch.

## Was der Upload tut und was nicht

- Protokoll: explizites FTPS auf Port 21 (`AUTH TLS`), Steuer- und Datenverbindung verschlüsselt. Das Zertifikat des Hostnamens wird geprüft. `FTP_SERVER` muss zum Zertifikat passen, also `sl1737.web.hostpoint.ch`.
- Hochgeladen wird nur der Inhalt von `webseite_2024/dist`, in den Zielordner hinein, nicht in einen Unterordner `dist`.
- Gleichnamige Dateien werden überschrieben. Dateien, die nur auf dem Server liegen (`.htaccess`, Statistiken, andere Domains, manuell hochgeladene Dateien), bleiben.
- Es gibt kein `--delete` und kein `dangerous-clean-slate`. Ein Blogpost, der aus dem Repo verschwindet, bleibt online, bis er in FileZilla gelöscht wird.
- Ein falscher, aber vorhandener Zielordner wird überschrieben. `www/` allein wäre der Ordner aller Domains, nicht die einzelne Website. Vor dem ersten echten Lauf den Dry-Run machen und den Pfad in FileZilla gegen `blog/batteriekongress-2026/index.html` prüfen.
