const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// images
const mapImg = new Image();
const overlayImg = new Image();

mapImg.crossOrigin = "anonymous";
overlayImg.crossOrigin = "anonymous";

mapImg.src = "map.png";
overlayImg.src = "overlay.png";

// data
let mapData;
let overlayData;
let currentImageData;

// camera
let offsetX = 0;
let offsetY = 0;
let scale = 1;

let isDragging = false;
let lastX = 0;
let lastY = 0;

// load images
Promise.all([
    new Promise(res => mapImg.onload = res),
    new Promise(res => overlayImg.onload = res)
]).then(() => {

    canvas.width = mapImg.width;
    canvas.height = mapImg.height;

    // draw map
    ctx.drawImage(mapImg, 0, 0);
    mapData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    currentImageData = mapData;

    // overlay → hidden canvas
    const tempCanvas = document.createElement("canvas");
    const tempCtx = tempCanvas.getContext("2d");

    tempCanvas.width = overlayImg.width;
    tempCanvas.height = overlayImg.height;

    tempCtx.drawImage(overlayImg, 0, 0);
    overlayData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);

    redraw();
});

// redraw with camera
function redraw(imageData = currentImageData) {
    currentImageData = imageData;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.setTransform(scale, 0, 0, scale, offsetX, offsetY);

    const tempCanvas = document.createElement("canvas");
    const tempCtx = tempCanvas.getContext("2d");

    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;

    tempCtx.putImageData(imageData, 0, 0);

    ctx.drawImage(tempCanvas, 0, 0);
}

// highlight using overlay
function highlightOverlay(targetColor) {
    if (!mapData || !overlayData) return;

    const result = new Uint8ClampedArray(mapData.data);

    for (let i = 0; i < overlayData.data.length; i += 4) {

        const r = overlayData.data[i];
        const g = overlayData.data[i + 1];
        const b = overlayData.data[i + 2];
        const a = overlayData.data[i + 3];

        if (a === 0) continue;

        if (matchColor(r, g, b, targetColor)) {
            result[i] = 255;
            result[i + 1] = 0;
            result[i + 2] = 0;
        }
    }

    const newImage = new ImageData(result, canvas.width, canvas.height);
    redraw(newImage);
}

// color match
function matchColor(r, g, b, target) {
    const tolerance = 5;

    return (
        Math.abs(r - target[0]) <= tolerance &&
        Math.abs(g - target[1]) <= tolerance &&
        Math.abs(b - target[2]) <= tolerance
    );
}

// reset
function resetMap() {
    redraw(mapData);
}

// ==========================
// 🖱️ PAN (drag)
// ==========================

canvas.addEventListener("mousedown", (e) => {
    isDragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
});

window.addEventListener("mouseup", () => {
    isDragging = false;
});

window.addEventListener("mousemove", (e) => {
    if (!isDragging) return;

    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;

    offsetX += dx;
    offsetY += dy;

    lastX = e.clientX;
    lastY = e.clientY;

    redraw();
});

// ==========================
// 🔍 ZOOM (scroll)
// ==========================

canvas.addEventListener("wheel", (e) => {
    e.preventDefault();

    const zoomFactor = 1.1;

    const mouseX = e.offsetX;
    const mouseY = e.offsetY;

    const worldX = (mouseX - offsetX) / scale;
    const worldY = (mouseY - offsetY) / scale;

    if (e.deltaY < 0) {
        scale *= zoomFactor;
    } else {
        scale /= zoomFactor;
    }

    // clamp zoom
    scale = Math.max(0.2, Math.min(scale, 10));

    offsetX = mouseX - worldX * scale;
    offsetY = mouseY - worldY * scale;

    redraw();
});