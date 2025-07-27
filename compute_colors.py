from PIL import Image, ImageSequence
import numpy as np
from skimage.color import rgb2lab, lab2rgb
from sklearn.cluster import KMeans
import json
import glob
import pathlib

def rep_colors(path):
    """
    Computes two representative colors from an image file.
    """
    try:
        img = Image.open(path)
        frames = [np.asarray(f.convert("RGBA")) for f in ImageSequence.Iterator(img)]
        rgba = np.concatenate(frames, axis=0)
    except Exception as e:
        print(f"Warning: Could not read {path}. Skipping. Error: {e}")
        return None, None

    opaque = rgba[rgba[..., 3] > 32]
    if opaque.shape[0] < 2:
        print(f"Warning: Not enough opaque pixels in {path}. Skipping.")
        return None, None

    opaque_rgb = opaque[..., :3] / 255.0
    lab = rgb2lab(opaque_rgb.reshape(-1, 3))

    try:
        km = KMeans(n_clusters=2, n_init='auto', random_state=0).fit(lab)
    except ValueError:
        print(f"Warning: KMeans failed for {path}. Skipping.")
        return None, None
        
    counts = np.bincount(km.labels_)
    w = counts / counts.sum()
    return km.cluster_centers_, w

def main():
    """
    Processes all sprite sheets to find representative colors and saves them to a JSON file.
    """
    assets = {}
    for p in glob.glob("spritesheets/*.png"):
        cs, w = rep_colors(p)
        if cs is None:
            continue

        sprite_id = pathlib.Path(p).stem
        
        if w[0] > w[1]:
            primary_color_lab = cs[0]
            secondary_color_lab = cs[1]
        else:
            primary_color_lab = cs[1]
            secondary_color_lab = cs[0]

        primary_color_rgb = (lab2rgb(primary_color_lab.reshape(1, 1, 3)).reshape(3) * 255).astype(int)
        secondary_color_rgb = (lab2rgb(secondary_color_lab.reshape(1, 1, 3)).reshape(3) * 255).astype(int)

        assets[sprite_id] = {
            "primary_lab": primary_color_lab.tolist(),
            "secondary_lab": secondary_color_lab.tolist(),
            "primary_rgb": primary_color_rgb.tolist(),
            "secondary_rgb": secondary_color_rgb.tolist(),
        }

    pathlib.Path("colors.json").write_text(json.dumps(assets, indent=2))
    print("Pre-computed colors for", len(assets), "sprites.")

if __name__ == "__main__":
    main() 