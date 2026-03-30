import type { ToFConfig, ToFReading, SpeedResult } from '../../../type/ballSpeed.types';

// sound speed in m/s at 20°C
const DEFAULT_CONFIG: ToFConfig = { 
    soundSpeedMs: 343, // m/s
}

/**
 * Calculates the speed of an object based on time-of-flight readings.
 * 
 * Formula : c = 331.3 x sqrt(1 + T/273.15)
 */
export function soundSpeedAtTemperature(tempCelsius: number): number {
    return 331.3 * Math.sqrt(1 + tempCelsius / 273.15);
}


/**
 * calculate the distance ball/capture of the time of flight readings
 * 
 * Formula : d = (c x t) / 2 
 *  - c : speed of sound in m/s
 * - t : time of flight in seconds
 * - /2 beaucse the sound travels to the object and back
 */
export function tofToDistance(tofMs: number, config: ToFConfig = DEFAULT_CONFIG): number {
    if (tofMs <= 0) throw new Error ('tofMs must be positive');

    const tofS = tofMs / 1000 // convert ms to s
    return (config.soundSpeedMs * tofS) / 2;   // distance in meters
}

/** 
 * 
 * Calculates the speed of an object based on time-of-flight readings.
 * 
 * Formula : v = (d2 - d1) / (t2 - t1)
 *  - d1 : distance at time t1
 *  - d2 : distance at time t2
 * - t1 : time of first reading in seconds
 *  - t2 : time of second reading in seconds
 * 
 * @param readings An array of time-of-flight readings with timestamps
 * @param config Optional configuration for sound speed
 * @returns The calculated speed in m/s
 */
export function calculateBallSpeed(reading: ToFReading, config: ToFConfig = DEFAULT_CONFIG ): SpeedResult {
  if (reading.tof1Ms <= 0)  throw new Error('tof1Ms doit être supérieur à 0')
  if (reading.tof2Ms <= 0)  throw new Error('tof2Ms doit être supérieur à 0')
  if (reading.deltaMs <= 0) throw new Error('deltaMs doit être supérieur à 0')
 
  const distance1M = tofToDistance(reading.tof1Ms, config)
  const distance2M = tofToDistance(reading.tof2Ms, config)
 
  const deltaT  = reading.deltaMs / 1000                      // ms → s
  const speedMs = (distance1M - distance2M) / deltaT          // m/s
 
  return {
    distance1M: Math.round(distance1M    * 1000) / 1000,
    distance2M: Math.round(distance2M    * 1000) / 1000,
    speedMs:    Math.round(speedMs       * 100)  / 100,
    speedKmh:   Math.round(speedMs * 3.6 * 100)  / 100,
  }
}
 