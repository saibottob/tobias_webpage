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
| `FTP_SERVER_DIR` | `/www/tobias-gatschet.ch` |

Das Passwort gehört in kein File und in keinen Commit. Die Werte stehen nur in den GitHub-Secrets; der Workflow liest sie zur Laufzeit.

## Zielordner

Die Live-Seite liegt auf dem Server in `/www/tobias-gatschet.ch`. Unter `www/` liegen weitere Domains, deshalb darf der Upload nicht nach `www/` selbst gehen. Als `FTP_SERVER_DIR` genau `/www/tobias-gatschet.ch` eintragen.

Das Home des Hostings ist `/home/axesotis/`. Der FTP-Benutzer sieht den Ordner je nach Login als `/www/tobias-gatschet.ch` oder als `www/tobias-gatschet.ch`. Beides bezeichnet denselben Ordner, solange es nicht nur `www/` ist. Der Workflow lehnt `www` und `/www` ab.

Der Workflow wechselt mit `cd` in diesen Ordner. Gibt es ihn nicht, bricht der Lauf ab und legt nichts an. In FileZilla ist der Ordner daran zu erkennen, dass darin `index.html` und `blog/batteriekongress-2026/index.html` liegen.

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
- Ein falscher, aber vorhandener Zielordner wird überschrieben. `www/` allein enthält die anderen Domains und wird vom Workflow abgelehnt. Der gesetzte Ordner ist `/www/tobias-gatschet.ch`. Vor dem ersten echten Lauf den Dry-Run machen und prüfen, dass der Pfad im Log auf `tobias-gatschet.ch` endet und `blog/batteriekongress-2026/index.html` vorkommt.
