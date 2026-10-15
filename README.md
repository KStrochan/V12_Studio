# V12 Service

Сайт автосервісу V12 Service: лендинг із послугами, відгуками та контактами, онлайн-запис на обслуговування (вибір послуги, дати й часу), форма «Передзвоніть мені» і адмін-панель власника (записи, консультації, клієнти, контент, налаштування, експорт у CSV). Нові заявки приходять власнику в Telegram з кнопками «Підтвердити» / «Відхилити».

## Стек

- Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, framer-motion
- Supabase: Postgres, Auth, RLS (`@supabase/supabase-js`, `@supabase/ssr`)
- Telegram Bot API для сповіщень власнику
- Тести: Vitest (юніт + PGlite для SQL), Playwright (E2E, мобільний 375×812 і десктопний 1280×800 проєкти), Lighthouse CI
- Хостинг: Vercel

## Локальна розробка

```bash
npm install
cp .env.example .env.local   # заповніть значення
npm run dev                  # http://localhost:3000
```

Без змінних Supabase публічна сторінка показує резервний контент (`src/lib/content-fallback.ts`), але запис, консультації й адмінка працювати не будуть.

Корисні команди:

| Команда | Що робить |
| --- | --- |
| `npm run dev` | dev-сервер |
| `npm run build && npm start` | production-збірка й запуск |
| `npx vitest run` | юніт- та інтеграційні тести (PGlite, без Docker) |
| `npx tsc --noEmit` | перевірка типів |
| `npx playwright test` | E2E (проєкти `mobile` і `desktop`) |
| `npx @lhci/cli autorun` | Lighthouse CI за `lighthouserc.json` (мобільний профіль, `/`) |

## Змінні середовища

| Змінна | Призначення |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL проєкту Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | публічний anon-ключ (доступ обмежує RLS) |
| `SUPABASE_SERVICE_ROLE_KEY` | service-role ключ, **тільки сервер** |
| `TELEGRAM_BOT_TOKEN` | токен бота від @BotFather |
| `TELEGRAM_OWNER_CHAT_ID` | id чату власника; кнопки приймаються лише звідти |
| `TELEGRAM_WEBHOOK_SECRET` | випадковий рядок (`A-Z a-z 0-9 _ -`, до 256 символів) |
| `NEXT_PUBLIC_SITE_URL` | публічна адреса сайту (sitemap, robots, JSON-LD) |

## Налаштування Supabase

1. Створіть проєкт на [supabase.com](https://supabase.com) (регіон найближчий до України, напр. Frankfurt).
2. Встановіть Supabase CLI і зв'яжіть репозиторій із проєктом. Усі команди виконуйте з папки `v12-service/`. `supabase init` не потрібен: `supabase/config.toml` уже в репозиторії (реєстрація користувачів у ньому вимкнена).
   ```bash
   cd v12-service
   supabase login
   supabase link --project-ref <project-ref>
   ```
3. Порядок: link → db push → seed → create-owner. Застосуйте міграції (по порядку `0001` → `0007`):
   ```bash
   supabase db push
   ```
   - `0001_schema.sql`: таблиці й обмеження (включно із забороною перетину записів)
   - `0002_rls.sql`: політики RLS
   - `0003_create_booking_tx.sql`, `0004_booking_tx_keep_client.sql`: транзакційне створення запису
   - `0005_admin_booking_tx.sql`: зміни записів із адмінки
   - `0006_hardening.sql`: причина вихідного дня недоступна анонімам (публічне представлення `days_off_public`), безпечний `search_path` і очищення `rate_limits`
   - `0007_car_year.sql`: додає `bookings.car_year`, перестворює `create_booking_tx` і `admin_create_booking_tx` із параметром `car_year` (ті самі права доступу)
4. Заповніть початкові дані: виконайте вміст `supabase/seed.sql` у SQL Editor Supabase (налаштування, послуги, відгуки). Телефон і адреса в сиді порожні, а приклади відгуків приховані (`visible = false`): заповніть їх в адмінці перед запуском.
5. Скопіюйте URL, anon-ключ і service-role ключ (Project Settings → API) у `.env.local`.
6. Створіть акаунт власника:
   ```bash
   npx tsx scripts/create-owner.ts owner@example.com "<надійний-пароль>"
   ```
   Скрипт читає `.env.local`. Вхід в адмінку: `/admin/login`.

## Розгортання на Vercel

1. Імпортуйте репозиторій у Vercel, **Root Directory** = `v12-service`.
2. У Settings → Environment Variables додайте всі змінні з таблиці вище для Production (і Preview, якщо потрібно).
3. Задеплойте. Після підключення домену виставте `NEXT_PUBLIC_SITE_URL` на справжню адресу й передеплойте.

## Telegram-бот

1. Створіть бота в @BotFather, отримайте токен.
2. Дізнайтесь свій `chat_id` (напишіть боту, потім відкрийте `https://api.telegram.org/bot<TOKEN>/getUpdates`).
3. Задайте `TELEGRAM_BOT_TOKEN`, `TELEGRAM_OWNER_CHAT_ID`, `TELEGRAM_WEBHOOK_SECRET` у Vercel.
4. Зареєструйте webhook:
   ```bash
   curl -X POST "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook" \
     -d "url=https://<ваш-домен>/api/telegram/webhook" \
     -d "secret_token=<TELEGRAM_WEBHOOK_SECRET>" \
     -d 'allowed_updates=["callback_query"]'
   ```

Подробиці: [docs/telegram.md](docs/telegram.md).

## Контрольний список запуску

1. Застосувати міграції `0001`–`0007` (`supabase db push`).
   > **УВАГА: міграцію `0007` ОБОВ’ЯЗКОВО застосувати ДО деплою цієї версії, інакше публічні й адмінські записи не створюватимуться.**
2. Виконати `supabase/seed.sql`.
3. Створити власника: `npx tsx scripts/create-owner.ts <email> "<пароль>"`.
4. Задати змінні середовища у Vercel, зокрема `NEXT_PUBLIC_SITE_URL` (без неї sitemap, посилання на sitemap у robots.txt і `url` у JSON-LD у production не публікуються).
5. У Supabase Dashboard: Authentication → Sign In / Providers → вимкнути «Allow new users to sign up» (публічну реєстрацію).
6. Зареєструвати Telegram webhook (розділ нижче).
7. В адмінці заповнити телефон, адресу, соцмережі й опублікувати справжні відгуки.
8. Один раз вручну пройти повний сценарій: запис на сайті, сповіщення в Telegram, підтвердження кнопкою, перевірка запису в адмінці.

## Що власник замінює після запуску

Більшість значень змінюється в адмінці (`/admin/settings`, `/admin/services`, `/admin/reviews`):

- телефон, адреса, години роботи, соцмережі
- послуги й ціни, відгуки
- фото: файли в `public/` (логотип `public/logo.webp`, зображення в секціях)
- домен: `NEXT_PUBLIC_SITE_URL` у Vercel
- `TELEGRAM_OWNER_CHAT_ID` на реальний chat_id власника
- лічильники в блоці «Чому ми» (зараз заглушки 8 / 500+ / 100%) замінити на справжні цифри
- приклади відгуків із `seed.sql` (приховані) замінити на справжні й опублікувати

## Безпека

- `SUPABASE_SERVICE_ROLE_KEY` обходить RLS. Він використовується лише в серверному коді (`src/lib/supabase/admin.ts` має `import 'server-only'`) і ніколи не повинен потрапляти в `NEXT_PUBLIC_*` змінні чи клієнтські компоненти.
- Ліміт запитів довіряє заголовку `x-vercel-forwarded-for` (Vercel виставляє його сам). На іншому хостингу потрібне налаштування довіреного проксі, інакше IP клієнта можна підробити.
- Анонімні користувачі не можуть викликати SQL-функції створення запису й лічильника запитів: це робить лише сервер.
- Захист від спаму: приховане поле-honeypot (`website`), ліміт 5 запитів на запис з одного IP за 10 хвилин (429).
- Адмінка й `/api/admin/*` доступні лише користувачеві з роллю `owner`.
- Webhook Telegram перевіряє секрет і chat_id власника.
- Не комітьте `.env.local`.

## Відомі обмеження

- Ціни навмисно не показуються на публічному сайті: `price_from` не вибирається публічним запитом і не потрапляє в браузер (колонка в БД і адмінка лишаються).

- Якщо змінні Supabase задані, але БД не мігрована чи не заповнена сидом, майстер запису показує резервні послуги, а створення запису завершується помилкою. Спершу застосуйте міграції й сид.
- **Сценарії з реальним Supabase тут не перевірялись.** Розробка велась на машині без облікових даних Supabase й Docker. SQL (схема, RLS, конкурентні записи, ліміти) перевірено через PGlite; E2E використовують мок API. Тести проти реального стеку (`tests/e2e/spam.spec.ts`, частина `consultation.spec.ts`) пропускаються без `SUPABASE_SERVICE_ROLE_KEY`. Перед запуском у прод пройдіть повний сценарій вручну: запис, сповіщення в Telegram, підтвердження, вхід в адмінку.
- `supabase test db` (pgTAP) не запускався: файли в `supabase/tests/*.db.test.ts` виконуються Vitest-ом через PGlite.
- Клієнт не отримує сповіщень про підтвердження чи відхилення запису: сповіщення тільки власнику.
- Вибір послуги в `#booking` за посиланням (preselect) не реалізовано.

## Фото

Фото на сайті (hero, галерея «Наш сервіс», банер) — **тимчасові безкоштовні стокові знімки** з Unsplash, не фото реального сервісу. Список — `src/lib/photos.ts`, файли — `public/photos/`. Джерела, автори, ліцензії та інструкція, як замінити їх на справжні фото: [`docs/PHOTOS.md`](docs/PHOTOS.md).
