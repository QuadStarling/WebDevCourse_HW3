

//--Get HTML DOM Element References 
const form = document.getElementById('songForm');
const list = document.getElementById('songList');
const submitBtn = document.getElementById('submitBtn');

function renderSavedSongsList() {
    const savedList = document.getElementById("savedSongsList");
    savedList.innerHTML = "";

    songs.forEach(song => {
        const li = document.createElement("li");
        li.innerHTML = `<a href="${song.url}" target="_blank">${song.title}</a>`;
        savedList.appendChild(li);
    });
}


// This runs automatically when the page finishes loading
document.addEventListener('DOMContentLoaded', () => {

    //1) Get From Local Storage
    const storedData = localStorage.getItem('songs');
    //02) if exsist
    if (storedData) {
        // If yes, turn the JSON string back into an Array
        songs = JSON.parse(storedData);
    } else {
        // If no, start with an empty array
        songs = [];
    }

    // SHOW the data
    renderSongs(songs);
    renderSavedSongsList();

    // Listen to radio button changes for sorting
    document.querySelectorAll('input[name="sortOption"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            sortSongs(e.target.value);
        });
    });
    sortSongs('date');
});

//User Click the Add Button
form.addEventListener('submit', (e) => {
    e.preventDefault();

    const title = document.getElementById('title').value;
    const url = document.getElementById('url').value;
    const rating = Number(document.getElementById('rating').value);
    const id = document.getElementById('songId').value;  // hidden field

    if (id) {
        // EDIT mode: update the existing song
        const songToEdit = songs.find(s => s.id == id);
        songToEdit.title = title;
        songToEdit.url = url;
        songToEdit.rating = rating;
    } else {
        // ADD mode: create new song
        const song = {
            id: Date.now(),
            title: title,
            url: url,
            rating: rating,
            dateAdded: Date.now()
        };
        songs.push(song);
    }

    saveAndRender();
    form.reset();

    // Reset submit button to ADD mode
    submitBtn.innerHTML = '<i class="fas fa-plus"></i> Add';
    submitBtn.classList.replace('btn-warning', 'btn-success');
    document.getElementById('songId').value = '';
});

//Save to Local storage and  render UI Table
function saveAndRender() {

    localStorage.setItem('songs', JSON.stringify(songs));
    //TODO RELOAD UI 
    renderSongs();
    renderSavedSongsList();   // refresh top list
    if (isCardView) renderCards();  // sync card view if active
}


//Display Song From Current Updated songs array as tale Rows 
function renderSongs() {
    list.innerHTML = ''; // Clear current list

    songs.forEach(song => {
        // Create table row
        const row = document.createElement('tr');

        row.innerHTML = `
            <td>
                <img src="${getThumbnailUrl(getYouTubeID(song.url))}" width="80" class="me-2">
                ${song.title}
            </td>
            <td>
                <a href="${song.url}" target="_blank" class="text-info">Watch</a>
                <button class="btn btn-sm btn-primary ms-2" onclick="playSong('${song.url}')">
                    <i class="fas fa-play"></i> Play
                </button>
            </td>
            <td>${song.rating}/10</td>
            <td class="text-end">
                <button class="btn btn-sm btn-warning me-2" onclick="editSong(${song.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteSong(${song.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        list.appendChild(row);
    });
}

function deleteSong(id) {
    if (confirm('Are you sure?')) {
        // Filter out the song with the matching ID
        songs = songs.filter(song => song.id !== id);
        saveAndRender();
    }
}

function getYouTubeID(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

function getThumbnailUrl(videoId) {
    return `https://img.youtube.com/vi/${videoId}/0.jpg`;
}

function sortSongs(option) {
    if (option === 'name') {
        songs.sort((a, b) => a.title.localeCompare(b.title));
    } else if (option === 'date') {
        songs.sort((a, b) => b.dateAdded - a.dateAdded); // newest first
    } else if (option === 'rating') {
        songs.sort((a, b) => b.rating - a.rating); // highest rating first
    }
    renderSongs();
    renderSavedSongsList();
    if (isCardView) renderCards();
}


function editSong(id) {

    const songToEdit = songs.find(song => song.id === id);


    document.getElementById('title').value = songToEdit.title;
    document.getElementById('url').value = songToEdit.url;
    document.getElementById('songId').value = songToEdit.id; // Set Hidden ID
    document.getElementById('rating').value = songToEdit.rating;

    submitBtn.innerHTML = '<i class="fas fa-save"></i> Update';
    submitBtn.classList.replace('btn-success', 'btn-warning');
}

function playSong(url) {
    const videoId = getYouTubeID(url);
    if (!videoId) {
        alert('Invalid YouTube URL');
        return;
    }

    const playerFrame = document.getElementById('playerFrame');
    const playerModal = document.getElementById('playerModal');

    playerFrame.src = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    playerModal.style.display = 'flex';
}

// Close the player modal
document.getElementById('closePlayer').addEventListener('click', () => {
    const playerFrame = document.getElementById('playerFrame');
    const playerModal = document.getElementById('playerModal');

    playerFrame.src = ''; // stop video
    playerModal.style.display = 'none';
});

let isCardView = false;

document.getElementById('toggleViewBtn').addEventListener('click', () => {
    isCardView = !isCardView;

    const table = document.querySelector('table');
    const cards = document.getElementById('cardContainer');
    const btn = document.getElementById('toggleViewBtn');

    if (isCardView) {
        table.style.display = 'none';
        cards.style.display = 'flex';
        btn.innerHTML = '<i class="fas fa-table"></i> Table View';
    } else {
        table.style.display = '';
        cards.style.display = 'none';
        btn.innerHTML = '<i class="fas fa-th"></i> Card View';
    }

    renderCards(); // render cards when switched
});

function renderCards() {
    const cardContainer = document.getElementById('cardContainer');
    cardContainer.innerHTML = '';

    songs.forEach(song => {
        const videoId = getYouTubeID(song.url) || '';
        const thumbnail = videoId
            ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
            : 'https://via.placeholder.com/150';

        const card = document.createElement('div');
        card.className = 'col-md-3';
        card.innerHTML = `
            <div class="card h-100">
                <img src="${thumbnail}" class="card-img-top" alt="${song.title}">
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title">${song.title}</h5>
                    <p class="card-text">Rating: ${song.rating}/10</p>
                    <div class="mt-auto d-flex justify-content-between">
                        <button class="btn btn-primary btn-sm" onclick="playSong('${song.url}')">
                            <i class="fas fa-play"></i> Play
                        </button>
                        <button class="btn btn-warning btn-sm" onclick="editSong(${song.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="deleteSong(${song.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
        cardContainer.appendChild(card);
    });
}


