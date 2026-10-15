import { describe, expect, it } from 'vitest'
import { cidToDecimal, googleDirectionsUrl, googleEmbedUrl, googlePlaceUrl } from './location'

describe('location helpers', () => {
  it('converts hex CID to decimal', () => {
    expect(cidToDecimal('0x11802dd0c00439a6')).toBe('1261058270261688742')
    expect(cidToDecimal('ff')).toBe('255')
  })
  it('builds exact URLs', () => {
    expect(googleEmbedUrl()).toBe('https://www.google.com/maps?q=49.2666809,23.8763218&z=17&output=embed')
    expect(googleDirectionsUrl()).toBe('https://www.google.com/maps/dir/?api=1&destination=49.2666809,23.8763218')
    expect(googlePlaceUrl()).toBe('https://www.google.com/maps?cid=1261058270261688742')
  })
})
