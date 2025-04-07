let satelliteMap = null;
let satelliteMarker = null;
let satelliteTrackLine = null;
let trackPositions = [];
let satInterval = null;

function fetchSatelliteData() {
    setLoading(true);

    if (satInterval) {
        clearInterval(satInterval);
        satInterval = null;
    }

    let satelliteId = document.getElementById('satellite-id').value;
    const customId = document.getElementById('custom-satellite-id').value;

    if (customId.trim() !== '') {
        satelliteId = customId.trim();
    }

    fetch(`/api/satellites?satellite_id=${satelliteId}`)
        .then(response => response.json())
        .then(data => {
            const infoDiv = document.getElementById('satellite-info');
            const tleDiv = document.getElementById('satellite-tle');
            const nameTitle = document.getElementById('satellite-name');
            const positionDiv = document.getElementById('satellite-position');

            if (data.error) {
                infoDiv.innerHTML = `<div class="alert alert-warning">${data.error}</div>`;
                tleDiv.textContent = '';
                nameTitle.textContent = 'Không tìm thấy vệ tinh';
                positionDiv.textContent = 'Không có dữ liệu vị trí';
                setLoading(false);
                return;
            }

            nameTitle.textContent = data.name || 'Thông tin vệ tinh';

            let infoHtml = `
                <table class="table table-dark">
                    <tr><td>ID:</td><td>${data.satelliteId || 'N/A'}</td></tr>
                    <tr><td>Tên:</td><td>${data.name || 'N/A'}</td></tr>
                    <tr><td>Ngày cập nhật:</td><td>${new Date(data.date || '').toLocaleString()}</td></tr>
                    <tr><td>Độ nghiêng:</td><td>${data.line1 ? extractInclination(data.line1) : 'N/A'}°</td></tr>
                    <tr><td>Chu kỳ:</td><td>${data.line2 ? extractPeriod(data.line2) : 'N/A'} phút</td></tr>
                </table>
            `;
            infoDiv.innerHTML = infoHtml;

            if (data.line1 && data.line2) {
                tleDiv.textContent = `${data.line1}\n${data.line2}`;
                initSatelliteMap();
                trackPositions = [];
                updateSatellitePosition(data.name, data.line1, data.line2);
                satInterval = setInterval(() => updateSatellitePosition(data.name, data.line1, data.line2), 5000);

                document.getElementById('add-satellite-favorite').onclick = () => {
                    fetch('/api/favorites', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ type: 'satellite', id: satelliteId, data })
                    }).then(() => alert('Added to favorites!'));
                };

                document.getElementById('add-satellite-note').onclick = () => {
                    const note = prompt('Enter your note:');
                    if (note) {
                        fetch('/api/notes', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ type: 'satellite', id: satelliteId, note })
                        }).then(() => displayNote('satellite', satelliteId));
                    }
                };

                displayNote('satellite', satelliteId);
            } else {
                tleDiv.textContent = 'Không có dữ liệu TLE';
                positionDiv.textContent = 'Không có dữ liệu vị trí';
            }

            setLoading(false);
        })
        .catch(error => {
            console.error('Error fetching satellite data:', error);
            document.getElementById('satellite-info').innerHTML = `
                <div class="alert alert-danger">Không thể lấy dữ liệu vệ tinh.</div>
            `;
            document.getElementById('satellite-position').textContent = 'Không có dữ liệu vị trí';
            setLoading(false);
        });
}

function initSatelliteMap() {
    if (satelliteMap) satelliteMap.remove();

    satelliteMap = L.map('satellite-map').setView([0, 0], 2);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18
    }).addTo(satelliteMap);

    satelliteMarker = L.marker([0, 0], {
        icon: L.divIcon({
            className: 'satellite-icon',
            html: '<i class="fas fa-satellite text-primary" style="font-size: 24px;"></i>',
            iconSize: [24, 24],
            iconAnchor: [12, 12]
        })
    }).addTo(satelliteMap);

    satelliteTrackLine = L.polyline([], {
        color: 'rgba(0, 123, 255, 0.7)',
        weight: 2,
        dashArray: '5, 5'
    }).addTo(satelliteMap);
}

function updateSatellitePosition(name, line1, line2) {
    if (!satelliteMap) return;

    try {
        const satrec = satellite.twoline2satrec(line1, line2);
        const now = new Date();
        const positionAndVelocity = satellite.propagate(satrec, now);
        const positionEci = positionAndVelocity.position;
        const gmst = satellite.gstime(now);
        const positionGd = satellite.eciToGeodetic(positionEci, gmst);

        const longitude = satellite.degreesLong(positionGd.longitude);
        const latitude = satellite.degreesLat(positionGd.latitude);
        const altitude = positionGd.height;

        satelliteMarker.setLatLng([latitude, longitude]);
        document.getElementById('satellite-position').innerHTML = `
            <strong>Vĩ độ:</strong> ${latitude.toFixed(4)}° | 
            <strong>Kinh độ:</strong> ${longitude.toFixed(4)}° | 
            <strong>Độ cao:</strong> ${altitude.toFixed(2)} km
        `;

        trackPositions.push([latitude, longitude]);
        if (trackPositions.length > 100) trackPositions.shift();
        satelliteTrackLine.setLatLngs(trackPositions);

        if (trackPositions.length === 1) satelliteMap.setView([latitude, longitude], 3);
    } catch (error) {
        console.error("Error updating satellite position:", error);
    }
}

function extractInclination(line1) {
    return line1 && line1.length > 16 ? parseFloat(line1.substring(8, 16).trim()).toFixed(2) : 'N/A';
}

function extractPeriod(line2) {
    if (line2 && line2.length > 63) {
        const meanMotion = parseFloat(line2.substring(52, 63).trim());
        return !isNaN(meanMotion) && meanMotion > 0 ? (1440 / meanMotion).toFixed(2) : 'N/A';
    }
    return 'N/A';
}

function displayNote(type, id) {
    fetch('/api/notes')
        .then(response => response.json())
        .then(notes => {
            const note = notes.find(n => n.type === type && n.id === id);
            const container = document.getElementById(`${type}-note-container`);
            if (note) {
                container.innerHTML = `
                    <p><strong>Note:</strong> ${note.note}</p>
                    <button class="btn btn-outline-warning btn-sm" onclick="editNote('${type}', '${id}')">Edit</button>
                    <button class="btn btn-outline-danger btn-sm" onclick="deleteNote('${type}', '${id}')">Delete</button>
                `;
            } else {
                container.innerHTML = '';
            }
        });
}

function editNote(type, id) {
    const newNote = prompt('Edit your note:');
    if (newNote) {
        fetch(`/api/notes/${type}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ note: newNote })
        }).then(() => displayNote(type, id));
    }
}

function deleteNote(type, id) {
    fetch(`/api/notes/${type}/${id}`, { method: 'DELETE' })
        .then(() => displayNote(type, id));
}