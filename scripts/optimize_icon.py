from pathlib import Path
from PIL import Image

source = Path('/home/ubuntu/webdev-static-assets/petmed-icon.png')
project = Path('/home/ubuntu/petmed-mobile/assets/images')
image = Image.open(source).convert('RGBA')
image.thumbnail((1024, 1024), Image.Resampling.LANCZOS)
for filename in ('icon.png', 'splash-icon.png', 'favicon.png', 'android-icon-foreground.png'):
    output = project / filename
    image.save(output, format='PNG', optimize=True, compress_level=9)
    print(f'{filename}: {output.stat().st_size} bytes')
