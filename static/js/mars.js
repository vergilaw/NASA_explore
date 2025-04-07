function fetchMarsPhotos() {
    setLoading(true);
    const rover = document.getElementById('mars-rover').value;
    const sol = document.getElementById('mars-sol').value;
    const camera = document.getElementById('mars-camera').value;

    fetch(`/api/mars-photos?rover=${rover}&sol=${sol}&camera=${camera}`)
        .then(response => response.json())
        .then(data => {
            const resultContainer = document.getElementById('mars-result');
            resultContainer.innerHTML = '';

            if (data.photos && data.photos.length > 0) {
                const photoCount = Math.min(data.photos.length, 20);
                const photoText = photoCount < data.photos.length ?
                    `Showing ${photoCount} of ${data.photos.length} photos` :
                    `${photoCount} photos found`;

                const infoRow = document.createElement('div');
                infoRow.className = 'col-12 mb-3';
                infoRow.innerHTML = `<p>${photoText}</p>`;
                resultContainer.appendChild(infoRow);

                data.photos.slice(0, 20).forEach(photo => {
                    const col = document.createElement('div');
                    col.className = 'col-md-4 mb-3';
                    col.innerHTML = `
                        <div class="card h-100">
                            <img src="${photo.img_src}" class="card-img-top" alt="Mars Photo">
                            <div class="card-body">
                                <h6 class="card-title">Camera: ${photo.camera.full_name}</h6>
                                <p class="card-text">Earth Date: ${photo.earth_date}</p>
                                <p class="card-text small">Sol: ${photo.sol}</p>
                                <button class="btn btn-outline-success btn-sm add-mars-favorite" data-id="${photo.id}">Thêm vào yêu thích</button>
                                <button class="btn btn-outline-info btn-sm add-mars-note" data-id="${photo.id}">Thêm ghi chú</button>
                                <div class="mars-note-container mt-2" data-id="${photo.id}"></div>
                            </div>
                        </div>
                    `;
                    resultContainer.appendChild(col);
                });

                document.querySelectorAll('.add-mars-favorite').forEach(btn => {
                    btn.onclick = () => {
                        const id = btn.dataset.id;
                        const photo = data.photos.find(p => p.id == id);
                        fetch('/api/favorites', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ type: 'mars', id, data: photo })
                        }).then(() => alert('Added to favorites!'));
                    };
                });

                document.querySelectorAll('.add-mars-note').forEach(btn => {
                    btn.onclick = () => {
                        const id = btn.dataset.id;
                        const note = prompt('Enter your note:');
                        if (note) {
                            fetch('/api/notes', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ type: 'mars', id, note })
                            }).then(() => displayNote('mars', id, `.mars-note-container[data-id="${id}"]`));
                        }
                    };
                });

                data.photos.forEach(photo => displayNote('mars', photo.id, `.mars-note-container[data-id="${photo.id}"]`));
            } else {
                resultContainer.innerHTML = '<div class="col-12"><p>No photos found.</p></div>';
            }
            setLoading(false);
        })
        .catch(error => {
            console.error('Error fetching Mars photos:', error);
            setLoading(false);
            alert('Failed to fetch Mars photos.');
        });
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