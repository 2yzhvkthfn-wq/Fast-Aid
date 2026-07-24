const mapElement = document.getElementById('map');
const username = document.body.getAttribute('data-username');
const token = document.body.getAttribute('data-token');

const socket = io();
socket.emit('join', { username: username });

const notificationElement = document.getElementById('notification');
const requestsTableBody = document.getElementById('requestsTable').getElementsByTagName('tbody')[0];
const emptyHint = document.getElementById('emptyHint');

let helperInfo = {};
let map = null;
let activeRequestId = null;

function formatDate(dateValue) {
    return new Date(dateValue).toLocaleString(getLang() === 'fr' ? 'fr-CA' : 'en-CA');
}

function updateEmptyHint() {
    emptyHint.style.display = requestsTableBody.rows.length === 0 ? 'block' : 'none';
}

axios.get(`/helpers/info?username=${username}&token=${token}`)
    .then((res) => {
        helperInfo = res.data.helperDetails;
        helperInfo.location = {
            address: helperInfo.location.address,
            longitude: helperInfo.location.coordinates[0],
            latitude: helperInfo.location.coordinates[1]
        };

        mapboxgl.accessToken = mapElement.getAttribute('data-mapboxtoken');
        map = new mapboxgl.Map({
            container: 'map',
            style: 'mapbox://styles/mapbox/streets-v12',
            center: [helperInfo.location.longitude, helperInfo.location.latitude],
            zoom: 13
        });

        new mapboxgl.Marker()
            .setLngLat([helperInfo.location.longitude, helperInfo.location.latitude])
            .addTo(map);

        loadActiveRequest();
    })
    .catch((error) => console.log(error));

function renderStatusActions(request) {
    const container = document.getElementById('statusActions');
    container.innerHTML = '';
    activeRequestId = request._id;

    const actions = [];
    if (request.status === 'accepted') actions.push({ status: 'en_route', label: 'mark_en_route' });
    if (request.status === 'en_route') actions.push({ status: 'arrived', label: 'mark_arrived' });
    if (request.status === 'arrived') actions.push({ status: 'completed', label: 'mark_completed' });

    actions.forEach(action => {
        const btn = document.createElement('button');
        btn.className = 'primary-btn';
        btn.textContent = t(action.label);
        btn.addEventListener('click', () => {
            socket.emit('status-update', {
                requestId: request._id,
                helperId: username,
                status: action.status
            });
        });
        container.appendChild(btn);
    });
}

function showActivePanel(request) {
    document.getElementById('activePanel').classList.remove('hidden');
    let html = `
        <p><strong>${t('requester')}:</strong> ${request.requesterId}</p>
        <p><strong>${t('category')}:</strong> ${categoryLabel(request.category)}</p>
    `;
    if (request.subType) {
        html += `<p><strong>${t('problem_type')}:</strong> ${subTypeLabel(request.subType)}</p>`;
    }
    html += `<p><strong>${t('location')}:</strong> ${request.location.address}</p>`;
    html += `<p><strong>${t('status')}:</strong> <span class="status-badge status-${request.status}">${statusLabel(request.status)}</span></p>`;
    document.getElementById('activeDetails').innerHTML = html;
    renderStatusActions(request);

    if (map && request.location && request.location.coordinates) {
        new mapboxgl.Marker({ color: '#e74c3c' })
            .setLngLat(request.location.coordinates)
            .addTo(map);
    }
}

async function loadActiveRequest() {
    try {
        const res = await fetch(`/requests/active/helper?token=${token}`);
        const data = await res.json();
        if (data.request) {
            showActivePanel(data.request);
            notificationElement.innerHTML = `<i class="fas fa-check-circle" style="color:#27ae60"></i> ${t('active_request')}`;
        } else {
            document.getElementById('activePanel').classList.add('hidden');
            activeRequestId = null;
            notificationElement.innerHTML = `<span data-i18n="helper_waiting">${t('helper_waiting')}</span>`;
        }
    } catch (error) {
        console.log(error);
    }
}

socket.on('incoming-request', (requestInfo) => {
    notificationElement.innerHTML = `<i class="fas fa-exclamation-circle" style="color:#e74c3c"></i> ${t('incoming_request')}`;

    if (activeRequestId) return;

    const row = requestsTableBody.insertRow();
    row.dataset.requestId = requestInfo.requestId;
    row.innerHTML = `
        <td>${requestInfo.requesterId}</td>
        <td>${categoryLabel(requestInfo.category)}${requestInfo.subType ? ' / ' + subTypeLabel(requestInfo.subType) : ''}</td>
        <td>${requestInfo.location.address}</td>
        <td>${formatDate(requestInfo.requestTime)}</td>
        <td><button class="accept-btn" data-id="${requestInfo.requestId}">${t('accept')}</button></td>
    `;
    updateEmptyHint();

    if (map) {
        new mapboxgl.Marker({ color: '#e74c3c' })
            .setLngLat([requestInfo.location.longitude, requestInfo.location.latitude])
            .addTo(map);
    }
});

socket.on('request-taken', (data) => {
    const row = requestsTableBody.querySelector(`tr[data-request-id="${data.requestId}"]`);
    if (row) row.remove();
    updateEmptyHint();
});

requestsTableBody.addEventListener('click', (event) => {
    if (!event.target.classList.contains('accept-btn')) return;

    const requestId = event.target.getAttribute('data-id');
    socket.emit('request-accepted', {
        requestId: requestId,
        helperInfo: helperInfo
    });

    event.target.textContent = t('accepted');
    event.target.disabled = true;
    event.target.className = 'accepted-btn';

    setTimeout(loadActiveRequest, 500);
});

socket.on('accept-failed', () => {
    alert(t('already_accepted'));
});

socket.on('status-updated', () => {
    loadActiveRequest();
});

document.addEventListener('languageChanged', loadActiveRequest);

updateEmptyHint();
