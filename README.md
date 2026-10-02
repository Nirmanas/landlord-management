# LandLordMan

LandLordMan – nuomos valdymo programa su atskirais nuomotojų ir nuomininkų puslapiais. Nuomotojai tvarko butus, nuomos sutartis, mokėjimo laikotarpius ir nuomininkus. Nuomininkai peržiūri savo sutartis ir praneša apie išsiųstus mokėjimus.

## HTTP API

Duomenys keičiami per aiškius HTTP API maršrutus; Server Actions nenaudojami. Išsami specifikacija su schemomis ir atsakymų kodais pateikta [openapi.yaml](openapi.yaml).

`POST /api/auth/login` grąžina 15 minučių `access_token` ir nustato HttpOnly `auth` bei septynių dienų `refresh` slapukus. API klientas gali siųsti `Authorization: Bearer <access_token>`; naršyklė automatiškai siunčia slapukus. Pateikta `Authorization` antraštė turi pirmenybę prieš `auth` slapuką. `POST /api/auth/refresh` rotuoja atnaujinimo žetoną, o `DELETE /api/auth/login` atšaukia atnaujinimo sesiją ir pašalina abu slapukus.

Nuomotojo API prasideda `/api/landlord`, nuomininko – `/api/tenant`. Kiekvienas maršrutas tikrina prisijungimą ir atitinkamą rolę. Nuomotojas pasiekia savo butus ir jų įrašus, nuomininkas – įrašus, susietus su jo sutartimis ar mokėjimų istorija. Nuomininkų kontaktų katalogas prieinamas nuomotojams. Įdėtiniuose URL sutartis turi priklausyti nurodytam butui, o laikotarpis – nurodytai sutarčiai; neatitinkantys arba neprieinami įrašai grąžina `404`.

### API maršrutai

Toliau `{area}` reiškia `landlord` arba `tenant`; GET užklausoms reikia atitinkamos rolės. POST, PUT ir DELETE duomenų maršrutai prieinami tik nuomotojo srityje, išskyrus atskirai nurodytą mokėjimo pranešimą.

| Metodas | Adresas | Veiksmas |
| --- | --- | --- |
| POST | `/api/auth/register` | Registracija: `{ name, phoneNumber, email, password }`. |
| POST | `/api/auth/login` | Prisijungimas: `{ email, password }`. |
| POST | `/api/auth/refresh` | Prieigos žetono atnaujinimas naudojant `refresh` slapuką. |
| DELETE | `/api/auth/login` | Atsijungimas. |
| GET, POST | `/api/{area}/apartments` | Butų sąrašas arba naujas butas: `{ name, address }`. |
| GET, PUT, DELETE | `/api/{area}/apartments/{apartment}` | Buto peržiūra, atnaujinimas arba archyvavimas. |
| GET | `/api/{area}/leases` | Visų pasiekiamų sutarčių sąrašas suvestinėms. |
| GET, POST | `/api/{area}/apartments/{apartment}/leases` | Konkretaus buto sutartys; kūrimas: `{ startDate, endDate, rentalPrice, tenantIds }`. |
| GET, PUT, DELETE | `/api/{area}/apartments/{apartment}/leases/{lease}` | Sutarties peržiūra, atnaujinimas arba archyvavimas. |
| GET | `/api/{area}/periods` | Visų pasiekiamų laikotarpių sąrašas suvestinėms. |
| GET, POST | `/api/{area}/apartments/{apartment}/leases/{lease}/periods` | Sutarties laikotarpiai; kūrimas: `{ name, startDate, endDate }`. |
| GET, PUT, DELETE | `/api/{area}/apartments/{apartment}/leases/{lease}/periods/{period}` | Laikotarpio peržiūra, pavadinimo pakeitimas (`{ name }`) arba archyvavimas. |
| PUT, DELETE | `/api/landlord/tenants/{id}` | Kontakto pakeitimas (`{ name, phoneNumber }`) arba nuomininko archyvavimas. |
| GET | `/api/landlord/payments` | Nuomotojo mokėjimai; filtrai URL užklausos parametruose `apartment`, `lease`, `tenant`, `period`, `status`. |
| POST | `/api/tenant/payments/{id}/report` | Savo neapmokėto arba nepavykusio mokėjimo pranešimas; būsena tampa `pending`. |
| POST | `/api/landlord/payments/{id}/confirm` | Savo buto mokėjimo gavimo patvirtinimas; `pending` būsena tampa `confirmed`. |

ID pateikiami kaip teigiamų dešimtainių skaičių eilutės (pvz., `"12"`), datos – `YYYY-MM-DD`. Kuriant sutartį ar laikotarpį, tėvinį įrašą nurodo URL; neprivalomi JSON `apartmentId` arba `leaseId` turi sutapti su URL. Sutarties negalima perkelti į kitą butą. JSON užklausoms nurodykite `Content-Type: application/json`. Naršyklės keitimo užklausų `Origin` turi sutapti su API adresu.

Įrašų atsakymai naudoja `{ "data": ... }`, sąrašai – `{ "data": [...] }`, klaidos – `{ "error": "..." }`. Dažniausi kodai: `400` (blogas JSON ar URL ID), `401` (neprisijungta), `403` (netinkama rolė), `404` (įrašas neprieinamas), `409` (archyvuotas įrašas ar netinkama būsena), `422` (blogi laukai), `500` (serverio klaida). DELETE archyvuoja įrašus; istorija lieka pasiekiama.

`rentalPrice` yra teigiamas sveikasis skaičius centais. Sutarties datos negali persidengti su kita to paties buto sutartimi. Laikotarpio datos turi patekti į sutarties laikotarpį ir negali persidengti su kitu laikotarpiu. Kuriant laikotarpį, `dueDate` lygi `endDate`, o nuomos suma tolygiai padalijama priskirtiems nuomininkams.

Mokėjimų filtravimo pavyzdys: `GET /api/landlord/payments?apartment=12&tenant=8&status=pending`. Visi pateikti filtrai taikomi kartu duomenų bazėje ir visada apribojami prisijungusio nuomotojo butais. `status` gali būti `unpaid`, `overdue`, `pending`, `confirmed` arba `failed`; `overdue` reiškia neapmokėtą mokėjimą su terminu iki šiandienos, o `unpaid` – neapmokėtą mokėjimą, kurio terminas šiandien arba vėliau. Datos lyginamos pagal programos serverio šiandienos datą. Tušti filtrai netaikomi. Neteisingi ID, būsenos arba pasikartojantys parametrai grąžina `400`. Puslapis `/landlord/payments` saugo tuos pačius filtrus savo URL, todėl juos galima išsaugoti ir atkurti perkrovus puslapį.
