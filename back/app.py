from flask import Flask, jsonify
from flask_cors import CORS
import json
import os

app = Flask(__name__)
CORS(app)



JSON_FILE_POINTS = 'distr_emr_matrix_test_1.json'
JSON_FILE_GEO = 'build_Vasileostrovskiy.geojson'


def get_coordinates(file, encoding):
    try:
        if not os.path.exists(file):
            return jsonify({"error": "Файл не найден"}), 404
        with open(file, 'r', encoding=encoding) as f:
            data = json.load(f)
        return jsonify(data)

    except json.JSONDecodeError:
        return jsonify({"error": "Ошибка в формате JSON"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/coordinates/points', methods=['GET'])
def get_points_coordinates():
    return get_coordinates(JSON_FILE_POINTS, 'utf-8')


@app.route('/api/coordinates/geo', methods=['GET'])
def get_geo_coordinates():
    return get_coordinates(JSON_FILE_GEO, 'windows-1251')


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
