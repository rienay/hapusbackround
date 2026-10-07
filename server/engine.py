import io
import os
import numpy as np
import rembg
from PIL import Image, ImageOps

_sessions = {}

def get_session(model_name="isnet-general-use"):
    # Normalize model names
    if model_name in ("isnet", "isnet-general", "isnet-general-use", "removebg", "auto"):
        model_name = "isnet-general-use"
    elif model_name in ("u2net", "standard"):
        model_name = "u2net"
    elif model_name in ("u2net_human_seg", "human"):
        model_name = "u2net_human_seg"
    elif model_name in ("u2netp", "fast"):
        model_name = "u2netp"

    if model_name not in _sessions:
        print(f"[AI Engine] Memuat session rembg untuk model: {model_name}...")
        _sessions[model_name] = rembg.new_session(model_name)
        print(f"[AI Engine] Model {model_name} siap digunakan!")
    return _sessions[model_name], model_name

def remove_background(
    image_bytes_or_pil,
    model_name="isnet-general-use",
    alpha_matting=True,
    fg_threshold=240,
    bg_threshold=10,
    erode_size=10,
    base_size=1000
):
    if isinstance(image_bytes_or_pil, Image.Image):
        img = image_bytes_or_pil
    else:
        img = Image.open(io.BytesIO(image_bytes_or_pil))

    img = ImageOps.exif_transpose(img)
    img_rgb = img.convert("RGB")

    session, resolved_model = get_session(model_name)

    # Process with rembg
    result = rembg.remove(
        img_rgb,
        session=session,
        alpha_matting=alpha_matting,
        alpha_matting_foreground_threshold=fg_threshold,
        alpha_matting_background_threshold=bg_threshold,
        alpha_matting_erode_size=erode_size,
        alpha_matting_base_size=base_size,
        post_process_mask=True
    )

    # Check if result is empty (e.g. human model selected for non-human image)
    alpha = np.array(result)[:, :, 3]
    non_zero = np.count_nonzero(alpha)
    total_pixels = alpha.size

    # If mask is virtually empty (< 0.8% of image) and not already using isnet-general-use,
    # auto-fallback to isnet-general-use so the user NEVER gets an empty blank cutout!
    if non_zero < (total_pixels * 0.008) and resolved_model != "isnet-general-use":
        print(f"[AI Engine] Model {resolved_model} menghasilkan gambar kosong. Fallback otomatis ke isnet-general-use...")
        fallback_session, _ = get_session("isnet-general-use")
        result = rembg.remove(
            img_rgb,
            session=fallback_session,
            alpha_matting=alpha_matting,
            alpha_matting_foreground_threshold=fg_threshold,
            alpha_matting_background_threshold=bg_threshold,
            alpha_matting_erode_size=erode_size,
            alpha_matting_base_size=base_size,
            post_process_mask=True
        )

    return result
