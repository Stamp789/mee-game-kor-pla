/** Analytic critically damped follower: stable across refresh rates and direction changes. */
export function dampJourney(current: number, target: number, velocity: number, delta: number) {
  const omega = 2 / .3;
  const step = Math.min(.1, Math.max(0, delta));
  const offset = current - target;
  const spring = velocity + omega * offset;
  const decay = Math.exp(-omega * step);
  let value = target + (offset + spring * step) * decay;
  let nextVelocity = (velocity - omega * spring * step) * decay;
  if ((target - current) * (value - target) > 0 || value < 0 || value > 1) {
    value = Math.min(1, Math.max(0, target)); nextVelocity = 0;
  }
  if (Math.abs(value - target) < .00001 && Math.abs(nextVelocity) < .0001) {
    value = target; nextVelocity = 0;
  }
  return { value, velocity: nextVelocity };
}

/** A slow departure, an unbroken acceleration through the sculpture, then a gentle arrival. */
export function journeyRailProgress(progress: number) {
  const t = Math.min(1, Math.max(0, progress));
  return .12 * t + .88 * t * t * (3 - 2 * t);
}
