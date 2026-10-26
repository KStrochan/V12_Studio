#!/usr/bin/env node
// Cuts the hero video into WebP frames for the scroll-driven hero and switches the site to it.
//
//   node scripts/hero-frames.mjs path/to/video.mp4 [--frames 120] [--mobile-frames 90] [--from 0] [--to 10] [--focus 0.5]
//
// Needs ffmpeg and ffprobe on PATH. Writes public/hero-seq/{desktop,mobile}/f001.webp… and poster.webp,
// then rewrites src/lib/heroSequence.ts. --focus (0…1) moves the phone crop left/right if the car is off-centre.
import { spawnSync } from 'node:child_process'
import { mkdirSync, readdirSync, rmSync, statSync, writeFileSync, copyFileSync } from 'node:fs'
import path from 'node:path'

const args = process.argv.slice(2)
const input = args.find((a) => !a.startsWith('--') && !/^\d/.test(a))
const opt = (name, def) => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 ? Number(args[i + 1]) : def
}
if (!input) {
  console.error('Usage: node scripts/hero-frames.mjs video.mp4 [--frames 120] [--mobile-frames 90] [--from 0] [--to 10] [--focus 0.5]')
  process.exit(1)
}

const run = (cmd, a) => {
  const r = spawnSync(cmd, a, { encoding: 'utf8' })
  if (r.status !== 0) {
    console.error(r.stderr || r.error)
    process.exit(1)
  }
  return r.stdout
}

const probe = JSON.parse(run('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height:format=duration', '-of', 'json', input]))
const duration = Number(probe.format.duration)
const from = opt('from', 0)
const to = Math.min(opt('to', duration), duration)
const span = to - from
const N = opt('frames', 120)
const M = opt('mobile-frames', 90)
const focus = Math.min(Math.max(opt('focus', 0.5), 0), 1)
if (!(span > 0)) throw new Error('Empty time range')

const root = path.join(process.cwd(), 'public', 'hero-seq')
rmSync(root, { recursive: true, force: true })
const dirs = { desktop: path.join(root, 'desktop'), mobile: path.join(root, 'mobile') }
Object.values(dirs).forEach((d) => mkdirSync(d, { recursive: true }))

const cut = (dir, count, vf, quality) =>
  run('ffmpeg', ['-v', 'error', '-ss', String(from), '-t', String(span), '-i', input, '-an',
    '-vf', `fps=${count}/${span},${vf}`, '-frames:v', String(count), '-c:v', 'libwebp', '-quality', String(quality),
    '-compression_level', '6', path.join(dir, 'f%03d.webp')])

// Desktop: 1280 px wide, original aspect. Phones: a 9:16 crop around --focus, 720×1280.
cut(dirs.desktop, N, 'scale=1280:-2:flags=lanczos', 68)
cut(dirs.mobile, M, `crop=ih*9/16:ih:(iw-ih*9/16)*${focus}:0,scale=720:1280:flags=lanczos`, 62)
copyFileSync(path.join(dirs.desktop, 'f001.webp'), path.join(root, 'poster.webp'))

const count = (d) => readdirSync(d).filter((f) => f.endsWith('.webp')).length
const weight = (d) => readdirSync(d).reduce((s, f) => s + statSync(path.join(d, f)).size, 0)
const dims = JSON.parse(run('ffprobe', ['-v', 'error', '-show_entries', 'stream=width,height', '-of', 'json', path.join(dirs.desktop, 'f001.webp')])).streams[0]

const seq = {
  desktop: { dir: '/hero-seq/desktop', count: count(dirs.desktop), width: dims.width, height: dims.height },
  mobile: { dir: '/hero-seq/mobile', count: count(dirs.mobile), width: 720, height: 1280 },
  poster: '/hero-seq/poster.webp',
}
writeFileSync(
  path.join(process.cwd(), 'src', 'lib', 'heroSequence.ts'),
  `import type { HeroSequence } from '@/components/site/scrollSequence'

/**
 * Scroll-driven hero video, cut into frames by scripts/hero-frames.mjs (which rewrites this file).
 * null = no video yet: the hero shows the regular photo version. See docs/HERO-VIDEO.md.
 */
export const HERO_SEQUENCE: HeroSequence | null = ${JSON.stringify(seq, null, 2)}
`,
)
const mb = (b) => (b / 1024 / 1024).toFixed(1) + ' MB'
console.log(`desktop: ${seq.desktop.count} frames, ${mb(weight(dirs.desktop))}`)
console.log(`mobile:  ${seq.mobile.count} frames, ${mb(weight(dirs.mobile))}`)
console.log('src/lib/heroSequence.ts updated')
