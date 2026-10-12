// Routing Module - Handles distance calculations using OSRM with Haversine fallback
const RoutingModule = {
    OSRM_API: 'https://router.project-osrm.org/route/v1/driving',

    // Calculate distance and duration between two points using OSRM
    async getRoute(origin, destination) {
        try {
            const url = `${this.OSRM_API}/${origin.lon},${origin.lat};${destination.lon},${destination.lat}?overview=full`;
            
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error('OSRM request failed');
            }

            const data = await response.json();

            if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
                const route = data.routes[0];
                return {
                    distance: route.distance, // meters
                    duration: route.duration, // seconds
                    geometry: route.geometry,
                    source: 'osrm'
                };
            }

            throw new Error('No route found');
        } catch (error) {
            console.warn('OSRM failed, using Haversine fallback:', error);
            // Fallback to Haversine
            return this._calculateHaversineDistance(origin, destination);
        }
    },

    // Calculate Haversine distance between two points (straight line)
    _calculateHaversineDistance(origin, destination) {
        const R = 6371e3; // Earth's radius in meters
        const φ1 = origin.lat * Math.PI / 180;
        const φ2 = destination.lat * Math.PI / 180;
        const Δφ = (destination.lat - origin.lat) * Math.PI / 180;
        const Δλ = (destination.lon - origin.lon) * Math.PI / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
                  Math.cos(φ1) * Math.cos(φ2) *
                  Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        const distance = R * c; // meters
        
        // Estimate duration (assuming average speed of 50 km/h in urban areas)
        const duration = (distance / 1000) / 50 * 3600; // seconds

        return {
            distance,
            duration,
            geometry: null,
            source: 'haversine'
        };
    },

    // Format distance for display
    formatDistance(meters) {
        if (meters >= 1000) {
            return `${(meters / 1000).toFixed(1)} km`;
        }
        return `${Math.round(meters)} m`;
    },

    // Format duration for display
    formatDuration(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);

        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes} min`;
    }
};
