// Initialize the map, centered on the College of Engineering Trivandrum (CET)
const map = L.map('map').setView([8.5477, 76.9067], 15);

// Add the OpenStreetMap tile layer
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Add a marker for the College of Engineering Trivandrum
const cetMarker = L.marker([8.5477, 76.9067]).addTo(map);
cetMarker.bindPopup("<b>College of Engineering Trivandrum</b><br>Sreekaryam, Thiruvananthapuram").openPopup();

// --- Geosearch integration for finding locations by name ---
const provider = new GeoSearch.OpenStreetMapProvider();
const searchControl = new GeoSearch.GeoSearchControl({
    provider: provider,
    style: 'bar',
    showMarker: true,
    showPopup: true,
    autoClose: true,
    searchLabel: 'Search places...',
    animateZoom: true,
    resultFormat: function(data) {
        return data.label;
    }
});
map.addControl(searchControl);

// --- Locate control for detecting the user's current location ---
L.control.locate({
    position: 'topleft',
    strings: {
        title: "Show me where I am!"
    },
    locateOptions: {
        maxZoom: 16
    }
}).addTo(map);

// --- Routing integration for "from" and "to" locations ---
const getRouteBtn = document.getElementById('get-route-btn');
const fromInput = document.getElementById('from-location');
const toInput = document.getElementById('to-location');
let routeLayer = null;

getRouteBtn.addEventListener('click', async () => {
    const fromLocation = fromInput.value;
    const toLocation = toInput.value;

    if (!fromLocation || !toLocation) {
        alert("Please enter both 'from' and 'to' locations.");
        return;
    }

    getRouteBtn.disabled = true;
    getRouteBtn.textContent = 'Calculating...';

    try {
        // Geocode the "from" and "to" locations
        const fromResult = await provider.search({ query: fromLocation });
        const toResult = await provider.search({ query: toLocation });

        if (fromResult.length === 0 || toResult.length === 0) {
            alert("Could not find one or both locations. Please be more specific.");
            return;
        }

        // Use the OSRM routing service
        const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${fromResult[0].x},${fromResult[0].y};${toResult[0].x},${toResult[0].y}?overview=full&geometries=geojson`;

        const response = await fetch(osrmUrl);
        const data = await response.json();

        if (data.code !== 'Ok') {
            alert("Routing failed. " + (data.message || 'Unknown error.'));
            return;
        }

        // Remove old route and markers
        if (routeLayer) {
            map.removeLayer(routeLayer);
        }
        map.eachLayer(function(layer) {
            if (layer instanceof L.Marker && layer !== cetMarker) {
                map.removeLayer(layer);
            }
        });

        // Add the new route to the map
        const routeGeoJSON = data.routes[0].geometry;
        routeLayer = L.geoJSON(routeGeoJSON, {
            style: {
                color: '#007bff',
                weight: 5,
                opacity: 0.7
            }
        }).addTo(map);

        // Add markers for the start and end points of the route
        const startMarker = L.marker([fromResult[0].y, fromResult[0].x]).addTo(map);
        const endMarker = L.marker([toResult[0].y, toResult[0].x]).addTo(map);

        const routeDistance = (data.routes[0].distance / 1000).toFixed(2); // in km
        const routeDuration = (data.routes[0].duration / 60).toFixed(0); // in minutes
        
        startMarker.bindPopup(`<b>From:</b> ${fromResult[0].label}`).openPopup();
        endMarker.bindPopup(`<b>To:</b> ${toResult[0].label}<br><b>Distance:</b> ${routeDistance} km<br><b>Est. Time:</b> ${routeDuration} min`).openPopup();

        // Fit the map view to the bounds of the route
        map.fitBounds(routeLayer.getBounds(), { padding: [50, 500] });

    } catch (error) {
        console.error("Error fetching route:", error);
        alert("An error occurred while fetching the route.");
    } finally {
        getRouteBtn.disabled = false;
        getRouteBtn.textContent = 'Get Route';
    }
});