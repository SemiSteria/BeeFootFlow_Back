import { describe, it, expect } from 'vitest'
import { soundSpeedAtTemperature, tofToDistance, calculateBallSpeed } from './ballSpeed.js'
import type { ToFReading } from '../../type/ballSpeed.types.js'

describe('soundSpeedAtTemperature', () => {
  it('returns 331.3 m/s at 0°C', () => {
    expect(soundSpeedAtTemperature(0)).toBeCloseTo(331.3, 1)
  })

  it('returns ~343 m/s at 20°C (default config value)', () => {
    expect(soundSpeedAtTemperature(20)).toBeCloseTo(343.2, 0)
  })

  it('increases with temperature', () => {
    expect(soundSpeedAtTemperature(30)).toBeGreaterThan(soundSpeedAtTemperature(10))
  })
})

describe('tofToDistance', () => {
  it('converts a 10 ms round-trip into 1.715 m at default sound speed', () => {
    // d = (343 m/s × 0.010 s) / 2
    expect(tofToDistance(10)).toBeCloseTo(1.715, 3)
  })

  it('honours a custom sound speed configuration', () => {
    // d = (300 × 0.010) / 2 = 1.5 m
    expect(tofToDistance(10, { soundSpeedMs: 300 })).toBeCloseTo(1.5, 3)
  })

  it('throws on zero or negative time of flight', () => {
    expect(() => tofToDistance(0)).toThrow('tofMs must be positive')
    expect(() => tofToDistance(-5)).toThrow('tofMs must be positive')
  })
})

describe('calculateBallSpeed', () => {
  const reading: ToFReading = { tof1Ms: 10, tof2Ms: 4, deltaMs: 100 }

  it('computes distances, m/s and km/h for a nominal reading', () => {
    const r = calculateBallSpeed(reading)
    expect(r.distance1M).toBeCloseTo(1.715, 3)   // (343 × 0.010) / 2
    expect(r.distance2M).toBeCloseTo(0.686, 3)   // (343 × 0.004) / 2
    expect(r.speedMs).toBeCloseTo(10.29, 2)      // (1.715 − 0.686) / 0.1
    expect(r.speedKmh).toBeCloseTo(37.04, 2)     // 10.29 × 3.6
  })

  it('rounds distances to 3 decimals and speeds to 2 decimals', () => {
    const r = calculateBallSpeed({ tof1Ms: 7, tof2Ms: 3, deltaMs: 90 })
    expect(r.distance1M).toBe(Math.round(r.distance1M * 1000) / 1000)
    expect(r.speedMs).toBe(Math.round(r.speedMs * 100) / 100)
  })

  it('returns a negative speed when the ball moves away from the sensor', () => {
    const r = calculateBallSpeed({ tof1Ms: 4, tof2Ms: 10, deltaMs: 100 })
    expect(r.speedMs).toBeLessThan(0)
  })

  it('rejects invalid readings (edge cases)', () => {
    expect(() => calculateBallSpeed({ ...reading, tof1Ms: 0 })).toThrow('tof1Ms')
    expect(() => calculateBallSpeed({ ...reading, tof2Ms: -1 })).toThrow('tof2Ms')
    expect(() => calculateBallSpeed({ ...reading, deltaMs: 0 })).toThrow('deltaMs')
  })

  it('uses the provided configuration end to end', () => {
    const r = calculateBallSpeed(reading, { soundSpeedMs: 300 })
    expect(r.distance1M).toBeCloseTo(1.5, 3)
    expect(r.distance2M).toBeCloseTo(0.6, 3)
    expect(r.speedMs).toBeCloseTo(9, 2)
  })
})
