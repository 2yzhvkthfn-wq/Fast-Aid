const mapElement = document.getElementById('map');
const username = document.body.getAttribute('data-username');
const token = document.body.getAttribute('data-token');

const socket = io();
socket.emit('join', { username: username });

let selectedCategory = null;
let selectedSubType = null;
let map = null;
let marker = null;
let mapInitialized = false;

let requestDetails = {
    requesterId: username,
    category: null,
    subType: null,
    location: {
        address: '1380 Sherbrooke St W, Montreal, QC H3G 1J5, Canada',
        longitude: -73.5804,
        latitude: 45.4980
    }
};

const VEHICLE_SUBTYPES = ['dead_battery', 'flat_tire', 'vehicle_breakdown', 'other_mechanical'];
const HOME_SUBTYPES = ['plumbing', 'electrical', 'locksmith', 'heating'];

function showNotification(messageKey, type) {
    const notification = document.getElementById('notification');
    notification.textContent = t(messageKey);
    notification.className = 'notification' + (type ? ' ' + type : '');
    notification.classList.remove('hidden');
}

function hideNotification() {
    document.getElementById('notification').classList.add('hidden');
}

function showStep(stepId) {
    ['stepCategory', 'stepSubtype', 'stepLocation'].forEach(id => {
        document.getElementById(id).classList.toggle('hidden', id !== stepId);
    });
}

function buildSubtypeGrid(subtypes) {
    const grid = document.getElementById('subtypeGrid');
    grid.innerHTML = '';
    subtypes.forEach(subType => {
        const card = document.createElement('div');
        card.className = 'category-card';
        card.dataset.subtype = subType;
        card.innerHTML = `<h3 data-i18n="sub_${subType}">${t('sub_' + subType)}</h3>`;
        card.addEventListener('click', () => selectSubType(subType));
        grid.appendChild(card);
    });
    applyTranslations();
}

function selectCategory(category) {
    selectedCategory = category;
    selectedSubType = null;
    requestDetails.category = category;
    requestDetails.subType = null;

    if (category === 'medical' || category === 'pet') {
        goToLocationStep();
        return;
    }

    const subtypes = category === 'vehicle' ? VEHICLE_SUBTYPES : HOME_SUBTYPES;
    buildSubtypeGrid(subtypes);
    showStep('stepSubtype');
}

function selectSubType(subType) {
    selectedSubType = subType;
    requestDetails.subType = subType;
    goToLocationStep();
}

function goToLocationStep() {
    updateSelectedSummary();
    showStep('stepLocation');
    initMap();
}

function updateSelectedSummary() {
    let text = categoryLabel(selectedCategory);
    if (selectedSubType) {
        text += ' — ' + subTypeLabel(selectedSubType);
    }
    document.getElementById('selectedSummary').textContent = text;
}

function initMap() {
    if (mapInitialized) return;
    mapInitialized = true;

    mapboxgl.accessToken = mapElement.getAttribute('data-mapboxtoken');
    map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [-73.5804, 45.4980],
        zoom: 13
    });

    marker = new mapboxgl.Marker()
        .setLngLat([-73.5804, 45.4980])
        .addTo(map);

    const geocoder = new MapboxGeocoder({
        accessToken: mapboxgl.accessToken,
        placeholder: 'Search',
        mapboxgl: mapboxgl,
        marker: false,
        bbox: [-73.7077, 45.4215, -73.5145, 45.5773]
    });

    document.getElementById('geocoder').appendChild(geocoder.onAdd(map));

    geocoder.on('result', (e) => {
        requestDetails.location = {
            address: e.result.place_name,
            latitude: e.result.geometry.coordinates[1],
            longitude: e.result.geometry.coordinates[0]
        };
        marker.setLngLat(e.result.geometry.coordinates);
        map.flyTo({ center: e.result.geometry.coordinates });
    });
}

function showActiveRequestPanel(request, helperInfo) {
    document.getElementById('newRequestFlow').classList.add('hidden');
    document.getElementById('activeRequestPanel').classList.remove('hidden');

    let html = `
        <p><strong>${t('category')}:</strong> ${categoryLabel(request.category)}</p>
    `;
    if (request.subType) {
        html += `<p><strong>${t('problem_type')}:</strong> ${subTypeLabel(request.subType)}</p>`;
    }
    html += `<p><strong>${t('location')}:</strong> ${request.location.address}</p>`;
    html += `<p><strong>${t('status')}:</strong> <span class="status-badge status-${request.status}">${statusLabel(request.status)}</span></p>`;

    if (helperInfo) {
        html += `<p><strong>${t('helper')}:</strong> ${helperInfo.displayName}</p>`;
        html += `<p><strong>${t('contact_phone')}:</strong> ${helperInfo.phone}</p>`;
    }

    document.getElementById('activeRequestDetails').innerHTML = html;
}

async function loadActiveRequest() {
    try {
        const res = await fetch(`/requests/active/requester?token=${token}`);
        const data = await res.json();
        if (data.request) {
            document.getElementById('newRequestFlow').classList.add('hidden');
            showActiveRequestPanel(data.request);
            if (data.request.helperId && data.request.status !== 'pending') {
                const helperRes = await fetch(`/helpers/info?username=${data.request.helperId}&token=${token}`);
                const helperData = await helperRes.json();
                showActiveRequestPanel(data.request, helperData.helperDetails);
            } else if (data.request.status === 'pending') {
                showNotification('waiting_for_helper');
            }
        } else {
            document.getElementById('newRequestFlow').classList.remove('hidden');
            document.getElementById('activeRequestPanel').classList.add('hidden');
        }
    } catch (error) {
        console.log(error);
    }
}

document.querySelectorAll('[data-category]').forEach(card => {
    card.addEventListener('click', () => selectCategory(card.dataset.category));
});

document.getElementById('backToCategory').addEventListener('click', () => showStep('stepCategory'));
document.getElementById('backFromLocation').addEventListener('click', () => {
    if (selectedCategory === 'medical' || selectedCategory === 'pet') {
        showStep('stepCategory');
    } else {
        showStep('stepSubtype');
    }
});

document.getElementById('submitRequestBtn').addEventListener('click', () => {
    hideNotification();
    socket.emit('help-request', requestDetails);
});

socket.on('request-error', (data) => {
    showNotification(data.message, 'error');
});

socket.on('request-created', () => {
    showNotification('waiting_for_helper');
    loadActiveRequest();
});

socket.on('request-accepted', async (data) => {
    showNotification('helper_en_route', 'success');
    const helperRes = await fetch(`/helpers/info?username=${data.helperInfo.username}&token=${token}`);
    const helperData = await helperRes.json();
    const res = await fetch(`/requests/active/requester?token=${token}`);
    const reqData = await res.json();
    showActiveRequestPanel(reqData.request, helperData.helperDetails || data.helperInfo);
});

socket.on('status-updated', () => {
    loadActiveRequest();
});

document.addEventListener('languageChanged', () => {
    loadActiveRequest();
    updateSelectedSummary();
});

loadActiveRequest();
