"""
Uka logolari generatori - Uchqun.ai
Purple-Gold gradient, rounded square, white icon symbols
"""
import sys
sys.stdout.reconfigure(encoding='utf-8')
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import os
import math

OUTPUT_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "public", "bots")
os.makedirs(OUTPUT_DIR, exist_ok=True)

SIZE = 512
CORNER_RADIUS = 100

# Bot configs: slug -> emoji symbol
BOTS = {
    "umumiy": "💬",
    "huquqshunos": "⚖️",
    "soliqchi": "🧾",
    "dasturchi": "💻",
    "biznesmen": "📊",
    "ustoz": "📚",
    "psixolog": "🧠",
    "oshpaz": "🍽️",
    "avtomexanik": "🔧",
    "dehqon": "🌾",
    "startupchi": "🚀",
    "santexnik": "🚿",
}

def create_gradient(size, color1, color2):
    """Create diagonal gradient from bottom-left to top-right"""
    img = Image.new("RGB", (size, size))
    pixels = img.load()
    for y in range(size):
        for x in range(size):
            # Diagonal gradient
            t = (x + y) / (2 * size)
            r = int(color1[0] * (1 - t) + color2[0] * t)
            g = int(color1[1] * (1 - t) + color2[1] * t)
            b = int(color1[2] * (1 - t) + color2[2] * t)
            pixels[x, y] = (r, g, b)
    return img

def create_rounded_mask(size, radius):
    """Create rounded rectangle mask"""
    mask = Image.new("L", (size, size), 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle([(0, 0), (size - 1, size - 1)], radius=radius, fill=255)
    return mask

def create_logo(slug, emoji, size=SIZE):
    """Create a single bot logo"""
    # Purple to Gold gradient
    purple = (60, 20, 120)  # Dark purple
    gold = (200, 170, 50)   # Gold

    # Create gradient background
    gradient = create_gradient(size, purple, gold)

    # Apply rounded corners
    mask = create_rounded_mask(size, CORNER_RADIUS)

    # Create final image with transparency
    final = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    gradient_rgba = gradient.convert("RGBA")
    final.paste(gradient_rgba, mask=mask)

    # Draw emoji on top
    draw = ImageDraw.Draw(final)

    # Try to find a good emoji font
    font_paths = [
        "C:/Windows/Fonts/seguiemj.ttf",  # Windows Segoe UI Emoji
        "C:/Windows/Fonts/segoeui.ttf",
        "/usr/share/fonts/truetype/noto/NotoColorEmoji.ttf",
    ]

    font = None
    font_size = int(size * 0.45)

    for fp in font_paths:
        if os.path.exists(fp):
            try:
                font = ImageFont.truetype(fp, font_size)
                break
            except:
                continue

    if font is None:
        font = ImageFont.load_default()

    # Center the emoji
    bbox = draw.textbbox((0, 0), emoji, font=font)
    text_w = bbox[2] - bbox[0]
    text_h = bbox[3] - bbox[1]
    x = (size - text_w) // 2
    y = (size - text_h) // 2 - bbox[1]

    draw.text((x, y), emoji, font=font, fill="white")

    # Save
    output_path = os.path.join(OUTPUT_DIR, f"{slug}.png")
    final.save(output_path, "PNG")
    print(f"✅ {slug}.png saved ({size}x{size})")

# Generate all logos
for slug, emoji in BOTS.items():
    create_logo(slug, emoji)

print(f"\n🎉 {len(BOTS)} ta logo yaratildi: {OUTPUT_DIR}")
