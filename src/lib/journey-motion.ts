export const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));
export const ease = (value: number) => {
  const t = clamp(value);
  return t * t * t * (t * (t * 6 - 15) + 10);
};

// A single unwrapped rotation, with the next cover already on the reverse face.
// Face changes occur only while that physical face points away from the viewer.
export function sampleJourney(progress: number, count: number) {
  const position = clamp(progress) * Math.max(0, count - 1);
  const active = Math.round(position);
  const wave = Math.sin(position * Math.PI);
  return {
    position,
    active,
    front: clamp(Math.round(position / 2) * 2, 0, Math.floor((count - 1) / 2) * 2),
    back: count < 2 ? 0 : clamp(Math.round((position - 1) / 2) * 2 + 1, 1, Math.floor((count - 2) / 2) * 2 + 1),
    angle: position * 180 - 18 * Math.cos(position * Math.PI),
    tilt: 9 + wave * 4,
    pitch: 7 + Math.sin(position * Math.PI / 2) * 2,
    drift: wave * 12,
    rise: wave * -18,
    scale: 1 + wave * wave * .02,
  };
}

// Analytic critically damped motion: velocity survives new scroll targets and
// the same duration produces the same result at different refresh rates.
export function followScroll(value: number, velocity: number, target: number, seconds: number) {
  const frequency = 22;
  const offset = value - target;
  const impulse = (velocity + frequency * offset) * seconds;
  const decay = Math.exp(-frequency * seconds);
  return {
    value: target + (offset + impulse) * decay,
    velocity: (velocity - frequency * impulse) * decay,
  };
}
