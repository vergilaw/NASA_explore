document.addEventListener('DOMContentLoaded', function() {
    // Xử lý xóa mục yêu thích với xác nhận
    document.querySelectorAll('.remove-favorite').forEach(btn => {
        btn.addEventListener('click', function() {
            const type = this.dataset.type;
            const id = this.dataset.id;
            if (confirm('Bạn có muốn xóa mục này khỏi danh sách yêu thích không?')) {
                fetch(`/api/favorites/${type}/${id}`, { method: 'DELETE' })
                    .then(() => {
                        document.getElementById(`favorite-${type}-${id}`).remove();
                        if (!document.querySelector('#favorites-list .col-md-4')) {
                            document.getElementById('favorites-list').innerHTML = '<p class="col-12">Chưa có mục yêu thích nào.</p>';
                        }
                    })
                    .catch(error => console.error('Error removing favorite:', error));
            }
        });
    });

    // Load existing notes for all favorites
    loadAllNotes();

    // Add event listeners for the add note buttons
    document.querySelectorAll('.add-note-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const type = this.dataset.type;
            const id = this.dataset.id;
            const noteTextarea = document.querySelector(`.note-textarea[data-type="${type}"][data-id="${id}"]`);
            const noteText = noteTextarea.value.trim();

            if (!noteText) {
                alert('Note cannot be empty');
                return;
            }

            // Check if note already exists
            const noteContainer = document.querySelector(`.note-container[data-type="${type}"][data-id="${id}"]`);
            const noteExists = noteContainer.querySelector('.note-text');

            if (noteExists) {
                // Update existing note
                updateNote(type, id, noteText);
            } else {
                // Add new note
                addNote(type, id, noteText);
            }
        });
    });

    // Add event listeners for edit and delete buttons
    document.addEventListener('click', function(e) {
        // Edit note button
        if (e.target.classList.contains('edit-note-btn') || e.target.closest('.edit-note-btn')) {
            const btn = e.target.classList.contains('edit-note-btn') ? e.target : e.target.closest('.edit-note-btn');
            const type = btn.dataset.type;
            const id = btn.dataset.id;
            toggleNoteEdit(type, id, true);
        }

        // Delete note button
        if (e.target.classList.contains('delete-note-btn') || e.target.closest('.delete-note-btn')) {
            const btn = e.target.classList.contains('delete-note-btn') ? e.target : e.target.closest('.delete-note-btn');
            const type = btn.dataset.type;
            const id = btn.dataset.id;
            if (confirm('Are you sure you want to delete this note?')) {
                deleteNote(type, id);
            }
        }

        // Cancel edit button
        if (e.target.classList.contains('cancel-edit-btn') || e.target.closest('.cancel-edit-btn')) {
            const btn = e.target.classList.contains('cancel-edit-btn') ? e.target : e.target.closest('.cancel-edit-btn');
            const type = btn.dataset.type;
            const id = btn.dataset.id;
            toggleNoteEdit(type, id, false);
        }
    });
});

// Load notes for all favorite items
function loadAllNotes() {
    fetch('/api/notes')
        .then(response => response.json())
        .then(notes => {
            notes.forEach(note => {
                displayNote(note.type, note.id, note.note);
            });
        })
        .catch(error => console.error('Error fetching notes:', error));
}

// Display a note for a specific item
function displayNote(type, id, noteText) {
    const noteContainer = document.querySelector(`.note-container[data-type="${type}"][data-id="${id}"]`);
    if (!noteContainer) return;

    const noteDisplay = document.createElement('div');
    noteDisplay.className = 'note-display';
    noteDisplay.innerHTML = `
        <div class="note-text mb-2">${noteText}</div>
        <div class="btn-group">
            <button class="btn btn-outline-warning btn-sm edit-note-btn" data-type="${type}" data-id="${id}">
                <i class="fas fa-edit"></i> Edit
            </button>
            <button class="btn btn-outline-danger btn-sm delete-note-btn" data-type="${type}" data-id="${id}">
                <i class="fas fa-trash"></i> Delete
            </button>
        </div>
    `;

    // Clear the container and add the note display
    noteContainer.innerHTML = '';
    noteContainer.appendChild(noteDisplay);

    // Also update the textarea value for potential edits
    const textarea = document.querySelector(`.note-textarea[data-type="${type}"][data-id="${id}"]`);
    if (textarea) {
        textarea.value = noteText;
    }
}

// Add a new note
function addNote(type, id, noteText) {
    fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, id, note: noteText })
    })
    .then(response => {
        if (!response.ok) throw new Error('Failed to add note');
        return response.json();
    })
    .then(() => {
        displayNote(type, id, noteText);
        toggleNoteEdit(type, id, false);
    })
    .catch(error => console.error('Error adding note:', error));
}

// Update an existing note
function updateNote(type, id, noteText) {
    fetch(`/api/notes/${type}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: noteText })
    })
    .then(response => {
        if (!response.ok) throw new Error('Failed to update note');
        return response.json();
    })
    .then(() => {
        displayNote(type, id, noteText);
        toggleNoteEdit(type, id, false);
    })
    .catch(error => console.error('Error updating note:', error));
}

// Delete a note
function deleteNote(type, id) {
    fetch(`/api/notes/${type}/${id}`, { method: 'DELETE' })
    .then(response => {
        if (!response.ok) throw new Error('Failed to delete note');
        return response.json();
    })
    .then(() => {
        const noteContainer = document.querySelector(`.note-container[data-type="${type}"][data-id="${id}"]`);
        if (noteContainer) {
            noteContainer.innerHTML = '';
        }

        // Clear the textarea
        const textarea = document.querySelector(`.note-textarea[data-type="${type}"][data-id="${id}"]`);
        if (textarea) {
            textarea.value = '';
        }

        // Show the note editor
        const noteEditor = document.querySelector(`.note-editor[data-type="${type}"][data-id="${id}"]`);
        if (noteEditor) {
            noteEditor.style.display = 'block';
        }
    })
    .catch(error => console.error('Error deleting note:', error));
}

// Toggle between edit mode and display mode
function toggleNoteEdit(type, id, isEdit) {
    const noteContainer = document.querySelector(`.note-container[data-type="${type}"][data-id="${id}"]`);
    const noteEditor = document.querySelector(`.note-editor[data-type="${type}"][data-id="${id}"]`);

    if (isEdit) {
        // Switch to edit mode
        if (noteContainer) noteContainer.style.display = 'none';
        if (noteEditor) noteEditor.style.display = 'block';
    } else {
        // Switch to display mode
        if (noteEditor) noteEditor.style.display = 'none';
        if (noteContainer) noteContainer.style.display = 'block';
    }
}