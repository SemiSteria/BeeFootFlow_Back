import { describe, it, expect } from 'vitest'
import { handleImpact, iotEmitter } from './iotHandler.js'
import type { ImpactEvent } from './iotHandler.js'
import type { ToFReading } from '../../type/ballSpeed.types.js'

describe('handleImpact (pipeline IoT)', () => {
  const reading: ToFReading = { tof1Ms: 10, tof2Ms: 4, deltaMs: 100 }

  it('builds a timestamped ImpactEvent from a ToF reading', () => {
    const event = handleImpact(reading)
    expect(event.speedResult.speedMs).toBeCloseTo(10.29, 2)
    // horodatage ISO 8601 valide
    expect(new Date(event.timestamp).toISOString()).toBe(event.timestamp)
  })

  it('emits the event on the internal bus (SSE subscribers receive it)', () => {
    let received: ImpactEvent | null = null
    const listener = (e: ImpactEvent) => { received = e }
    iotEmitter.on('impact', listener)

    const returned = handleImpact(reading)

    iotEmitter.off('impact', listener) // cleanup, comme le fait stream.route.ts
    expect(received).not.toBeNull()
    expect(received).toEqual(returned)
  })

  it('propagates validation errors from the math module', () => {
    expect(() => handleImpact({ tof1Ms: 0, tof2Ms: 4, deltaMs: 100 })).toThrow()
  })
})
