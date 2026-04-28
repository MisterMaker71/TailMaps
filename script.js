const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

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
let scale = 1;

// dragging
let isDragging = false;
let lastX = 0;
let lastY = 0;

// layers
let activeColors = [];
let activeButtons = new Map();

let pathEnabled = false;
const pathColor = [254, 254, 254];

// ==========================
// LOAD
// ==========================

Promise.all([
    new Promise(res => mapImg.onload = res),
    new Promise(res => overlayImg.onload = res)
]).then(() => {

    resizeCanvas();

    // map
    const t1 = document.createElement("canvas");
    const c1 = t1.getContext("2d");

    t1.width = mapImg.width;
    t1.height = mapImg.height;

    c1.drawImage(mapImg, 0, 0);
    mapData = c1.getImageData(0, 0, t1.width, t1.height);
    currentImageData = mapData;

    // overlay
    const t2 = document.createElement("canvas");
    const c2 = t2.getContext("2d");

    t2.width = overlayImg.width;
    t2.height = overlayImg.height;

    c2.drawImage(overlayImg, 0, 0);
    overlayData = c2.getImageData(0, 0, t2.width, t2.height);

    fitToScreen();
});

// ==========================
// CANVAS SIZE
// ==========================

function resizeCanvas() {
    const rect = canvas.parentElement.getBoundingClientRect();
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

    scale = Math.min(scaleX, scaleY);

    offsetX = (viewW - mapImg.width * scale) / 2;
    offsetY = (viewH - mapImg.height * scale) / 2;

    redrawLayers();
}

// ==========================
// DRAW
// ==========================

function redraw(imageData = currentImageData) {
    currentImageData = imageData;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.imageSmoothingEnabled = false;

    ctx.setTransform(scale, 0, 0, scale, offsetX, offsetY);

    const temp = document.createElement("canvas");
    const tctx = temp.getContext("2d");

    temp.width = mapImg.width;
    temp.height = mapImg.height;

    tctx.putImageData(imageData, 0, 0);
    ctx.drawImage(temp, 0, 0);
}

// ==========================
// LAYER SYSTEM
// ==========================

function redrawLayers() {
    const result = new Uint8ClampedArray(mapData.data);

    for (let i = 0; i < overlayData.data.length; i += 4) {

        const r = overlayData.data[i];
        const g = overlayData.data[i + 1];
        const b = overlayData.data[i + 2];
        const a = overlayData.data[i + 3];

        if (a === 0) continue;

        // regions
        for (const color of activeColors) {
            if (matchColor(r, g, b, color)) {
                result[i] = 255;
                result[i + 1] = 0;
                result[i + 2] = 0;
            }
        }

        // path on top
        if (pathEnabled && matchColor(r, g, b, pathColor)) {
            result[i] = 255;
            result[i + 1] = 255;
            result[i + 2] = 0; // yellow
        }
    }

    redraw(new ImageData(result, mapImg.width, mapImg.height));
}

// ==========================
// TOGGLE REGION
// ==========================

function toggleColor(color, button) {

    const isSameActive =
        activeColors.length === 1 &&
        activeColors[0][0] === color[0] &&
        activeColors[0][1] === color[1] &&
        activeColors[0][2] === color[2];

    // reset all buttons first
    document.querySelectorAll(".controls button").forEach(b => {
        b.style.background = "";
    });

    if (isSameActive) {
        // turn OFF
        activeColors = [];
    } else {
        // turn ON only this one
        activeColors = [color];
        button.style.background = "#550000";
    }

    redrawLayers();
}

// ==========================
// TOGGLE PATH
// ==========================

function togglePath(button) {
    pathEnabled = !pathEnabled;

    button.style.background = pathEnabled ? "#555500" : "";

    redrawLayers();
}

// ==========================
// MATCH COLOR
// ==========================

function matchColor(r, g, b, t) {
    const tol = 5;
    return (
        Math.abs(r - t[0]) <= tol &&
        Math.abs(g - t[1]) <= tol &&
        Math.abs(b - t[2]) <= tol
    );
}

// ==========================
// RESET
// ==========================

function resetMap() {
    activeColors = [];

    // reset ONLY region buttons (not the path button)
    document.querySelectorAll(".controls button").forEach(b => {
        if (!b.classList.contains("path-btn")) {
            b.style.background = "";
        }
    });

    redrawLayers(); // keep path state
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