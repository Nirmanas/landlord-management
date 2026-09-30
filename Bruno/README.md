# Saitynai API demonstracija

Kolekcija patikrina 15 CRUD metodų: butus (`/api/apartments`), sutartis (`/api/leases`) ir mokėjimo laikotarpius (`/api/periods`). Užduoties lentelėje sutartims pakartotas `/api/periods`; projekte sutarčių maršrutas yra `/api/leases`.

## Paleidimas

1. Paleiskite programą ir Bruno atidarykite aplanką, kuriame yra `opencollection.yml`.
2. Pasirinkite `Local` aplinką. Įveskite testinio **nuomotojo** `landlordEmail`, `landlordPassword` ir aktyvaus registruoto nuomininko `tenantId`. Prireikus pakeiskite `baseUrl`. Slaptažodžio nesaugokite siunčiamoje kolekcijos kopijoje.
3. Bruno paspauskite **Run Collection** arba iš šio aplanko paleiskite `npx --yes @usebruno/cli run --env Local`.

Užklausos sunumeruotos vykdymo tvarka. Prisijungimo žetonas ir sukurti ID perduodami automatiškai. Kiekvienas metodas tikrina HTTP kodą, atsakymo turinį bei įrašo ID. Klaidos scenarijai tikrina 400 (trūksta JSON turinio), 422 (blogi JSON laukai) ir 404 (nerastas įrašas). DELETE čia grąžina **200 su archyvuotu įrašu**, todėl tikrinamas ir `archivedAt`. Trynimas yra archyvavimas: bandomieji įrašai išlieka duomenų bazėje. Paleidžiant pakartotinai sukuriamas naujas butas, todėl sutarties datos su ankstesniu bandymu nesikerta.

Prieš ~15 s pristatymą pašildykite Next.js serverį. Esant šaltam `next dev` kompiliavimui ar lėtai DB, vykdymas gali trukti ilgiau; kolekcija netvirtina konkretaus greičio.

Pastaba: labai didelis skaitinis ID (`9007199254740991`) šiuo metu buto GET maršrute grąžina 500 dėl DB `Int` ribos. 404 demonstracijoje naudojamas neegzistuojantis `999999999` ID.
