const input = document.getElementById('pngInput');
const convertBtn = document.getElementById('convertBtn');
const downloadBtn = document.getElementById('downloadBtn');
const svgOutput = document.getElementById('svgOutput');
const previewBox = document.getElementById('previewBox');
const detailRange = document.getElementById('detailRange');

let lastSvg = '';

function showMessage(message) {
  previewBox.innerHTML = `<div class="helper">${message}</div>`;
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function convert() {
  const file = input.files?.[0];
  if (!file) {
    showMessage('Bitte zuerst eine PNG-Datei auswählen.');
    return;
  }
  if (!window.ImageTracer) {
    showMessage('ImageTracer wurde nicht geladen. Prüfe die Internetverbindung oder das CDN.');
    return;
  }

  const dataUrl = await fileToDataUrl(file);
  previewBox.innerHTML = `<img src="${dataUrl}" alt="PNG Vorschau" />`;

  const img = new Image();
  img.onload = () => {
    const detail = Number(detailRange.value);
    const options = {
      ltres: 1 / detail,
      qtres: 1 / detail,
      pathomit: Math.max(2, Math.round(detail / 2)),
      numberofcolors: 16,
      scale: 1,
      strokewidth: 0,
      desc: true,
    };

    const svgString = ImageTracer.imagedataToSVG(ImageTracer.getImgdata(img), options);
    lastSvg = svgString;
    svgOutput.value = svgString;
    previewBox.innerHTML = svgString;
    downloadBtn.disabled = false;
  };
  img.src = dataUrl;
}

convertBtn.addEventListener('click', convert);

downloadBtn.addEventListener('click', () => {
  if (!lastSvg) return;
  const blob = new Blob([lastSvg], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'converted-image.svg';
  a.click();
  URL.revokeObjectURL(url);
});

input.addEventListener('change', () => {
  if (input.files?.[0]) {
    showMessage('Bereit zum Konvertieren.');
    downloadBtn.disabled = true;
    svgOutput.value = '';
    lastSvg = '';
  }
});
