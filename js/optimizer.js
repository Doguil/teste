// Optimizer Module - Route optimization using Nearest Neighbor + 2-opt
const Optimizer = {
    // Main optimization function
    async optimizeRoute(startPoint, destinations, stopTime = 5, startTime = null, shouldOptimizeOrder = true) {
        // Validate inputs
        if (!startPoint || !startPoint.lat || !startPoint.lon) {
            throw new Error('Invalid start point');
        }

        if (!destinations || destinations.length === 0) {
            throw new Error('No destinations provided');
        }

        // Ensure all destinations have coordinates
        const allPoints = [startPoint, ...destinations];
        for (const point of allPoints) {
            if (!point.lat || !point.lon) {
                throw new Error('All points must have coordinates');
            }
        }

        // Calculate distance matrix
        const matrix = await this._calculateDistanceMatrix(allPoints);

        // Create initial order (0 = start point, 1..n = destinations)
        const initialOrder = Array.from({ length: allPoints.length }, (_, i) => i);

        // Optimize order if enabled
        const optimizedOrder = shouldOptimizeOrder ? this._optimize(initialOrder, matrix) : initialOrder;

        // Calculate statistics
        const totalDistance = this._calculateTotalDistance(optimizedOrder, matrix);
        const totalTime = this._calculateTotalTime(totalDistance, destinations.length, stopTime);
        const originalDistance = shouldOptimizeOrder ? this._calculateTotalDistance(initialOrder, matrix) : totalDistance;

        // Build stops array with ETAs
        const routeWithETAs = this._buildStopsArray(startPoint, destinations, optimizedOrder, matrix, stopTime, startTime);

        return {
            stops: routeWithETAs,
            totalDistance,
            totalTime,
            originalDistance,
            savings: shouldOptimizeOrder ? originalDistance - totalDistance : 0,
            savingsPercent: shouldOptimizeOrder ? ((originalDistance - totalDistance) / originalDistance * 100).toFixed(1) : 0
        };
    },

    // Calculate distance matrix between all points
    async _calculateDistanceMatrix(points) {
        const n = points.length;
        const distances = Array(n).fill(null).map(() => Array(n).fill(0));
        const durations = Array(n).fill(null).map(() => Array(n).fill(0));

        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                if (i === j) {
                    distances[i][j] = 0;
                    durations[i][j] = 0;
                } else {
                    const result = await RoutingModule.getRoute(points[i], points[j]);
                    if (result) {
                        // Convert meters to kilometers
                        distances[i][j] = result.distance / 1000;
                        // Convert seconds to minutes
                        durations[i][j] = result.duration / 60;
                    } else {
                        // Fallback to Haversine distance (already in km)
                        const haversineDist = this._haversineDistance(
                            points[i].lat, points[i].lon,
                            points[j].lat, points[j].lon
                        );
                        distances[i][j] = haversineDist;
                        durations[i][j] = (haversineDist / 50) * 60; // Assume 50 km/h average, result in minutes
                    }
                }
            }
        }

        return { distances, durations };
    },

    // Haversine distance calculation (fallback)
    _haversineDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth's radius in km
        const dLat = this._toRad(lat2 - lat1);
        const dLon = this._toRad(lon2 - lon1);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(this._toRad(lat1)) * Math.cos(this._toRad(lat2)) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    },

    _toRad(degrees) {
        return degrees * (Math.PI / 180);
    },

    // Build stops array with ETA and details
    _buildStopsArray(startPoint, destinations, order, matrix, stopTime, startTime) {
        const stops = [];
        let currentTime = startTime ? this._parseTime(startTime) : Date.now();
        let cumulativeDistance = 0;

        for (let i = 0; i < order.length; i++) {
            const index = order[i];
            const point = index === 0 ? startPoint : destinations[index - 1];
            
            let distanceToNext = 0;
            let durationToNext = 0;

            if (i < order.length - 1) {
                const nextIndex = order[i + 1];
                // Matrix values are now in km and minutes
                distanceToNext = matrix.distances[index][nextIndex];
                durationToNext = matrix.durations[index][nextIndex];
            }

            const eta = new Date(currentTime);
            
            stops.push({
                order: i + 1,
                name: point.name || (index === 0 ? 'Ponto de Partida' : `Paragem ${i}`),
                address: point.address || '',
                lat: point.lat,
                lon: point.lon,
                notes: point.notes || '',
                distanceFromPrevious: cumulativeDistance,
                durationFromPrevious: i === 0 ? 0 : stopTime,
                distanceToNext,
                durationToNext,
                eta: eta.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }),
                completed: false,
                isStart: index === 0
            });

            cumulativeDistance += distanceToNext;
            // durationToNext is in minutes, convert to milliseconds
            currentTime += durationToNext * 60 * 1000 + (i > 0 ? stopTime * 60 * 1000 : 0);
        }

        return stops;
    },

    // Main optimization algorithm (Nearest Neighbor + 2-opt)
    _optimize(initialOrder, matrix) {
        // Start with Nearest Neighbor
        let currentOrder = this._nearestNeighbor(initialOrder, matrix);
        
        // Improve with 2-opt
        currentOrder = this._twoOpt(currentOrder, matrix);
        
        return currentOrder;
    },

    // Nearest Neighbor algorithm
    _nearestNeighbor(order, matrix) {
        const n = order.length;
        const visited = new Set();
        const result = [];
        
        // Start from first point (start point)
        let current = order[0];
        visited.add(current);
        result.push(current);

        while (visited.size < n) {
            let nearest = null;
            let nearestDist = Infinity;

            // Find nearest unvisited neighbor
            for (const point of order) {
                if (!visited.has(point)) {
                    const dist = matrix.distances[current][point];
                    if (dist < nearestDist) {
                        nearestDist = dist;
                        nearest = point;
                    }
                }
            }

            if (nearest !== null) {
                visited.add(nearest);
                result.push(nearest);
                current = nearest;
            }
        }

        return result;
    },

    // 2-opt improvement algorithm
    _twoOpt(order, matrix) {
        let improved = true;
        let bestOrder = [...order];
        let bestDistance = this._calculateTotalDistance(bestOrder, matrix);

        const maxIterations = 1000;
        let iterations = 0;

        while (improved && iterations < maxIterations) {
            improved = false;
            iterations++;

            for (let i = 0; i < bestOrder.length - 1; i++) {
                for (let j = i + 2; j < bestOrder.length; j++) {
                    // Try 2-opt swap
                    const newOrder = this._twoOptSwap(bestOrder, i, j);
                    const newDistance = this._calculateTotalDistance(newOrder, matrix);

                    if (newDistance < bestDistance) {
                        bestOrder = newOrder;
                        bestDistance = newDistance;
                        improved = true;
                    }
                }
            }
        }

        return bestOrder;
    },

    // Perform 2-opt swap
    _twoOptSwap(order, i, j) {
        const newOrder = order.slice(0, i + 1);
        const reversed = order.slice(i + 1, j + 1).reverse();
        const remaining = order.slice(j + 1);
        return [...newOrder, ...reversed, ...remaining];
    },

    // Calculate total distance for a route
    _calculateTotalDistance(order, matrix) {
        let total = 0;
        for (let i = 0; i < order.length - 1; i++) {
            const dist = matrix.distances[order[i]][order[i + 1]];
            // Ensure we're adding numbers, not strings
            total += Number(dist) || 0;
        }
        return total;
    },

    // Calculate total time
    _calculateTotalTime(totalDistance, stopCount, stopTime) {
        // Assume average speed of 50 km/h
        const travelTime = (totalDistance / 50) * 60; // in minutes
        const stopTimeTotal = stopCount * stopTime;
        return Math.round(travelTime + stopTimeTotal);
    },

    // Parse time string (HH:MM) to Date
    _parseTime(timeStr) {
        const [hours, minutes] = timeStr.split(':').map(Number);
        const now = new Date();
        now.setHours(hours, minutes, 0, 0);
        return now.getTime();
    }
};
