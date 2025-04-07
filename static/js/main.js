document.addEventListener('DOMContentLoaded', function() {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    document.getElementById('apod-date').value = todayStr;

    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    const nextWeekStr = nextWeek.toISOString().split('T')[0];

    document.getElementById('asteroids-start').value = todayStr;
    document.getElementById('asteroids-end').value = nextWeekStr;

    document.getElementById('earth-date').value = '2020-01-01';

    const lastMonth = new Date();
    lastMonth.setDate(today.getDate() - 30);
    document.getElementById('space-weather-start').value = lastMonth.toISOString().split('T')[0];
    document.getElementById('space-weather-end').value = todayStr;

    fetchAPOD();
    fetchInitialStats();

    const tabElements = document.querySelectorAll('button[data-bs-toggle="tab"]');
    tabElements.forEach(function(tabElement) {
        tabElement.addEventListener('shown.bs.tab', function(event) {
            const targetId = event.target.getAttribute('data-bs-target').substring(1);
            if (targetId === 'apod' && document.getElementById('apod-title').textContent === '') {
                fetchAPOD();
            } else if (targetId === 'satellites') {
                setTimeout(() => {
                    if (satelliteMap) satelliteMap.invalidateSize();
                }, 100);
            }
        });
    });

    document.getElementById('fetch-apod').addEventListener('click', fetchAPOD);
    document.getElementById('fetch-mars').addEventListener('click', fetchMarsPhotos);
    document.getElementById('fetch-earth').addEventListener('click', fetchEarthImagery);
    document.getElementById('fetch-asteroids').addEventListener('click', fetchAsteroids);
    document.getElementById('search-library').addEventListener('click', searchLibrary);
    document.getElementById('fetch-satellite').addEventListener('click', fetchSatelliteData);
    document.getElementById('fetch-space-weather').addEventListener('click', fetchSpaceWeather);
});

function setLoading(isLoading) {
    document.getElementById('loading').style.display = isLoading ? 'block' : 'none';
}

function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function fetchInitialStats() {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    const nextWeekStr = nextWeek.toISOString().split('T')[0];

    fetch(`/api/asteroids?start_date=${todayStr}&end_date=${nextWeekStr}`)
        .then(response => response.json())
        .then(data => {
            let count = 0;
            if (data.near_earth_objects) {
                Object.keys(data.near_earth_objects).forEach(date => {
                    count += data.near_earth_objects[date].length;
                });
            }
            document.getElementById('asteroid-count').textContent = count;
        })
        .catch(error => console.error('Error fetching asteroid count:', error));

    const lastMonth = new Date();
    lastMonth.setDate(today.getDate() - 30);
    const lastMonthStr = lastMonth.toISOString().split('T')[0];

    fetch(`/api/space-weather?start_date=${lastMonthStr}&end_date=${todayStr}`)
        .then(response => response.json())
        .then(data => {
            let count = Array.isArray(data) ? data.length : 0;
            document.getElementById('space-weather-count').textContent = count;
        })
        .catch(error => console.error('Error fetching space weather count:', error));
}