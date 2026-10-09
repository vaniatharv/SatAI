import io
from pathlib import Path
from typing import Union, Tuple
from PIL import Image
import numpy as np
import torch
import torchvision.transforms as T

from backend.app.config import settings

# ImageNet standard normalization parameters (widely used in LEVIR-CD training)
IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD = [0.229, 0.224, 0.225]


def load_image(image_input: Union[str, Path, bytes, io.BytesIO, Image.Image]) -> Image.Image:
    """
    Loads and decodes any image into an RGB PIL Image.
    Supports PNG, JPG, JPEG, TIFF, GeoTIFF, and memory bytes.
    Validates image integrity and handles color profiles / transparencies.
    """
    if isinstance(image_input, Image.Image):
        img = image_input
    elif isinstance(image_input, (str, Path)):
        img = Image.open(image_input)
    elif isinstance(image_input, (bytes, io.BytesIO)):
        bio = io.BytesIO(image_input) if isinstance(image_input, bytes) else image_input
        img = Image.open(bio)
    else:
        raise ValueError(f"Unsupported image input type: {type(image_input)}")

    # Convert to RGB (discards alpha channel or converts 1-channel / multi-band to standard 3-channel RGB)
    if img.mode != "RGB":
        img = img.convert("RGB")

    return img


def get_transform(
    target_size: Tuple[int, int] = (256, 256),
    normalization: str = "imagenet"
) -> T.Compose:
    """
    Configurable preprocessing transform pipeline.
    
    If your custom .pth model uses different mean/std or resolution,
    adjust normalization parameter or modify transform here.
    """
    transforms_list = [
        T.Resize(target_size, interpolation=T.InterpolationMode.BILINEAR),
        T.ToTensor()
    ]

    if normalization == "imagenet":
        transforms_list.append(T.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD))
    elif normalization == "standard" or normalization == "min_max":
        transforms_list.append(T.Normalize(mean=[0.5, 0.5, 0.5], std=[0.5, 0.5, 0.5]))
    # 'none' keeps [0, 1] ToTensor values

    return T.Compose(transforms_list)


def preprocess_pair(
    before_img: Image.Image,
    after_img: Image.Image,
    target_size: Tuple[int, int] = (256, 256),
    normalization: str = "imagenet"
) -> Tuple[torch.Tensor, torch.Tensor, Tuple[int, int]]:
    """
    Prepares a bitemporal image pair for Siamese model inference.

    Args:
        before_img: PIL Image for T1
        after_img: PIL Image for T2
        target_size: Target (height, width) for model input
        normalization: 'imagenet' | 'standard' | 'none'

    Returns:
        tensor_before: Batch tensor (1, 3, H, W)
        tensor_after: Batch tensor (1, 3, H, W)
        original_size: Tuple of original (width, height)
    """
    orig_size = before_img.size  # (W, H)
    transform = get_transform(target_size=target_size, normalization=normalization)

    t1 = transform(before_img).unsqueeze(0)  # Shape: (1, 3, H, W)
    t2 = transform(after_img).unsqueeze(0)  # Shape: (1, 3, H, W)

    return t1, t2, orig_size
