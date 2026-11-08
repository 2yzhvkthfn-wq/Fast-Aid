// Mapbox access token
const mapElement = document.getElementById('map');
mapboxgl.accessToken = mapElement.getAttribute("data-mapboxtoken");

// API request to fetch emergencies
axios.get("/emergencies/info")
    .then( (res) => {
        console.log(res.data);

        // Initialize heat map
        map = new mapboxgl.Map({
            container: "map",
            style: "mapbox://styles/mapbox/dark-v9",
            center: [-73.610369,45.513182],
            zoom: 11.5
        });

        map.on("load", () => {
            // Add a new source from the GeoJSON data and set the 'cluster' option to true.
            map.addSource("emergency-requests", {
                type: "geojson",
                data: res.data
            });

            
            map.addLayer({
                "id": "emergencies",
                "type": "circle",
                "source": "emergency-requests",
                "paint": {
                    "circle-color": [
                        "match",
                        ["get", "status"],
                        "pending", "#ff2a2a",
                        "accepted", "#3dff78",
                        "#888888"
                    ],
                    "circle-radius": 18,
                    "circle-blur": 1,
                    "circle-opacity": 0.95
                }
            });
        });
    })
    .catch( (error) => {console.log(error);});
