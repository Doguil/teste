// Map Module - Leaflet integration for displaying routes
const MapModule = {
    map: null,
    markers: [],
    routeLine: null,

    // Initialize map
    init(containerId) {
        if (this.map) {
            return this.map;
        }

        // Check if Leaflet is available
        if (typeof L === 'undefined') {
            console.error('Leaflet is not loaded');
            return null;
        }

        // Create map
        this.map = L.map(containerId).setView([39.5, -8.5], 8); // Center on Portugal

        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(this.map);

        return this.map;
    },

    // Clear all markers and routes
    clear() {
        // Remove markers
        this.markers.forEach(marker => {
            if (marker) {
                this.map.removeLayer(marker);
            }
        });
        this.markers = [];

        // Remove route line
        if (this.routeLine) {
            this.map.removeLayer(this.routeLine);
            this.routeLine = null;
        }
    },

    // Add a marker
    addMarker(lat, lon, options = {}) {
        const {
            title = '',
            icon = 'default',
            order = null,
            completed = false
        } = options;

        let markerIcon;

        if (icon === 'start') {
            markerIcon = L.divIcon({
                className: 'custom-marker marker-start',
                html: '<div class="marker-icon">🚀</div>',
                iconSize: [40, 40],
                iconAnchor: [20, 20]
            });
        } else if (icon === 'stop') {
            const color = completed ? '#00b894' : '#e94560';
            markerIcon = L.divIcon({
                className: 'custom-marker marker-stop',
                html: `<div class="marker-icon" style="background-color: ${color}">${order}</div>`,
                iconSize: [35, 35],
                iconAnchor: [17, 17]
            });
        } else {
            markerIcon = L.divIcon({
                className: 'custom-marker',
                html: '<div class="marker-icon">📍</div>',
                iconSize: [35, 35],
                iconAnchor: [17, 17]
            });
        }

        const marker = L.marker([lat, lon], { icon: markerIcon })
            .addTo(this.map);

        if (title) {
            marker.bindPopup(title);
        }

        this.markers.push(marker);
        return marker;
    },

    // Draw route line
    drawRoute(points, options = {}) {
        const {
            color = '#e94560',
            weight = 4,
            opacity = 0.7
        } = options;

        if (this.routeLine) {
            this.map.removeLayer(this.routeLine);
        }

        const latLngs = points.map(p => [p.lat, p.lon]);

        this.routeLine = L.polyline(latLngs, {
            color,
            weight,
            opacity
        }).addTo(this.map);

        return this.routeLine;
    },

    // Fit map to show all points
    fitBounds(points) {
        if (!points || points.length === 0) return;

        const bounds = L.latLngBounds(points.map(p => [p.lat, p.lon]));
        this.map.fitBounds(bounds, { padding: [50, 50] });
    },

    // Display optimized route on map
    displayRoute(stops) {
        this.clear();

        const points = [];

        stops.forEach((stop, index) => {
            // Add marker
            const icon = stop.isStart ? 'start' : 'stop';
            this.addMarker(stop.lat, stop.lon, {
                title: `<b>${stop.name}</b><br>${stop.address}`,
                icon,
                order: stop.order,
                completed: stop.completed
            });

            points.push({ lat: stop.lat, lon: stop.lon });
        });

        // Draw route line
        this.drawRoute(points);

        // Fit bounds
        this.fitBounds(points);
    },

    // Update marker completion status
    updateMarkerCompletion(index, completed, isStart) {
        if (this.markers[index]) {
            const marker = this.markers[index];
            const stopElement = marker.getElement();
            if (stopElement) {
                const iconElement = stopElement.querySelector('.marker-icon');
                if (iconElement && !isStart) {
                    iconElement.style.backgroundColor = completed ? '#00b894' : '#e94560';
                }
            }
        }
    },

    // Update marker order
    updateMarkerOrder(index, newOrder, isStart) {
        if (this.markers[index]) {
            const marker = this.markers[index];
            const stopElement = marker.getElement();
            if (stopElement) {
                const iconElement = stopElement.querySelector('.marker-icon');
                if (iconElement && !isStart) {
                    iconElement.textContent = newOrder;
                }
            }
        }
    },

    // Destroy map
    destroy() {
        if (this.map) {
            this.map.remove();
            this.map = null;
            this.markers = [];
            this.routeLine = null;
        }
    }
};
