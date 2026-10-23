import test from 'node:test';
import assert from 'node:assert/strict';
import { sampleJourney, followScroll } from '../src/lib/journey-motion.ts';

test('the visible cover matches the selected game throughout every half-turn', () => {
  for (let step = 0; step <= 6000; step++) {
    const pose = sampleJourney(step / 6000, 4);
    const facing = Math.cos(pose.angle * Math.PI / 180);
    if (Math.abs(facing) < 1e-8) continue; // Exactly edge-on: neither cover faces the viewer.
    assert.equal(facing > 0 ? pose.front : pose.back, pose.active, `cover mismatch at ${pose.position}`);
  }
});

test('a cover is replaced only while its physical face is turned away', () => {
  for (const direction of [1, -1]) {
    let previous = sampleJourney(direction === 1 ? 0 : 1, 4);
    for (let step = 1; step <= 6000; step++) {
      const progress = direction === 1 ? step / 6000 : 1 - step / 6000;
      const pose = sampleJourney(progress, 4);
      const facing = Math.cos(pose.angle * Math.PI / 180);
      if (pose.front !== previous.front) assert.ok(facing < -.9, 'front changed while visible');
      if (pose.back !== previous.back) assert.ok(facing > .9, 'back changed while visible');
      assert.ok(Math.abs(pose.angle - previous.angle) < .13, 'rotation jumped at a cover boundary');
      previous = pose;
    }
  }
});

test('the same scroll response is consistent at 30, 60 and 120 Hz', () => {
  function advance(fps) {
    let state = { value: 0, velocity: 0 };
    for (let frame = 0; frame < fps / 2; frame++) state = followScroll(state.value, state.velocity, 1, 1 / fps);
    return state;
  }
  const reference = advance(120);
  for (const fps of [30, 60]) {
    const result = advance(fps);
    assert.ok(Math.abs(result.value - reference.value) < 1e-12);
    assert.ok(Math.abs(result.velocity - reference.velocity) < 1e-12);
  }
});

test('scroll response settles without overshooting and can smoothly reverse', () => {
  let state = { value: 0, velocity: 0 };
  for (const target of [1, 0]) {
    for (let frame = 0; frame < 120; frame++) {
      const previous = state.value;
      state = followScroll(state.value, state.velocity, target, 1 / 120);
      assert.ok(state.value >= -1e-9 && state.value <= 1 + 1e-9);
      assert.ok(target === 1 ? state.value >= previous : state.value <= previous + 1e-9);
    }
    assert.ok(Math.abs(state.value - target) < 1e-7);
  }
});
