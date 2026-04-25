import os
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, Subset
from sklearn.model_selection import train_test_split
import numpy as np

from model import RespiratoryDiseaseClassifier
from dataset import RespiratoryDataset

def train_model(data_dir, metadata_file, num_epochs=30, batch_size=32, learning_rate=0.001):
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Using device: {device}")

    # To apply augmentation only to training data, we create two dataset objects
    full_dataset_train = RespiratoryDataset(data_dir=data_dir, metadata_file=metadata_file, augment=True)
    full_dataset_val = RespiratoryDataset(data_dir=data_dir, metadata_file=metadata_file, augment=False)
    
    if len(full_dataset_train) == 0:
        print("Dataset is empty. Check your data directory and metadata file.")
        return

    print(f"Total dataset size: {len(full_dataset_train)}")
    
    # Train/Val split indices
    indices = list(range(len(full_dataset_train)))
    
    # We can stratify by labels to handle class imbalance during split
    labels = [int(row['disease']) for _, row in full_dataset_train.metadata.iterrows()]
    
    train_indices, val_indices = train_test_split(indices, test_size=0.2, stratify=labels, random_state=42)

    train_dataset = Subset(full_dataset_train, train_indices)
    val_dataset = Subset(full_dataset_val, val_indices)

    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True, num_workers=4, pin_memory=True, persistent_workers=True)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False, num_workers=4, pin_memory=True, persistent_workers=True)

    # Class Weights for CrossEntropyLoss
    # Counts based on your data: 140 (Healthy), 238 (Asthma), 168 (COPD)
    # Weights = total_samples / (num_classes * class_samples)
    total = len(full_dataset_train)
    weights = [total / (3 * 140), total / (3 * 238), total / (3 * 168)]
    class_weights = torch.tensor(weights, dtype=torch.float32).to(device)

    # Initialize Model, Loss, Optimizer, Scheduler
    model = RespiratoryDiseaseClassifier(num_classes=3).to(device)
    criterion = nn.CrossEntropyLoss(weight=class_weights)
    optimizer = optim.Adam(model.parameters(), lr=learning_rate, weight_decay=1e-4) # added L2 regularization
    scheduler = optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode='min', factor=0.5, patience=3)

    best_val_loss = float('inf')
    early_stop_patience = 8
    patience_counter = 0

    # Training Loop
    for epoch in range(num_epochs):
        model.train()
        running_loss = 0.0
        correct = 0
        total_samples = 0

        for inputs, batch_labels in train_loader:
            inputs, batch_labels = inputs.to(device), batch_labels.to(device)

            optimizer.zero_grad()
            outputs = model(inputs)
            loss = criterion(outputs, batch_labels)
            
            loss.backward()
            optimizer.step()

            running_loss += loss.item() * inputs.size(0)
            _, predicted = torch.max(outputs, 1)
            total_samples += batch_labels.size(0)
            correct += (predicted == batch_labels).sum().item()

        epoch_loss = running_loss / len(train_dataset)
        epoch_acc = correct / total_samples

        # Validation Loop
        model.eval()
        val_loss = 0.0
        val_correct = 0
        val_total = 0
        with torch.no_grad():
            for inputs, batch_labels in val_loader:
                inputs, batch_labels = inputs.to(device), batch_labels.to(device)
                outputs = model(inputs)
                loss = criterion(outputs, batch_labels)
                
                val_loss += loss.item() * inputs.size(0)
                _, predicted = torch.max(outputs, 1)
                val_total += batch_labels.size(0)
                val_correct += (predicted == batch_labels).sum().item()

        val_loss = val_loss / len(val_dataset)
        val_acc = val_correct / val_total
        
        # Step the scheduler
        scheduler.step(val_loss)

        print(f"Epoch {epoch+1}/{num_epochs} - "
              f"Train Loss: {epoch_loss:.4f}, Train Acc: {epoch_acc:.4f} - "
              f"Val Loss: {val_loss:.4f}, Val Acc: {val_acc:.4f}")

        # Save best model and Early Stopping
        if val_loss < best_val_loss:
            best_val_loss = val_loss
            torch.save(model.state_dict(), "disease_classifier.pth")
            print("  --> Saved best model checkpoint")
            patience_counter = 0
        else:
            patience_counter += 1
            
        if patience_counter >= early_stop_patience:
            print("Early stopping triggered! Validation loss hasn't improved for several epochs.")
            break

if __name__ == "__main__":
    # Update these paths once you download the dataset
    DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "airs-ai-in-respiratory-sounds", "sounds", "sounds")
    METADATA_FILE = os.path.join(os.path.dirname(__file__), "..", "airs-ai-in-respiratory-sounds", "train.csv")
    
    if not os.path.exists(METADATA_FILE):
        print(f"Please place your dataset metadata at {METADATA_FILE} and audio in {DATA_DIR}")
    else:
        train_model(data_dir=DATA_DIR, metadata_file=METADATA_FILE)
