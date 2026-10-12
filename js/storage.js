// Storage Module - Handles LocalStorage operations
const Storage = {
    KEYS: {
        ROUTES: 'route_optimizer_routes',
        CURRENT_ROUTE: 'route_optimizer_current',
        GEOCODING_CACHE: 'route_optimizer_geocoding_cache',
        DISTANCE_CACHE: 'route_optimizer_distance_cache',
        CLIENTS: 'route_optimizer_clients',
        START_POINTS: 'route_optimizer_start_points'
    },

    // Save data to LocalStorage
    save(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Error saving to LocalStorage:', error);
            return false;
        }
    },

    // Load data from LocalStorage
    load(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Error loading from LocalStorage:', error);
            return null;
        }
    },

    // Remove data from LocalStorage
    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Error removing from LocalStorage:', error);
            return false;
        }
    },

    // Save a route
    saveRoute(route) {
        const routes = this.load(this.KEYS.ROUTES) || [];
        const existingIndex = routes.findIndex(r => r.id === route.id);
        
        if (existingIndex >= 0) {
            routes[existingIndex] = route;
        } else {
            routes.unshift(route);
        }

        // Keep only last 50 routes
        if (routes.length > 50) {
            routes.pop();
        }

        return this.save(this.KEYS.ROUTES, routes);
    },

    // Load all routes
    loadRoutes() {
        return this.load(this.KEYS.ROUTES) || [];
    },

    // Load a specific route
    loadRoute(routeId) {
        const routes = this.loadRoutes();
        return routes.find(r => r.id === routeId) || null;
    },

    // Delete a route
    deleteRoute(routeId) {
        const routes = this.loadRoutes();
        const filtered = routes.filter(r => r.id !== routeId);
        return this.save(this.KEYS.ROUTES, filtered);
    },

    // Save current route state
    saveCurrentRoute(route) {
        return this.save(this.KEYS.CURRENT_ROUTE, route);
    },

    // Load current route state
    loadCurrentRoute() {
        return this.load(this.KEYS.CURRENT_ROUTE);
    },

    // Clear current route state
    clearCurrentRoute() {
        return this.remove(this.KEYS.CURRENT_ROUTE);
    },

    // Cache geocoding result
    cacheGeocoding(address, coords) {
        const cache = this.load(this.KEYS.GEOCODING_CACHE) || {};
        const key = this._normalizeAddress(address);
        cache[key] = {
            coords,
            timestamp: Date.now()
        };
        this.save(this.KEYS.GEOCODING_CACHE, cache);
    },

    // Get cached geocoding result
    getCachedGeocoding(address) {
        const cache = this.load(this.KEYS.GEOCODING_CACHE) || {};
        const key = this._normalizeAddress(address);
        const cached = cache[key];
        
        if (cached) {
            // Cache expires after 30 days
            const age = Date.now() - cached.timestamp;
            if (age < 30 * 24 * 60 * 60 * 1000) {
                return cached.coords;
            }
        }
        
        return null;
    },

    // Cache distance matrix
    cacheDistanceMatrix(points, matrix) {
        const cache = this.load(this.KEYS.DISTANCE_CACHE) || {};
        const key = this._generateDistanceKey(points);
        cache[key] = {
            matrix,
            timestamp: Date.now()
        };
        this.save(this.KEYS.DISTANCE_CACHE, cache);
    },

    // Get cached distance matrix
    getCachedDistanceMatrix(points) {
        const cache = this.load(this.KEYS.DISTANCE_CACHE) || {};
        const key = this._generateDistanceKey(points);
        const cached = cache[key];
        
        if (cached) {
            // Cache expires after 7 days
            const age = Date.now() - cached.timestamp;
            if (age < 7 * 24 * 60 * 60 * 1000) {
                return cached.matrix;
            }
        }
        
        return null;
    },

    // Clear all caches
    clearCaches() {
        this.remove(this.KEYS.GEOCODING_CACHE);
        this.remove(this.KEYS.DISTANCE_CACHE);
    },

    // Save clients
    saveClients(clients) {
        return this.save(this.KEYS.CLIENTS, clients);
    },

    // Load clients
    loadClients() {
        return this.load(this.KEYS.CLIENTS) || [];
    },

    // Add client
    addClient(client) {
        const clients = this.loadClients();
        client.id = Date.now();
        client.createdAt = new Date().toISOString();
        clients.push(client);
        return this.saveClients(clients);
    },

    // Update client
    updateClient(clientId, updatedData) {
        const clients = this.loadClients();
        const index = clients.findIndex(c => c.id === clientId);
        if (index >= 0) {
            clients[index] = { ...clients[index], ...updatedData };
            return this.saveClients(clients);
        }
        return false;
    },

    // Delete client
    deleteClient(clientId) {
        const clients = this.loadClients();
        const filtered = clients.filter(c => c.id !== clientId);
        return this.saveClients(filtered);
    },

    // Save start points
    saveStartPoints(startPoints) {
        return this.save(this.KEYS.START_POINTS, startPoints);
    },

    // Load start points
    loadStartPoints() {
        return this.load(this.KEYS.START_POINTS) || [];
    },

    // Add start point
    addStartPoint(startPoint) {
        const startPoints = this.loadStartPoints();
        startPoint.id = Date.now();
        startPoint.createdAt = new Date().toISOString();
        startPoints.push(startPoint);
        return this.saveStartPoints(startPoints);
    },

    // Update start point
    updateStartPoint(startPointId, updatedData) {
        const startPoints = this.loadStartPoints();
        const index = startPoints.findIndex(s => s.id === startPointId);
        if (index >= 0) {
            startPoints[index] = { ...startPoints[index], ...updatedData };
            return this.saveStartPoints(startPoints);
        }
        return false;
    },

    // Delete start point
    deleteStartPoint(startPointId) {
        const startPoints = this.loadStartPoints();
        const filtered = startPoints.filter(s => s.id !== startPointId);
        return this.saveStartPoints(filtered);
    },

    // Normalize address for caching
    _normalizeAddress(address) {
        return address.toLowerCase().trim().replace(/\s+/g, ' ');
    },

    // Generate key for distance matrix caching
    _generateDistanceKey(points) {
        const sorted = points
            .map(p => `${p.lat.toFixed(6)},${p.lon.toFixed(6)}`)
            .sort()
            .join('|');
        return sorted;
    }
};
