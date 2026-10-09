import torch
import torch.nn as nn

class ConvBlock(nn.Module):
    """
    Standard dual-convolution building block with Batch Normalization and ReLU:
    Conv2d(3x3) -> BatchNorm2d -> ReLU -> Conv2d(3x3) -> BatchNorm2d -> ReLU
    """
    def __init__(self, in_channels: int, out_channels: int):
        super().__init__()
        self.block = nn.Sequential(
            nn.Conv2d(in_channels, out_channels, kernel_size=3, padding=1),
            nn.BatchNorm2d(out_channels),
            nn.ReLU(inplace=True),
            nn.Conv2d(out_channels, out_channels, kernel_size=3, padding=1),
            nn.BatchNorm2d(out_channels),
            nn.ReLU(inplace=True)
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.block(x)


class Encoder(nn.Module):
    """
    Siamese Encoder backbone with 4 feature extraction stages and 2x2 MaxPool.
    Channels: 3 -> 64 -> 128 -> 256 -> 512
    Shared between Before (T1) and After (T2) satellite image streams.
    """
    def __init__(self, in_channels: int = 3):
        super().__init__()
        self.enc1 = ConvBlock(in_channels, 64)
        self.enc2 = ConvBlock(64, 128)
        self.enc3 = ConvBlock(128, 256)
        self.enc4 = ConvBlock(256, 512)
        self.pool = nn.MaxPool2d(kernel_size=2, stride=2)

    def forward(self, x: torch.Tensor):
        e1 = self.enc1(x)
        e2 = self.enc2(self.pool(e1))
        e3 = self.enc3(self.pool(e2))
        e4 = self.enc4(self.pool(e3))
        return e1, e2, e3, e4


class DecoderBlock(nn.Module):
    """
    Decoder stage using ConvTranspose2d (up-sampling) followed by concatenation
    with differential skip-connections and dual-convolution refinement.
    """
    def __init__(self, in_channels: int, skip_channels: int, out_channels: int):
        super().__init__()
        self.up = nn.ConvTranspose2d(in_channels, skip_channels, kernel_size=2, stride=2)
        self.conv = ConvBlock(skip_channels + skip_channels, out_channels)

    def forward(self, x: torch.Tensor, skip: torch.Tensor) -> torch.Tensor:
        x = self.up(x)
        x = torch.cat([x, skip], dim=1)
        return self.conv(x)


class SiameseUNet(nn.Module):
    """
    Siamese U-Net architecture for Remote Sensing Change Detection (e.g., LEVIR-CD).

    Flow:
        1. Encodes Before (x1) and After (x2) through identical, weight-shared Siamese encoders.
        2. Computes absolute difference feature maps (|e_i(x1) - e_i(x2)|) across all scale levels.
        3. Decodes differential features through transposed convolutions with skip connections.
        4. Outputs 1-channel change logits at full original resolution.
    """
    def __init__(self, in_channels: int = 3, out_channels: int = 1):
        super().__init__()
        self.encoder = Encoder(in_channels=in_channels)
        self.decoder3 = DecoderBlock(512, 256, 256)
        self.decoder2 = DecoderBlock(256, 128, 128)
        self.decoder1 = DecoderBlock(128, 64, 64)
        self.final = nn.Conv2d(64, out_channels, kernel_size=1)

    def forward(self, x1: torch.Tensor, x2: torch.Tensor) -> torch.Tensor:
        """
        Forward pass for bitemporal satellite image inputs.

        Args:
            x1: Tensor of shape (B, C, H, W) for T1 (Before)
            x2: Tensor of shape (B, C, H, W) for T2 (After)

        Returns:
            Logits tensor of shape (B, 1, H, W).
            Apply torch.sigmoid(output) to obtain change probabilities in [0, 1].
        """
        # Siamese feature extraction
        e1_1, e2_1, e3_1, e4_1 = self.encoder(x1)
        e1_2, e2_2, e3_2, e4_2 = self.encoder(x2)

        # Differential feature calculation
        diff4 = torch.abs(e4_1 - e4_2)
        diff3 = torch.abs(e3_1 - e3_2)
        diff2 = torch.abs(e2_1 - e2_2)
        diff1 = torch.abs(e1_1 - e1_2)

        # Decoder path with skip connections
        d3 = self.decoder3(diff4, diff3)
        d2 = self.decoder2(d3, diff2)
        d1 = self.decoder1(d2, diff1)

        # 1x1 projection to 1-channel binary change logits
        out = self.final(d1)
        return out
