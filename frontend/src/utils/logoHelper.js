import logoUrl from '../assets/moonlight_logo.png';

let cachedBase64 = null;
let loading = null;

export function logoDataUrl() {
  return logoUrl;
}

export async function getLogoBase64() {
  if (cachedBase64) return cachedBase64;
  if (loading) return loading;
  loading = (async () => {
    const res = await fetch(logoUrl);
    const blob = await res.blob();
    cachedBase64 = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result).split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    return cachedBase64;
  })();
  try {
    return await loading;
  } catch {
    return null;
  }
}

export async function loadLogoImage() {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = logoUrl;
  });
}