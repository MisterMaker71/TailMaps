const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const mapImg = new Image();
const overlayImg = new Image();

// important for GitHub Pages / server use
mapImg.crossOrigin = "anonymous";
overlayImg.crossOrigin = "anonymous";

mapImg.src = "map.png";
overlayImg.src = "overlay.png";

let mapData;
let overlayData;

Promise.all([
    new Promise(res => mapImg.onload = res),
    new Promise(res => overlayImg.onload = res)
]).then(() => {

    // ensure same size
    canvas.width = mapImg.width;
    canvas.height = mapImg.height;

    // draw base map
    ctx.drawImage(mapImg, 0, 0);
    mapData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // create hidden canvas for overlay
    const tempCanvas = document.createElement("canvas");
    const tempCtx = tempCanvas.getContext("2d");

    tempCanvas.width = overlayImg.width;
    tempCanvas.height = overlayImg.height;

    tempCtx.drawImage(overlayImg, 0, 0);
    overlayData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);

    console.log("Images loaded and ready");
});

function highlightOverlay(targetColor) {

    if (!mapData || !overlayData) {
        console.warn("Images not loaded yet");
        return;
    }

    // copy original map so we don’t destroy it
    const result = new Uint8ClampedArray(mapData.data);

    for (let i = 0; i < overlayData.data.length; i += 4) {

        const r = overlayData.data[i];
        const g = overlayData.data[i + 1];
        const b = overlayData.data[i + 2];
        const a = overlayData.data[i + 3];

        // skip transparent pixels
        if (a === 0) continue;

        if (matchColor(r, g, b, targetColor)) {
            result[i] = 255;     // red
            result[i + 1] = 0;
            result[i + 2] = 0;
        }
    }

    const newImage = new ImageData(result, canvas.width, canvas.height);
    ctx.putImageData(newImage, 0, 0);
}

function matchColor(r, g, b, target) {
    const tolerance = 5;

    return (
        Math.abs(r - target[0]) <= tolerance &&
        Math.abs(g - target[1]) <= tolerance &&
        Math.abs(b - target[2]) <= tolerance
    );
}

function resetMap() {
    if (mapData) {
        ctx.putImageData(mapData, 0, 0);
    }
}