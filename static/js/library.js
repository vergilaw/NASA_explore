function searchLibrary() {
    setLoading(true);
    const query = document.getElementById('search-query').value;
    const mediaType = document.getElementById('media-type').value;
    const yearStart = document.getElementById('year-start').value;

    fetch(`/api/search?q=${query}&media_type=${mediaType}&year_start=${yearStart}`)
        .then(response => response.json())
        .then(data => {
            const resultContainer = document.getElementById('library-result');
            resultContainer.innerHTML = '';

            if (data.collection && data.collection.items && data.collection.items.length > 0) {
                const countDiv = document.createElement('div');
                countDiv.className = 'col-12 mb-3';
                countDiv.innerHTML = `<p>Tìm thấy ${data.collection.items.length} kết quả. Hiển thị 20 kết quả đầu tiên.</p>`;
                resultContainer.appendChild(countDiv);

                data.collection.items.slice(0, 20).forEach(item => {
                    if (item.links && item.links[0] && item.data && item.data[0]) {
                        const col = document.createElement('div');
                        col.className = 'col-md-4 mb-3';

                        let mediaElement = '';
                        let viewUrl = item.links[0].href;

                        if (mediaType === 'image') {
                            mediaElement = `<img src="${item.links[0].href}" class="card-img-top" alt="${item.data[0].title}">`;
                        } else if (mediaType === 'video') {
                            let videoUrl = item.href || null;
                            viewUrl = videoUrl || `https://images.nasa.gov/details-${item.data[0].nasa_id}`;
                            mediaElement = videoUrl ?
                                `<div class="ratio ratio-16x9"><iframe src="${videoUrl}" title="${item.data[0].title}" allowfullscreen></iframe></div>` :
                                `<div class="video-thumbnail-container">
                                    <img src="${item.links[0].href}" class="card-img-top" alt="${item.data[0].title}">
                                    <div class="video-play-overlay"><i class="fas fa-play-circle fa-3x"></i></div>
                                </div>`;
                        } else if (mediaType === 'audio') {
                            mediaElement = `<audio controls class="w-100 mt-3"><source src="${item.links[0].href}" type="audio/mpeg"></audio>`;
                        }

                        let dateFormatted = item.data[0].date_created ? new Date(item.data[0].date_created).toLocaleDateString() : '';

                        col.innerHTML = `
                            <div class="card h-100">
                                ${mediaElement}
                                <div class="card-body">
                                    <h6 class="card-title">${item.data[0].title}</h6>
                                    ${dateFormatted ? `<p class="card-text"><small>Date: ${dateFormatted}</small></p>` : ''}
                                    <p class="card-text small">${item.data[0].description?.substring(0, 150) || 'No description'}${item.data[0].description?.length > 150 ? '...' : ''}</p>
                                    <button class="btn btn-outline-success btn-sm add-library-favorite" data-id="${item.data[0].nasa_id}">Thêm vào yêu thích</button>
                                    <button class="btn btn-outline-info btn-sm add-library-note" data-id="${item.data[0].nasa_id}">Thêm ghi chú</button>
                                    <div class="library-note-container mt-2" data-id="${item.data[0].nasa_id}"></div>
                                </div>
                                <div class="card-footer">
                                    <a href="${viewUrl}" class="btn btn-sm btn-primary" target="_blank">${mediaType === 'video' ? 'Xem video trên NASA' : 'Xem đầy đủ'}</a>
                                </div>
                            </div>
                        `;
                        resultContainer.appendChild(col);
                    }
                });

                document.querySelectorAll('.add-library-favorite').forEach(btn => {
                    btn.onclick = () => {
                        const id = btn.dataset.id;
                        const item = data.collection.items.find(i => i.data[0].nasa_id === id);
                        fetch('/api/favorites', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ type: 'library', id, data: item })
                        }).then(() => alert('Added to favorites!'));
                    };
                });

                document.querySelectorAll('.add-library-note').forEach(btn => {
                    btn.onclick = () => {
                        const id = btn.dataset.id;
                        const note = prompt('Enter your note:');
                        if (note) {
                            fetch('/api/notes', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ type: 'library', id, note })
                            }).then(() => displayNote('library', id, `.library-note-container[data-id="${id}"]`));
                        }
                    };
                });

                data.collection.items.forEach(item =>
                    displayNote('library', item.data[0].nasa_id, `.library-note-container[data-id="${item.data[0].nasa_id}"]`));
            } else {
                resultContainer.innerHTML = '<div class="col-12"><p class="alert alert-info">Không tìm thấy kết quả.</p></div>';
            }
            setLoading(false);
        })
        .catch(error => {
            console.error('Error searching NASA library:', error);
            setLoading(false);
            alert('Failed to search NASA library.');
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