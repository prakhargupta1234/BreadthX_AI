import os
import glob
import pandas as pd
import librosa
import numpy as np
import torch
from torch.utils.data import Dataset

import torchaudio.transforms as T

class RespiratoryDataset(Dataset):
    def __init__(self, data_dir, metadata_file, target_sr=16000, max_pad_len=400, augment=False):
        """
        data_dir: directory containing patient folders
        metadata_file: CSV file containing candidateID and disease label
        augment: Whether to apply SpecAugment data augmentation
        """
        self.data_dir = data_dir
        self.metadata = pd.read_csv(metadata_file)
        self.target_sr = target_sr
        self.max_pad_len = max_pad_len
        self.augment = augment
        
        # SpecAugment transforms
        self.time_masking = T.TimeMasking(time_mask_param=40)
        self.freq_masking = T.FrequencyMasking(freq_mask_param=15)
        
        # Mapping based on user request (0=Healthy, 1=Asthma, 2=COPD)
        self.classes = ['Healthy', 'Asthma', 'COPD']
        
        # Filter metadata to ensure candidate folders actually exist and are not empty
        valid_rows = []
        for idx, row in self.metadata.iterrows():
            candidate_id = str(row['candidateID']).strip()
            cough_path = os.path.join(self.data_dir, candidate_id, "cough.wav")
            # A valid WAV file must be > 44 bytes (44 bytes is just the empty header)
            if os.path.exists(cough_path) and os.path.getsize(cough_path) > 44:
                valid_rows.append(row)
                
        if valid_rows:
            self.metadata = pd.DataFrame(valid_rows).reset_index(drop=True)
            print(f"Found {len(self.metadata)} valid audio samples.")
        else:
            print("Warning: No valid audio samples found.")
            
    def __len__(self):
        return len(self.metadata)

    def extract_features(self, file_path):
        try:
            import torchaudio
            import librosa
            
            # Use librosa to load to bypass Windows FFmpeg/torchcodec missing DLL issues
            # librosa safely uses soundfile and handles resampling to target_sr automatically
            audio_np, sr = librosa.load(file_path, sr=self.target_sr)
            
            # Convert to PyTorch tensor [channels, time]
            waveform = torch.tensor(audio_np, dtype=torch.float32).unsqueeze(0)
                
            # Extract Mel-spectrogram purely using PyTorch (fast)
            mel_transform = torchaudio.transforms.MelSpectrogram(
                sample_rate=self.target_sr, n_mels=128, n_fft=1024, hop_length=512
            )
            mel_spec = mel_transform(waveform)
            
            # Convert to log scale (dB)
            db_transform = torchaudio.transforms.AmplitudeToDB(stype='power', top_db=80)
            log_mel_spec = db_transform(mel_spec)
            
            # Squeeze channel dim to match old shape: (128, time)
            log_mel_spec = log_mel_spec.squeeze(0)
            
            # Pad or truncate to max_pad_len
            if log_mel_spec.shape[1] > self.max_pad_len:
                log_mel_spec = log_mel_spec[:, :self.max_pad_len]
            else:
                pad_width = self.max_pad_len - log_mel_spec.shape[1]
                # Pad expects (pad_left, pad_right, pad_top, pad_bottom) for 2D
                log_mel_spec = torch.nn.functional.pad(log_mel_spec, (0, pad_width))
                
            tensor_spec = log_mel_spec
            
            if self.augment:
                # Add channel dim for masking
                tensor_spec = tensor_spec.unsqueeze(0)
                tensor_spec = self.freq_masking(tensor_spec)
                tensor_spec = self.time_masking(tensor_spec)
                tensor_spec = tensor_spec.squeeze(0)
                
            return tensor_spec
        except Exception as e:
            print(f"Error processing {file_path}: {e}")
            return None

    def __getitem__(self, idx):
        row = self.metadata.iloc[idx]
        candidate_id = str(row['candidateID']).strip()
        
        # We'll use cough.wav for the analysis
        file_path = os.path.join(self.data_dir, candidate_id, "cough.wav")
        
        label = int(row['disease'])
        
        features = self.extract_features(file_path)
        
        if features is None:
            # Return dummy if failed
            features = torch.zeros((128, self.max_pad_len), dtype=torch.float32)
            
        # Add channel dimension: (1, 128, max_pad_len)
        features = features.unsqueeze(0)
        
        return features.clone().detach(), torch.tensor(label, dtype=torch.long)
