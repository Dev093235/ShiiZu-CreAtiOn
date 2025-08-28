let slideIndex = 0;
const maxPhotos = 30;
const expiryTime = 24 * 60 * 60 * 1000; // 24 hours

// Compress image to <1MB
function compressImage(file, callback) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            const maxSize = 1024 * 1024; // 1MB
            let quality = 0.9;

            // Reduce quality until size is under 1MB
            do {
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                const dataUrl = canvas.toDataURL('image/jpeg', quality);
                if (dataUrl.length < maxSize || quality <= 0.1) {
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
if (uploadBtn) {
    uploadBtn.addEventListener('click', () => {
        const file = photoInput.files[0];
        if (file) {
            compressImage(file, (dataUrl) => {
                if (savePhoto(dataUrl)) {
                    alert('Uploaded! Share this URL in group: ' + dataUrl.slice(0, 20) + '...');
                    photoInput.value = '';
                    loadGallery(document.getElementById('uploadedPhotos')); // Show uploaded photo
                }
            });
        } else {
            alert('Select a photo!');
        }
    });
}

// Show Photo in Gallery
const photoUrl = document.getElementById('photoUrl');
const addUrlBtn = document.getElementById('addUrlBtn');
if (addUrlBtn) {
    addUrlBtn.addEventListener('click', () => {
        cleanExpiredPhotos();
        const url = photoUrl.value.trim();
        if (url && url.startsWith('data:image')) {
            loadGallery(document.getElementById('gallery'), url);
            photoUrl.value = '';
        } else {
            alert('Paste a valid photo URL from group!');
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
const gallery = document.getElementById('uploadedPhotos');
if (gallery) loadGallery(gallery);
