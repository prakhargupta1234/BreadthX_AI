document.addEventListener('DOMContentLoaded', () => {
    // Tab Switching
    const tabUpload = document.getElementById('tab-upload');
    const tabRecord = document.getElementById('tab-record');
    const contentUpload = document.getElementById('content-upload');
    const contentRecord = document.getElementById('content-record');

    tabUpload.addEventListener('click', () => switchTab('upload'));
    tabRecord.addEventListener('click', () => switchTab('record'));

    function switchTab(tab) {
        if (tab === 'upload') {
            tabUpload.classList.add('active');
            tabRecord.classList.remove('active');
            contentUpload.classList.add('active');
            contentRecord.classList.remove('active');
        } else {
            tabRecord.classList.add('active');
            tabUpload.classList.remove('active');
            contentRecord.classList.add('active');
            contentUpload.classList.remove('active');
        }
        resetState();
    }

    // State
    let selectedFile = null;
    let mediaRecorder = null;
    let audioChunks = [];
    let isRecording = false;
    let recordInterval = null;
    let recordSeconds = 0;

    const submitBtn = document.getElementById('submit-btn');
    const loadingEl = document.getElementById('loading');
    const resultsEl = document.getElementById('results');

    function resetState() {
        selectedFile = null;
        audioChunks = [];
        submitBtn.disabled = true;
        document.getElementById('file-name-display').textContent = '';
        document.getElementById('file-input').value = '';
        document.getElementById('audio-preview').classList.add('hidden');
        resultsEl.classList.add('hidden');
    }

    // --- Upload Logic ---
    const dropArea = document.getElementById('drop-area');
    const fileInput = document.getElementById('file-input');
    const fileNameDisplay = document.getElementById('file-name-display');

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, () => dropArea.classList.add('dragover'), false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, () => dropArea.classList.remove('dragover'), false);
    });

    dropArea.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files);
    });

    fileInput.addEventListener('change', function() {
        handleFiles(this.files);
    });

    function handleFiles(files) {
        if (files.length > 0) {
            const file = files[0];
            if (file.type.startsWith('audio/')) {
                selectedFile = file;
                fileNameDisplay.textContent = `Selected: ${file.name}`;
                submitBtn.disabled = false;
            } else {
                alert('Please upload a valid audio file.');
            }
        }
    }

    // --- Recording Logic ---
    const micBtn = document.getElementById('mic-btn');
    const recordStatus = document.getElementById('record-status');
    const recordTimer = document.getElementById('record-timer');
    const audioPreview = document.getElementById('audio-preview');

    micBtn.addEventListener('click', async () => {
        if (!isRecording) {
            startRecording();
        } else {
            stopRecording();
        }
    });

    async function startRecording() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);
            audioChunks = [];

            mediaRecorder.ondataavailable = e => {
                if (e.data.size > 0) {
                    audioChunks.push(e.data);
                }
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                
                try {
                    // Convert WebM to WAV natively in the browser
                    const arrayBuffer = await audioBlob.arrayBuffer();
                    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
                    
                    const wavBlob = bufferToWave(audioBuffer, audioBuffer.length);
                    selectedFile = new File([wavBlob], "recording.wav", { type: 'audio/wav' });
                    
                    const audioUrl = URL.createObjectURL(wavBlob);
                    audioPreview.src = audioUrl;
                    audioPreview.classList.remove('hidden');
                    
                    submitBtn.disabled = false;
                } catch (e) {
                    console.error("Error converting audio to WAV:", e);
                    alert("Failed to process recording. Please try again.");
                }

                stream.getTracks().forEach(track => track.stop()); // release mic
            };

            mediaRecorder.start();
            isRecording = true;
            micBtn.classList.add('recording');
            recordStatus.textContent = "Recording...";
            recordTimer.classList.remove('hidden');
            
            recordSeconds = 0;
            updateTimerDisplay();
            recordInterval = setInterval(() => {
                recordSeconds++;
                updateTimerDisplay();
            }, 1000);

            resultsEl.classList.add('hidden');
        } catch (err) {
            console.error("Error accessing microphone:", err);
            alert("Could not access the microphone. Please check permissions.");
        }
    }

    function stopRecording() {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
            isRecording = false;
            micBtn.classList.remove('recording');
            recordStatus.textContent = "Recording complete. You can play back or submit.";
            clearInterval(recordInterval);
        }
    }

    function updateTimerDisplay() {
        const mins = Math.floor(recordSeconds / 60).toString().padStart(2, '0');
        const secs = (recordSeconds % 60).toString().padStart(2, '0');
        recordTimer.textContent = `${mins}:${secs}`;
    }

    // --- Submit Logic ---
    submitBtn.addEventListener('click', async () => {
        if (!selectedFile) return;

        const formData = new FormData();
        formData.append('file', selectedFile);

        submitBtn.disabled = true;
        loadingEl.classList.remove('hidden');
        resultsEl.classList.add('hidden');

        try {
            const response = await fetch('/predict', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Server error occurred');
            }

            displayResults(data);
        } catch (error) {
            alert('Error: ' + error.message);
            submitBtn.disabled = false;
        } finally {
            loadingEl.classList.add('hidden');
        }
    });

    function displayResults(data) {
        // Set Main Prediction
        const predDisease = document.getElementById('pred-disease');
        const predConfidence = document.getElementById('pred-confidence');
        
        predDisease.textContent = data.prediction;
        
        const confPercent = (data.confidence * 100).toFixed(1);
        predConfidence.textContent = `${confPercent}%`;
        
        // Color badge based on confidence and disease
        if (data.prediction === 'Healthy') {
            predConfidence.style.color = 'var(--success)';
            predConfidence.style.background = 'rgba(16, 185, 129, 0.2)';
            predConfidence.style.borderColor = 'rgba(16, 185, 129, 0.5)';
        } else {
            predConfidence.style.color = 'var(--warning)';
            predConfidence.style.background = 'rgba(245, 158, 11, 0.2)';
            predConfidence.style.borderColor = 'rgba(245, 158, 11, 0.5)';
        }

        // Generate Bars
        const container = document.getElementById('bars-container');
        container.innerHTML = '';

        // Sort probabilities
        const sortedProbs = Object.entries(data.all_probabilities)
            .sort((a, b) => b[1] - a[1]);

        sortedProbs.forEach(([disease, prob]) => {
            const percent = (prob * 100).toFixed(1);
            
            const row = document.createElement('div');
            row.className = 'bar-row';
            
            let barColor = 'var(--accent)';
            if (disease === data.prediction) {
                barColor = disease === 'Healthy' ? 'var(--success)' : 'var(--warning)';
            }
            
            row.innerHTML = `
                <div class="bar-label">
                    <span>${disease}</span>
                    <span>${percent}%</span>
                </div>
                <div class="bar-bg">
                    <div class="bar-fill" style="width: 0%; background: ${barColor}"></div>
                </div>
            `;
            container.appendChild(row);

            // Animate bar
            setTimeout(() => {
                row.querySelector('.bar-fill').style.width = `${percent}%`;
            }, 50);
        });

        resultsEl.classList.remove('hidden');
        submitBtn.disabled = false;
    }

    // Helper function to encode AudioBuffer to WAV
    function bufferToWave(abuffer, len) {
      let numOfChan = abuffer.numberOfChannels,
          length = len * numOfChan * 2 + 44,
          buffer = new ArrayBuffer(length),
          view = new DataView(buffer),
          channels = [], i, sample,
          offset = 0,
          pos = 0;

      function setUint16(data) {
        view.setUint16(pos, data, true);
        pos += 2;
      }

      function setUint32(data) {
        view.setUint32(pos, data, true);
        pos += 4;
      }

      setUint32(0x46464952);                         // "RIFF"
      setUint32(length - 8);                         // file length - 8
      setUint32(0x45564157);                         // "WAVE"
      setUint32(0x20746d66);                         // "fmt " chunk
      setUint32(16);                                 // length = 16
      setUint16(1);                                  // PCM (uncompressed)
      setUint16(numOfChan);
      setUint32(abuffer.sampleRate);
      setUint32(abuffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
      setUint16(numOfChan * 2);                      // block-align
      setUint16(16);                                 // 16-bit

      setUint32(0x61746164);                         // "data" - chunk
      setUint32(length - pos - 4);                   // chunk length

      for(i = 0; i < abuffer.numberOfChannels; i++)
        channels.push(abuffer.getChannelData(i));

      while(pos < length) {
        for(i = 0; i < numOfChan; i++) {
          sample = Math.max(-1, Math.min(1, channels[i][offset])); 
          sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767)|0; 
          view.setInt16(pos, sample, true);          
          pos += 2;
        }
        offset++;
      }

      return new Blob([buffer], {type: "audio/wav"});
    }
});
