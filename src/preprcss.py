import cv2 as cv
import numpy as np
import imutils
import inspect
import sys
import os
import matplotlib.pyplot as plt
from skimage.morphology import skeletonize
from skimage.filters import threshold_otsu
from skimage import img_as_ubyte


def deskew(img, max_skew=5.0):
    """
    Detects skew angle and rotates image to correct it.
    If absolute angle below max_skew degrees, skips rotation to avoid over-correction.
    """
    coords = np.column_stack(np.where(img < 255))
    rect = cv.minAreaRect(coords)
    angle = rect[-1]
    # normalize angle
    if angle < -45:
        angle = -(90 + angle)
    else:
        angle = -angle
    # skip small skews
    if abs(angle) < max_skew:
        return img, 0.0
    (h, w) = img.shape[:2]
    M = cv.getRotationMatrix2D((w // 2, h // 2), angle, 1.0)
    rotated = cv.warpAffine(img, M, (w, h), flags=cv.INTER_CUBIC, borderMode=cv.BORDER_REPLICATE)
    return rotated, angle


def enhance_contrast_gray(gray):
    clahe = cv.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    return clahe.apply(gray)


def boundaryBox(img):
    try:
        h, w = img.shape[:2]
        # find boundaries
        top = next((y for y in range(h) if 0 in img[y]), 0)
        bottom = next((y for y in range(h-1, -1, -1) if 0 in img[y]), h-1)
        left = next((x for x in range(w) if 0 in img[:, x]), 0)
        right = next((x for x in range(w-1, -1, -1) if 0 in img[:, x]), w-1)
        return top, bottom, left, right
    except Exception as e:
        print(f"Error in boundaryBox: {e}")
        raise


def preprocess(img_path,
               output_size=(256, 256),
               deskew_enabled=True,
               max_skew=5.0):
    """
    Advanced preprocessing for signature verification:
      - Load & grayscale
      - Optional deskew (skips if |angle|<max_skew)
      - Resize to height=720
      - CLAHE contrast
      - Gaussian blur
      - Adaptive thresholding
      - Morphological cleanup
      - Crop to signature
      - Skeletonize
      - Normalize size
    Returns all intermediate steps and the detected skew angle.
    """
    img = cv.imread(img_path)
    if img is None:
        raise FileNotFoundError(f"Cannot read image {img_path}")

    gray = cv.cvtColor(img, cv.COLOR_BGR2GRAY)

    angle = 0.0
    if deskew_enabled:
        gray, angle = deskew(gray, max_skew)

    gray = imutils.resize(gray, height=720)
    gray = enhance_contrast_gray(gray)
    blur = cv.GaussianBlur(gray, (5, 5), 0)

    binary = cv.adaptiveThreshold(
        blur, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv.THRESH_BINARY_INV, 21, 15
    )
    kernel = cv.getStructuringElement(cv.MORPH_RECT, (3, 3))
    clean = cv.morphologyEx(binary, cv.MORPH_OPEN, kernel, iterations=1)
    clean = cv.morphologyEx(clean, cv.MORPH_CLOSE, kernel, iterations=2)

    top, bottom, left, right = boundaryBox(clean)
    signature = clean[top:bottom, left:right]

    sig_u8 = img_as_ubyte(signature > 0)
    skeleton = skeletonize(sig_u8 // 255)
    skeleton = img_as_ubyte(skeleton)

    final = cv.resize(skeleton, output_size, interpolation=cv.INTER_AREA)

    return {
        'original': img,
        'gray': gray,
        'binary': binary,
        'clean': clean,
        'signature': signature,
        'skeleton': skeleton,
        'final': final,
        'skew_angle': angle
    }


def show_results(img_path, deskew_enabled=True, max_skew=5.0, save_final=True):
    results = preprocess(img_path,
                         deskew_enabled=deskew_enabled,
                         max_skew=max_skew)

    # Save final image
    if save_final:
        script_dir = os.path.dirname(os.path.abspath(__file__))
        save_path = os.path.join(script_dir, 'final_signature.png')
        cv.imwrite(save_path, results['final'])
        print(f"Saved final normalized skeleton to: {save_path}")

    keys = ['original', 'gray', 'binary', 'clean', 'signature', 'skeleton', 'final']
    titles = ['Original',
              f'Grayscale{(" & Deskewed" if deskew_enabled and results["skew_angle"]!=0 else "")}',
              'Binary', 'Cleaned', 'Cropped', 'Skeleton', 'Normalized']

    plt.figure(figsize=(14, 8))
    for i, (key, title) in enumerate(zip(keys, titles), 1):
        plt.subplot(2, 4, i)
        plt.title(title)
        plt.axis('off')
        im = results[key]
        if im.ndim == 2:
            plt.imshow(im, cmap='gray')
        else:
            plt.imshow(cv.cvtColor(im, cv.COLOR_BGR2RGB))
    plt.tight_layout()
    plt.show()


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python script.py <image_path> [--no-deskew]")
    else:
        deskew_flag = '--no-deskew' not in sys.argv
        show_results(sys.argv[1], deskew_enabled=deskew_flag)
