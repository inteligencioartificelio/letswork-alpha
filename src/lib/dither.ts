/**
 * Bayer 4x4 Dithering — convierte cualquier imagen de canvas en una
 * representación bicolor de tinta física (e-ink aesthetic).
 */

const BAYER_MATRIX_4X4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

function parseHex(hex: string) {
  const clean = hex.replace('#', '');
  const num = parseInt(clean, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

export function applyBayerDither(
  canvas: HTMLCanvasElement,
  colorInkHex = '#080808',
  colorPaperHex = '#F5F3F1',
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const width = canvas.width;
  const height = canvas.height;
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  const ink = parseHex(colorInkHex);
  const paper = parseHex(colorPaperHex);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const gray = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
      const intensity = gray / 255;
      const bayerValue = BAYER_MATRIX_4X4[y % 4][x % 4];
      const threshold = (bayerValue + 0.5) / 16;

      if (intensity < threshold) {
        data[idx] = ink.r;
        data[idx + 1] = ink.g;
        data[idx + 2] = ink.b;
      } else {
        data[idx] = paper.r;
        data[idx + 1] = paper.g;
        data[idx + 2] = paper.b;
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

export function processAvatarFile(
  file: File,
  colorInkHex = '#080808',
  colorPaperHex = '#F5F3F1',
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 96;
        canvas.height = 96;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        const size = Math.min(img.width, img.height);
        const sx = (img.width - size) / 2;
        const sy = (img.height - size) / 2;
        ctx.drawImage(img, sx, sy, size, size, 0, 0, 96, 96);
        applyBayerDither(canvas, colorInkHex, colorPaperHex);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = event.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}
