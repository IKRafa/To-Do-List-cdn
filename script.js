document.addEventListener('DOMContentLoaded', function () {
    const stickyWallView = document.getElementById('sticky-wall-view');
    const calendarView = document.getElementById('calendar-view');
    const profileView = document.getElementById('profile-view');
    const stickyWallLink = document.getElementById('sticky-wall-link');
    const calendarLink = document.getElementById('calendar-link');
    const profileLink = document.getElementById('profile-link');
    const userNicknameSpan = document.getElementById('user-nickname');

    const modal = document.getElementById('add-note-modal');
    const addNoteForm = document.getElementById('add-note-form');
    const cancelNoteBtn = document.getElementById('cancel-note');
    const colorSelectors = document.querySelectorAll('input[name="note-color"]');
    
    const profileForm = document.getElementById('profile-form');

    const calendarGrid = document.getElementById('calendar-grid');
    const monthYearDisplay = document.getElementById('month-year');
    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');
    let currentDate = new Date();

    const colorClasses = {
        yellow: 'bg-yellow-200',
        pink: 'bg-pink-200',
        orange: 'bg-orange-200',
        blue: 'bg-blue-200',
    };
    
    function switchView(viewToShow) {
        [stickyWallView, calendarView, profileView].forEach(view => {
            if (view) {
                view.classList.add('hidden');
            }
        });

        if (viewToShow) {
            viewToShow.classList.remove('hidden');
        }

        [stickyWallLink, calendarLink, profileLink].forEach(link => {
            if (link) {
                link.classList.remove('font-bold', 'text-blue-600', 'bg-blue-50');
                link.classList.add('text-gray-600');
            }
        });

        if (viewToShow === stickyWallView && stickyWallLink) {
            stickyWallLink.classList.add('font-bold', 'text-blue-600', 'bg-blue-50');
        } else if (viewToShow === calendarView && calendarLink) {
            calendarLink.classList.add('font-bold', 'text-blue-600', 'bg-blue-50');
        } else if (viewToShow === profileView && profileLink) {
            profileLink.classList.add('font-bold', 'text-blue-600', 'bg-blue-50');
        }
    }

    async function fetchNotes() {
        try {
            const response = await fetch('service/notes.php');
            if (!response.ok) throw new Error('Network response was not ok');
            const notes = await response.json();
            renderNotes(notes);
        } catch (error) {
            console.error('Fetch error:', error);
        }
    }

    function renderNotes(notes) {
        const wall = document.getElementById('sticky-wall');
        if (!wall) return;
        wall.innerHTML = '';

        if (notes.length === 0) {
            const emptyStateMessage = document.createElement('div');
            emptyStateMessage.className = 'col-span-full text-center text-gray-500 py-10 rounded-lg bg-gray-50';
            emptyStateMessage.innerHTML = `
                <h3 class="text-xl font-semibold">Belum ada catatan</h3>
                <p class="mt-1">Klik tombol '+' untuk membuat catatan pertamamu!</p>
            `;
            wall.appendChild(emptyStateMessage);
        } else {
            notes.forEach(note => {
                const noteEl = createNoteElement(note);
                wall.appendChild(noteEl);
            });
        }

        const addCard = document.createElement('div');
        addCard.className = 'bg-gray-100 rounded-lg p-6 flex items-center justify-center min-h-[200px] cursor-pointer hover:bg-gray-200 transition-colors';
        addCard.innerHTML = '<span class="text-5xl font-thin text-gray-400">+</span>';
        addCard.addEventListener('click', () => {
            if (modal) modal.classList.remove('hidden');
        });
        wall.appendChild(addCard);
    }

    function createNoteElement(note) {
        const noteEl = document.createElement('div');
        noteEl.className = `${colorClasses[note.color] || 'bg-yellow-200'} rounded-lg p-6 flex flex-col min-h-[200px] group relative`;
        
        let tasksHtml = note.tasks.map(task => 
            `<li data-task-id="${task.id}" class="task-item cursor-pointer ${task.is_completed ? 'completed' : ''}">${task.content}</li>`
        ).join('');

        noteEl.innerHTML = `
            <h3 class="font-bold text-lg mb-2">${note.title}</h3>
            <ul class="space-y-1 list-disc list-inside flex-grow">${tasksHtml}</ul>
            <button class="delete-note-btn absolute top-2 right-2 text-gray-500 hover:text-black opacity-0 group-hover:opacity-100 transition-opacity">&times;</button>
        `;

        const deleteBtn = noteEl.querySelector('.delete-note-btn');
        if(deleteBtn) {
            deleteBtn.addEventListener('click', async () => {
                await deleteNote(note.id);
                fetchNotes();
            });
        }

        noteEl.querySelectorAll('.task-item').forEach(item => {
            item.addEventListener('click', async () => {
                const taskId = item.dataset.taskId;
                const isCompleted = !item.classList.contains('completed');
                await toggleTaskCompletion(taskId, isCompleted);
                item.classList.toggle('completed');
            });
        });
        return noteEl;
    }

    async function deleteNote(noteId) {
        await fetch('service/notes.php', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: noteId })
        });
    }

    async function toggleTaskCompletion(taskId, isCompleted) {
        await fetch('service/notes.php', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: taskId, is_completed: isCompleted })
        });
    }

    if (addNoteForm) {
        addNoteForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const title = document.getElementById('note-title').value;
            const tasksRaw = document.getElementById('note-tasks').value;
            const tasks = tasksRaw.split('\n').filter(t => t.trim() !== '');
            const color = document.querySelector('input[name="note-color"]:checked').value;
            
            await fetch('service/notes.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, tasks, color })
            });
    
            if(modal) modal.classList.add('hidden');
            addNoteForm.reset();
            const yellowColor = document.querySelector('#color-yellow');
            if(yellowColor) yellowColor.checked = true;
            updateColorSelection();
            fetchNotes();
        });
    }

    if (cancelNoteBtn) {
        cancelNoteBtn.addEventListener('click', () => {
            if(modal) modal.classList.add('hidden');
            if(addNoteForm) addNoteForm.reset();
            const yellowColor = document.querySelector('#color-yellow');
            if(yellowColor) yellowColor.checked = true;
            updateColorSelection();
        });
    }

    function updateColorSelection() {
        colorSelectors.forEach(input => {
            const label = input.nextElementSibling;
            if (label) {
                if (input.checked) {
                    label.classList.add('ring-2', 'ring-blue-500');
                } else {
                    label.classList.remove('ring-2', 'ring-blue-500');
                }
            }
        });
    }
    colorSelectors.forEach(input => input.addEventListener('change', updateColorSelection));
    
    async function loadProfile() {
        try {
            const response = await fetch('service/profile.php');
            if (!response.ok) throw new Error('Failed to fetch profile');
            const profile = await response.json();
            
            const nicknameInput = document.getElementById('profile-nickname');
            const fullnameInput = document.getElementById('profile-fullname');
            const ageInput = document.getElementById('profile-age');
            const dobInput = document.getElementById('profile-dob');

            if(nicknameInput) nicknameInput.value = profile.nickname || '';
            if(fullnameInput) fullnameInput.value = profile.fullname || '';
            if(ageInput) ageInput.value = profile.age || '';
            if(dobInput) dobInput.value = profile.dob || '';

            if(userNicknameSpan) userNicknameSpan.textContent = profile.nickname || '';
        } catch (error) {
            console.error('Error loading profile:', error);
        }
    }

    if (profileForm) {
        profileForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const profileData = {
                nickname: document.getElementById('profile-nickname').value,
                fullname: document.getElementById('profile-fullname').value,
                age: document.getElementById('profile-age').value,
                dob: document.getElementById('profile-dob').value,
            };
    
            try {
                const response = await fetch('service/profile.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(profileData)
                });
                if (!response.ok) throw new Error('Failed to save profile');
                alert('Profil berhasil disimpan!');
                if(userNicknameSpan) userNicknameSpan.textContent = profileData.nickname;
            } catch (error) {
                console.error('Error saving profile:', error);
                alert('Gagal menyimpan profil.');
            }
        });
    }

    function renderCalendar() {
        if (!calendarGrid || !monthYearDisplay) return;
        calendarGrid.innerHTML = '';
        const month = currentDate.getMonth();
        const year = currentDate.getFullYear();
        monthYearDisplay.textContent = `${currentDate.toLocaleString('id-ID', { month: 'long' })} ${year}`;
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const dayHeaders = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

        dayHeaders.forEach(day => {
            const dayEl = document.createElement('div');
            dayEl.className = 'text-center font-bold text-gray-500';
            dayEl.textContent = day;
            calendarGrid.appendChild(dayEl);
        });

        for (let i = 0; i < firstDayOfMonth; i++) {
            calendarGrid.appendChild(document.createElement('div'));
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const dayEl = document.createElement('div');
            dayEl.className = 'text-center py-2 border rounded-lg';
            dayEl.textContent = day;
            if (day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear()) {
                dayEl.classList.add('bg-blue-600', 'text-white');
            }
            calendarGrid.appendChild(dayEl);
        }
    }

    if (prevMonthBtn) {
        prevMonthBtn.addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() - 1);
            renderCalendar();
        });
    }

    if (nextMonthBtn) {
        nextMonthBtn.addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() + 1);
            renderCalendar();
        });
    }
    
    if (stickyWallLink) stickyWallLink.addEventListener('click', (e) => { e.preventDefault(); switchView(stickyWallView); });
    if (calendarLink) calendarLink.addEventListener('click', (e) => { e.preventDefault(); switchView(calendarView); });
    if (profileLink) profileLink.addEventListener('click', (e) => { e.preventDefault(); switchView(profileView); });

    function init() {
        switchView(stickyWallView);
        fetchNotes();
        loadProfile();
        renderCalendar();
    }

    init();
});