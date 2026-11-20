# V50 – Einrichtung

**Stand 20.11.2026: Die Datenbankteile von V50 sind in Supabase bereits aktiv.**
Die SQL-Dateien im Repository geben jetzt genau diesen Live-Stand wieder (Referenz).
Sie müssen **nicht** erneut ausgeführt werden.

## Was live aktiv ist

**Stundenzettel-Abgabe** (`V50_berichte_abgabe.sql`)
- RPC `app_v50_submit_week(date)` → leitet an die geprüfte Funktion `app_v49_week_submit(date)` weiter. Nur für angemeldete Benutzer, nicht für `anon`.
- Den Abgabe-Zeitstempel schützt der bestehende Trigger `app_v49_week_submit_guard`. Einen zweiten Abgabe-Trigger (`v50_guard_week_submission`) bitte **nicht** anlegen – er würde die Abgabe blockieren.
- Der E-Meister sieht Stundenzettel nur nach Abgabe (Policy `v30_week_read`).

**Blaue Zettel**
- Restrictive Policy `v50_blue_signed_only`: fremde Berichte erst sichtbar nach Polier-Unterschrift (bei zwei Blättern beide) oder wenn bereits geprüft.
- RPC `app_v50_delete_blue_draft(text)`: Monteur löscht nur eigene, nicht unterschriebene Entwürfe.

**Material nachbestellen** (`V50_material_nachbestellen.sql`)
- Tabelle `material_reorders` mit RLS. Rechte: SELECT/INSERT/UPDATE erlaubt, DELETE/TRUNCATE gesperrt.
- Trigger `v50_reorder_guard` übernimmt Materialname, M-Nummer und Mitarbeitername aus der Datenbank; nur E-Meister/Admin dürfen abhaken.

## Nur bei Neueinrichtung

Die beiden Skripte sind so geschrieben, dass sie nichts doppelt anlegen und keine vorhandene Policy oder Trigger ersetzen. Reihenfolge: zuerst `V50_material_nachbestellen.sql`, dann `V50_berichte_abgabe.sql`. Voraussetzung sind die Funktionen und Policies aus V30–V49.

## Noch offen: Funktionstest

- Als Mitarbeiter: Material nachbestellen → Name und M-Nummer erscheinen automatisch.
- Als Schlottau: Material im Prüfplatz abhaken → verschwindet aus „offen“, bleibt in der Liste als „Bestellt“.
- Stundenzettel speichern → beim E-Meister unsichtbar. Erst *Stundenzettel abgeben* macht ihn sichtbar.
- Blauen Zettel ohne Polier-Unterschrift → beim E-Meister unsichtbar; nach Unterschrift und Cloud-Sync sichtbar.
- Eigenen nicht unterschriebenen blauen Zettel löschen → klappt; nach Polier-Unterschrift wird Löschen abgelehnt.
- Android und iPhone neu laden, Rollen prüfen.
