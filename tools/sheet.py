import sys, glob
from PIL import Image
files = sys.argv[2:]
cols = 2; w, h = 960, 540
rows = (len(files) + cols - 1) // cols
sheet = Image.new('RGB', (cols * w, rows * h), 'black')
for i, f in enumerate(files):
    im = Image.open(f).convert('RGB').resize((w, h))
    sheet.paste(im, ((i % cols) * w, (i // cols) * h))
sheet.save(sys.argv[1])
