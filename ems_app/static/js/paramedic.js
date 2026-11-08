// Mapbox access token
const mapElement = document.getElementById('map');
mapboxgl.accessToken = mapElement.getAttribute("data-mapboxtoken");

const socket = io(); // object to emit events to and listen to events from the server
const username = document.body.getAttribute("data-username");
const notificationElement = document.getElementById('notification');
const emergencyRequestsTable = document.getElementById('emergency-requests').getElementsByTagName('tbody')[0];

socket.emit("join", { username: username }); // Send a join signal to the server to join a room named after username


let paramedicInfo = {};
let map = {};

// Request to retrieve paramedic info and initialize location on map
axios.get(`/paramedics/info?username=${username}`)
    .then((res) => {
        paramedicInfo = res.data.paramedicDetails;
        paramedicInfo.location = {
            address: paramedicInfo.location.address,
            longitude: paramedicInfo.location.coordinates[0],
            latitude: paramedicInfo.location.coordinates[1]
        }

        // Initialize the map
        map = new mapboxgl.Map({
            container: 'map', // ID of HTML element
            style: 'mapbox://styles/mapbox/streets-v12',
            center: [paramedicInfo.location.longitude, paramedicInfo.location.latitude], // Starting position
            zoom: 12
        });

        // Add a marker at the initial position
        const marker = new mapboxgl.Marker()
            .setLngLat([paramedicInfo.location.longitude, paramedicInfo.location.latitude])
            .addTo(map);

    })
    .catch((error) => {
        console.log(error)
    })



// Listen to "emergency-request" event from the server
let emergencyDetails = {};

socket.on("emergency-request", (emergencyInfo) => {

    console.log(`Paramedic ${username} received the emergency request`)
    console.log(`EMERGENCY ${JSON.stringify(emergencyInfo)}`)

    // Latest notification
    notificationElement.innerHTML =
        `<i class="fas fa-exclamation-circle" style="color: #087a72;"></i>
        Patient ${emergencyInfo.patientId} needs help now.<br>
        <i class="fas fa-map-marker-alt" style="color: #087a72;"></i>
        Location: ${emergencyInfo.location.address}`

    // Marker to show the new emergency location
    new mapboxgl.Marker({
        element: createCustomMarker('url(/static/images/patient.png)'), // Custom patient marker
    })
        .setLngLat([emergencyInfo.location.longitude, emergencyInfo.location.latitude])
        .addTo(map);

    const readableDate = convertDateFormat(emergencyInfo.emergencyTime) // Convert Date format

    // Add new row to the emergency table
    const newRow = emergencyRequestsTable.insertRow();
    newRow.innerHTML = `
        <td>${emergencyInfo.patientId}</td>
        <td>${emergencyInfo.location.address}</td>
        <td>${readableDate}</td>
        <td>
            <button 
                class="accept-btn" 
                data-emergency-id="${emergencyInfo.emergencyId}" 
                data-patient-name="${emergencyInfo.patientId}">
                Accept
            </button>
        </td>
    `;

})

// Accept buttons
emergencyRequestsTable.addEventListener('click', (event) => {
    if (event.target.classList.contains('accept-btn')) {
        AcceptHelp(event.target.getAttribute('data-emergency-id'), event.target.getAttribute('data-patient-name'));
    }
});


// Send a "request-accepted" signal to the server
function AcceptHelp(emergencyId, patientName) {
    socket.emit("request-accepted", {
        emergencyId: emergencyId,
        paramedicInfo: paramedicInfo
    });

    const acceptButton = document.querySelector(`button[data-emergency-id='${emergencyId}']`);
    acceptButton.textContent = 'Accepted';
    acceptButton.disabled = true;
    acceptButton.classList.remove('accept-btn');
    acceptButton.classList.add('accepted-btn');

    // Update the notification
    notificationElement.innerHTML = `<i class="fas fa-check-circle" style="color: #0f6b45;"></i>
                                        You accepted the request for ${patientName}.`;
}


// Helper method to convert date Format 
function convertDateFormat(emergencyDate) {
    const date = new Date(emergencyDate)
    // Format the date to a more readable format
    const readableDate = date.toLocaleString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        timeZoneName: "short"
    });
    return readableDate
}

// Helper method to create a custom marker
function createCustomMarker(url) {
    const element = document.createElement('div');
    element.style.backgroundImage = url;
    element.style.width = '45px';
    element.style.height = '40px';
    element.style.backgroundSize = 'contain'; // Make sure the image fits within the element
    element.style.backgroundRepeat = 'no-repeat'; // Prevent repetition
    element.style.backgroundPosition = 'center';
    return element;
}