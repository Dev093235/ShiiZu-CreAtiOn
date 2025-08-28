let slideIndex = 0;
const maxPhotos = 30;
const expiryTime = 24 * 60 * 60 * 1000; // 24 hours

// Compress image to <1MB with better quality
function compressImage(file, callback) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            const maxSize = 1024 * 1024; // 1MB
            let quality = 0.7; // Start with decent quality

            do {
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                const dataUrl = canvas.toDataURL('image/jpeg', quality);
                if (dataUrl.length < maxSize || quality <= 0.3) {
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

// Apply filter
function applyFilter(dataUrl, filterType, value) {
    const img = new Image();
    img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
            if (filterType === 'brightness') {
                data[i] = data[i] * (value / 100);     // R
                data[i + 1] = data[i + 1] * (value / 100); // G
                data[i + 2] = data[i + 2] * (value / 100); // B
            } else if (filterType === 'contrast') {
                const factor = (259 * (value + 255)) / (255 * (259 - value));
                data[i] = factor * (data[i] - 128) + 128;     // R
                data[i + 1] = factor * (data[i + 1] - 128) + 128; // G
                data[i + 2] = factor * (data[i + 2] - 128) + 128; // B
            }
        }
        ctx.putImageData(imageData, 0, 0);
        return canvas.toDataURL('image/jpeg');
    };
    img.src = dataUrl;
}

// Save photo to LocalStorage
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
    photos.forEach(photo => {
        const col = document.createElement('div');
        col.className = 'col-md-4 mb-3';
        col.innerHTML = `
            <div class="card">
                <a href="${photo.url}" download="edited_photo.jpg">
                    <img src="${photo.url}" class="card-img-top" alt="Photo">
                </a>
            </div>
        `;
        container.appendChild(col);
    });
}

// Upload Edited Photo
const photoInput = document.getElementById('photoInput');
const uploadBtn = document.getElementById('uploadBtn');
const filterSelect = document.getElementById('filterSelect');
const filterValue = document.getElementById('filterValue');
if (uploadBtn) {
    uploadBtn.addEventListener('click', () => {
        const file = photoInput.files[0];
        if (file) {
            compressImage(file, (dataUrl) => {
                const filterType = filterSelect.value;
                const value = filterValue.value;
                let finalUrl = dataUrl;
                if (filterType !== 'none') {
                    finalUrl = applyFilter(dataUrl, filterType, value);
                }
                if (savePhoto(finalUrl)) {
                    alert('Uploaded! View below or share URL: ' + finalUrl.slice(0, 20) + '...');
                    photoInput.value = '';
                    loadGallery(document.getElementById('gallery'));
                }
            });
        } else {
            alert('Select a photo!');
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

// Add Background Animations
function createBalloons() {
    for (let i = 0; i < 5; i++) {
        const balloon = document.createElement('div');
        balloon.className = 'balloon';
        balloon.style.left = Math.random() * 100 + 'vw';
        balloon.style.animationDuration = Math.random() * 5 + 6 + 's';
        balloon.style.background = `radial-gradient(circle at ${Math.random() * 50}% ${Math.random() * 50}%, hsl(${Math.random() * 360}, 70%, 70%), hsl(${Math.random() * 360}, 80%, 60%))`;
        document.body.appendChild(balloon);
        setTimeout(() => balloon.remove(), 12000);
    }
    setTimeout(createBalloons, 3000);
}

function createCodingText() {
    const text = ['var', 'function', 'if', 'else', 'console.log'];
    const coding = document.createElement('div');
    coding.className = 'coding-text';
    coding.style.left = '100vw';
    coding.style.top = Math.random() * 50 + 20 + 'vh';
    coding.textContent = text[Math.floor(Math.random() * text.length)];
    document.body.appendChild(coding);
    setTimeout(() => coding.remove(), 10000);
    setTimeout(createCodingText, 1000);
}

createBalloons();
createCodingText();

// Load Gallery
const gallery = document.getElementById('gallery');
if (gallery) loadGallery(gallery);
