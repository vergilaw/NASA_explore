function fetchAPOD() {
    setLoading(true);
    const dateInput = document.getElementById('apod-date');
    const date = dateInput.value;

    const selectedDate = new Date(date);
    const today = new Date();
    if (selectedDate > today) {
        alert('Không thể chọn ngày trong tương lai.');
        dateInput.value = today.toISOString().split('T')[0];
        setLoading(false);
        return;
    }

    fetch(`/api/apod?date=${date}`)
        .then(response => {
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            return response.json();
        })
        .then(data => {
            if (data.error) throw new Error(data.error);

            document.getElementById('apod-title').textContent = data.title || 'No title available';
            document.getElementById('apod-date-display').textContent = `Date: ${data.date}`;
            document.getElementById('apod-explanation').textContent = data.explanation || 'No explanation available';

            const imgContainer = document.querySelector('#apod .img-container');
            imgContainer.innerHTML = '';

            if (data.media_type === 'image') {
                const img = new Image();
                img.src = data.hdurl || data.url;
                img.alt = data.title;
                img.className = 'img-fluid';
                img.onload = () => setLoading(false);
                img.onerror = () => {
                    setLoading(false);
                    imgContainer.innerHTML = '<p class="alert alert-warning">Không thể tải hình ảnh.</p>';
                };
                imgContainer.appendChild(img);
            } else if (data.media_type === 'video') {
                const iframe = document.createElement('iframe');
                iframe.src = data.url;
                iframe.width = '100%';
                iframe.height = '450';
                iframe.frameBorder = '0';
                iframe.allowFullscreen = true;
                iframe.onload = () => setLoading(false);
                imgContainer.appendChild(iframe);
            } else {
                setLoading(false);
                imgContainer.innerHTML = '<p class="alert alert-info">Media loại này không được hỗ trợ.</p>';
            }

            document.getElementById('add-apod-favorite').onclick = () => {
                fetch('/api/favorites', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ type: 'apod', id: data.date, data })
                }).then(() => alert('Added to favorites!'));
            };

            document.getElementById('add-apod-note').onclick = () => {
                const note = prompt('Enter your note:');
                if (note) {
                    fetch('/api/notes', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ type: 'apod', id: data.date, note })
                    }).then(() => displayNote('apod', data.date));
                }
            };

            displayNote('apod', data.date);
        })
        .catch(error => {
            console.error('Error fetching APOD:', error);
            setLoading(false);
            document.querySelector('#apod .img-container').innerHTML = `<div class="alert alert-danger">Error: ${error.message}</div>`;
            document.getElementById('apod-title').textContent = '';
            document.getElementById('apod-date-display').textContent = '';
            document.getElementById('apod-explanation').textContent = '';
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