# A320 Type Rating Trainer – verschlüsselte Version

Diese Version enthält **keine Klartext-Fragen** im Code. Der Fragenkatalog liegt verschlüsselt in:

```text
questions.enc.json
```

Die App entschlüsselt die Fragen erst nach Passworteingabe lokal im Browser.

## Enthaltene Dateien

```text
index.html
style.css
app.js
questions.enc.json
manifest.json
service-worker.js
icon-192.png
icon-512.png
tools/encrypt.html
```

## Nicht enthalten

Aus Datenschutzgründen sind diese Klartext-Dateien **nicht** im Ordner enthalten:

```text
questions.js
fragen_liste.md
A320 Typerating Test.xlsx
A320 LAT Questionnaire PPT.pdf
```

## Lokal starten

Die verschlüsselte Version darf nicht einfach per Doppelklick geöffnet werden, weil der Browser sonst `questions.enc.json` nicht sauber laden kann.

Starte im Ordner einen lokalen Server:

```bash
python3 -m http.server 8000
```

Dann im Browser öffnen:

```text
http://localhost:8000
```

## iPhone / Handy

Für die verschlüsselte Version ist HTTPS empfohlen. Am einfachsten:

1. Ordner auf GitHub in ein privates oder öffentliches Repository hochladen.
2. GitHub Pages aktivieren.
3. Die GitHub-Pages-URL auf dem iPhone in Safari öffnen.
4. Passwort eingeben.
5. Optional: Teilen → Zum Home-Bildschirm.

Wichtig: Wenn das Repository öffentlich ist, ist `questions.enc.json` theoretisch herunterladbar, aber verschlüsselt. Verwende deshalb ein starkes Passwort.

## Passwort ändern

1. App entsperren.
2. `Fragen als JSON exportieren` klicken.
3. `tools/encrypt.html` im lokalen Server öffnen:

```text
http://localhost:8000/tools/encrypt.html
```

4. Exportierte JSON-Datei auswählen.
5. Neues starkes Passwort eingeben.
6. Neue `questions.enc.json` herunterladen.
7. Alte `questions.enc.json` im App-Ordner ersetzen.

## Daten

Statistik und Versuche werden lokal im Browser gespeichert (`localStorage`). Sie werden nicht synchronisiert und nicht an einen Server gesendet.


## Update: Auto-Check im Lernmodus

In dieser Version wird im Lernmodus eine Antwort direkt beim Anklicken geprüft.

- Richtige Antwort: wird grün markiert und nach ca. 1 Sekunde geht es automatisch zur nächsten Frage.
- Falsche Antwort: gewählte Antwort wird rot markiert, richtige Antwort grün; danach manuell mit „Nächste Frage“ weiter.
- Testprüfung: unverändert, keine Anzeige der Lösung während der Prüfung.

Für GitHub/Vercel/Cloudflare müssen mindestens diese Dateien ersetzt werden:

- app.js
- service-worker.js

Danach die Seite mit `?v=4` öffnen und auf dem iPhone ggf. Website-Daten löschen.
