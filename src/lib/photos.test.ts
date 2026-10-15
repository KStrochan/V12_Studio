import { describe, expect, it } from 'vitest'
import { existsSync, statSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { PHOTOS, getBannerPhoto, getGalleryPhotos, getHeroPhoto } from './photos'

const pub = (src: string) => path.join(process.cwd(), 'public', src)

function jpegSize(buf: Buffer): { width: number; height: number } {
  let i = 2
  while (i < buf.length) {
    if (buf[i] !== 0xff) { i++; continue }
    const marker = buf[i + 1]
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
      return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) }
    }
    i += 2 + buf.readUInt16BE(i + 2)
  }
  throw new Error('no SOF marker')
}

describe('photos list', () => {
  it('has hero, banner and 6-8 gallery photos', () => {
    expect(getHeroPhoto()).toBeDefined()
    expect(getBannerPhoto()).toBeDefined()
    const g = getGalleryPhotos().length
    expect(g).toBeGreaterThanOrEqual(6)
    expect(g).toBeLessThanOrEqual(8)
  })

  it.each(PHOTOS.map((p) => [p.src, p] as const))('%s is valid', (_src, p) => {
    expect(existsSync(pub(p.src))).toBe(true)
    expect(p.alt.trim().length).toBeGreaterThan(10)
    const buf = readFileSync(pub(p.src))
    const real = jpegSize(buf)
    expect(p.width).toBe(real.width)
    expect(p.height).toBe(real.height)
    expect(statSync(pub(p.src)).size).toBeLessThanOrEqual(350 * 1024)
    if (p.blur) {
      expect(p.blur.startsWith('data:image/jpeg;base64,')).toBe(true)
      expect(p.blur.length).toBeLessThanOrEqual(1024)
    }
  })
})
