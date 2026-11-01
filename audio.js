export class CabinAudio {
  constructor({fire=65,wind=30}={}){this.fireVolume=fire;this.windVolume=wind;this.enabled=false;this.context=null;this.pendingSip=null;this.error=null;}
  async initialize(){
    if(this.error||this.context?.state==='closed'){this.destroy();this.context=null;this.ready=null;this.error=null;this.enabled=false;}
    if(this.context)return this.ready;
    const AC=window.AudioContext||window.webkitAudioContext;if(!AC)throw new Error('이 브라우저에서는 소리를 재생할 수 없어요.');
    this.context=new AC();const c=this.context;
    this.master=c.createGain();this.master.gain.value=0;this.master.connect(c.destination);
    this.fireGain=c.createGain();this.fireGain.gain.value=this.fireVolume/100*.7;
    const filter=c.createBiquadFilter();filter.type='lowpass';filter.frequency.value=6400;
    const compressor=c.createDynamicsCompressor();compressor.threshold.value=-22;compressor.ratio.value=2.5;compressor.attack.value=.015;compressor.release.value=.25;
    this.fireGain.connect(filter);filter.connect(compressor);compressor.connect(this.master);
    this.windGain=c.createGain();this.windGain.gain.value=this.windVolume/100*.16;this.windGain.connect(this.master);
    const length=c.sampleRate*5,buffer=c.createBuffer(1,length,c.sampleRate),data=buffer.getChannelData(0);let brown=0;for(let i=0;i<length;i++){brown=(brown+.02*(Math.random()*2-1))/1.02;data[i]=brown*3;}
    const wind=c.createBufferSource();wind.buffer=buffer;wind.loop=true;const windFilter=c.createBiquadFilter();windFilter.type='bandpass';windFilter.frequency.value=240;windFilter.Q.value=.32;wind.connect(windFilter);windFilter.connect(this.windGain);wind.start();
    this.ready=Promise.all(['fireplace','sipping'].map(async name=>{const response=await fetch(`./assets/audio/${name}.mp3`);if(!response.ok)throw new Error('소리 파일을 불러오지 못했어요. 다시 소리를 켜주세요.');return c.decodeAudioData(await response.arrayBuffer());})).then(([fire,sip])=>{this.fireBuffer=fire;this.sipBuffer=sip;this.nextFireAt=c.currentTime+.05;this.scheduleFire();this.scheduler=setInterval(()=>this.scheduleFire(),1000);}).catch(error=>{this.error=error;throw error;});
    return this.ready;
  }
  scheduleFire(){if(!this.fireBuffer||!this.enabled||document.hidden)return;const c=this.context,overlap=1.8;while(this.nextFireAt<c.currentTime+3){const start=Math.max(c.currentTime+.02,this.nextFireAt),source=c.createBufferSource(),gain=c.createGain(),duration=this.fireBuffer.duration;source.buffer=this.fireBuffer;source.connect(gain);gain.connect(this.fireGain);gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(1,start+overlap);gain.gain.setValueAtTime(1,start+duration-overlap);gain.gain.linearRampToValueAtTime(0,start+duration);source.start(start);this.nextFireAt=start+duration-overlap;}}
  async toggle(){const loading=this.initialize();await this.context.resume();await loading;this.enabled=!this.enabled;this.master.gain.setTargetAtTime(this.enabled&&!document.hidden?.8:0,this.context.currentTime,.35);if(this.enabled)this.scheduleFire();return this.enabled;}
  setVolume(channel,value){this[channel+'Volume']=value;const gain=this[channel+'Gain'];if(gain)gain.gain.setTargetAtTime(value/100*(channel==='fire'?.7:.16),this.context.currentTime,.15);}
  sip(delay=1.65){this.cancelSip();if(!this.enabled||!this.sipBuffer||document.hidden)return;const c=this.context,source=c.createBufferSource(),gain=c.createGain();source.buffer=this.sipBuffer;gain.gain.value=.40;source.connect(gain);gain.connect(this.master);source.start(c.currentTime+delay);this.pendingSip=source;}
  cancelSip(){if(this.pendingSip){try{this.pendingSip.stop();}catch{}this.pendingSip=null;}}
  boost(){if(this.enabled&&this.fireGain){this.fireGain.gain.setTargetAtTime(this.fireVolume/100*.95,this.context.currentTime,.2);this.fireGain.gain.setTargetAtTime(this.fireVolume/100*.7,this.context.currentTime+3,1);}}
  visibility(){if(!this.context)return;this.master.gain.setTargetAtTime(this.enabled&&!document.hidden?.8:0,this.context.currentTime,.2);if(document.hidden)this.cancelSip();else this.scheduleFire();}
  destroy(){clearInterval(this.scheduler);this.cancelSip();this.context?.close().catch(()=>{});}
  get state(){return {enabled:this.enabled,fireDecoded:!!this.fireBuffer,sipDecoded:!!this.sipBuffer,fireDuration:this.fireBuffer?.duration||0,sipDuration:this.sipBuffer?.duration||0,error:this.error?.message||null};}
}
