const token = document.body.getAttribute('data-token');

const tabs = document.querySelectorAll('.admin-tabs button');
const sections = {
    users: document.getElementById('tabUsers'),
    requests: document.getElementById('tabRequests'),
    map: document.getElementById('tabMap')
};

tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        Object.values(sections).forEach(s => s.classList.remove('active'));
        sections[tab.dataset.tab].classList.add('active');
        if (tab.dataset.tab === 'map') initAdminMap();
    });
});

async function loadUsers() {
    const res = await axios.get(`/admin/users?token=${token}`);
    const tbody = document.querySelector('#usersTable tbody');
    tbody.innerHTML = '';

    res.data.users.forEach(user => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${user.username}</td>
            <td>${user.displayName}</td>
            <td>${user.phone}</td>
            <td>${user.profession || '—'}</td>
            <td>${user.canRequest ? '✓' : '—'}</td>
            <td>${user.canHelp ? '✓' : '—'}</td>
            <td>${user.username !== 'admin' ? `<button class="secondary-btn delete-user" data-username="${user.username}">${t('admin_delete')}</button>` : ''}</td>
        `;
    });
}

async function loadRequests() {
    const res = await axios.get(`/admin/requests?token=${token}`);
    const tbody = document.querySelector('#requestsTable tbody');
    tbody.innerHTML = '';

    res.data.requests.forEach(request => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${request.requesterId}</td>
            <td>${request.helperId || '—'}</td>
            <td>${categoryLabel(request.category)}${request.subType ? ' / ' + subTypeLabel(request.subType) : ''}</td>
            <td>
                <select class="status-select" data-id="${request._id}">
                    <option value="pending" ${request.status === 'pending' ? 'selected' : ''}>${statusLabel('pending')}</option>
                    <option value="accepted" ${request.status === 'accepted' ? 'selected' : ''}>${statusLabel('accepted')}</option>
                    <option value="en_route" ${request.status === 'en_route' ? 'selected' : ''}>${statusLabel('en_route')}</option>
                    <option value="arrived" ${request.status === 'arrived' ? 'selected' : ''}>${statusLabel('arrived')}</option>
                    <option value="completed" ${request.status === 'completed' ? 'selected' : ''}>${statusLabel('completed')}</option>
                </select>
            </td>
            <td>${request.location ? request.location.address : '—'}</td>
            <td><button class="secondary-btn delete-request" data-id="${request._id}">${t('admin_delete')}</button></td>
        `;
    });
}

document.getElementById('createUserForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const payload = {
        username: form.username.value,
        password: form.password.value,
        displayName: form.displayName.value,
        phone: form.phone.value,
        canRequest: form.canRequest.checked,
        canHelp: form.canHelp.checked,
        profession: form.profession.value || null
    };

    if (form.canHelp.checked && form.lng.value && form.lat.value) {
        payload.location = {
            type: 'Point',
            address: form.address.value,
            coordinates: [Number(form.lng.value), Number(form.lat.value)]
        };
    }

    await axios.post(`/admin/users?token=${token}`, payload);
    form.reset();
    loadUsers();
});

document.querySelector('#usersTable tbody').addEventListener('click', async (e) => {
    if (!e.target.classList.contains('delete-user')) return;
    await axios.delete(`/admin/users/${e.target.dataset.username}?token=${token}`);
    loadUsers();
});

document.querySelector('#requestsTable tbody').addEventListener('change', async (e) => {
    if (!e.target.classList.contains('status-select')) return;
    await axios.put(`/admin/requests/${e.target.dataset.id}?token=${token}`, { status: e.target.value });
});

document.querySelector('#requestsTable tbody').addEventListener('click', async (e) => {
    if (!e.target.classList.contains('delete-request')) return;
    await axios.delete(`/admin/requests/${e.target.dataset.id}?token=${token}`);
    loadRequests();
});

let adminMapInitialized = false;

async function initAdminMap() {
    if (adminMapInitialized) return;
    adminMapInitialized = true;

    const mapElement = document.getElementById('adminMap');
    mapboxgl.accessToken = mapElement.getAttribute('data-mapboxtoken');

    const res = await axios.get(`/requests/geojson?token=${token}`);
    const map = new mapboxgl.Map({
        container: 'adminMap',
        style: 'mapbox://styles/mapbox/dark-v10',
        center: [-73.5804, 45.4980],
        zoom: 12
    });

    map.on('load', () => {
        map.addSource('requests', { type: 'geojson', data: res.data });
        map.addLayer({
            id: 'requests-layer',
            type: 'circle',
            source: 'requests',
            paint: {
                'circle-color': [
                    'match',
                    ['get', 'status'],
                    'pending', 'rgba(255,0,0,0.7)',
                    'completed', 'rgba(39,174,96,0.8)',
                    'rgba(52,152,219,0.8)'
                ],
                'circle-radius': 12,
                'circle-blur': 0.4
            }
        });
    });
}

document.addEventListener('languageChanged', () => {
    loadRequests();
});

loadUsers();
loadRequests();
