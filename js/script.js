let slideIndex = 0;
const maxPhotos = 30;
const expiryTime = 24 * 60 * 60 * 1000;
const modal = new bootstrap.Modal(document.getElementById('photoModal'));
let canvas, ctx, image, cropStart;

let waifu2x;
async function initWaifu2x() {
    try {
        waifu2x = new Waifu2x();
        await waifu2x.init({ noiseLevel: 1, scale: 2 });
        console.log('Waifu2x initialized successfully');
    } catch (error) {
        console.error('Waifu2x initialization failed:', error);
        alert('Image enhancement failed to initialize. Using original images.');
        waifu2x = null;
    }
}
initWaifu2x();

// Function to upscale image
async function upscaleImage(dataUrl) {
    if (!waifu2x) return dataUrl;
    try {
        const img = new Image();
        img.src = dataUrl;
        await new Promise(resolve => img.onload = resolve);

        const canvas = document.createElement('canvas');
        canvas.width = img.width * 2;
        canvas.height = img.height * 2;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const upscaledDataUrl = await waifu2x.upscale(canvas.toDataURL('image/jpeg', 0.95));
        return upscaledDataUrl || dataUrl;
    } catch (error) {
        console.error('Upscaling error:', error);
        return dataUrl;
    }
}

// Compress image
function compressImage(file, callback) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            const maxSize = 3 * 1024 * 1024;
            let quality = 0.85;

            do {
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                const dataUrl = canvas.toDataURL('image/jpeg', quality);
                if (dataUrl.length < maxSize || quality <= 0.5) {
                    callback(dataUrl);
                    break;
                }
                quality -= 0.1;
            } while (true);
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// Save photo
function savePhoto(dataUrl) {
    let photos = JSON.parse(localStorage.getItem('photos')) || [];
    if (photos.length >= maxPhotos) {
        alert('Limit reached! Wait for photos to expire.');
        return false;
    }
    photos.push({ url: dataUrl, timestamp: Date.now() });
    localStorage.setItem('photos', JSON.stringify(photos));
    return true;
}

// Clean expired photos
function cleanExpiredPhotos() {
    let photos = JSON.parse(localStorage.getItem('photos')) || [];
    photos = photos.filter(photo => Date.now() - photo.timestamp < expiryTime);
    localStorage.setItem('photos', JSON.stringify(photos));
    return photos;
}

// Load Gallery
function loadGallery(container) {
    cleanExpiredPhotos();
    container.innerHTML = '';
    const photos = JSON.parse(localStorage.getItem('photos')) || [];
    if (photos.length === 0) {
        container.innerHTML = '<p class="text-center text-muted">No photos uploaded yet!</p>';
        return;
    }
    photos.forEach((photo, index) => {
        const col = document.createElement('div');
        col.className = 'col-md-4 mb-4';
        col.innerHTML = `
            <div class="card">
                <img src="${photo.url}" class="card-img-top" onclick="showFullPhoto('${photo.url}', ${index})" alt="Sizzu Photo ${index}">
            </div>
        `;

        for (let i = 0; i < 3; i++) {
            const balloon = document.createElement('div');
            balloon.className = 'balloon';
            balloon.style.left = `${Math.random() * 120 - 10}%`;
            balloon.style.top = `${Math.random() * 120 - 10}%`;
            balloon.style.animationDuration = `${Math.random() * 5 + 12}s`;
            balloon.style.setProperty('--hue', Math.random() * 360);
            col.querySelector('.card').appendChild(balloon);
            setTimeout(() => balloon.remove(), 15000);
        }

        container.appendChild(col);
    });
    observeGalleryItems();
}

// Observe gallery items
function observeGalleryItems() {
    const items = document.querySelectorAll('#gallery .col-md-4');
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.2 });
    items.forEach(item => observer.observe(item));
}

// Show Full Photo and Edit
function showFullPhoto(url, index) {
    canvas = document.getElementById('editCanvas');
    ctx = canvas.getContext('2d', { willReadFrequently: true });
    image = new Image();
    image.src = url;
    image.onload = () => {
        canvas.width = image.width;
        canvas.height = image.height;
        ctx.drawImage(image, 0, 0);
        document.getElementById('photoModalLabel').innerText = `Full Photo ${index}`;
        modal.show();
    };
}

// Edit Functions
document.getElementById('cropBtn').addEventListener('click', () => {
    if (!cropStart) {
        cropStart = { x: 0, y: 0 };
        canvas.addEventListener('mousedown', startCrop);
        canvas.addEventListener('mousemove', doCrop);
        canvas.addEventListener('mouseup', endCrop);
        alert('Click and drag to crop, then click Crop again to confirm.');
    } else {
        endCrop();
    }
});

function startCrop(e) {
    cropStart = { x: e.offsetX, y: e.offsetY };
}

function doCrop(e) {
    if (cropStart) {
        const width = e.offsetX - cropStart.x;
        const height = e.offsetY - cropStart.y;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(image, 0, 0);
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 2;
        ctx.strokeRect(cropStart.x, cropStart.y, width, height);
    }
}

function endCrop() {
    if (cropStart) {
        const cropEnd = { x: event.offsetX, y: event.offsetY };
        const width = cropEnd.x - cropStart.x;
        const height = cropEnd.y - cropStart.y;
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = Math.abs(width);
        tempCanvas.height = Math.abs(height);
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.drawImage(image, cropStart.x, cropStart.y, width, height, 0, 0, tempCanvas.width, tempCanvas.height);
        image.src = tempCanvas.toDataURL();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(image, 0, 0);
        cropStart = null;
        canvas.removeEventListener('mousedown', startCrop);
        canvas.removeEventListener('mousemove', doCrop);
        canvas.removeEventListener('mouseup', endCrop);
    }
}

document.getElementById('brightnessBtn').addEventListener('click', () => {
    const brightness = prompt('Enter brightness value (-100 to 100):', '10');
    if (brightness !== null) {
        const value = parseInt(brightness);
        if (!isNaN(value) && value >= -100 && value <= 100) {
            ctx.filter = `brightness(${100 + value}%)`;
            ctx.drawImage(image, 0, 0);
            ctx.filter = 'none'; // Reset filter after drawing
        } else {
            alert('Please enter a value between -100 and 100!');
        }
    }
});

document.getElementById('saveBtn').addEventListener('click', () => {
    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    savePhoto(dataUrl);
    loadGallery(document.getElementById('gallery'));
    modal.hide();
    alert('Photo saved and updated in gallery!');
});

// Upload Options
const photoInput = document.getElementById('photoInput');
const uploadOriginalBtn = document.getElementById('uploadOriginalBtn');
const uploadEnhanceBtn = document.getElementById('uploadEnhanceBtn');

if (uploadOriginalBtn) {
    uploadOriginalBtn.addEventListener('click', () => {
        const file = photoInput.files[0];
        if (file) {
            if (file.size > 3 * 1024 * 1024) {
                alert('Photo size should be under 3MB!');
                return;
            }
            compressImage(file, (dataUrl) => {
                if (savePhoto(dataUrl)) {
                    alert('Original photo uploaded successfully! View below.');
                    photoInput.value = '';
                    loadGallery(document.getElementById('gallery'));
                }
            });
        } else {
            alert('Please select a photo!');
        }
    });
}

if (uploadEnhanceBtn) {
    uploadEnhanceBtn.addEventListener('click', () => {
        const file = photoInput.files[0];
        if (file) {
            if (file.size > 3 * 1024 * 1024) {
                alert('Photo size should be under 3MB!');
                return;
            }
            compressImage(file, async (dataUrl) => {
                try {
                    const upscaledUrl = await upscaleImage(dataUrl);
                    if (savePhoto(upscaledUrl)) {
                        alert('Enhanced photo uploaded successfully! View below.');
                        photoInput.value = '';
                        loadGallery(document.getElementById('gallery'));
                    }
                } catch (error) {
                    console.error('Upscaling error:', error);
                    alert('Enhancement failed, using original image.');
                    if (savePhoto(dataUrl)) {
                        loadGallery(document.getElementById('gallery'));
                    }
                }
            });
        } else {
            alert('Please select a photo!');
        }
    });
}

// Slideshow
function showSlideshow() {
    const slideshow = document.getElementById('slideshow');
    const slideshowImg = document.getElementById('slideshow-img');
    const photos = cleanExpiredPhotos();
    if (photos.length > 0) {
        slideIndex = 0;
        slideshowImg.src = photos[slideIndex].url;
        slideshow.style.display = 'flex';
    } else {
        alert('No photos to show in slideshow!');
    }
}

function changeSlide(n) {
    const slideshowImg = document.getElementById('slideshow-img');
    const photos = cleanExpiredPhotos();
    slideIndex += n;
    if (slideIndex >= photos.length) slideIndex = 0;
    if (slideIndex < 0) slideIndex = photos.length - 1;
    slideshowImg.src = photos[slideIndex].url;
}

// Load Gallery
const gallery = document.getElementById('gallery');
if (gallery) loadGallery(gallery);
