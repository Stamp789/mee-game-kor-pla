// Original slow A minor melody with soft bell and felt-piano overtones.
export function makeWalkingScore() {
  const Audio=window.AudioContext||window.webkitAudioContext;
  if(!Audio)throw new Error('Web Audio unavailable');
  const ctx=new Audio();
  const master=ctx.createGain();master.gain.value=0;master.connect(ctx.destination);
  const echo=ctx.createDelay(1);echo.delayTime.value=.33;
  const echoGain=ctx.createGain();echoGain.gain.value=.16;echo.connect(echoGain).connect(master);
  const bus=ctx.createGain();bus.connect(master);bus.connect(echo);
  const bars=[
    [[57,69],[],[72],[76],[],[74],[],[72]],
    [[53,69],[],[72],[],[67],[],[64],[]],
    [[60,67],[],[71],[72],[],[76],[],[72]],
    [[55,71],[],[67],[],[62],[],[64],[]],
    [[57,69],[],[72],[76],[],[81],[],[79]],
    [[53,76],[],[72],[],[69],[],[],[]],
    [[52,71],[],[68],[],[64],[],[71],[]],
    [[57,69],[],[],[64],[],[57],[],[]],
  ].flat();
  let timer=0,next=0,index=0;
  function note(midi,time){
    const hz=440*2**((midi-69)/12),volume=midi<63?.10:.08;
    for(const [ratio,weight,length] of [[1,1,2.2],[2.006,.23,.80],[3.01,.074,.31]]) {
      const tone=ctx.createOscillator(), level=ctx.createGain();
      tone.frequency.value=hz*ratio;
      level.gain.setValueAtTime(.0001,time);
      level.gain.exponentialRampToValueAtTime(volume*weight,time+.022);
      level.gain.exponentialRampToValueAtTime(.0001,time+length);
      tone.connect(level).connect(bus);tone.start(time);tone.stop(time+length+.03);
    }
  }
  function schedule(){
    if(ctx.state!=='running')return;
    const now=ctx.currentTime;if(next<now-.1)next=now+.04;
    while(next<now+.20){bars[index++%bars.length].forEach((pitch,i)=>note(pitch,next+i*.035));next+=.54;}
  }
  return {
    async start(){if(ctx.state!=='running')await ctx.resume();if(!timer){next=ctx.currentTime+.08;timer=setInterval(schedule,80);schedule();}return ctx.state==='running';},
    stop(){clearInterval(timer);timer=0;master.gain.setTargetAtTime(0,ctx.currentTime,.1);},
    fade(end){master.gain.setTargetAtTime(.62-end*.48,ctx.currentTime,.35);},
    running(){return ctx.state==='running';},
  };
}
