function fetchSpaceWeather() {
    setLoading(true);
    const startDate = document.getElementById('space-weather-start').value;
    const endDate = document.getElementById('space-weather-end').value;

    fetch(`/api/space-weather?start_date=${startDate}&end_date=${endDate}`)
        .then(response => response.json())
        .then(data => {
            const eventsDiv = document.getElementById('space-weather-events');

            if (data.error) {
                eventsDiv.innerHTML = `<div class="alert alert-warning">${data.error}</div>`;
                setLoading(false);
                return;
            }

            if (!Array.isArray(data) || data.length === 0) {
                eventsDiv.innerHTML = `
                    <div class="alert alert-info">Không có sự kiện CME trong khoảng thời gian này.</div>
                `;
                setLoading(false);
                return;
            }

            eventsDiv.innerHTML = '';

            const overviewDiv = document.createElement('div');
            overviewDiv.className = 'mb-4';
            overviewDiv.innerHTML = `
                <div class="alert alert-success">
                    <h5><i class="fas fa-sun"></i> Đã tìm thấy ${data.length} sự kiện CME</h5>
                    <p>Khoảng thời gian: ${formatDate(startDate)} đến ${formatDate(endDate)}</p>
                </div>
            `;
            eventsDiv.appendChild(overviewDiv);

            data.forEach((event, index) => {
                const eventDiv = document.createElement('div');
                eventDiv.className = 'card bg-dark mb-3';

                const formattedDate = new Date(event.startTime || '').toLocaleString();
                const speed = event.cmeAnalyses && event.cmeAnalyses.length > 0 ? event.cmeAnalyses[0].speed : 'Không có dữ liệu';
                const id = event.activityID || `${startDate}-${index}`;

                eventDiv.innerHTML = `
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h5>Sự kiện CME #${index + 1}</h5>
                        <span class="badge bg-primary">${formattedDate}</span>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-6">
                                <p><strong>Thời gian bắt đầu:</strong> ${event.startTime || 'N/A'}</p>
                                <p><strong>Nguồn vị trí:</strong> ${event.sourceLocation || 'Không xác định'}</p>
                                <p><strong>Ghi chú:</strong> ${event.note || 'Không có ghi chú'}</p>
                            </div>
                            <div class="col-md-6">
                                <p><strong>Tốc độ:</strong> ${speed} km/s</p>
                                <p><strong>Loại:</strong> ${event.type || 'N/A'}</p>
                                <p><strong>Liên kết:</strong> ${event.link ? `<a href="${event.link}" target="_blank">Chi tiết</a>` : 'Không có'}</p>
                                <button class="btn btn-outline-success btn-sm add-space-weather-favorite" data-id="${id}">Thêm vào yêu thích</button>
                                <button class="btn btn-outline-info btn-sm add-space-weather-note" data-id="${id}">Thêm ghi chú</button>
                                <div class="space-weather-note-container mt-2" data-id="${id}"></div>
                            </div>
                        </div>
                    </div>
                `;
                eventsDiv.appendChild(eventDiv);

                eventDiv.querySelector('.add-space-weather-favorite').onclick = () => {
                    fetch('/api/favorites', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ type: 'space_weather', id, data: event })
                    }).then(() => alert('Added to favorites!'));
                };

                eventDiv.querySelector('.add-space-weather-note').onclick = () => {
                    const note = prompt('Enter your note:');
                    if (note) {
                        fetch('/api/notes', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ type: 'space_weather', id, note })
                        }).then(() => displayNote('space_weather', id, `.space-weather-note-container[data-id="${id}"]`));
                    }
                };

                displayNote('space_weather', id, `.space-weather-note-container[data-id="${id}"]`);
            });

            setLoading(false);
        })
        .catch(error => {
            console.error('Error fetching space weather data:', error);
            document.getElementById('space-weather-events').innerHTML = `
                <div class="alert alert-danger">Không thể lấy dữ liệu thời tiết không gian.</div>
            `;
            setLoading(false);
        });
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString();
}

function displayNote(type, id, selector) {
    fetch('/api/notes')
        .then(response => response.json())
        .then(notes => {
            const note = notes.find(n => n.type === type && n.id === id);
            const container = document.querySelector(selector);
            if (note) {
                container.innerHTML = `
                    <p><strong>Note:</strong> ${note.note}</p>
                    <button class="btn btn-outline-warning btn-sm" onclick="editNote('${type}', '${id}', '${selector}')">Edit</button>
                    <button class="btn btn-outline-danger btn-sm" onclick="deleteNote('${type}', '${id}', '${selector}')">Delete</button>
                `;
            } else {
                container.innerHTML = '';
            }
        });
}

function editNote(type, id, selector) {
    const newNote = prompt('Edit your note:');
    if (newNote) {
        fetch(`/api/notes/${type}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ note: newNote })
        }).then(() => displayNote(type, id, selector));
    }
}

function deleteNote(type, id, selector) {
    fetch(`/api/notes/${type}/${id}`, { method: 'DELETE' })
        .then(() => displayNote(type, id, selector));
}