const colorInput = document.getElementById('colorInput');
const extractBtn = document.getElementById('extractBtn');
const paletteGrid = document.getElementById('paletteGrid');
const imagePreview = document.getElementById('imagePreview');
const paletteSize = document.getElementById('paletteSize');

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('').toUpperCase();
}

function getPixelData(image, maxSide = 240) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));

  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  return ctx.getImageData(0, 0, canvas.width, canvas.height).data;
}

function extractPalette(data, colorsWanted) {
  const buckets = new Map();

  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3];
    if (a < 180) continue;

    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const key = `${Math.round(r / 24) * 24},${Math.round(g / 24) * 24},${Math.round(b / 24) * 24}`;
    const entry = buckets.get(key) || { r: 0, g: 0, b: 0, count: 0 };
    entry.r += r;
    entry.g += g;
    entry.b += b;
    entry.count += 1;
    buckets.set(key, entry);
  }

  return [...buckets.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, colorsWanted)
    .map(item => {
      const r = Math.round(item.r / item.count);
      const g = Math.round(item.g / item.count);
      const b = Math.round(item.b / item.count);
      return { hex: rgbToHex(r, g, b), rgb: `rgb(${r}, ${g}, ${b})`, count: item.count };
    });
}

function renderPalette(colors) {
  paletteGrid.innerHTML = colors.map(color => `
    <div class="swatch">
      <div class="swatch-chip" style="background:${color.hex};"></div>
      <div class="swatch-code">${color.hex}</div>
      <div class="swatch-meta">${color.rgb}</div>
      <button class="btn btn-secondary" type="button" data-copy="${color.hex}" style="margin-top:12px;width:100%;">Kopieren</button>
    </div>
  `).join('');

  paletteGrid.querySelectorAll('[data-copy]').forEach(button => {
    button.addEventListener('click', async () => {
      await navigator.clipboard.writeText(button.dataset.copy);
      const original = button.textContent;
      button.textContent = 'Kopiert!';
      setTimeout(() => button.textContent = original, 900);
    });
  });
}

function showPreview(src) {
  imagePreview.innerHTML = `<img src="${src}" alt="Bildvorschau" />`;
}

function extract() {
  const file = colorInput.files?.[0];
  if (!file) {
    imagePreview.innerHTML = '<div class="helper">Bitte zuerst ein Bild auswählen.</div>';
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    const src = reader.result;
    showPreview(src);

    const img = new Image();
    img.onload = () => {
      const data = getPixelData(img);
      const colors = extractPalette(data, Number(paletteSize.value));
      renderPalette(colors);
    };
    img.src = src;
  };
  reader.readAsDataURL(file);
}

extractBtn.addEventListener('click', extract);

colorInput.addEventListener('change', () => {
  if (colorInput.files?.[0]) {
    extract();
  }
});
