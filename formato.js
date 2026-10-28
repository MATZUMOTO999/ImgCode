'use strict';

const fileInput = document.getElementById('fileInput');
const resolution = document.getElementById('resolution');
const resValue = document.getElementById('resValue');
const originalCanvas = document.getElementById('originalImage');
const pixelatedCanvas = document.getElementById('pixelatedImage');
const renderCanvas = document.getElementById('renderPreview');
const codeOutput = document.getElementById('codeOutput');
const asciiPreview = document.getElementById('asciiPreview');
const asciiPreviewBox = document.getElementById('asciiPreviewBox');
const paletteSelect = document.getElementById('paletaSelect');
const asciiSize = document.getElementById('asciiSize');
const sizeValue = document.getElementById('sizeValue');
const uploadZone = document.querySelector('.upload-zone');

let imageData = null;
let currentTab = 'html';
let generatedCode = '';
let currentImage = null;
let activeExample = null;

const examples = {
    corazon: [
        '00111100',
        '01111110',
        '11111111',
        '11111111',
        '01111110',
        '00111100',
        '00011000',
        '00000000'
    ],
    estrella: [
        '00011000',
        '00011000',
        '10011001',
        '01011010',
        '00111100',
        '01111110',
        '11011011',
        '00011000'
    ]
};

const asciiPalettes = {
    detallada: '@%#*+=-:. ',
    simple: '#=-. ',
    bloques: '█▓▒░ ',
    binario: '01'
};

resolution.addEventListener('input', () => {
    resValue.textContent = `${resolution.value}px`;
    if (activeExample) {
        cargarEjemplo(activeExample);
    } else if (currentImage) {
        procesarImagen(currentImage);
    }
});

fileInput.addEventListener('change', () => {
    const [file] = fileInput.files;
    if (file) cargarArchivo(file);
});

document.getElementById('convertButton').addEventListener('click', convertir);
document.getElementById('copyButton').addEventListener('click', copiarCodigo);
document.getElementById('downloadButton').addEventListener('click', descargarCodigo);
document.getElementById('resetButton').addEventListener('click', reiniciar);
paletteSelect.addEventListener('change', cambiarPaleta);
asciiSize.addEventListener('input', cambiarTamanoASCII);

document.querySelectorAll('[data-example]').forEach((button) => {
    button.addEventListener('click', () => cargarEjemplo(button.dataset.example));
});

document.querySelectorAll('[data-format]').forEach((button) => {
    button.addEventListener('click', () => cambiarTab(button.dataset.format));
});

uploadZone.addEventListener('dragover', (event) => {
    event.preventDefault();
    uploadZone.classList.add('dragging');
});

uploadZone.addEventListener('dragleave', (event) => {
    if (!uploadZone.contains(event.relatedTarget)) {
        uploadZone.classList.remove('dragging');
    }
});

uploadZone.addEventListener('drop', (event) => {
    event.preventDefault();
    uploadZone.classList.remove('dragging');
    const [file] = event.dataTransfer.files;
    if (file) cargarArchivo(file);
});

function cargarArchivo(file) {
    if (!file.type.startsWith('image/')) {
        alert('Selecciona un archivo de imagen válido.');
        return;
    }

    activeExample = null;
    const reader = new FileReader();
    reader.addEventListener('load', () => {
        const img = new Image();
        img.addEventListener('load', () => {
            currentImage = img;
            procesarImagen(img);
        });
        img.addEventListener('error', () => alert('No se pudo cargar la imagen.'));
        img.src = reader.result;
    });
    reader.addEventListener('error', () => alert('No se pudo leer el archivo de imagen.'));
    reader.readAsDataURL(file);
}

function procesarImagen(img) {
    const width = Number.parseInt(resolution.value, 10);
    const height = Math.max(1, Math.round(width / (img.width / img.height)));

    originalCanvas.width = width;
    originalCanvas.height = height;
    const context = originalCanvas.getContext('2d');
    context.drawImage(img, 0, 0, width, height);
    imageData = context.getImageData(0, 0, width, height);
    mostrarImagen();
}

function cargarEjemplo(name) {
    const pattern = examples[name];
    if (!pattern) return;

    activeExample = name;
    currentImage = null;
    const width = Number.parseInt(resolution.value, 10);
    const height = width;
    const color = name === 'corazon' ? [255, 70, 110] : [255, 215, 0];
    originalCanvas.width = width;
    originalCanvas.height = height;
    imageData = originalCanvas.getContext('2d').createImageData(width, height);

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const patternX = Math.floor((x / width) * pattern[0].length);
            const patternY = Math.floor((y / height) * pattern.length);
            const index = (y * width + x) * 4;
            imageData.data[index] = color[0];
            imageData.data[index + 1] = color[1];
            imageData.data[index + 2] = color[2];
            imageData.data[index + 3] = pattern[patternY][patternX] === '1' ? 255 : 0;
        }
    }

    mostrarImagen();
}

function mostrarImagen() {
    pixelatedCanvas.width = imageData.width;
    pixelatedCanvas.height = imageData.height;
    pixelatedCanvas.getContext('2d').putImageData(imageData, 0, 0);

    renderCanvas.width = imageData.width;
    renderCanvas.height = imageData.height;
    renderCanvas.getContext('2d').putImageData(imageData, 0, 0);
    convertir();
}

function convertir() {
    if (!imageData) return;

    if (currentTab === 'html') generarHTML();
    else if (currentTab === 'canvas') generarCanvas();
    else generarASCII();

    codeOutput.textContent = generatedCode;
    actualizarVistaASCII();
}

function generarHTML() {
    const { width, data } = imageData;
    const pixelSize = 5;
    let html = `<!-- Imagen generada con Image-to-Code -->\n<div class="pixel-art" style="display:grid;grid-template-columns:repeat(${width},${pixelSize}px);width:${width * pixelSize}px;">\n`;

    for (let i = 0; i < data.length; i += 4) {
        const [red, green, blue, alpha] = data.slice(i, i + 4);
        html += `  <div style="width:${pixelSize}px;height:${pixelSize}px;background:rgba(${red},${green},${blue},${(alpha / 255).toFixed(2)})"></div>\n`;
    }

    generatedCode = `${html}</div>`;
}

function generarCanvas() {
    const { width, height, data } = imageData;
    const pixels = [];

    for (let i = 0; i < data.length; i += 4) {
        pixels.push(`[${data[i]},${data[i + 1]},${data[i + 2]},${data[i + 3]}]`);
    }

    generatedCode = `// Imagen generada con Image-to-Code
const canvas = document.createElement('canvas');
canvas.width = ${width};
canvas.height = ${height};
const ctx = canvas.getContext('2d');
const img = ctx.createImageData(${width}, ${height});
const data = [
  ${pixels.join(',\n  ')}
];
data.forEach((pixel, index) => {
  img.data[index * 4] = pixel[0];
  img.data[index * 4 + 1] = pixel[1];
  img.data[index * 4 + 2] = pixel[2];
  img.data[index * 4 + 3] = pixel[3];
});
ctx.putImageData(img, 0, 0);
document.body.appendChild(canvas);`;
}

function generarASCII() {
    generatedCode = `<pre style="font-family: monospace; font-size: ${asciiSize.value}px; line-height: ${asciiSize.value}px;">\n${generarTextoASCII()}</pre>`;
}

function actualizarVistaASCII() {
    const isASCII = currentTab === 'ascii';
    asciiPreviewBox.hidden = !isASCII;
    if (isASCII) {
        asciiPreview.textContent = generarTextoASCII();
        asciiPreview.style.fontSize = `${asciiSize.value}px`;
        asciiPreview.style.lineHeight = `${asciiSize.value}px`;
    } else {
        asciiPreview.textContent = '';
    }
}

function generarTextoASCII() {
    if (!imageData) return '';

    const { width, height, data } = imageData;
    const chars = asciiPalettes[paletteSelect.value];
    let ascii = '';

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const index = (y * width + x) * 4;
            if (data[index + 3] === 0) {
                ascii += ' ';
                continue;
            }

            const brightness = 0.299 * data[index] + 0.587 * data[index + 1] + 0.114 * data[index + 2];
            ascii += chars[Math.round((brightness / 255) * (chars.length - 1))];
        }
        ascii += '\n';
    }

    return ascii;
}

function cambiarTab(tab) {
    currentTab = tab;
    document.querySelectorAll('[data-format]').forEach((button) => {
        const isSelected = button.dataset.format === tab;
        button.classList.toggle('active', isSelected);
        button.setAttribute('aria-selected', String(isSelected));
    });
    convertir();
}

function cambiarPaleta() {
    convertir();
}

function cambiarTamanoASCII() {
    sizeValue.textContent = `${asciiSize.value}px`;
    convertir();
}

async function copiarCodigo() {
    if (!generatedCode) {
        alert('Primero convierte una imagen.');
        return;
    }

    try {
        await navigator.clipboard.writeText(generatedCode);
        alert('Código copiado al portapapeles.');
    } catch (error) {
        alert(`No se pudo copiar el código: ${error.message}`);
    }
}

function descargarCodigo() {
    if (!generatedCode) {
        alert('Primero convierte una imagen.');
        return;
    }

    const extension = currentTab === 'html' ? 'html' : currentTab === 'canvas' ? 'js' : 'txt';
    const blob = new Blob([generatedCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `imagen-codigo.${extension}`;
    link.click();
    URL.revokeObjectURL(url);
}

function reiniciar() {
    fileInput.value = '';
    imageData = null;
    generatedCode = '';
    currentImage = null;
    activeExample = null;
    codeOutput.textContent = 'Sube una imagen para ver el código aquí...';

    [originalCanvas, pixelatedCanvas, renderCanvas].forEach((canvas) => {
        canvas.width = 0;
        canvas.height = 0;
    });

    asciiPreview.textContent = '';
    asciiPreviewBox.hidden = true;
    resolution.value = 40;
    resValue.textContent = '40px';
    asciiSize.value = 10;
    sizeValue.textContent = '10px';
    paletteSelect.value = 'detallada';
}
