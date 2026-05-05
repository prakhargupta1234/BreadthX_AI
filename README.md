# BreatheX AI — Intelligent Respiratory Disease Classifier

BreatheX AI is a premium, medical-grade AI platform that utilizes deep learning to analyze cough audio samples and classify respiratory conditions like **Asthma** and **COPD** with high confidence.

## 🚀 Features
- **Real-time Audio Analysis**: Instant processing of cough samples.
- **Official Clinical Reports**: Professional, printable reports with probability breakdowns.
- **Interactive Dashboard**: Track your respiratory health history over time.
- **Premium UI**: Glassmorphism-inspired design with immersive animations.

---

## 🧠 Internal Working & ML Pipeline

### 1. Signal Acquisition
The system accepts standard WAV audio files. Upon upload, the backend utilizes the **Librosa** library to load and resample the signal to a consistent **16,000 Hz**.

### 2. Feature Engineering (Mel-Spectrograms)
Raw audio is converted into a visual representation of frequency over time:
- **Transform**: Torchaudio Mel-Spectrogram.
- **Parameters**: 128 mel bins, 1024 FFT window size, 512 hop length.
- **Normalization**: Converted to Log-scale (Decibels) to mimic human hearing and improve neural network convergence.

### 3. Temporal Standardization
To ensure consistency across variable recording lengths, all spectrograms are padded or truncated to a fixed width of **400 temporal frames** (~12.8 seconds).

### 4. Neural Network Architecture
The core engine is a **modified ResNet18** (Residual Neural Network):
- **Input**: 1-channel grayscale spectrogram image (128x400).
- **Residual Blocks**: Uses skip connections to train deep layers effectively without gradient vanishing issues.
- **Global Average Pooling**: Reduces spatial dimensions while preserving the most critical features.
- **Final Layer**: A 3-class linear head with **Dropout (0.5)** for robust generalization.

### 5. Inference & Probability
The model outputs raw logits which are passed through a **Softmax** function to generate a probability distribution (0-100%) for:
- **Healthy**
- **Asthma**
- **COPD**

---

## 🛠️ Technology Stack
- **Frontend**: React, Framer Motion, Lucide React, Tailwind CSS.
- **Backend**: FastAPI (Python), Uvicorn.
- **Database**: MySQL.
- **Deep Learning**: PyTorch, Torchaudio, Librosa.

---

## 📁 Project Structure
- `/frontend`: Vite-based React application.
- `/backend`: FastAPI server and database logic.
- `/ml`: Model definition, training scripts, and inference engine.
- `/uploads`: Temporary storage for processed audio.

---

## 🛡️ Security
- **Authentication**: JWT-based secure sessions.
- **Password Hashing**: Industry-standard Argon2/Bcrypt hashing.
- **Data Privacy**: Encrypted communication between client and server.

---

Developed by **BreatheX AI Team** © 2026.
