import torch
import torch.nn as nn
import torchvision.models as models

class RespiratoryDiseaseClassifier(nn.Module):
    def __init__(self, num_classes=3):
        super(RespiratoryDiseaseClassifier, self).__init__()
        
        # Load a pretrained ResNet18 model
        self.resnet = models.resnet18(weights=models.ResNet18_Weights.DEFAULT)
        
        # ResNet18 accepts 3-channel images by default. 
        # Our mel-spectrograms are 1-channel. We can modify the first conv layer.
        original_conv = self.resnet.conv1
        self.resnet.conv1 = nn.Conv2d(1, 64, kernel_size=7, stride=2, padding=3, bias=False)
        
        # Optional: Copy weights from one of the channels of the original pretrained conv1
        # This helps maintain the pretrained benefits even for 1 channel
        with torch.no_grad():
            self.resnet.conv1.weight[:] = original_conv.weight.mean(dim=1, keepdim=True)
            
        # Replace the final fully connected layer to match our num_classes
        num_ftrs = self.resnet.fc.in_features
        
        # We also add Dropout for regularization
        self.resnet.fc = nn.Sequential(
            nn.Dropout(p=0.5),
            nn.Linear(num_ftrs, num_classes)
        )

    def forward(self, x):
        return self.resnet(x)
