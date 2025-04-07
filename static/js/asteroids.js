function fetchAsteroids() {
    setLoading(true);
    const startDate = document.getElementById('asteroids-start').value;
    const endDate = document.getElementById('asteroids-end').value;

    fetch(`/api/asteroids?start_date=${startDate}&end_date=${endDate}`)
        .then(response => response.json())
        .then(data => {
            const tableBody = document.getElementById('asteroids-table');
            tableBody.innerHTML = '';

            let totalAsteroids = 0;
            let hazardousCount = 0;

            if (data.near_earth_objects) {
                Object.keys(data.near_earth_objects).forEach(date => {
                    const asteroids = data.near_earth_objects[date];
                    totalAsteroids += asteroids.length;

                    asteroids.forEach(asteroid => {
                        const isHazardous = asteroid.is_potentially_hazardous_asteroid;
                        if (isHazardous) hazardousCount++;

                        const diameterMin = asteroid.estimated_diameter.meters.estimated_diameter_min;
                        const diameterMax = asteroid.estimated_diameter.meters.estimated_diameter_max;
                        const diameterAvg = (diameterMin + diameterMax) / 2;

                        const approachData = asteroid.close_approach_data[0];
                        const missDistance = parseInt(approachData.miss_distance.kilometers);
                        const velocity = parseInt(approachData.relative_velocity.kilometers_per_hour);

                        const row = document.createElement('tr');
                        row.innerHTML = `
                            <td>${asteroid.name}</td>
                            <td>${diameterAvg.toFixed(2)}</td>
                            <td>${formatNumber(missDistance)}</td>
                            <td>${formatNumber(velocity)}</td>
                            <td>${isHazardous ? '<span class="text-danger">Có</span>' : 'Không'}</td>
                            <td>${approachData.close_approach_date}</td>
                            <td>
                                <button class="btn btn-outline-success btn-sm add-asteroid-favorite" data-id="${asteroid.id}">Yêu thích</button>
                                <button class="btn btn-outline-info btn-sm add-asteroid-note" data-id="${asteroid.id}">Ghi chú</button>
                                <div class="asteroid-note-container mt-2" data-id="${asteroid.id}"></div>
                            </td>
                        `;
                        tableBody.appendChild(row);
                    });
                });

                document.querySelectorAll('.add-asteroid-favorite').forEach(btn => {
                    btn.onclick = () => {
                        const id = btn.dataset.id;
                        const asteroid = Object.values(data.near_earth_objects).flat().find(a => a.id === id);
                        fetch('/api/favorites', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ type: 'asteroid', id, data: asteroid })
                        }).then(() => alert('Added to favorites!'));
                    };
                });

                document.querySelectorAll('.add-asteroid-note').forEach(btn => {
                    btn.onclick = () => {
                        const id = btn.dataset.id;
                        const note = prompt('Enter your note:');
                        if (note) {
                            fetch('/api/notes', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ type: 'asteroid', id, note })
                            }).then(() => displayNote('asteroid', id, `.asteroid-note-container[data-id="${id}"]`));
                        }
                    };
                });

                Object.values(data.near_earth_objects).flat().forEach(asteroid =>
                    displayNote('asteroid', asteroid.id, `.asteroid-note-container[data-id="${asteroid.id}"]`));
            }

            document.getElementById('asteroid-count-result').textContent = totalAsteroids;
            document.getElementById('hazardous-count').textContent = hazardousCount;
            setLoading(false);
        })
        .catch(error => {
            console.error('Error fetching asteroid data:', error);
            setLoading(false);
            alert('Failed to fetch asteroid data.');
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