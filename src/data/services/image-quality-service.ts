import * as FileSystem from 'expo-file-system';
import jpeg from 'jpeg-js';

export type ImageQualityIssueCode =
  | 'blur'
  | 'low_resolution'
  | 'underexposed'
  | 'overexposed'
  | 'low_contrast'
  | 'evaluation_error';

export interface ImageQualityMetrics {
  sharpness?: number;
  width?: number;
  height?: number;
  brightness?: number;
  contrast?: number;
}

export interface ImageQualityResult {
  isValid: boolean;
  issues: string[];
  metrics: ImageQualityMetrics;
}

export const IMAGE_QUALITY_DEFAULTS = {
  minWidth: 1200,
  minHeight: 1200,
  minSharpness: 50,
  minBrightness: 35,
  maxBrightness: 220,
  minContrast: 18,
};

const MENSAJES_POR_ISSUE: Record<ImageQualityIssueCode, string> = {
  blur: 'La fotografía está borrosa. Intenta mantener el teléfono estable.',
  low_resolution: 'La resolución de la fotografía es insuficiente.',
  underexposed: 'La fotografía tiene poca iluminación. Busca un lugar más iluminado.',
  overexposed: 'La fotografía está sobreexpuesta. Prueba con una luz más uniforme.',
  low_contrast: 'La fotografía presenta poco contraste. Intenta otra toma con mejor iluminación.',
  evaluation_error: 'No se pudo evaluar la fotografía. Inténtalo de nuevo.',
};

function normalizarBase64(base64: string): string {
  return base64.replace(/\s+/g, '');
}

function base64AUint8Array(base64: string): Uint8Array {
  const limpio = normalizarBase64(base64);
  const binary = atob(limpio);
  const bytes = new Uint8Array(binary.length);
  for (let indice = 0; indice < binary.length; indice += 1) {
    bytes[indice] = binary.charCodeAt(indice);
  }
  return bytes;
}

function obtenerLuminancia(r: number, g: number, b: number): number {
  return r * 0.299 + g * 0.587 + b * 0.114;
}

function prepararEscalaGris(
  pixels: Uint8Array,
  width: number,
  height: number,
  targetWidth: number,
  targetHeight: number,
): Float32Array {
  const gris = new Float32Array(width * height);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const indice = (y * width + x) * 4;
      const r = pixels[indice];
      const g = pixels[indice + 1];
      const b = pixels[indice + 2];
      gris[y * width + x] = obtenerLuminancia(r, g, b);
    }
  }

  const escalado = new Float32Array(targetWidth * targetHeight);
  for (let y = 0; y < targetHeight; y += 1) {
    const sourceY = Math.min(height - 1, Math.floor((y / targetHeight) * height));
    for (let x = 0; x < targetWidth; x += 1) {
      const sourceX = Math.min(width - 1, Math.floor((x / targetWidth) * width));
      escalado[y * targetWidth + x] = gris[sourceY * width + sourceX];
    }
  }

  return escalado;
}

function calcularVarianzaLaplaciano(gris: Float32Array, width: number, height: number): number {
  const laplacianos: number[] = [];

  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const centro = gris[y * width + x];
      const izquierda = gris[y * width + (x - 1)];
      const derecha = gris[y * width + (x + 1)];
      const arriba = gris[(y - 1) * width + x];
      const abajo = gris[(y + 1) * width + x];
      const laplaciano = 4 * centro - izquierda - derecha - arriba - abajo;
      laplacianos.push(laplaciano);
    }
  }

  if (laplacianos.length === 0) return 0;

  const media =
    laplacianos.reduce((total, valor) => total + valor, 0) / laplacianos.length;
  const varianza =
    laplacianos.reduce((total, valor) => total + (valor - media) ** 2, 0) /
    laplacianos.length;

  return varianza;
}

function calcularContraste(luminancias: number[]): number {
  if (luminancias.length === 0) return 0;

  const media =
    luminancias.reduce((total, valor) => total + valor, 0) / luminancias.length;
  const varianza =
    luminancias.reduce((total, valor) => total + (valor - media) ** 2, 0) /
    luminancias.length;

  return Math.sqrt(varianza);
}

async function leerPixelesDeImagen(uri: string): Promise<{ width: number; height: number; data: Uint8Array }> {
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const bytes = base64AUint8Array(base64);
  const imagen = jpeg.decode(bytes, { useTArray: true });

  if (!imagen || !imagen.width || !imagen.height || !imagen.data) {
    throw new Error('No se pudo decodificar la imagen');
  }

  return {
    width: imagen.width,
    height: imagen.height,
    data: new Uint8Array(imagen.data),
  };
}

export function evaluarCalidadDesdePixeles({
  width,
  height,
  data,
}: {
  width: number;
  height: number;
  data: Uint8Array;
}): ImageQualityResult {
  const metrics: ImageQualityMetrics = {
    width,
    height,
  };

  const maxDimension = Math.max(width, height);
  const targetDimension = Math.min(160, Math.max(24, Math.round(maxDimension * 0.3)));
  const targetWidth = Math.max(1, Math.min(width, Math.round((width / maxDimension) * targetDimension)));
  const targetHeight = Math.max(1, Math.min(height, Math.round((height / maxDimension) * targetDimension)));

  const luminancias = new Float32Array(width * height);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const indice = (y * width + x) * 4;
      const r = data[indice];
      const g = data[indice + 1];
      const b = data[indice + 2];
      luminancias[y * width + x] = obtenerLuminancia(r, g, b);
    }
  }

  const mediaIluminacion =
    luminancias.reduce((total, valor) => total + valor, 0) / luminancias.length;
  const contrast = calcularContraste(Array.from(luminancias));
  const escaladoGris = prepararEscalaGris(data, width, height, targetWidth, targetHeight);
  const sharpness = calcularVarianzaLaplaciano(escaladoGris, targetWidth, targetHeight);

  metrics.sharpness = Number(sharpness.toFixed(2));
  metrics.brightness = Number(mediaIluminacion.toFixed(2));
  metrics.contrast = Number(contrast.toFixed(2));

  const issues: string[] = [];

  if (width < IMAGE_QUALITY_DEFAULTS.minWidth || height < IMAGE_QUALITY_DEFAULTS.minHeight) {
    issues.push(MENSAJES_POR_ISSUE.low_resolution);
  }

  if (sharpness < IMAGE_QUALITY_DEFAULTS.minSharpness) {
    issues.push(MENSAJES_POR_ISSUE.blur);
  }

  if (mediaIluminacion < IMAGE_QUALITY_DEFAULTS.minBrightness) {
    issues.push(MENSAJES_POR_ISSUE.underexposed);
  }

  if (mediaIluminacion > IMAGE_QUALITY_DEFAULTS.maxBrightness) {
    issues.push(MENSAJES_POR_ISSUE.overexposed);
  }

  if (contrast < IMAGE_QUALITY_DEFAULTS.minContrast) {
    issues.push(MENSAJES_POR_ISSUE.low_contrast);
  }

  const unicas = [...new Set(issues)];
  return {
    isValid: unicas.length === 0,
    issues: unicas,
    metrics,
  };
}

export async function evaluarCalidadImagen(uri: string): Promise<ImageQualityResult> {
  try {
    const imagen = await leerPixelesDeImagen(uri);
    return evaluarCalidadDesdePixeles(imagen);
  } catch {
    return {
      isValid: false,
      issues: [MENSAJES_POR_ISSUE.evaluation_error],
      metrics: {},
    };
  }
}
