import datetime

class DataProcessor:
    @staticmethod
    def process_asteroid_data(asteroid_data):
        if not asteroid_data or "near_earth_objects" not in asteroid_data:
            return {"asteroid_count": 0, "hazardous_count": 0, "asteroids": []}

        all_asteroids = []
        hazardous_count = 0

        for date, asteroids in asteroid_data["near_earth_objects"].items():
            for asteroid in asteroids:
                is_hazardous = asteroid.get("is_potentially_hazardous_asteroid", False)
                if is_hazardous:
                    hazardous_count += 1

                diameter = 0
                if "estimated_diameter" in asteroid and "meters" in asteroid["estimated_diameter"]:
                    min_diam = asteroid["estimated_diameter"]["meters"].get("estimated_diameter_min", 0)
                    max_diam = asteroid["estimated_diameter"]["meters"].get("estimated_diameter_max", 0)
                    diameter = (min_diam + max_diam) / 2

                approach_data = {}
                if asteroid.get("close_approach_data") and len(asteroid["close_approach_data"]) > 0:
                    approach = asteroid["close_approach_data"][0]
                    approach_data = {
                        "close_approach_date": approach.get("close_approach_date", "Unknown"),
                        "miss_distance_km": float(approach.get("miss_distance", {}).get("kilometers", 0)),
                        "velocity_kph": float(approach.get("relative_velocity", {}).get("kilometers_per_hour", 0))
                    }

                simplified_asteroid = {
                    "id": asteroid.get("id", ""),
                    "name": asteroid.get("name", "Unknown"),
                    "diameter_meters": round(diameter, 2),
                    "is_hazardous": is_hazardous,
                    "approach_date": approach_data.get("close_approach_date", ""),
                    "miss_distance_km": round(approach_data.get("miss_distance_km", 0)),
                    "velocity_kph": round(approach_data.get("velocity_kph", 0))
                }
                all_asteroids.append(simplified_asteroid)

        all_asteroids.sort(key=lambda x: x["approach_date"])
        return {"asteroid_count": len(all_asteroids), "hazardous_count": hazardous_count, "asteroids": all_asteroids}

    @staticmethod
    def process_library_results(library_data, max_items=20):
        if not library_data or "collection" not in library_data or "items" not in library_data["collection"]:
            return []

        items = library_data["collection"]["items"]
        processed_items = []

        for item in items[:max_items]:
            if not item.get("links") or not item.get("data") or len(item["data"]) == 0:
                continue

            data = item["data"][0]
            link = next((l for l in item["links"] if l.get("rel") == "preview"), item["links"][0])

            processed_item = {
                "title": data.get("title", "Untitled"),
                "description": data.get("description", "No description available"),
                "date_created": data.get("date_created", "Unknown date"),
                "media_type": data.get("media_type", "image"),
                "nasa_id": data.get("nasa_id", ""),
                "preview_url": link.get("href", "")
            }
            processed_items.append(processed_item)

        return processed_items

    @staticmethod
    def validate_date_range(start_date, end_date, max_days=7):
        today = datetime.datetime.now().date()
        try:
            start = datetime.datetime.strptime(start_date, "%Y-%m-%d").date()
        except (ValueError, TypeError):
            start = today
        try:
            end = datetime.datetime.strptime(end_date, "%Y-%m-%d").date()
        except (ValueError, TypeError):
            end = today + datetime.timedelta(days=1)

        if end < start:
            end = start + datetime.timedelta(days=1)
        date_diff = (end - start).days
        if date_diff > max_days:
            end = start + datetime.timedelta(days=max_days)
        return start.strftime("%Y-%m-%d"), end.strftime("%Y-%m-%d")