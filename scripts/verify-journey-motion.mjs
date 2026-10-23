import assert from 'node:assert/strict';
import { dampJourney, journeyRailProgress } from '../src/scenes/hero/journey-motion.ts';

function simulate(fps, seconds, target, initial=0, initialVelocity=0) {
  let value=initial,velocity=initialVelocity;
  for(let i=0;i<fps*seconds;i++){
    const next=dampJourney(value,target,velocity,1/fps);
    assert.ok(Number.isFinite(next.value)&&next.value>=0&&next.value<=1,'Follower must stay finite and inside the scene');
    if(initial<=target)assert.ok(next.value>=value-1e-12&&next.value<=target+1e-12,'A resting forward move cannot overshoot');
    value=next.value;velocity=next.velocity;
  }
  return {value,velocity};
}
const samples=[30,60,120].map(fps=>simulate(fps,.5,1));
assert.ok(Math.max(...samples.map(s=>s.value))-Math.min(...samples.map(s=>s.value))<1e-8,'Camera timing must agree across refresh rates');
assert.ok(simulate(60,2,1).value>.9999,'Camera must settle instead of lagging indefinitely');
const forward=simulate(60,.25,1);
let reverse=forward;
for(let i=0;i<180;i++)reverse=dampJourney(reverse.value,0,reverse.velocity,1/60);
assert.ok(reverse.value<.0001&&Math.abs(reverse.velocity)<.001,'Reversing scroll must settle at the new position');
let last=-1;
for(let i=0;i<=1000;i++){const value=journeyRailProgress(i/1000);assert.ok(value>=last&&value>=0&&value<=1,'Rail timing must remain monotonic and bounded');last=value;}
assert.equal(journeyRailProgress(0),0);assert.equal(journeyRailProgress(1),1);
console.log('Motion verified: bounded convergence, no overshoot, reversal recovery, 30/60/120 Hz consistency, and continuous rail timing.');
