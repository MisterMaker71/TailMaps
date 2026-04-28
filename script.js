const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");


const zoomDisplay = document.getElementById("zoomDisplay");


// disable blur
ctx.imageSmoothingEnabled = false;

// images
const mapImg = new Image();
const overlayImg = new Image();

mapImg.src = "map.png";
overlayImg.src = "overlay.png";

// data
let mapData, overlayData, currentImageData;

// camera
let offsetX = 0;
let offsetY = 0;
let scale = 1.5;

// drag
let isDragging = false;
let lastX = 0;
let lastY = 0;


function updateZoomDisplay() {
    const percent = Math.round(scale * 100);
    zoomDisplay.textContent = "Zoom: " + percent + "%";
}

// ==========================
// LOAD
// ==========================

Promise.all([
    new Promise(res => mapImg.onload = res),
    new Promise(res => overlayImg.onload = res)
]).then(() => {

    resizeCanvas();

    // prepare map
    const temp = document.createElement("canvas");
    const tctx = temp.getContext("2d");

    temp.width = mapImg.width;
    temp.height = mapImg.height;

    tctx.drawImage(mapImg, 0, 0);
    mapData = tctx.getImageData(0, 0, temp.width, temp.height);
    currentImageData = mapData;

    // prepare overlay
    const temp2 = document.createElement("canvas");
    const tctx2 = temp2.getContext("2d");

    temp2.width = overlayImg.width;
    temp2.height = overlayImg.height;

    tctx2.drawImage(overlayImg, 0, 0);
    overlayData = tctx2.getImageData(0, 0, temp2.width, temp2.height);

    fitToScreen();
});

// ==========================
// CANVAS SIZE
// ==========================

function resizeCanvas() {
    const container = canvas.parentElement;
    const rect = container.getBoundingClientRect();

    canvas.width = rect.width;
    canvas.height = rect.height;
}

// ==========================
// FIT
// ==========================

function fitToScreen() {
    const viewW = canvas.width;
    const viewH = canvas.height;

    const scaleX = viewW / mapImg.width;
    const scaleY = viewH / mapImg.height;

    scale = Math.max(scaleX, scaleY);

    offsetX = (viewW - mapImg.width * scale) / 2;
    offsetY = (viewH - mapImg.height * scale) / 2;

    redraw();
}

// ==========================
// DRAW
// ==========================

const clamp = (val, min=1, max=10) => Math.min(Math.max(val, min), max)

function redraw(imageData = currentImageData) {
    currentImageData = imageData;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.imageSmoothingEnabled = false;

	offsetX = clamp(offsetX, 100, 100);
	offsetY = clamp(offsetY, 100, 100);
	
    ctx.setTransform(scale, 0, 0, scale, offsetX, offsetY);

    const temp = document.createElement("canvas");
    const tctx = temp.getContext("2d");

    temp.width = mapImg.width;
    temp.height = mapImg.height;

    tctx.putImageData(imageData, 0, 0);

    ctx.drawImage(temp, 0, 0);
	
	updateZoomDisplay();
}

// ==========================
// HIGHLIGHT
// ==========================

function highlightOverlay(target) {
    const result = new Uint8ClampedArray(mapData.data);

    for (let i = 0; i < overlayData.data.length; i += 4) {

        const r = overlayData.data[i];
        const g = overlayData.data[i + 1];
        const b = overlayData.data[i + 2];
        const a = overlayData.data[i + 3];

        if (a === 0) continue;

        if (matchColor(r, g, b, target)) {
            result[i] = 255;
            result[i + 1] = 0;
            result[i + 2] = 0;
        }
    }

    redraw(new ImageData(result, mapImg.width, mapImg.height));
}

function matchColor(r, g, b, t) {
    const tol = 5;
    return (
        Math.abs(r - t[0]) <= tol &&
        Math.abs(g - t[1]) <= tol &&
        Math.abs(b - t[2]) <= tol
    );
}

function resetMap() {
    redraw(mapData);
}

// ==========================
// PAN
// ==========================

canvas.addEventListener("mousedown", e => {
    isDragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
});

window.addEventListener("mouseup", () => isDragging = false);

window.addEventListener("mousemove", e => {
    if (!isDragging) return;

    offsetX += e.clientX - lastX;
    offsetY += e.clientY - lastY;

    lastX = e.clientX;
    lastY = e.clientY;

    redraw();
});

// ==========================
// ZOOM
// ==========================

canvas.addEventListener("wheel", e => {
    e.preventDefault();

    const zoom = 1.1;

    const mx = e.offsetX;
    const my = e.offsetY;

    const wx = (mx - offsetX) / scale;
    const wy = (my - offsetY) / scale;

    scale *= (e.deltaY < 0) ? zoom : 1 / zoom;

    scale = Math.max(0.2, Math.min(scale, 10));

    offsetX = mx - wx * scale;
    offsetY = my - wy * scale;

    redraw();
});

// ==========================
// RESIZE
// ==========================

window.addEventListener("resize", () => {
    resizeCanvas();
    fitToScreen();
});