const clamp=value=>Math.max(0,Math.min(1,value));
export const smooth=value=>{const x=clamp(value);return x*x*(3-2*x);};
export const DRINK_DURATION=8.6;
export function drinkFrame(seconds,from=1,to=Math.max(0,from-.32)){
  const lift=smooth(seconds/1.35)*(1-smooth((seconds-7.1)/1.5));
  const sip=smooth((seconds-1.6)/.7)*(1-smooth((seconds-6.8)/.5));
  const consumed=smooth((seconds-1.8)/4.8);
  return {lift,sip,level:from+(to-from)*consumed,active:seconds>=0&&seconds<DRINK_DURATION};
}
export function nightProgress(seconds){return smooth((seconds-25)/110);}
