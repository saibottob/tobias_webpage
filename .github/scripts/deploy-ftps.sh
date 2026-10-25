#!/usr/bin/env bash
# Lädt ein lokales Verzeichnis per explizitem FTPS (Port 21, AUTH TLS) hoch.
# Es wird nichts auf dem Server gelöscht: kein mirror --delete, kein clean-slate.
# Dateien, die es lokal und remote gibt, werden überschrieben (STOR), nicht
# erst gelöscht und neu angelegt.
#
# FTP_PORT ist kein Secret und wird vom Workflow nicht gesetzt (immer 21).
# Nur lokale Tests dürfen einen anderen Port setzen.
set +x
set -euo pipefail

require_var() {
  local name="$1"
  if [[ -z "${!name:-}" ]]; then
    echo "Fehlt: ${name}. Erwartet werden die GitHub-Secrets FTP_SERVER, FTP_USERNAME, FTP_PASSWORD und FTP_SERVER_DIR." >&2
    exit 1
  fi
  if [[ "${!name}" == *$'\n'* || "${!name}" == *$'\r'* ]]; then
    echo "${name} enthält einen Zeilenumbruch und wird abgelehnt." >&2
    exit 1
  fi
}

require_var FTP_SERVER
require_var FTP_USERNAME
require_var FTP_PASSWORD
require_var FTP_SERVER_DIR
export FTP_SERVER FTP_USERNAME FTP_PASSWORD FTP_SERVER_DIR

if [[ ! "$FTP_SERVER" =~ ^[A-Za-z0-9.-]+$ ]]; then
  echo "FTP_SERVER muss ein Hostname sein, ohne Schema, Pfad oder Leerzeichen. Beispiel: sl1737.web.hostpoint.ch" >&2
  exit 1
fi

FTP_SERVER_DIR="${FTP_SERVER_DIR#"${FTP_SERVER_DIR%%[![:space:]]*}"}"
FTP_SERVER_DIR="${FTP_SERVER_DIR%"${FTP_SERVER_DIR##*[![:space:]]}"}"
if [[ -z "$FTP_SERVER_DIR" ]]; then
  echo "FTP_SERVER_DIR ist leer." >&2
  exit 1
fi
if [[ "$FTP_SERVER_DIR" == *"://"* ]]; then
  echo "FTP_SERVER_DIR ist ein Ordnerpfad, keine URL." >&2
  exit 1
fi
if [[ "$FTP_SERVER_DIR" == *".."* ]]; then
  echo "FTP_SERVER_DIR darf keine '..'-Segmente enthalten." >&2
  exit 1
fi

PORT="${FTP_PORT:-21}"
if [[ ! "$PORT" =~ ^[0-9]+$ ]] || [[ "$PORT" -lt 1 || "$PORT" -gt 65535 ]]; then
  echo "FTP_PORT ist ungültig." >&2
  exit 1
fi

LOCAL_DIR="${LOCAL_DIR:-dist}"
if [[ ! -s "$LOCAL_DIR/index.html" ]]; then
  echo "Build-Output fehlt oder ist leer: ${LOCAL_DIR}/index.html" >&2
  exit 1
fi
if [[ ! -d "$LOCAL_DIR/blog" || ! -d "$LOCAL_DIR/css" ]]; then
  echo "Build-Output unvollständig: ${LOCAL_DIR} enthält kein blog/ oder css/." >&2
  exit 1
fi

DRY=no
case "${DRY_RUN:-false}" in
  true|True|TRUE|1|yes|Yes|YES) DRY=yes ;;
esac

LOCAL_ABS="$(cd "$LOCAL_DIR" && pwd)"
FILE_COUNT="$(find "$LOCAL_ABS" -type f | wc -l | tr -d ' ')"

umask 077
SCRIPT="$(mktemp)"
REDACT="$(mktemp)"
trap 'rm -f "$SCRIPT" "$REDACT"' EXIT
cat > "$REDACT" << 'PY'
import os
import re
import sys
import urllib.parse

needles = []
for value in (os.environ.get("FTP_PASSWORD", ""), os.environ.get("FTP_USERNAME", "")):
    if not value:
        continue
    needles.extend(
        [
            value,
            urllib.parse.quote(value, safe=""),
            urllib.parse.quote_plus(value),
        ]
    )
needles = sorted({needle for needle in needles if len(needle) >= 4}, key=len, reverse=True)
userinfo = re.compile(r"([a-zA-Z][a-zA-Z0-9+.-]*://)\S+@")

for line in sys.stdin:
    line = userinfo.sub(r"\1***@", line)
    for needle in needles:
        line = line.replace(needle, "***")
    sys.stdout.write(line)
    sys.stdout.flush()
PY

export LOCAL_ABS DRY PORT
python3 - "$SCRIPT" << 'PY'
import os
import sys

path = sys.argv[1]

def q(value: str) -> str:
    return '"' + value.replace("\\", "\\\\").replace('"', '\\"') + '"'

dry = os.environ["DRY"] == "yes"
mirror = [
    "mirror",
    "--reverse",
    "--verbose",
    "--transfer-all",
    "--overwrite",
    "--no-perms",
]
if dry:
    mirror.append("--dry-run")
forbidden = ("--delete", "--Remove-source-files", "--Move")
if any(arg == flag or arg.startswith("--delete") for arg in mirror for flag in forbidden):
    raise SystemExit("Interner Fehler: Löschoption im mirror-Befehl.")

server = os.environ["FTP_SERVER"]
lines = [
    "set cmd:fail-exit yes",
    "set cmd:interactive no",
    "set cmd:trace no",
    "set xfer:clobber yes",
    "set ftp:passive-mode yes",
    "set ftp:ssl-allow yes",
    "set ftp:ssl-force yes",
    "set ftp:ssl-auth TLS",
    "set ftp:ssl-protect-data yes",
    "set ftp:ssl-protect-list yes",
    "set ssl:verify-certificate yes",
    "set ssl:check-hostname yes",
    "set net:max-retries 2",
    "set net:timeout 30",
    f"open -p {os.environ['PORT']} ftp://{server}",
    f"user {q(os.environ['FTP_USERNAME'])} {q(os.environ['FTP_PASSWORD'])}",
    f"cd {q(os.environ['FTP_SERVER_DIR'])}",
    f"lcd {q(os.environ['LOCAL_ABS'])}",
    " ".join(mirror) + " . .",
    "bye",
]
with open(path, "w", encoding="utf-8") as handle:
    handle.write("\n".join(lines) + "\n")
os.chmod(path, 0o600)
PY

if grep -E -q -- '--delete|clean-slate|Remove-source-files' "$SCRIPT"; then
  echo "Interner Fehler: das FTP-Skript würde etwas löschen. Abbruch vor der Verbindung." >&2
  exit 1
fi

echo "Lokale Dateien: ${FILE_COUNT}"
echo "FTPS explizit, Port ${PORT}. Dry-Run: ${DRY}. Nichts wird gelöscht; vorhandene Dateien werden überschrieben."
echo "Der Zielordner muss schon existieren. Ein unbekannter Pfad bricht ab, statt einen neuen Ordner anzulegen."

# lftp druckt im Dry-Run FTP-URLs mit Benutzer und Passwort. Die Ausgabe wird
# gefiltert, bevor sie im Log landet. pipefail erhält den Exit-Code von lftp.
lftp -f "$SCRIPT" 2>&1 | python3 -u "$REDACT"
