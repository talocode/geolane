#!/usr/bin/env python3
"""Generate geolane-demo.mp4 — terminal-style product demo."""
import os
import subprocess
import sys

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    subprocess.check_call([sys.executable, "-m", "pip", "install", "pillow", "--break-system-packages", "-q"])
    from PIL import Image, ImageDraw, ImageFont

W, H = 1280, 720
FPS = 15
FONT_PATHS = [
    "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf",
    "/usr/share/fonts/truetype/noto/NotoSansMono-Regular.ttf",
]
FONT = next((p for p in FONT_PATHS if os.path.exists(p)), None)
FONTSIZE = 22
font = ImageFont.truetype(FONT, FONTSIZE) if FONT else ImageFont.load_default()
title_font = ImageFont.truetype(FONT, 32) if FONT else font

OUT_DIR = "/tmp/geolane-frames"
os.makedirs(OUT_DIR, exist_ok=True)

# (text, color_rgb)
SCRIPT = [
    ("", (180, 180, 190)),
    ("  GeoLane  v0.1.1", (120, 220, 255)),
    ("  AI Search Visibility Intelligence", (180, 200, 255)),
    ("  github.com/talocode/geolane  ·  npm i @talocode/geolane", (140, 140, 160)),
    ("", (180, 180, 190)),
    ("$ geolane audit --url https://example.com", (80, 220, 140)),
    ("", (180, 180, 190)),
    ('  {', (210, 210, 220)),
    ('    "score": 72,', (255, 220, 100)),
    ('    "grade": "C",', (255, 220, 100)),
    ('    "summary": "GEO score 72/100. Crawler access 16/16.",', (210, 210, 220)),
    ('    "crawlers": { "allowed": 16, "blocked": 0, "accessRate": 100 },', (180, 220, 255)),
    ('    "citation": { "score": 58, "grade": "D" },', (200, 180, 255)),
    ('    "llmsTxt": { "exists": false, "score": 0 },', (255, 160, 160)),
    ('    "actions": [', (210, 210, 220)),
    ('      { "priority": "high", "title": "Publish /llms.txt" },', (255, 180, 100)),
    ('      { "priority": "medium", "title": "Add JSON-LD structured data" }', (255, 180, 100)),
    ("    ]", (210, 210, 220)),
    ("  }", (210, 210, 220)),
    ("", (180, 180, 190)),
    ("$ geolane crawlers --url https://example.com", (80, 220, 140)),
    ("  GPTBot ✓  ClaudeBot ✓  PerplexityBot ✓  Google-Extended ✓", (80, 220, 140)),
    ("", (180, 180, 190)),
    ("$ geolane llms-txt --url https://example.com", (80, 220, 140)),
    ("  draft ready → publish to /llms.txt for AI agents", (120, 220, 255)),
    ("", (180, 180, 190)),
    ("  ────────────────────────────────────────────", (100, 100, 120)),
    ("  npm install -g @talocode/geolane", (255, 255, 255)),
    ("  Works on Linux · macOS · Windows · Android · iOS (Node)", (180, 200, 220)),
    ("  Cloud: POST /v1/geolane/audit  ·  40 credits", (160, 180, 200)),
    ("  ────────────────────────────────────────────", (100, 100, 120)),
]


def render(up_to: int) -> Image.Image:
    img = Image.new("RGB", (W, H), (12, 14, 22))
    draw = ImageDraw.Draw(img)
    # top bar
    draw.rectangle([0, 0, W, 48], fill=(22, 28, 42))
    draw.text((24, 10), "● ● ●   geolane — AI visibility terminal", font=font, fill=(120, 130, 150))
    y = 70
    for i, (text, color) in enumerate(SCRIPT):
        if i > up_to:
            break
        draw.text((32, y), text, font=font, fill=color)
        y += 28
    return img


frame_idx = 0
for current in range(len(SCRIPT)):
    for _ in range(4):  # hold each line
        render(current).save(f"{OUT_DIR}/frame_{frame_idx:05d}.png")
        frame_idx += 1

# hold final
for _ in range(FPS * 3):
    render(len(SCRIPT) - 1).save(f"{OUT_DIR}/frame_{frame_idx:05d}.png")
    frame_idx += 1

print(f"Generated {frame_idx} frames", file=sys.stderr)

out_mp4 = os.environ.get("GEOLANE_DEMO_OUT", os.path.join(os.path.dirname(__file__), "..", "release-assets", "geolane-demo.mp4"))
os.makedirs(os.path.dirname(os.path.abspath(out_mp4)), exist_ok=True)

cmd = [
    "ffmpeg", "-y",
    "-framerate", str(FPS),
    "-i", f"{OUT_DIR}/frame_%05d.png",
    "-c:v", "libx264",
    "-pix_fmt", "yuv420p",
    "-crf", "23",
    "-movflags", "+faststart",
    out_mp4,
]
subprocess.check_call(cmd)
print(out_mp4)
