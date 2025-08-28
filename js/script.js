let slideIndex = 0;
const maxPhotos = 30;
const expiryTime = 24 * 60 * 60 * 1000; // 24 hours

// Initialize waifu2x-wasm
const waifu2x = new Waifu2x();
waifu2x.init().then(() => {
    console.log('Waifu2x initialized');
});

// Function to upscale image using waifu2x
async function upscaleImage(dataUrl) {
    const img = new Image();
    img.src = dataUrl;
    await new Promise(resolve => img.onload = resolve);

    const canvas = document.createElement('canvas');
    canvas.width = img.width * 2; // 2x upscaling (HD quality)
    canvas.height = img.height * 2;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const upscaledDataUrl = await waifu2x.upscale(canvas.toDataURL('image/jpeg'));
    return upscaledDataUrl;
}

// Compress image (optional step before upscaling)
function compressImage(file, callback) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            const maxSize = 3 * 1024 * 1024; // 3MB limit
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

// Load Gallery with Balloons Behind Photos
function loadGallery(container) {
    cleanExpiredPhotos();
    container.innerHTML = '';
    const photos = JSON.parse(localStorage.getItem('photos')) || [];
    photos.forEach(photo => {
        const col = document.createElement('div');
        col.className = 'col-md-4 mb-4';
        col.innerHTML = `
            <div class="card">
                <a href="${photo.url}" download="sizzu_edited_photo.jpg">
                    <img src="${photo.url}" class="card-img-top" alt="Sizzu Photo">
                </a>
            </div>
        `;

        // Add balloons behind each card
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

// Observe gallery items for scroll animation
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

// Upload & Upscale Photo
const photoInput = document.getElementById('photoInput');
const uploadBtn = document.getElementById('uploadBtn');
if (uploadBtn) {
    uploadBtn.addEventListener('click', () => {
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
                        alert('Uploaded and enhanced to HD successfully! View below.');
                        photoInput.value = '';
                        loadGallery(document.getElementById('gallery'));
                    }
                } catch (error) {
                    console.error('Upscaling error:', error);
                    alert('Enhancement failed, using original image. Check browser performance.');
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
