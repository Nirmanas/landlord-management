# LandLordMan

LandLordMan – nuomos valdymo programa su atskirais nuomotojų ir nuomininkų puslapiais. Nuomotojai gali tvarkyti butus, nuomos sutartis, mokėjimo laikotarpius ir nuomininkus. Nuomininkai gali peržiūrėti savo nuomos sutartis ir mokėjimų informaciją.

## HTTP API

API pasiekiama adresais, prasidedančiais `/api`. Išsami kompiuteriu apdorojama specifikacija su schemomis ir atsakymų kodais pateikta faile [openapi.yaml](openapi.yaml).

### Autentifikavimas ir duomenų formatas

`POST /api/auth/login` grąžina `access_token` ir nustato HttpOnly slapuką `auth`. API klientas žetoną gali siųsti antraštėje `Authorization: Bearer <access_token>`; naršyklė gali automatiškai siųsti slapuką. Jei pateikta `Authorization` antraštė, ji turi pirmenybę prieš slapuką. Žetonai galioja 24 valandas. `DELETE /api/auth/login` pašalina slapuką, tačiau anksčiau išduotas Bearer žetonas lieka galioti iki jo galiojimo pabaigos.

Norint naudoti butų, nuomos sutarčių ir mokėjimo laikotarpių API maršrutus, reikia prisijungti. Nuomotojai gali kurti, keisti ir archyvuoti jiems priklausančius įrašus. Nuomininkai gali skaityti įrašus, susietus su jų nuomos sutartimis arba mokėjimų istorija. ID URL kelyje ir JSON turinyje pateikiami kaip teigiamų dešimtainių skaičių **eilutės** (pavyzdžiui, `"12"`); datos pateikiamos `YYYY-MM-DD` formato eilutėmis. Siųsdami JSON turinį nurodykite `Content-Type: application/json`.

Sėkmingos užklausos dėl vieno įrašo grąžina `{ "data": ... }`, o sąrašų užklausos – `{ "data": [...] }`. Klaidos grąžina `{ "error": "..." }`. Jei neteisingi autentifikavimo duomenų laukai, atsakyme taip pat būna objektas `fields`. Dažniausi būsenos kodai: `400` (neteisingas JSON arba ID URL kelyje), `401` (reikia prisijungti arba neteisingi prisijungimo duomenys), `403` (reikalingos nuomotojo teisės), `404` (įrašas nerastas arba nepasiekiamas šiam naudotojui), `409` (dubliuojamas, archyvuotas arba su kitu įrašu persidengiantis įrašas), `422` (neteisingi duomenys) ir `500` (serverio klaida).

### API maršrutai

| Metodas | Adresas | Prieiga | Užklausos turinys / veiksmas |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | Visiems | `{ "name": string, "phoneNumber": string, "email": string, "password": string }`; slaptažodį turi sudaryti bent 8 simboliai. Grąžina `201 { "success": true }`. Užsiregistravus automatiškai neprisijungiama. |
| `POST` | `/api/auth/login` | Visiems | `{ "email": string, "password": string }`. Grąžina `{ "success": true, "access_token": string, "token_type": "Bearer", "expires_in": 86400 }`. |
| `DELETE` | `/api/auth/login` | Visiems | Atsijungia pašalindamas slapuką `auth`; grąžina `{ "success": true }`. |
| `GET` | `/api/apartments` | Nuomotojui arba nuomininkui | Pateikia pasiekiamų butų sąrašą. |
| `POST` | `/api/apartments` | Nuomotojui | Sukuria butą pagal `{ "name": string, "address": string }`; grąžina `201`. |
| `GET` | `/api/apartments/{id}` | Nuomotojui arba nuomininkui | Pateikia vieną pasiekiamą butą. |
| `PUT` | `/api/apartments/{id}` | Buto savininkui | Pakeičia pavadinimą ir adresą; turinys toks pat kaip `POST` užklausoje. |
| `DELETE` | `/api/apartments/{id}` | Buto savininkui | Archyvuoja butą; grąžina įrašą su užpildytu `archivedAt`. |
| `GET` | `/api/leases` | Nuomotojui arba nuomininkui | Pateikia pasiekiamų nuomos sutarčių sąrašą. |
| `POST` | `/api/leases` | Nuomotojui | Sukuria nuomos sutartį pagal `{ "apartmentId": string, "startDate": string, "endDate": string, "rentalPrice": number, "tenantIds": string[] }`; grąžina `201`. |
| `GET` | `/api/leases/{id}` | Nuomotojui arba nuomininkui | Pateikia vieną pasiekiamą nuomos sutartį. |
| `PUT` | `/api/leases/{id}` | Buto savininkui | Atnaujina sutartį; reikia tokio pat viso turinio kaip `POST` užklausoje. Sutarties negalima perkelti į kitą butą. |
| `DELETE` | `/api/leases/{id}` | Buto savininkui | Archyvuoja nuomos sutartį. |
| `GET` | `/api/periods` | Nuomotojui arba nuomininkui | Pateikia pasiekiamų mokėjimo laikotarpių sąrašą. |
| `POST` | `/api/periods` | Nuomotojui | Sukuria laikotarpį pagal `{ "leaseId": string, "name": string, "startDate": string, "endDate": string }`; grąžina `201`. |
| `GET` | `/api/periods/{id}` | Nuomotojui arba nuomininkui | Pateikia vieną pasiekiamą mokėjimo laikotarpį. |
| `PUT` | `/api/periods/{id}` | Buto savininkui | Pakeičia laikotarpio pavadinimą pagal `{ "name": string }`. |
| `DELETE` | `/api/periods/{id}` | Buto savininkui | Archyvuoja mokėjimo laikotarpį. |

Butų atsakymuose pateikiami laukai `id`, `name`, `address` ir `archivedAt`. Nuomos sutarčių atsakymuose pateikiami `id`, `apartmentId`, `startDate`, `endDate`, pagal datas apskaičiuojamas `status` (`upcoming`, `active` arba `ended`), `totalRentCents`, `tenantIds` ir `archivedAt`. Mokėjimo laikotarpių atsakymuose pateikiami `id`, `leaseId`, `name`, `startDate`, `endDate`, `dueDate` ir `archivedAt`. Nearchyvuotų įrašų `archivedAt` reikšmė yra `null`, o archyvuotų – ISO formato laiko žyma. Archyvuotus įrašus ir toliau galima skaityti.

Nuomos sutarties `rentalPrice` reikšmė yra teigiamas sveikasis skaičius **centais**. Sutarčiai reikia bent vieno užregistruoto, prieinamo nuomininko; jos datos negali persidengti su kita to paties buto sutartimi. Laikotarpio datos turi patekti į sutarties laikotarpį ir negali persidengti su kitu mokėjimo laikotarpiu. Sukūrus laikotarpį, `dueDate` nustatoma lygi `endDate`, o kiekvienam priskirtam nuomininkui sukuriamas mokėjimas, kuo tolygiau padalijant nuomos sumą. Atnaujinant laikotarpį keičiamas tik jo pavadinimas.
