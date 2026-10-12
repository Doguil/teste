// Geocoder Module - Handles address to coordinates conversion using OpenStreetMap/Nominatim
const Geocoder = {
    NOMINATIM_API: 'https://nominatim.openstreetmap.org/search',
    USER_AGENT: 'RouteOptimizer',

    // Geocode an address to coordinates
    async geocodeAddress(address) {
        // Check cache first
        const cached = Storage.getCachedGeocoding(address);
        if (cached) {
            return cached;
        }

        try {
            const params = new URLSearchParams({
                q: address,
                format: 'json',
                limit: 1,
                addressdetails: 1
            });

            const response = await fetch(
                `${this.NOMINATIM_API}?${params}`,
                {
                    headers: {
                        'User-Agent': this.USER_AGENT
                    }
                }
            );

            if (!response.ok) {
                throw new Error('Geocoding request failed');
            }

            const data = await response.json();

            if (data && data.length > 0) {
                const result = data[0];
                const coords = {
                    lat: parseFloat(result.lat),
                    lon: parseFloat(result.lon),
                    displayName: result.display_name
                };

                // Cache the result
                Storage.cacheGeocoding(address, coords);

                return coords;
            }

            return null;
        } catch (error) {
            console.error('Geocoding error:', error);
            return null;
        }
    },

    // Reverse geocode - get address from coordinates
    async reverseGeocode(lat, lon) {
        try {
            const params = new URLSearchParams({
                lat: lat.toString(),
                lon: lon.toString(),
                format: 'json',
                addressdetails: 1
            });

            const response = await fetch(
                `${this.NOMINATIM_API}/reverse?${params}`,
                {
                    headers: {
                        'User-Agent': this.USER_AGENT
                    }
                }
            );

            if (!response.ok) {
                throw new Error('Reverse geocoding request failed');
            }

            const data = await response.json();
            return data.display_name || null;
        } catch (error) {
            console.error('Reverse geocoding error:', error);
            return null;
        }
    },

    // Geocode multiple addresses with rate limiting
    async geocodeBatch(addresses, onProgress) {
        const results = [];
        const batchSize = 1; // Nominatim allows 1 request per second
        const delay = 1000; // 1 second delay between requests

        for (let i = 0; i < addresses.length; i++) {
            const address = addresses[i];
            const coords = await this.geocodeAddress(address);
            
            results.push({
                address,
                coords,
                success: coords !== null
            });

            if (onProgress) {
                onProgress(i + 1, addresses.length);
            }

            // Add delay between requests (except for the last one)
            if (i < addresses.length - 1) {
                await this._sleep(delay);
            }
        }

        return results;
    },

    // Get current location using browser Geolocation API
    getCurrentLocation() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation not supported by browser'));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        lat: position.coords.latitude,
                        lon: position.coords.longitude
                    });
                },
                (error) => {
                    reject(error);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                }
            );
        });
    },

    // Sleep helper for rate limiting
    _sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
};
