import os
from flask import Flask, jsonify, render_template, request
from flask_cors import CORS
from dotenv import load_dotenv
import datetime
from services import NasaApiService, DataProcessor
from database.db_manager import init_db, add_favorite, remove_favorite, get_favorites, add_note, update_note, delete_note, get_notes

load_dotenv()

app = Flask(__name__)
CORS(app)

nasa_service = NasaApiService()
data_processor = DataProcessor()

# Initialize SQLite database
init_db()

@app.context_processor
def inject_now():
    return {'now': datetime.datetime.now()}

@app.template_filter('datetimeformat')
def datetimeformat(value):
    try:
        return datetime.datetime.strptime(value, "%Y-%m-%dT%H:%M:%SZ").strftime("%Y-%m-%d") if value else ""
    except ValueError:
        return value

# Main routes
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/about')
def about():
    return render_template('about.html')

@app.route('/favorites')
def favorites_page():
    favorites = get_favorites()
    notes = get_notes()  # Get notes to display them with favorites
    return render_template('partials/favorites.html', favorites=favorites, notes=notes)

# Error handlers
@app.errorhandler(404)
def page_not_found(e):
    return render_template('error.html', error='404 - Page Not Found'), 404

@app.errorhandler(500)
def server_error(e):
    return render_template('error.html', error='500 - Internal Server Error'), 500

# API Routes
@app.route('/api/apod', methods=['GET'])
def get_apod():
    date = request.args.get('date', datetime.datetime.now().strftime('%Y-%m-%d'))
    return jsonify(nasa_service.get_apod(date))

@app.route('/api/mars-photos', methods=['GET'])
def get_mars_photos():
    rover = request.args.get('rover', 'curiosity')
    sol = request.args.get('sol', '1000')
    camera = request.args.get('camera', '')
    return jsonify(nasa_service.get_mars_photos(rover, sol, camera))

@app.route('/api/earth-imagery', methods=['GET'])
def get_earth_imagery():
    lat = request.args.get('lat', '1.5')
    lon = request.args.get('lon', '100.75')
    date = request.args.get('date', '2020-01-01')
    return jsonify(nasa_service.get_earth_imagery(lat, lon, date))

@app.route('/api/search', methods=['GET'])
def search_nasa_library():
    query = request.args.get('q', 'galaxy')
    media_type = request.args.get('media_type', 'image')
    year_start = request.args.get('year_start', '2000')
    data = nasa_service.search_nasa_library(query, media_type, year_start)
    return jsonify(data)

@app.route('/api/asteroids', methods=['GET'])
def get_asteroids():
    start_date = request.args.get('start_date', datetime.datetime.now().strftime('%Y-%m-%d'))
    end_date = request.args.get('end_date', (datetime.datetime.now() + datetime.timedelta(days=7)).strftime('%Y-%m-%d'))
    start_date, end_date = data_processor.validate_date_range(start_date, end_date, max_days=7)
    data = nasa_service.get_asteroids(start_date, end_date)
    return jsonify(data)

@app.route('/api/satellites', methods=['GET'])
def get_satellites():
    satellite_id = request.args.get('satellite_id', '25544')
    return jsonify(nasa_service.get_satellite_data(satellite_id))

@app.route('/api/space-weather', methods=['GET'])
def get_space_weather():
    start_date = request.args.get('start_date', datetime.datetime.now().strftime('%Y-%m-%d'))
    end_date = request.args.get('end_date', (datetime.datetime.now() + datetime.timedelta(days=1)).strftime('%Y-%m-%d'))
    start_date, end_date = data_processor.validate_date_range(start_date, end_date, max_days=30)
    return jsonify(nasa_service.get_space_weather(start_date, end_date))

# Favorites API
@app.route('/api/favorites', methods=['POST'])
def add_favorite_route():
    data = request.get_json()
    item_type = data.get('type')
    item_id = data.get('id')
    item_data = data.get('data')
    if not item_type or not item_id or not item_data:
        return jsonify({'error': 'Missing required fields'}), 400
    add_favorite(item_type, item_id, item_data)
    return jsonify({'message': 'Favorite added'}), 201

@app.route('/api/favorites/<item_type>/<item_id>', methods=['DELETE'])
def remove_favorite_route(item_type, item_id):
    remove_favorite(item_type, item_id)
    return jsonify({'message': 'Favorite removed'}), 200

@app.route('/api/favorites', methods=['GET'])
def get_favorites_route():
    favorites = get_favorites()
    return jsonify(favorites)

# Notes API - Uncommented and active
@app.route('/api/notes', methods=['POST'])
def add_note_route():
    data = request.get_json()
    item_type = data.get('type')
    item_id = data.get('id')
    note_text = data.get('note')
    if not item_type or not item_id or not note_text:
        return jsonify({'error': 'Missing required fields'}), 400
    add_note(item_type, item_id, note_text)
    return jsonify({'message': 'Note added'}), 201

@app.route('/api/notes/<item_type>/<item_id>', methods=['PUT'])
def update_note_route(item_type, item_id):
    data = request.get_json()
    note_text = data.get('note')
    if not note_text:
        return jsonify({'error': 'Missing note text'}), 400
    update_note(item_type, item_id, note_text)
    return jsonify({'message': 'Note updated'}), 200

@app.route('/api/notes/<item_type>/<item_id>', methods=['DELETE'])
def delete_note_route(item_type, item_id):
    delete_note(item_type, item_id)
    return jsonify({'message': 'Note deleted'}), 200

@app.route('/api/notes', methods=['GET'])
def get_notes_route():
    notes = get_notes()
    return jsonify(notes)

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 8080))
    app.run(host='0.0.0.0', port=port, debug=True)