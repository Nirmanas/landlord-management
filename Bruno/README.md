# Saitynai API demonstracija

Kolekcija patikrina 15 CRUD metodų nuomotojo srityje: butus (`/api/landlord/apartments`), jų sutartis (`/api/landlord/apartments/{apartment}/leases`) ir sutarties mokėjimo laikotarpius (`/api/landlord/apartments/{apartment}/leases/{lease}/periods`). Tėviniai ID imami iš URL, o JSON turinyje nekartojami. Sąrašų ir įrašų patikros tikrina tėvinius ryšius. Papildomos užklausos patikrina nuomininko skaitymo API, rolių atskyrimą ir mokėjimo pranešimą bei gavimo patvirtinimą.

## Paleidimas

1. Paleiskite programą ir Bruno atidarykite aplanką, kuriame yra `opencollection.yml`.
2. Pasirinkite `Local` aplinką. Įveskite testinio **nuomotojo** `landlordEmail`, `landlordPassword` ir aktyvaus registruoto nuomininko `tenantId`. Prireikus pakeiskite `baseUrl`. Slaptažodžio nesaugokite siunčiamoje kolekcijos kopijoje.
3. Bruno paspauskite **Run Collection** arba iš šio aplanko paleiskite `npx --yes @usebruno/cli run --env Local`.

Užklausos sunumeruotos vykdymo tvarka. `01` prisijungia nuomotoju, išvalo ankstesnio vykdymo ID ir išsaugo 15 minučių `accessToken`. `02–23` sukuria, peržiūri, keičia ir archyvuoja bandomuosius įrašus; sukurti ID perduodami automatiškai. `24` patikrina, kad nuomotojo žetonas negali naudoti nuomininko API (`403`). Kiekvienas metodas tikrina HTTP kodą, atsakymo turinį bei įrašo ID. Klaidos scenarijai tikrina 400 (trūksta JSON turinio), 422 (blogi JSON laukai) ir 404 (nerastas įrašas). DELETE čia grąžina **200 su archyvuotu įrašu**, todėl tikrinamas ir `archivedAt`. Trynimas yra archyvavimas: bandomieji įrašai išlieka duomenų bazėje. Paleidžiant pakartotinai sukuriamas naujas butas, todėl sutarties datos su ankstesniu bandymu nesikerta.

## Nuomininko ir mokėjimų patikros

Norėdami vykdyti `25–34`, `Local` aplinkoje įveskite `tenantEmail` ir slaptą `tenantPassword`. Šis naudotojas turi atitikti pagrindiniame scenarijuje nurodytą `tenantId`. `25` išsaugo atskirą `tenantAccessToken`, o `26–33` patikrina `/api/tenant` sąrašus ir įdėtinius įrašus. Archyvuoti bandomieji įrašai lieka skaitomi. `34` patikrina, kad nuomininko žetonas negali naudoti nuomotojo API (`403`).

`35–36` papildomai reikia `paymentId`: tai turi būti šio nuomininko neapmokėtas arba nepavykęs bandomasis mokėjimas, susietas su prisijungusio nuomotojo butu. `35` pakeičia jo būseną į `pending`, o `36` patvirtina gavimą ir pakeičia būseną į `confirmed`. Pakartotiniam bandymui pasirinkite kitą neapmokėtą arba nepavykusį bandomąjį mokėjimą. Patvirtinimo užklausa vykdoma tik jei pranešimo užklausa šiame vykdyme pavyko.

Nepateikus nuomininko duomenų, kolekcijos vykdymas praleidžia `25–36`. Nepateikus tik `paymentId`, praleidžiamos `35–36`. Tam naudojama Bruno [kolekcijos vykdymo `skipRequest()` funkcija](https://github.com/usebruno/bruno-docs/blob/main/testing/script/javascript-reference.mdx). Vykdant pavienę užklausą, reikalingus duomenis ir žetoną reikia pateikti patiems.

Prieš ~15 s pristatymą pašildykite Next.js serverį. Esant šaltam `next dev` kompiliavimui ar lėtai DB, vykdymas gali trukti ilgiau; kolekcija netvirtina konkretaus greičio.

ID, viršijantys DB `Int` ribą, grąžina 400. 404 demonstracijoje naudojamas neegzistuojantis `999999999` ID.

## Mokėjimų filtravimas

`37` patikrina nuomotojo mokėjimų sąrašą. `38` perduoda `apartment`, `lease`, `tenant` ir `period` per URL užklausos parametrus ir tikrina, kad grąžinami tik pasirinkti mokėjimai. `39` tikrina `status=pending`, o `40` – neteisingos būsenos klaidą (`400`). Šios užklausos naudoja nuomotojo `accessToken` ir vykdomos net jei neprivalomas nuomininko scenarijus praleistas. Archyvuotų bandomųjų įrašų mokėjimai lieka sąrašuose.
