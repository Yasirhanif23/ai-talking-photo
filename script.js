// Global state variables
let photoFile = null;
let refFile = null;

// File Upload Handlers
document.addEventListener('DOMContentLoaded', () => {
    setupDropzone('photo-dropzone', 'photo-input', handlePhotoSelect);
    setupDropzone('ref-dropzone', 'ref-input', handleRefSelect);
});

function setupDropzone(dropzoneId, inputId, handler) {
    const dropzone = document.getElementById(dropzoneId);
    const input = document.getElementById(inputId);

    dropzone.addEventListener('click', () => input.click());

    input.addEventListener('change', (e) => {
        if (e.target.files.length > 0) handler(e.target.files[0]);
    });

    dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.style.borderColor = '#6366f1';
    });

    dropzone.addEventListener('dragleave', () => {
        dropzone.style.borderColor = '#334155';
    });

    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        if (e.dataTransfer.files.length > 0) handler(e.dataTransfer.files[0]);
    });
}

function handlePhotoSelect(file) {
    if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file.');
        return;
    }
    photoFile = file;
    const reader = new FileReader();
    reader.onload = (e) => {
        document.getElementById('photo-preview').src = e.target.result;
        document.getElementById('photo-prompt').classList.add('hidden');
        document.getElementById('photo-preview-box').classList.remove('hidden');
    };
    reader.readAsDataURL(file);
}

function handleRefSelect(file) {
    refFile = file;
    const reader = new FileReader();
    reader.onload = (e) => {
        const videoPrev = document.getElementById('ref-preview');
        const audioPrev = document.getElementById('ref-audio-preview');

        if (file.type.startsWith('video/')) {
            videoPrev.src = e.target.result;
            videoPrev.classList.remove('hidden');
            audioPrev.classList.add('hidden');
        } else if (file.type.startsWith('audio/')) {
            audioPrev.src = e.target.result;
            audioPrev.classList.remove('hidden');
            videoPrev.classList.add('hidden');
        }

        document.getElementById('ref-prompt').classList.add('hidden');
        document.getElementById('ref-preview-box').classList.remove('hidden');
    };
    reader.readAsDataURL(file);
}

function removeFile(type) {
    if (type === 'photo') {
        photoFile = null;
        document.getElementById('photo-input').value = '';
        document.getElementById('photo-prompt').classList.remove('hidden');
        document.getElementById('photo-preview-box').classList.add('hidden');
    } else {
        refFile = null;
        document.getElementById('ref-input').value = '';
        document.getElementById('ref-prompt').classList.remove('hidden');
        document.getElementById('ref-preview-box').classList.add('hidden');
    }
}

// Modal Trigger Functions
function openChoiceModal() {
    if (!photoFile || !refFile) {
        alert('Please upload both Source Photo and Reference Video/Audio first.');
        return;
    }
    document.getElementById('choice-modal').classList.remove('hidden');
}

function closeChoiceModal() {
    document.getElementById('choice-modal').classList.add('hidden');
}

// Option 1: User chooses "Watch Ad"
function startWithAd() {
    closeChoiceModal();
    // Simulate Monetag / Adsterra Popunder / Interstitial trigger
    console.log("Triggering Adsterra/Monetag Ad...");
    
    processAIVideo();
}

// Option 2: User chooses "Pay $0.10"
function startWithPayment() {
    closeChoiceModal();
    
    const confirmPay = confirm("You selected $0.10 Instant Fast Processing. Proceed to Payment?");
    if (confirmPay) {
        alert("Payment Received! Starting Priority HD Generation...");
        processAIVideo();
    }
}

// Real AI Video Generation Engine (Connected to /api/generate)
async function processAIVideo() {
    const generateBtn = document.getElementById('generate-btn');
    const statusBox = document.getElementById('status-box');
    const outputPlaceholder = document.getElementById('output-placeholder');
    const resultContainer = document.getElementById('result-container');
    const progressFill = document.getElementById('progress-fill');
    const statusTitle = document.getElementById('status-title');

    // UI Reset
    generateBtn.disabled = true;
    generateBtn.style.opacity = '0.5';
    outputPlaceholder.classList.add('hidden');
    resultContainer.classList.add('hidden');
    statusBox.classList.remove('hidden');

    try {
        progressFill.style.width = '20%';
        statusTitle.innerText = "Uploading Media & Preparing AI Engine...";

        // Convert files to Data URLs
        const photoDataUrl = await fileToDataURL(photoFile);
        const refDataUrl = await fileToDataURL(refFile);

        progressFill.style.width = '50%';
        statusTitle.innerText = "Running LivePortrait Expression Mapping...";

        // Call Vercel Serverless Function
        const response = await fetch('/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                source_image: photoDataUrl,
                driving_video: refDataUrl
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'AI generation failed.');
        }

        progressFill.style.width = '100%';
        statusTitle.innerText = "Finalizing Output Video...";

        const generatedVideoUrl = Array.isArray(data.output_url) ? data.output_url[0] : data.output_url;

        document.getElementById('output-video').src = generatedVideoUrl;
        document.getElementById('download-link').href = generatedVideoUrl;

        statusBox.classList.add('hidden');
        resultContainer.classList.remove('hidden');
        showAdModal();

    } catch (error) {
        alert("Generation Error: " + error.message);
        statusBox.classList.add('hidden');
        outputPlaceholder.classList.remove('hidden');
    } finally {
        generateBtn.disabled = false;
        generateBtn.style.opacity = '1';
    }
}

// Helper function to read file as Data URL
function fileToDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function showAdModal() {
    document.getElementById('ad-modal').classList.remove('hidden');
}

function closeAdModal() {
    document.getElementById('ad-modal').classList.add('hidden');
}

function resetApp() {
    removeFile('photo');
    removeFile('ref');
    document.getElementById('output-placeholder').classList.remove('hidden');
    document.getElementById('result-container').classList.add('hidden');
}
