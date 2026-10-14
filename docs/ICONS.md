# Service icons

Inline React components live in `src/components/icons/ServiceIcons.tsx`
(`serviceIcons` map keyed by `services.icon`). Fixed sizes and colours were removed so
`currentColor` and `className` control the look. Unknown keys fall back to the `scan` icon.

All icons were taken from https://www.svgrepo.com (monocolor vectors). The license is the one
shown on each icon's SVG Repo page (checked 2026-10-14): **CC0 License** (public domain dedication,
commercial use allowed, no attribution required). Collection shown on every page: "SVG Vector";
uploader: "SVG Repo". No credits line is required in the site footer.

| Key | Service | Source file | Source page | Collection / uploader | License |
|---|---|---|---|---|---|
| `scan` | Діагностика | diagnostic.svg (id 503284) | https://www.svgrepo.com/svg/503284/diagnostic | SVG Vector / SVG Repo | CC0 |
| `suspension` | Ходова частина | shock-absorber.svg (id 529208) | https://www.svgrepo.com/svg/529208/shock-absorber | SVG Vector / SVG Repo | CC0 |
| `oil` | Технічне обслуговування | oil-can-solid.svg (id 314403) | https://www.svgrepo.com/svg/314403/oil-can-solid | SVG Vector / SVG Repo | CC0 |
| `engine` | Ремонт двигуна | car-engine.svg (id 153583) | https://www.svgrepo.com/svg/153583/car-engine | SVG Vector / SVG Repo | CC0 |
| `bolt` | Автоелектрика | car-battery.svg (id 533066) | https://www.svgrepo.com/svg/533066/car-battery | SVG Vector / SVG Repo | CC0 |
| `brake` | Гальмівна система | disc-brake-car.svg (id 260320) | https://www.svgrepo.com/svg/260320/disc-brake-car | SVG Vector / SVG Repo | CC0 |
| `body` | Кузовний ремонт | spray-gun-paint.svg (id 219220) | https://www.svgrepo.com/svg/219220/spray-gun-paint | SVG Vector / SVG Repo | CC0 |
| `tire` | Шиномонтаж | rim-tyre.svg (id 266838) | https://www.svgrepo.com/svg/266838/rim-tyre | SVG Vector / SVG Repo | CC0 |

Direct file URLs follow the pattern `https://www.svgrepo.com/show/<id>/<name>.svg`.
Adding an icon: use only CC0 / public domain / MIT / Apache icons, add it to `serviceIcons`,
`ICON_NAMES` (`src/lib/admin-schemas.ts`), the label map in the admin `ServicesEditor.tsx`, and this table.
