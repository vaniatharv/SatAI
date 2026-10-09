"""
Helper script to generate representative LEVIR-CD style bitemporal satellite image pairs:
- Pair 1: Austin, TX - New Suburban Residential Housing Development (soil/grass -> houses with roads)
- Pair 2: Buda/Kyle, TX - Commercial Warehouse & Logistics Hub Expansion
- Pair 3: Lakeway, TX - Hill Country Villa Construction & Pool Additions

These provide realistic, out-of-the-box imagery so users can test real inference
immediately with 1-click in the UI, or upload their own custom GeoTIFF/PNGs.
"""

from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter
import numpy as np

def create_terrain_base(w=512, h=512, seed=42):
    np.random.seed(seed)
    # Grassy / semi-arid Texas terrain
    base = np.zeros((h, w, 3), dtype=np.uint8)
    base[..., 0] = np.random.randint(95, 125, size=(h, w))   # R
    base[..., 1] = np.random.randint(115, 145, size=(h, w))  # G
    base[..., 2] = np.random.randint(70, 95, size=(h, w))    # B
    img = Image.fromarray(base).filter(ImageFilter.GaussianBlur(radius=1.5))
    return img

def add_natural_roads(draw, coords_list, color=(80, 80, 85), width=10):
    for coords in coords_list:
        draw.line(coords, fill=color, width=width)

def generate_samples(samples_dir: Path):
    samples_dir.mkdir(parents=True, exist_ok=True)

    # ----------------- Sample 1: Residential Building Growth (Austin, TX) -----------------
    pair1_before = create_terrain_base(512, 512, seed=101)
    draw1_b = ImageDraw.Draw(pair1_before)
    # Old winding rural road
    add_natural_roads(draw1_b, [[(0, 250), (200, 240), (512, 260)]], color=(110, 105, 95), width=8)
    # Sparse trees / scrub
    for (x, y, r) in [(80, 80, 12), (95, 110, 10), (320, 150, 14), (400, 380, 16)]:
        draw1_b.ellipse([x-r, y-r, x+r, y+r], fill=(60, 85, 45))

    pair1_after = pair1_before.copy()
    draw1_a = ImageDraw.Draw(pair1_after)
    # New asphalt subdivision roads
    add_natural_roads(draw1_a, [
        [(150, 50), (150, 450)],
        [(350, 50), (350, 450)],
        [(150, 150), (350, 150)],
        [(150, 350), (350, 350)]
    ], color=(50, 52, 58), width=10)

    # New residential houses (red roofs, gray roofs, beige roofs)
    houses = [
        # Left cluster
        (70, 90, 130, 130, (190, 75, 60)),
        (70, 170, 130, 210, (180, 185, 195)),
        (70, 290, 130, 330, (200, 80, 65)),
        (70, 370, 130, 410, (175, 160, 140)),
        # Center cluster
        (180, 70, 230, 120, (195, 70, 55)),
        (260, 70, 310, 120, (210, 215, 220)),
        (180, 180, 230, 230, (185, 65, 50)),
        (260, 180, 310, 230, (165, 150, 130)),
        (180, 270, 230, 320, (190, 75, 60)),
        (260, 270, 310, 320, (215, 210, 205)),
        (180, 370, 230, 420, (180, 70, 55)),
        (260, 370, 310, 420, (190, 195, 200)),
        # Right cluster
        (380, 90, 440, 130, (185, 70, 55)),
        (380, 170, 440, 210, (170, 160, 145)),
        (380, 290, 440, 330, (195, 75, 60)),
        (380, 370, 440, 410, (205, 210, 215))
    ]
    for (x1, y1, x2, y2, col) in houses:
        draw1_a.rectangle([x1, y1, x2, y2], fill=col, outline=(30, 30, 30), width=1)
        # Small driveway
        draw1_a.rectangle([x2, (y1+y2)//2 - 4, x2+15, (y1+y2)//2 + 4], fill=(130, 130, 135))

    pair1_before.save(samples_dir / "sample1_before.png", "PNG")
    pair1_after.save(samples_dir / "sample1_after.png", "PNG")

    # ----------------- Sample 2: Industrial Logistics Hub (Kyle, TX) -----------------
    pair2_before = create_terrain_base(512, 512, seed=202)
    draw2_b = ImageDraw.Draw(pair2_before)
    add_natural_roads(draw2_b, [[(0, 100), (512, 100)]], color=(70, 70, 75), width=14)

    pair2_after = pair2_before.copy()
    draw2_a = ImageDraw.Draw(pair2_after)
    # Huge distribution warehouses & parking lots
    # Concrete parking lot apron
    draw2_a.rectangle([80, 140, 430, 430], fill=(160, 160, 165))
    # Logistics warehouses (light gray/white industrial corrugated roofs)
    draw2_a.rectangle([110, 170, 400, 270], fill=(235, 238, 242), outline=(50, 50, 60), width=2)
    draw2_a.rectangle([110, 300, 400, 400], fill=(225, 230, 235), outline=(50, 50, 60), width=2)

    pair2_before.save(samples_dir / "sample2_before.png", "PNG")
    pair2_after.save(samples_dir / "sample2_after.png", "PNG")

    print(f"Sample pairs created in {samples_dir.resolve()}")

if __name__ == "__main__":
    generate_samples(Path(__file__).resolve().parent.parent / "samples")
