import { EventEmitter } from 'events'
import { calculateBallSpeed } from '../math/index.js'
import type { ToFReading, SpeedResult } from '../../type/ballSpeed.types.js'

// Bus central - POST /api/impact -> handleImpact -> iotEmitter.emit('impact', event)
export const iotEmitter = new EventEmitter()

export interface ImpactEvent {
  speedResult: SpeedResult
  timestamp:   string
}

/**
 * Recove data from the ToF sensor, calculates the ball speed, and emits an event on the bus.
 * calculate ball speed using the time of flight readings and the known distance between the sensor and the ball.
 */
export function handleImpact(reading: ToFReading): ImpactEvent {
  const speedResult = calculateBallSpeed(reading)

  const event: ImpactEvent = {
    speedResult,
    timestamp: new Date().toISOString(),
  }

  iotEmitter.emit('impact', event)
  return event
}