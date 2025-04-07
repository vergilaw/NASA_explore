import os
import requests
from dotenv import load_dotenv

load_dotenv()
NASA_API_KEY = os.getenv("NASA_API_KEY", "DEMO_KEY")

class NasaApiService:
    @staticmethod
    def get_apod(date):
        url = f"https://api.nasa.gov/planetary/apod?api_key={NASA_API_KEY}&date={date}"
        response = requests.get(url)
        return response.json() if response.status_code == 200 else {"error": "Failed to fetch APOD data"}

    @staticmethod
    def get_mars_photos(rover, sol, camera=None):
        url = f"https://api.nasa.gov/mars-photos/api/v1/rovers/{rover}/photos?sol={sol}&api_key={NASA_API_KEY}"
        if camera:
            url += f"&camera={camera}"
        response = requests.get(url)
        return response.json() if response.status_code == 200 else {"error": "Failed to fetch Mars rover data"}

    @staticmethod
    def get_earth_imagery(lat, lon, date):
        """Fetch Earth imagery from NASA API with given coordinates and date."""
        url = f"https://api.nasa.gov/planetary/earth/assets?lon={lon}&lat={lat}&date={date}&dim=0.15&api_key={NASA_API_KEY}"
        response = requests.get(url)
        if response.status_code == 200:
            data = response.json()
            if 'url' in data:
                return {"image_url": data['url'], "date": data.get('date', date)}
            else:
                return {"error": "No image available for the specified coordinates and date"}
        return {"error": f"Failed to fetch Earth imagery: {response.status_code} - {response.text}"}

    @staticmethod
    def search_nasa_library(query, media_type, year_start):
        url = f"https://images-api.nasa.gov/search?q={query}&media_type={media_type}&year_start={year_start}"
        response = requests.get(url)
        return response.json() if response.status_code == 200 else {"error": "Failed to search NASA library"}

    @staticmethod
    def get_asteroids(start_date, end_date):
        url = f"https://api.nasa.gov/neo/rest/v1/feed?start_date={start_date}&end_date={end_date}&api_key={NASA_API_KEY}"
        response = requests.get(url)
        return response.json() if response.status_code == 200 else {"error": "Failed to fetch asteroid data"}

    @staticmethod
    def get_satellite_data(satellite_id="25544"):
        url = f"https://tle.ivanstanojevic.me/api/tle/{satellite_id}"
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json'
        }
        try:
            response = requests.get(url, headers=headers, timeout=10)
            return response.json() if response.status_code == 200 else {"error": "Failed to fetch satellite data"}
        except requests.exceptions.RequestException:
            return {"error": "Failed to fetch satellite data"}

    @staticmethod
    def get_space_weather(start_date, end_date):
        url = f"https://api.nasa.gov/DONKI/CME?startDate={start_date}&endDate={end_date}&api_key={NASA_API_KEY}"
        response = requests.get(url)
        return response.json() if response.status_code == 200 else {"error": "Failed to fetch space weather data"}