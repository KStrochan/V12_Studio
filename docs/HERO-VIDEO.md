# Відео на першому екрані

Перший екран — відео, яке грає фоном по колу без звуку. Поверх нього по черзі з'являються заголовок, слова-послуги («Діагностика. Ходова. Двигун. Електрика. Кузов.», змінюються кожні 2,2 с), кнопки і переваги.

Файли лежать у `public/hero/`:

| Файл | Що це |
|---|---|
| `hero-desktop.mp4` | 1280 px завширшки, H.264, без звуку |
| `hero-mobile.mp4` | 720×1280, вертикальний виріз для телефонів |
| `poster.webp`, `poster-mobile.webp` | перший кадр: видно до завантаження відео і тим, у кого в системі ввімкнено «зменшити рух» |

## Поточне відео

Стокове відео «A man in a garage with a car in the background» від cottonbro studio з Pexels: https://www.pexels.com/video/a-man-in-a-garage-with-a-car-in-the-background-4488715/ (Pexels License: безкоштовно, зокрема комерційно, без обов'язкової атрибуції; перевірено 2026-10-26). Узято перші 12 секунд і склеєно «вперед-назад», щоб коло було без ривка (24 с). Це ілюстрація, а не зйомка реального сервісу; на задньому плані видно старі рекламні таблички.

## Як замінити на своє відео

Потрібен ffmpeg. Найкраще — один плавний рух камери, 8–15 секунд, без тексту в кадрі; важливе тримайте по центру (на телефоні показується середина).

```bash
# комп'ютер: перші 12 с, вперед-назад, 1280 px
ffmpeg -ss 0 -t 12 -i video.mp4 -an -filter_complex "[0:v]scale=1280:-2,fps=25,split[a][b];[b]reverse[r];[a][r]concat=n=2:v=1[v]" -map "[v]" -c:v libx264 -preset slow -crf 27 -pix_fmt yuv420p -movflags +faststart public/hero/hero-desktop.mp4
# телефон: вертикальний виріз 9:16 з центру
ffmpeg -ss 0 -t 12 -i video.mp4 -an -filter_complex "[0:v]crop=ih*9/16:ih,scale=720:1280,fps=25,split[a][b];[b]reverse[r];[a][r]concat=n=2:v=1[v]" -map "[v]" -c:v libx264 -preset slow -crf 28 -pix_fmt yuv420p -movflags +faststart public/hero/hero-mobile.mp4
# постери
ffmpeg -i video.mp4 -frames:v 1 -vf scale=1280:-2 -c:v libwebp -quality 70 public/hero/poster.webp
ffmpeg -i video.mp4 -frames:v 1 -vf "crop=ih*9/16:ih,scale=720:1280" -c:v libwebp -quality 65 public/hero/poster-mobile.webp
```

Якщо відео вже зациклене саме по собі, прибери з команд частину зі `split`/`reverse`/`concat` (залиш тільки `scale`).

Слова-послуги — масив `SERVICES` у `src/components/site/Hero.tsx`.
