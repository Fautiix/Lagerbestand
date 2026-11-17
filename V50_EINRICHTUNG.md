# V50 – Einrichtung

Die Oberflächen- und JavaScript-Dateien für V50 liegen bereits im Repository auf `main`.

## Einmalige Datenbankeinrichtung

Im **bestehenden Supabase-Projekt** unter **SQL Editor** die Dateien in dieser Reihenfolge ausführen:

1. `V50_material_nachbestellen.sql` – gemeinsame Nachbestellliste mit Materialreferenz, M-Nummer, Mitarbeitername, den Status *Offen*/*Bestellt* und Berechtigungen. Eine eingetragene Anforderung erscheint anschließend im E-Meister-Prüfplatz.
2. `V50_berichte_abgabe.sql` – Stundenzettel erst nach bewusstem Klick auf *Stundenzettel abgeben* für den E-Meister sichtbar, blaue Zettel erst nach Polier-Unterschrift (bei zwei Blättern müssen beide unterschrieben sein). Das SQL enthält auch die serverseitige Löschregel für eigene Entwürfe.

Die Skripte wurden in GitHub gespeichert, **aber nicht automatisch in der Supabase-Datenbank ausgeführt**. Vor dem Ausführen die bestehenden RLS-Policies, Funktionssignaturen und Tabellenspalten im Projekt prüfen.

## Schnelltest nach Einrichtung

- Als Mitarbeiter die App in Version V50 öffnen, im Reiter *Material nachbestellen* einen Eintrag aus der Materialliste auswählen und speichern. M-Nummer und Name sollen automatisch erscheinen.
- Als Schlottau den Prüfplatz öffnen und das Material als *Bestellt* abhaken. Es soll aus den offenen Anforderungen verschwinden und in der allgemeinen Tabelle stehen bleiben.
- Einen neuen Stundenzettel anfangen und zwischenspeichern: beim E-Meister unsichtbar. Erst *Stundenzettel abgeben* öffnet ihn für die Prüfung.
- Blauen Zettel ohne Polier-Unterschrift speichern: beim E-Meister unsichtbar. Nach Polier-Unterschrift und erfolgreicher Cloud-Synchronisierung für die Prüfung sichtbar.
- Eigenen nicht abgegebenen blauen Zettel löschen: verschwunden aus lokaler und Cloud-Liste. Nach Polier-Unterschrift muss Löschen abgelehnt werden.
- App auf Android und iPhone neu laden und die Bedienung sowie Rollen prüfen.

**Stand:** Syntax der JavaScript-Dateien geprüft, aber keine Live-Tests mit echter Supabase-Datenbank oder iPhone durchgeführt.
