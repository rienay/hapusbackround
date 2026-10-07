import io
import os
import sys
import base64
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from server.engine import remove_background

app = Flask(__name__)
CORS(app)

@app.route('/health', methods=['GET'])
@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({
        "status": "online",
        "default_model": "isnet-general-use",
        "models": {
            "isnet-general-use": True,
            "u2net": True,
            "u2net_human_seg": True,
            "u2netp": True
        }
    })

@app.route('/api/remove-bg', methods=['POST'])
def handle_remove_bg():
    try:
        image_bytes = None
        model_name = request.form.get('model') or request.args.get('model') or 'isnet-general-use'
        alpha_matting_str = request.form.get('alpha_matting', 'true').lower()
        alpha_matting = alpha_matting_str in ('true', '1', 'yes')

        if 'file' in request.files:
            image_bytes = request.files['file'].read()
        elif 'image' in request.files:
            image_bytes = request.files['image'].read()
        elif request.is_json:
            json_data = request.get_json()
            model_name = json_data.get('model', model_name)
            alpha_matting = json_data.get('alpha_matting', alpha_matting)
            raw_b64 = json_data.get('image', '')
            if ',' in raw_b64:
                raw_b64 = raw_b64.split(',', 1)[1]
            image_bytes = base64.b64decode(raw_b64)

        if not image_bytes:
            return jsonify({"error": "Tidak ada file gambar yang dikirimkan."}), 400

        result_img = remove_background(
            image_bytes,
            model_name=model_name,
            alpha_matting=alpha_matting
        )

        output_bio = io.BytesIO()
        result_img.save(output_bio, format='PNG')
        output_bio.seek(0)

        if request.headers.get('Accept') == 'application/json' or request.args.get('format') == 'base64':
            b64_str = base64.b64encode(output_bio.getvalue()).decode('utf-8')
            return jsonify({
                "success": True,
                "model_used": model_name,
                "alpha_matting": alpha_matting,
                "image": f"data:image/png;base64,{b64_str}"
            })

        return send_file(output_bio, mimetype='image/png')

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5005))
    print(f"============================================================")
    print(f"  Pudding.bg AI Backend Server (IS-Net / RemoveBG Quality)")
    print(f"  Berjalan di: http://127.0.0.1:{port}")
    print(f"============================================================")
    app.run(host='0.0.0.0', port=port, debug=False)
