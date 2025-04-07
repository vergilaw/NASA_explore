function fetchEarthImagery() {
    setLoading(true);
    const lat = document.getElementById('earth-lat').value;
    const lon = document.getElementById('earth-lon').value;
    const date = document.getElementById('earth-date').value;

    fetch(`/api/earth-imagery?lat=${lat}&lon=${lon}&date=${date}`)
        .then(response => response.json())
        .then(data => {
            const container = document.getElementById('earth-result');

            if (data.error) {
                container.innerHTML = `<p class="alert alert-warning">${data.error}</p>`;
                setLoading(false);
                return;
            }

            if (data.image_url) {
                container.innerHTML = `
                    <div class="img-container">
                        <img id="earth-image" class="img-fluid" src="${data.image_url}" alt="Earth Imagery">
                    </div>
                    <div class="mt-3">
                        <p>Coordinates: ${lat}° N, ${lon}° E</p>
                        <p>Date: ${data.date}</p>
                        <button class="btn btn-outline-success btn-sm" id="add-earth-favorite">Thêm vào yêu thích</button>
                        <button class="btn btn-outline-info btn-sm" id="add-earth-note">Thêm ghi chú</button>
                        <div id="earth-note-container" class="mt-2"></div>
                    </div>
                `;

                document.getElementById('add-earth-favorite').onclick = () => {
                    fetch('/api/favorites', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ type: 'earth', id: `${lat}-${lon}-${date}`, data })
                    }).then(() => alert('Added to favorites!'));
                };

                document.getElementById('add-earth-note').onclick = () => {
                    const note = prompt('Enter your note:');
                    if (note) {
                        fetch('/api/notes', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ type: 'earth', id: `${lat}-${lon}-${date}`, note })
                        }).then(() => displayNote('earth', `${lat}-${lon}-${date}`));
                    }
                };

                displayNote('earth', `${lat}-${lon}-${date}`);
            } else {
                container.innerHTML = '<p class="alert alert-info">No image found for the selected coordinates and date.</p>';
            }
            setLoading(false);
        })
        .catch(error => {
            console.error('Error fetching Earth imagery:', error);
            setLoading(false);
            document.getElementById('earth-result').innerHTML = '<p class="alert alert-danger">Failed to fetch Earth imagery. Please try again.</p>';
        });
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