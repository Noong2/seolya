// Touch tablets and phones keep their mobile controls after screen rotation.
export function deviceProfile(){
  const touch=matchMedia('(pointer: coarse)').matches;
  const mobile=touch||innerWidth<=700;
  return {touch,mobile,portrait:innerHeight>=innerWidth,fov:innerHeight>=innerWidth&&mobile?76:65,pixelRatio:mobile?1.25:1.7,snowCount:mobile?700:1700,fps:mobile?30:60};
}
export function updateDeviceLayout(){
  const profile=deviceProfile();
  document.documentElement.dataset.mobile=String(profile.mobile);
  document.documentElement.dataset.touch=String(profile.touch);
  return profile;
}
