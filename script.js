const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

ctx.imageSmoothingEnabled = false;

console.log("script loaded!");

const mapImg = new Image();
const overlayImg = new Image();

mapImg.crossOrigin = "anonymous";
overlayImg.crossOrigin = "anonymous";

mapImg.src = "map.png";
overlayImg.src = "overlay.png";


let mapData;
let overlayData;
let currentImageData;


let offsetX = 0;
let offsetY = 0;
let scale = 1;

let isDragging = false;
let lastX = 0;
let lastY = 0;


function fitToScreen() {
    const container = canvas.parentElement;

    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    const scaleX = containerWidth / canvas.width;
    const scaleY = containerHeight / canvas.height;

    // pick smaller → keep aspect ratio
    scale = Math.min(scaleX, scaleY);

    // center it
    offsetX = (containerWidth - canvas.width * scale) / 2;
    offsetY = (containerHeight - canvas.height * scale) / 2;

    redraw();
	
	console.log("fit to screen");
}


// load images
Promise.all([
    new Promise(res => mapImg.onload = res),
    new Promise(res => overlayImg.onload = res)
]).then(() => {
    canvas.width = mapImg.width;
    canvas.height = mapImg.height;

    // draw
    ctx.drawImage(mapImg, 0, 0);
    mapData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    currentImageData = mapData;


    const tempCanvas = document.createElement("canvas");
    const tempCtx = tempCanvas.getContext("2d");

    tempCanvas.width = overlayImg.width;
    tempCanvas.height = overlayImg.height;

    tempCtx.drawImage(overlayImg, 0, 0);
    overlayData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
	
	fitToScreen();
});

window.addEventListener("resize", () => {
    fitToScreen();
});

// redraw
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

// highlight
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

// color test
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

// drag

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

// scroll

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