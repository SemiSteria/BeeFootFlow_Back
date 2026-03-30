export interface ToFReading {
  tof1Ms: number  // ms — time of flight for the first measurement (aller-retour)
  tof2Ms: number  // ms — time of flight for the second measurement (aller-retour)
  deltaMs: number // ms — time between the two measurements (t2 - t1)
}

export interface SpeedResult {
  distance1M: number  // m — distance ball/captor  t1
  distance2M: number  // m — distance ball/captor t2
  speedMs:    number  // m/s
  speedKmh:   number  // km/h
}

export interface ToFConfig {
  soundSpeedMs: number  // m/s — sound speed at the given temperature
}

