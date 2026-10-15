# Фото на сайті

Усі зображення нижче — **тимчасові безкоштовні стокові фото** з Unsplash (ліцензія Unsplash License: безкоштовне використання, зокрема комерційне, без дозволу й обов'язкової атрибуції). Це **не** фото реального автосервісу V12; на сайті вони так і підписані. Ліцензію перевірено на сторінці кожного фото та на https://unsplash.com/license (дата перевірки: 2026-10-15).

Файли: 1600 px завширшки, JPEG (progressive, quality 78), кожен менше 200 КБ. Список — `src/lib/photos.ts`.

| Файл | Роль | Сторінка джерела | Фотограф | Ліцензія | Перевірено |
|---|---|---|---|---|---|
| `public/photos/garage-interior.jpg` | hero | https://unsplash.com/photos/black-tool-chest-near-wire-spool-ZSz1m4JPDqU | Quilia | Unsplash License | 2026-10-15 |
| `public/photos/wrenches.jpg` | галерея | https://unsplash.com/photos/a-bunch-of-wrenches-and-other-tools-in-a-box-OegFhZfw6Ok | Isabela Kronemberger | Unsplash License | 2026-10-15 |
| `public/photos/engine-carburetor.jpg` | галерея | https://unsplash.com/photos/a-close-up-of-the-engine-of-a-car-ZCGyXRnr4Uw | Alex Marc Wagner | Unsplash License | 2026-10-15 |
| `public/photos/brake-disc-drilled.jpg` | галерея | https://unsplash.com/photos/close-up-of-a-cars-performance-brake-system-EpT-ZetoKm8 | Erik Mclean | Unsplash License | 2026-10-15 |
| `public/photos/wheel-brake.jpg` | галерея | https://unsplash.com/photos/a-close-up-of-a-car-tire-yqsgL2wKEHA | ün LIU | Unsplash License | 2026-10-15 |
| `public/photos/brake-disc-mono.jpg` | банер | https://unsplash.com/photos/a-close-up-of-a-wheel-on-a-vehicle-_ssyufaEVQc | Karan Suthar | Unsplash License | 2026-10-15 |
| `public/photos/hands-wrench-engine.jpg` | галерея | https://unsplash.com/photos/hands-working-on-car-engine-Fd6osyVbtG4 | Christian Buehner | Unsplash License | 2026-10-15 |
| `public/photos/fuse-box-hands.jpg` | галерея | https://unsplash.com/photos/a-close-up-of-a-person-working-on-a-cars-engine-gdRIqwPn5kI | Sincerely Media | Unsplash License | 2026-10-15 |

Критерії відбору: без впізнаваних облич, без читабельних логотипів, вивісок і номерних знаків, без водяних знаків, темна приглушена гама під чорно-графітову палітру сайту. Оригінали зменшено до 1600 px; фото `wrenches` обрізано до 3:2.

## Як замінити фото на справжні

1. Підготуйте фото: JPEG, **1600 px завширшки**, до 300 КБ (прогресивний, якість ~75–80). Співвідношення сторін: hero і банер — **3:2 або 16:9** (текст лежить поверх, важливий об'єкт тримайте по центру/справа); галерея — **3:2** (допускається 4:3 і 4:5).
2. Покладіть файл у `public/photos/` — або під тим самим іменем (тоді нічого більше міняти не треба, але оновіть `width`/`height`, якщо розмір інший), або з новим іменем.
3. У `src/lib/photos.ts` відредагуйте запис: `src`, `alt` (чесний опис українською), `width` і `height` (реальні розміри файлу), `credit` (видаліть для власних фото), `role` (`hero`, `banner` або `gallery`). Додати фото в галерею — додати запис з `role: 'gallery'` (рекомендовано 6–8).
4. `blur` (мініатюра-заглушка до 1 КБ) — необов'язковий. Без нього фото просто з'явиться без розмиття. Згенерувати: `sharp(file).resize(10).jpeg({ quality: 40 })` → base64 `data:image/jpeg;base64,...`.
5. Запустіть `npx vitest run src/lib/photos.test.ts` — перевіряє, що файли існують, розміри збігаються, вага до 350 КБ, alt не порожній.
6. Коли фото стануть справжніми, змініть підпис під галереєю в `src/components/site/Gallery.tsx` (зараз там сказано, що фото ілюстративні).
