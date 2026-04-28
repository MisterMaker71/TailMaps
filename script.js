const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const img = new Image();
img.src = "map.png";

let originalData;

img.onload = () => {
    canvas.width = img.width;
    canvas.height = img.height;

    ctx.drawImage(img, 0, 0);

    originalData = ctx.getImageData(0, 0, canvas.width, canvas.height);
};

function highlight(targetColor) {
    const data = new Uint8ClampedArray(originalData.data); // copy

    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        if (matchColor(r, g, b, targetColor)) {
            data[i] = 255;     // red
            data[i + 1] = 0;
            data[i + 2] = 0;
        }
    }

    const newImage = new ImageData(data, canvas.width, canvas.height);
    ctx.putImageData(newImage, 0, 0);
}

function matchColor(r, g, b, target) {
    const tolerance = 10;

    return (
        Math.abs(r - target[0]) < tolerance &&
        Math.abs(g - target[1]) < tolerance &&
        Math.abs(b - target[2]) < tolerance
    );
}