// Main Application
const App = {
    state: {
        startPoint: null,
        stops: [],
        optimizedResult: null,
        stopTime: 5,
        startTime: null,
        isAuthenticated: false,
        selectedClientIds: new Set()
    },

    PASSWORD_KEY: 'route_optimizer_password',

    init() {
        this._checkAuthentication();
        this._bindEvents();
        this._loadSavedState();
        this._setInitialTime();
    },

    // Check if user is authenticated
    _checkAuthentication() {
        const hasPassword = localStorage.getItem(this.PASSWORD_KEY);

        if (!hasPassword) {
            // First time - show setup form
            document.getElementById('loginFormContainer').classList.add('hidden');
            document.getElementById('setupPasswordContainer').classList.remove('hidden');
        } else {
            // Always show login form (no session persistence)
            document.getElementById('loginFormContainer').classList.remove('hidden');
            document.getElementById('setupPasswordContainer').classList.add('hidden');
        }
    },

    // Show main app after login
    _showMainApp() {
        document.getElementById('loginModal').classList.add('hidden');
        document.getElementById('mainApp').classList.remove('hidden');
    },

    // Login
    _login(password) {
        const storedPassword = localStorage.getItem(this.PASSWORD_KEY);
        const hashedPassword = this._hashPassword(password);

        if (hashedPassword === storedPassword) {
            this.state.isAuthenticated = true;
            this._showMainApp();
            this._showToast('Bem-vindo!', 'success');
            return true;
        }
        return false;
    },

    // Setup password (first time)
    _setupPassword(password, confirmPassword) {
        if (password !== confirmPassword) {
            return false;
        }

        if (password.length < 4) {
            this._showToast('A palavra-passe deve ter pelo menos 4 caracteres', 'error');
            return false;
        }

        const hashedPassword = this._hashPassword(password);
        localStorage.setItem(this.PASSWORD_KEY, hashedPassword);

        this.state.isAuthenticated = true;
        this._showMainApp();
        this._showToast('Palavra-passe definida com sucesso!', 'success');
        return true;
    },

    // Logout
    _logout() {
        this.state.isAuthenticated = false;
        document.getElementById('mainApp').classList.add('hidden');
        document.getElementById('loginModal').classList.remove('hidden');
        document.getElementById('loginPassword').value = '';
        document.getElementById('loginError').classList.add('hidden');
        this._showToast('Sessão terminada', 'info');
    },

    // Simple hash function (for demo - in production use proper crypto)
    _hashPassword(password) {
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash.toString(36);
    },

    // Set initial time to current time
    _setInitialTime() {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        document.getElementById('startTime').value = `${hours}:${minutes}`;
    },

    // Bind all event listeners
    _bindEvents() {
        // Login button
        document.getElementById('btnLogin').addEventListener('click', () => {
            const password = document.getElementById('loginPassword').value;
            if (this._login(password)) {
                document.getElementById('loginError').classList.add('hidden');
            } else {
                document.getElementById('loginError').classList.remove('hidden');
                document.getElementById('loginPassword').value = '';
            }
        });

        // Setup password button
        document.getElementById('btnSetupPassword').addEventListener('click', () => {
            const password = document.getElementById('setupPassword').value;
            const confirmPassword = document.getElementById('setupPasswordConfirm').value;
            if (this._setupPassword(password, confirmPassword)) {
                document.getElementById('setupError').classList.add('hidden');
            } else {
                document.getElementById('setupError').classList.remove('hidden');
            }
        });

        // Logout button
        document.getElementById('btnLogout').addEventListener('click', () => this._logout());

        // Login password enter key
        document.getElementById('loginPassword').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                document.getElementById('btnLogin').click();
            }
        });

        // Setup password enter key
        document.getElementById('setupPasswordConfirm').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                document.getElementById('btnSetupPassword').click();
            }
        });

        // Manage clients button
        document.getElementById('btnManageClients').addEventListener('click', () => this._showManageClientsModal());

        // Add client button
        document.getElementById('btnAddClient').addEventListener('click', () => this._showAddClientModal());

        // Add client form
        document.getElementById('addClientForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this._addClient();
        });

        // Search clients input
        document.getElementById('searchClients').addEventListener('input', (e) => {
            this._filterClients(e.target.value);
        });

        // Search select clients input
        document.getElementById('searchSelectClients').addEventListener('input', (e) => {
            this._filterSelectClients(e.target.value);
        });

        // Import clients button
        document.getElementById('btnImportClients').addEventListener('click', () => {
            this._hideModal('manageClientsModal');
            this._showImportModal();
        });

        // Export clients button
        document.getElementById('btnExportClients').addEventListener('click', () => this._exportClients());

        // Select clients button
        document.getElementById('btnSelectClients').addEventListener('click', () => this._showSelectClientsModal());

        // Select all clients
        document.getElementById('btnSelectAllClients').addEventListener('click', () => this._selectAllClients());

        // Deselect all clients
        document.getElementById('btnDeselectAllClients').addEventListener('click', () => this._deselectAllClients());

        // Add selected clients
        document.getElementById('btnAddSelectedClients').addEventListener('click', () => this._addSelectedClients());

        // Close manage clients modal
        document.getElementById('closeManageClientsModal').addEventListener('click', () => {
            this._hideModal('manageClientsModal');
        });

        // Close add client modal
        document.getElementById('closeAddClientModal').addEventListener('click', () => {
            this._hideModal('addClientModal');
        });

        // Close select clients modal
        document.getElementById('closeSelectClientsModal').addEventListener('click', () => {
            this._hideModal('selectClientsModal');
        });

        // Select start point button
        document.getElementById('btnSelectStartPoint').addEventListener('click', () => this._showSelectStartPointModal());

        // Add new start point button
        document.getElementById('btnAddNewStartPoint').addEventListener('click', () => {
            this._hideModal('selectStartPointModal');
            this._showAddStartPointModal();
        });

        // Add start point form
        document.getElementById('addStartPointForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this._addStartPoint();
        });

        // Close select start point modal
        document.getElementById('closeSelectStartPointModal').addEventListener('click', () => {
            this._hideModal('selectStartPointModal');
        });

        // Close add start point modal
        document.getElementById('closeAddStartPointModal').addEventListener('click', () => {
            this._hideModal('addStartPointModal');
        });

        // Search start points input
        document.getElementById('searchStartPoints').addEventListener('input', (e) => {
            this._filterStartPoints(e.target.value);
        });

        // New route button
        document.getElementById('btnNewRoute').addEventListener('click', () => this._newRoute());

        // History button
        document.getElementById('btnHistory').addEventListener('click', () => this._showHistory());

        // Use current location
        document.getElementById('btnUseCurrentLocation').addEventListener('click', () => this._useCurrentLocation());

        // Start point input change
        document.getElementById('startPoint').addEventListener('change', (e) => {
            // Clear coordinates if address changes
            if (this.state.startPoint && this.state.startPoint.address !== e.target.value) {
                this.state.startPoint = null;
                document.getElementById('startPointCoords').textContent = '';
            }
        });

        // Add stop button
        document.getElementById('btnAddStop').addEventListener('click', () => this._showAddStopModal());

        // Import button (removed - now in manage clients)
        // document.getElementById('btnImport').addEventListener('click', () => this._showImportModal());

        // Optimize button
        document.getElementById('btnOptimize').addEventListener('click', () => this._optimizeRoute());

        // Stop time input
        document.getElementById('stopTime').addEventListener('change', (e) => {
            this.state.stopTime = parseInt(e.target.value) || 5;
        });

        // Start time input
        document.getElementById('startTime').addEventListener('change', (e) => {
            this.state.startTime = e.target.value;
        });

        // Add stop form
        document.getElementById('addStopForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this._addStop();
        });

        // Close add stop modal
        document.getElementById('closeAddStopModal').addEventListener('click', () => {
            this._hideModal('addStopModal');
        });

        // Close import modal
        document.getElementById('closeImportModal').addEventListener('click', () => {
            this._hideModal('importModal');
        });

        // Close history modal
        document.getElementById('closeHistoryModal').addEventListener('click', () => {
            this._hideModal('historyModal');
        });

        // Close save route modal
        document.getElementById('closeSaveRouteModal').addEventListener('click', () => {
            this._hideModal('saveRouteModal');
        });

        // Import file
        document.getElementById('importFile').addEventListener('change', (e) => {
            this._handleImportFile(e);
        });

        // Process import
        document.getElementById('btnProcessImport').addEventListener('click', () => {
            this._processImport();
        });

        // Save route
        document.getElementById('btnSaveRoute').addEventListener('click', () => {
            this._showSaveRouteModal();
        });

        // Save route form
        document.getElementById('saveRouteForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this._saveRoute();
        });

        // Export route
        document.getElementById('btnExportRoute').addEventListener('click', () => {
            this._exportRoute();
        });

        // Print route
        document.getElementById('btnPrintRoute').addEventListener('click', () => {
            window.print();
        });

        // Close modals on outside click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.add('hidden');
                }
            });
        });
    },

    // Load saved state
    _loadSavedState() {
        if (!this.state.isAuthenticated) return;
        
        const saved = Storage.loadCurrentRoute();
        if (saved) {
            // Convert selectedClientIds array back to Set if it exists
            if (saved.selectedClientIds) {
                saved.selectedClientIds = new Set(saved.selectedClientIds);
            }
            this.state = { ...this.state, ...saved };
            this._renderStartPoint();
            this._renderStops();
            document.getElementById('stopTime').value = this.state.stopTime;
            if (this.state.startTime) {
                document.getElementById('startTime').value = this.state.startTime;
            }
        }
    },

    // Save current state
    _saveState() {
        if (!this.state.isAuthenticated) return;
        // Convert Set to array for JSON serialization
        const stateToSave = {
            startPoint: this.state.startPoint,
            stops: this.state.stops,
            optimizedResult: this.state.optimizedResult,
            stopTime: this.state.stopTime,
            startTime: this.state.startTime,
            isAuthenticated: this.state.isAuthenticated,
            selectedClientIds: Array.from(this.state.selectedClientIds)
        };
        Storage.saveCurrentRoute(stateToSave);
    },

    // New route
    _newRoute() {
        this.state = {
            startPoint: null,
            stops: [],
            optimizedResult: null,
            stopTime: 5,
            startTime: null,
            isAuthenticated: this.state.isAuthenticated,
            selectedClientIds: new Set()
        };

        document.getElementById('startPoint').value = '';
        document.getElementById('startPointCoords').textContent = '';
        document.getElementById('stopsList').innerHTML = '';
        document.getElementById('resultsSection').classList.add('hidden');
        Storage.clearCurrentRoute();
        this._setInitialTime();

        this._showToast('Nova rota criada. Selecione os clientes para esta rota.', 'info');
    },

    // Use current location
    async _useCurrentLocation() {
        try {
            this._showLoading('A obter localização...');
            
            const coords = await Geocoder.getCurrentLocation();
            
            // Reverse geocode to get address
            const address = await Geocoder.reverseGeocode(coords.lat, coords.lon);
            
            this.state.startPoint = {
                name: 'Localização Atual',
                address: address || 'Localização atual',
                lat: coords.lat,
                lon: coords.lon
            };

            document.getElementById('startPoint').value = this.state.startPoint.address;
            document.getElementById('startPointCoords').textContent = 
                `📍 ${coords.lat.toFixed(6)}, ${coords.lon.toFixed(6)}`;

            this._saveState();
            this._hideLoading();
            this._showToast('Localização obtida com sucesso', 'success');
        } catch (error) {
            this._hideLoading();
            this._showToast('Não foi possível obter a localização. Verifique as permissões do navegador.', 'error');
            console.error(error);
        }
    },

    // Show add stop modal
    _showAddStopModal() {
        document.getElementById('addStopForm').reset();
        document.getElementById('addStopModal').classList.remove('hidden');
    },

    // Add stop
    async _addStop() {
        const name = document.getElementById('stopName').value.trim();
        const address = document.getElementById('stopAddress').value.trim();
        const postalCode = document.getElementById('stopPostalCode').value.trim();
        const city = document.getElementById('stopCity').value.trim();
        const notes = document.getElementById('stopNotes').value.trim();
        const lat = document.getElementById('stopLat').value.trim();
        const lon = document.getElementById('stopLon').value.trim();

        if (!name || !address) {
            this._showToast('Nome e morada são obrigatórios', 'error');
            return;
        }

        const fullAddress = [address, postalCode, city].filter(Boolean).join(', ');

        let coords = null;

        // If coordinates provided manually
        if (lat && lon) {
            coords = {
                lat: parseFloat(lat),
                lon: parseFloat(lon)
            };
        } else {
            // Geocode the address
            this._showLoading('A localizar morada...');
            coords = await Geocoder.geocodeAddress(fullAddress);
            this._hideLoading();

            if (!coords) {
                this._showToast('Não foi possível localizar esta morada', 'error');
                return;
            }
        }

        const stop = {
            id: Date.now(),
            name,
            address: fullAddress,
            postalCode,
            city,
            notes,
            lat: coords.lat,
            lon: coords.lon,
            completed: false
        };

        this.state.stops.push(stop);
        this._saveState();
        this._renderStops();
        this._hideModal('addStopModal');
        this._showToast('Paragem adicionada', 'success');
    },

    // Render stops list
    _renderStops() {
        const container = document.getElementById('stopsList');
        container.innerHTML = '';

        this.state.stops.forEach((stop, index) => {
            const card = document.createElement('div');
            card.className = `stop-card ${stop.completed ? 'completed' : ''}`;
            card.draggable = true;
            card.dataset.index = index;

            card.innerHTML = `
                <div class="stop-number">${String(index + 1).padStart(2, '0')}</div>
                <div class="stop-info">
                    <div class="stop-name">${this._escapeHtml(stop.name)}</div>
                    <div class="stop-address">${this._escapeHtml(stop.address)}</div>
                    ${stop.notes ? `<div class="stop-notes">📝 ${this._escapeHtml(stop.notes)}</div>` : ''}
                </div>
                <div class="stop-actions">
                    <button class="btn btn-secondary btn-small" onclick="App._editStop(${index})">✏️</button>
                    <button class="btn btn-secondary btn-small" onclick="App._removeStop(${index})">🗑️</button>
                </div>
            `;

            // Drag and drop events
            card.addEventListener('dragstart', (e) => this._handleDragStart(e, index));
            card.addEventListener('dragover', (e) => this._handleDragOver(e));
            card.addEventListener('drop', (e) => this._handleDrop(e, index));
            card.addEventListener('dragend', (e) => this._handleDragEnd(e));

            container.appendChild(card);
        });
    },

    // Render start point
    _renderStartPoint() {
        if (this.state.startPoint) {
            document.getElementById('startPoint').value = this.state.startPoint.address;
            document.getElementById('startPointCoords').textContent = 
                `📍 ${this.state.startPoint.lat.toFixed(6)}, ${this.state.startPoint.lon.toFixed(6)}${this.state.startPoint.name ? ` | ${this.state.startPoint.name}` : ''}`;
        }
    },

    // Edit stop
    _editStop(index) {
        const stop = this.state.stops[index];
        document.getElementById('stopName').value = stop.name;
        document.getElementById('stopAddress').value = stop.address;
        document.getElementById('stopPostalCode').value = stop.postalCode || '';
        document.getElementById('stopCity').value = stop.city || '';
        document.getElementById('stopNotes').value = stop.notes || '';
        document.getElementById('stopLat').value = stop.lat || '';
        document.getElementById('stopLon').value = stop.lon || '';
        
        // Remove the stop and let user re-add it
        this.state.stops.splice(index, 1);
        this._renderStops();
        
        document.getElementById('addStopModal').classList.remove('hidden');
    },

    // Remove stop
    _removeStop(index) {
        this.state.stops.splice(index, 1);
        this._saveState();
        this._renderStops();
        this._showToast('Paragem removida', 'info');
    },

    // Drag and drop handlers
    _handleDragStart(e, index) {
        e.target.classList.add('dragging');
        e.dataTransfer.setData('text/plain', index);
    },

    _handleDragOver(e) {
        e.preventDefault();
    },

    _handleDrop(e, targetIndex) {
        e.preventDefault();
        const sourceIndex = parseInt(e.dataTransfer.getData('text/plain'));
        
        if (sourceIndex !== targetIndex) {
            const [removed] = this.state.stops.splice(sourceIndex, 1);
            this.state.stops.splice(targetIndex, 0, removed);
            this._saveState();
            this._renderStops();
        }
    },

    _handleDragEnd(e) {
        e.target.classList.remove('dragging');
    },

    // Show import modal
    _showImportModal() {
        document.getElementById('importFile').value = '';
        document.getElementById('columnMapping').classList.add('hidden');
        document.getElementById('importModal').classList.remove('hidden');
    },

    // Handle import file
    async _handleImportFile(e) {
        const file = e.target.files[0];
        if (!file) return;

        this._showLoading('A ler ficheiro...');

        try {
            const text = await file.text();
            let data = [];

            if (file.name.endsWith('.csv')) {
                data = this._parseCSV(text);
            } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
                data = this._parseExcel(text);
            } else {
                throw new Error('Formato não suportado');
            }

            if (data.length > 0) {
                this._setupColumnMapping(data[0]);
                this._showToast('Ficheiro lido com sucesso', 'success');
            } else {
                this._showToast('Ficheiro vazio ou inválido', 'error');
            }
        } catch (error) {
            this._showToast('Erro ao ler ficheiro', 'error');
            console.error(error);
        }

        this._hideLoading();
    },

    // Parse CSV
    _parseCSV(text) {
        const lines = text.split('\n').filter(line => line.trim());
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        const data = [];

        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
            const row = {};
            headers.forEach((h, j) => {
                row[h] = values[j] || '';
            });
            data.push(row);
        }

        return data;
    },

    // Parse Excel (using SheetJS)
    _parseExcel(text) {
        // This would need the actual file, not text
        // For now, return empty array
        return [];
    },

    // Setup column mapping
    _setupColumnMapping(headers) {
        const columns = Object.keys(headers);
        
        const selects = ['mapName', 'mapAddress', 'mapPostalCode', 'mapCity', 'mapNotes', 'mapLat', 'mapLon'];
        
        selects.forEach(selectId => {
            const select = document.getElementById(selectId);
            select.innerHTML = '<option value="">-- Selecione --</option>';
            columns.forEach(col => {
                const option = document.createElement('option');
                option.value = col;
                option.textContent = col;
                select.appendChild(option);
            });
        });

        // Auto-select common column names
        const commonMappings = {
            mapName: ['nome', 'name', 'cliente', 'client'],
            mapAddress: ['morada', 'address', 'endereço', 'rua'],
            mapPostalCode: ['código postal', 'postal code', 'cp', 'zip', 'código postal'],
            mapCity: ['localidade', 'city', 'cidade'],
            mapNotes: ['notas', 'notes', 'observações', 'telemovel', 'telefone', 'ncontribuinte', 'email']
        };

        Object.entries(commonMappings).forEach(([selectId, keywords]) => {
            const select = document.getElementById(selectId);
            columns.forEach(col => {
                const lowerCol = col.toLowerCase();
                if (keywords.some(kw => lowerCol.includes(kw))) {
                    select.value = col;
                }
            });
        });

        document.getElementById('columnMapping').classList.remove('hidden');
    },

    // Process import
    async _processImport() {
        const mapping = {
            name: document.getElementById('mapName').value,
            address: document.getElementById('mapAddress').value,
            postalCode: document.getElementById('mapPostalCode').value,
            city: document.getElementById('mapCity').value,
            notes: document.getElementById('mapNotes').value,
            lat: document.getElementById('mapLat').value,
            lon: document.getElementById('mapLon').value
        };

        if (!mapping.name || !mapping.address) {
            this._showToast('Selecione pelo menos Nome e Morada', 'error');
            return;
        }

        // Get file data again (simplified)
        const file = document.getElementById('importFile').files[0];
        if (!file) return;

        try {
            const text = await file.text();
            const data = this._parseCSV(text);
            
            let added = 0;
            let failed = 0;
            const total = data.length - 1;

            for (let i = 1; i < data.length; i++) {
                const row = data[i];
                const name = row[mapping.name];
                const address = row[mapping.address];
                
                if (!name || !address) continue;

                this._showLoading(`A importar clientes: ${added + failed}/${total}`);

                let coords = null;

                // If coordinates provided
                if (mapping.lat && mapping.lon && row[mapping.lat] && row[mapping.lon]) {
                    coords = {
                        lat: parseFloat(row[mapping.lat]),
                        lon: parseFloat(row[mapping.lon])
                    };
                }

                const fullAddress = [
                    address,
                    row[mapping.postalCode] || '',
                    row[mapping.city] || ''
                ].filter(Boolean).join(', ');

                // Build notes from multiple columns
                const notesParts = [];
                if (row[mapping.notes]) notesParts.push(row[mapping.notes]);
                if (row['telemovel'] || row['telemóvel']) notesParts.push(`📱 ${row['telemovel'] || row['telemóvel']}`);
                if (row['telefone']) notesParts.push(`📞 ${row['telefone']}`);
                if (row['ncontribuinte'] || row['nif']) notesParts.push(`🆔 ${row['ncontribuinte'] || row['nif']}`);
                if (row['email']) notesParts.push(`✉️ ${row['email']}`);
                const notes = notesParts.filter(Boolean).join(' | ');

                // Geocode if no coordinates
                if (!coords) {
                    coords = await Geocoder.geocodeAddress(fullAddress);
                }

                if (coords) {
                    const client = {
                        name,
                        address: fullAddress,
                        postalCode: row[mapping.postalCode] || '',
                        city: row[mapping.city] || '',
                        phone: row['telemovel'] || row['telemóvel'] || '',
                        email: row['email'] || '',
                        notes: row[mapping.notes] || '',
                        lat: coords.lat,
                        lon: coords.lon
                    };
                    Storage.addClient(client);
                    added++;
                } else {
                    failed++;
                }

                // Small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 500));
            }

            this._hideModal('importModal');
            this._hideLoading();

            this._showToast(`${added} clientes importados para a base de dados${failed > 0 ? `, ${failed} falharam` : ''}`, failed > 0 ? 'warning' : 'success');
        } catch (error) {
            this._hideLoading();
            this._showToast('Erro ao importar', 'error');
            console.error(error);
        }
    },

    // Optimize route
    async _optimizeRoute() {
        // Get start point
        const startPointAddress = document.getElementById('startPoint').value.trim();
        
        if (!startPointAddress) {
            this._showToast('Introduza um ponto de partida', 'error');
            return;
        }

        // Check if we need to geocode the start point
        const needsGeocoding = !this.state.startPoint || 
                               this.state.startPoint.address !== startPointAddress ||
                               !this.state.startPoint.lat || 
                               !this.state.startPoint.lon;

        if (needsGeocoding) {
            this._showLoading('A localizar ponto de partida...');
            const coords = await Geocoder.geocodeAddress(startPointAddress);
            this._hideLoading();

            if (!coords) {
                this._showToast('Não foi possível localizar o ponto de partida', 'error');
                return;
            }

            this.state.startPoint = {
                name: startPointAddress,
                address: startPointAddress,
                lat: coords.lat,
                lon: coords.lon
            };
            
            document.getElementById('startPointCoords').textContent = 
                `📍 ${coords.lat.toFixed(6)}, ${coords.lon.toFixed(6)}`;
        }

        if (this.state.stops.length === 0) {
            this._showToast('Adicione pelo menos uma paragem', 'error');
            return;
        }

        // Check if all stops have coordinates
        for (const stop of this.state.stops) {
            if (!stop.lat || !stop.lon) {
                this._showToast(`A paragem "${stop.name}" não tem coordenadas. Remova e adicione novamente.`, 'error');
                return;
            }
        }

        const shouldOptimizeOrder = document.getElementById('optimizeOrder').checked;
        this._showLoading(shouldOptimizeOrder ? 'A otimizar rota...' : 'A calcular rota...');

        try {
            // Optimize route
            const result = await Optimizer.optimizeRoute(
                this.state.startPoint,
                this.state.stops,
                this.state.stopTime,
                this.state.startTime,
                shouldOptimizeOrder
            );

            this.state.optimizedResult = result;
            this._saveState();
            this._renderResults();
            this._hideLoading();
            this._showToast(shouldOptimizeOrder ? 'Rota otimizada com sucesso' : 'Rota calculada com sucesso', 'success');
        } catch (error) {
            this._hideLoading();
            console.error('Erro detalhado:', error);
            this._showToast('Erro ao calcular rota: ' + error.message, 'error');
        }
    },

    // Render results
    _renderResults() {
        const result = this.state.optimizedResult;
        if (!result) return;

        // Show results section
        document.getElementById('resultsSection').classList.remove('hidden');

        // Update summary
        document.getElementById('totalDistance').textContent = `${result.totalDistance.toFixed(1)} km`;
        document.getElementById('totalTime').textContent = this._formatDuration(result.totalTime);
        document.getElementById('totalStops').textContent = result.stops.length - 1; // Exclude start point

        // Calculate toll cost estimate (Portugal average: ~€0.12 per km for highways)
        const tollCost = result.totalDistance * 0.12;
        document.getElementById('tollCost').textContent = `${tollCost.toFixed(2)} €`;

        // Render optimized stops
        const container = document.getElementById('optimizedStops');
        container.innerHTML = '';

        result.stops.forEach((stop, index) => {
            const stopElement = document.createElement('div');
            stopElement.className = 'optimized-stop';
            if (stop.completed) {
                stopElement.classList.add('completed');
            }

            stopElement.innerHTML = `
                <div class="optimized-stop-number">${stop.order}</div>
                <div class="optimized-stop-info">
                    <div class="optimized-stop-name">${this._escapeHtml(stop.name)}</div>
                    <div class="optimized-stop-address">${this._escapeHtml(stop.address)}</div>
                    <div class="optimized-stop-details">
                        <span>⏱️ ${stop.eta}</span>
                        ${stop.distanceFromPrevious > 0 ? `<span>📍 ${stop.distanceFromPrevious.toFixed(1)} km</span>` : ''}
                    </div>
                    ${stop.notes ? `<div class="optimized-stop-notes">${this._escapeHtml(stop.notes)}</div>` : ''}
                </div>
                <div class="optimized-stop-actions">
                    ${!stop.isStart ? `
                        <button class="btn btn-secondary btn-small" onclick="App._toggleStopComplete(${index})">
                            ${stop.completed ? '✓' : '○'}
                        </button>
                    ` : ''}
                </div>
            `;

            container.appendChild(stopElement);

            // Add arrow between stops
            if (index < result.stops.length - 1) {
                const arrow = document.createElement('div');
                arrow.className = 'route-arrow';
                arrow.textContent = '↓';
                container.appendChild(arrow);
            }
        });

        // Scroll to results
        document.getElementById('resultsSection').scrollIntoView({ behavior: 'smooth' });
    },

    // Toggle stop completion
    _toggleStopComplete(index) {
        if (!this.state.optimizedResult) return;

        this.state.optimizedResult.stops[index].completed = !this.state.optimizedResult.stops[index].completed;
        this._saveState();
        this._renderResults();
    },

    // Navigate to stop (removed - Waze button removed)
    _navigateToStop(index) {
        // Function kept for future use if needed
    },

    // Show save route modal
    _showSaveRouteModal() {
        if (!this.state.optimizedResult) {
            this._showToast('Otimize a rota primeiro', 'error');
            return;
        }

        const date = new Date().toLocaleDateString('pt-PT');
        document.getElementById('routeName').value = `Rota - ${date}`;
        document.getElementById('saveRouteModal').classList.remove('hidden');
    },

    // Save route
    _saveRoute() {
        const name = document.getElementById('routeName').value.trim();
        if (!name) {
            this._showToast('Introduza um nome para a rota', 'error');
            return;
        }

        const route = {
            id: Date.now(),
            name,
            date: new Date().toISOString(),
            startPoint: this.state.startPoint,
            stops: this.state.stops,
            optimizedResult: this.state.optimizedResult,
            stopTime: this.state.stopTime,
            startTime: this.state.startTime
        };

        Storage.saveRoute(route);
        this._hideModal('saveRouteModal');
        this._showToast('Rota guardada com sucesso', 'success');
    },

    // Show history
    _showHistory() {
        const routes = Storage.loadRoutes();
        const container = document.getElementById('historyList');
        container.innerHTML = '';

        if (routes.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">Sem rotas guardadas</p>';
        } else {
            routes.forEach(route => {
                const date = new Date(route.date).toLocaleDateString('pt-PT');
                const div = document.createElement('div');
                div.className = 'history-item';
                div.innerHTML = `
                    <div class="history-info">
                        <div class="history-name">${this._escapeHtml(route.name)}</div>
                        <div class="history-details">${date} • ${route.stops.length} paragens</div>
                    </div>
                    <div class="history-actions">
                        <button class="btn btn-secondary btn-small" onclick="App._loadRoute(${route.id})">📂</button>
                        <button class="btn btn-secondary btn-small" onclick="App._deleteRoute(${route.id})">🗑️</button>
                    </div>
                `;
                container.appendChild(div);
            });
        }

        document.getElementById('historyModal').classList.remove('hidden');
    },

    // Load route
    _loadRoute(routeId) {
        const route = Storage.loadRoute(routeId);
        if (!route) return;

        this.state = {
            startPoint: route.startPoint,
            stops: route.stops,
            optimizedResult: route.optimizedResult,
            stopTime: route.stopTime || 5,
            startTime: route.startTime
        };

        this._renderStartPoint();
        this._renderStops();
        document.getElementById('stopTime').value = this.state.stopTime;
        if (this.state.startTime) {
            document.getElementById('startTime').value = this.state.startTime;
        }

        if (this.state.optimizedResult) {
            this._renderResults();
        }

        this._saveState();
        this._hideModal('historyModal');
        this._showToast('Rota carregada', 'success');
    },

    // Delete route
    _deleteRoute(routeId) {
        if (confirm('Tem a certeza que deseja eliminar esta rota?')) {
            Storage.deleteRoute(routeId);
            this._showHistory();
            this._showToast('Rota eliminada', 'info');
        }
    },

    // Export route
    _exportRoute() {
        if (!this.state.optimizedResult) {
            this._showToast('Otimize a rota primeiro', 'error');
            return;
        }

        const result = this.state.optimizedResult;
        let csv = 'Ordem,Cliente,Morada,Distância,Tempo,Estado\n';

        result.stops.forEach((stop, index) => {
            if (!stop.isStart) {
                csv += `${stop.order},"${stop.name}","${stop.address}","${Routing.formatDistance(stop.distanceToNext)}","${Routing.formatDuration(stop.durationToNext)}","${stop.completed ? 'Concluída' : 'Pendente'}"\n`;
            }
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `rota_${Date.now()}.csv`;
        link.click();

        this._showToast('Rota exportada', 'success');
    },

    // UI Helpers
    _showModal(modalId) {
        document.getElementById(modalId).classList.remove('hidden');
    },

    _hideModal(modalId) {
        document.getElementById(modalId).classList.add('hidden');
    },

    _showLoading(text = 'A processar...') {
        document.getElementById('loadingText').textContent = text;
        document.getElementById('loadingOverlay').classList.remove('hidden');
    },

    _hideLoading() {
        document.getElementById('loadingOverlay').classList.add('hidden');
    },

    _showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        container.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 3000);
    },

    _escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    _formatDuration(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        
        if (hours > 0 && mins > 0) {
            return `${hours}h ${mins}min`;
        } else if (hours > 0) {
            return `${hours}h`;
        } else {
            return `${mins}min`;
        }
    },

    // Show manage clients modal
    _showManageClientsModal() {
        document.getElementById('searchClients').value = '';
        this._renderClientsList();
        document.getElementById('manageClientsModal').classList.remove('hidden');
    },

    // Render clients list
    _renderClientsList(filter = '') {
        const clients = Storage.loadClients();
        const container = document.getElementById('clientsList');
        container.innerHTML = '';

        // Filter clients by name
        const filteredClients = filter 
            ? clients.filter(client => 
                client.name.toLowerCase().includes(filter.toLowerCase()) ||
                client.address.toLowerCase().includes(filter.toLowerCase())
              )
            : clients;

        if (filteredClients.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">Sem clientes guardados</p>';
            return;
        }

        filteredClients.forEach(client => {
            const card = document.createElement('div');
            card.className = 'client-card';
            card.innerHTML = `
                <div class="client-info">
                    <div class="client-name">${this._escapeHtml(client.name)}</div>
                    <div class="client-address">${this._escapeHtml(client.address)}</div>
                    ${client.phone || client.email ? `
                        <div class="client-details">
                            ${client.phone ? `📱 ${this._escapeHtml(client.phone)}` : ''}
                            ${client.phone && client.email ? ' | ' : ''}
                            ${client.email ? `✉️ ${this._escapeHtml(client.email)}` : ''}
                        </div>
                    ` : ''}
                </div>
                <div class="client-actions">
                    <button class="btn btn-secondary btn-small" onclick="App._editClient(${client.id})">✏️</button>
                    <button class="btn btn-secondary btn-small" onclick="App._deleteClient(${client.id})">🗑️</button>
                </div>
            `;
            container.appendChild(card);
        });
    },

    // Filter clients by search
    _filterClients(filter) {
        this._renderClientsList(filter);
    },

    // Show add client modal
    _showAddClientModal() {
        document.getElementById('addClientForm').reset();
        document.getElementById('addClientModal').classList.remove('hidden');
    },

    // Add client
    async _addClient() {
        const name = document.getElementById('clientName').value.trim();
        const address = document.getElementById('clientAddress').value.trim();
        const postalCode = document.getElementById('clientPostalCode').value.trim();
        const city = document.getElementById('clientCity').value.trim();
        const phone = document.getElementById('clientPhone').value.trim();
        const email = document.getElementById('clientEmail').value.trim();
        const notes = document.getElementById('clientNotes').value.trim();

        if (!name || !address) {
            this._showToast('Nome e morada são obrigatórios', 'error');
            return;
        }

        const fullAddress = [address, postalCode, city].filter(Boolean).join(', ');

        this._showLoading('A localizar morada...');
        const coords = await Geocoder.geocodeAddress(fullAddress);
        this._hideLoading();

        if (!coords) {
            this._showToast('Não foi possível localizar esta morada', 'error');
            return;
        }

        const client = {
            name,
            address: fullAddress,
            postalCode,
            city,
            phone,
            email,
            notes,
            lat: coords.lat,
            lon: coords.lon
        };

        Storage.addClient(client);
        this._hideModal('addClientModal');
        this._renderClientsList();
        this._showToast('Cliente adicionado', 'success');
    },

    // Edit client
    _editClient(clientId) {
        const clients = Storage.loadClients();
        const client = clients.find(c => c.id === clientId);
        if (!client) return;

        document.getElementById('clientName').value = client.name;
        document.getElementById('clientAddress').value = client.address;
        document.getElementById('clientPostalCode').value = client.postalCode || '';
        document.getElementById('clientCity').value = client.city || '';
        document.getElementById('clientPhone').value = client.phone || '';
        document.getElementById('clientEmail').value = client.email || '';
        document.getElementById('clientNotes').value = client.notes || '';

        // Delete the old client and let user re-add it
        Storage.deleteClient(clientId);
        this._renderClientsList();
        
        document.getElementById('addClientModal').classList.remove('hidden');
    },

    // Delete client
    _deleteClient(clientId) {
        if (confirm('Tem a certeza que deseja eliminar este cliente?')) {
            Storage.deleteClient(clientId);
            this._renderClientsList();
            this._showToast('Cliente eliminado', 'info');
        }
    },

    // Export clients
    _exportClients() {
        const clients = Storage.loadClients();
        if (clients.length === 0) {
            this._showToast('Sem clientes para exportar', 'error');
            return;
        }

        let csv = 'Nome,Morada,Código Postal,Localidade,Telemóvel,Email,Notas\n';

        clients.forEach(client => {
            csv += `"${client.name}","${client.address}","${client.postalCode || ''}","${client.city || ''}","${client.phone || ''}","${client.email || ''}","${client.notes || ''}"\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `clientes_${Date.now()}.csv`;
        link.click();

        this._showToast('Clientes exportados', 'success');
    },

    // Show select clients modal
    _showSelectClientsModal() {
        document.getElementById('searchSelectClients').value = '';
        this.state.selectedClientIds.clear();
        this._renderSelectClientsList();
        document.getElementById('selectClientsModal').classList.remove('hidden');
    },

    // Render select clients list
    _renderSelectClientsList(filter = '') {
        const clients = Storage.loadClients();
        const container = document.getElementById('selectClientsList');
        container.innerHTML = '';

        // Filter clients by name
        const filteredClients = filter 
            ? clients.filter(client => 
                client.name.toLowerCase().includes(filter.toLowerCase()) ||
                client.address.toLowerCase().includes(filter.toLowerCase())
              )
            : clients;

        if (filteredClients.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">Sem clientes guardados. Adicione clientes primeiro em "Gerir Clientes".</p>';
            return;
        }

        filteredClients.forEach(client => {
            const card = document.createElement('div');
            card.className = 'client-card';
            const isChecked = this.state.selectedClientIds.has(client.id) ? 'checked' : '';
            card.innerHTML = `
                <input type="checkbox" class="client-checkbox-input" data-client-id="${client.id}" ${isChecked} onchange="App._toggleClientSelection(${client.id}, this.checked)">
                <div class="client-info">
                    <div class="client-name">${this._escapeHtml(client.name)}</div>
                    <div class="client-address">${this._escapeHtml(client.address)}</div>
                </div>
            `;
            container.appendChild(card);
        });
    },

    // Toggle client selection
    _toggleClientSelection(clientId, isChecked) {
        if (isChecked) {
            this.state.selectedClientIds.add(clientId);
        } else {
            this.state.selectedClientIds.delete(clientId);
        }
    },

    // Filter select clients by search
    _filterSelectClients(filter) {
        this._renderSelectClientsList(filter);
    },

    // Select all clients
    _selectAllClients() {
        const clients = Storage.loadClients();
        clients.forEach(client => {
            this.state.selectedClientIds.add(client.id);
        });
        document.querySelectorAll('.client-checkbox-input').forEach(checkbox => {
            checkbox.checked = true;
        });
    },

    // Deselect all clients
    _deselectAllClients() {
        this.state.selectedClientIds.clear();
        document.querySelectorAll('.client-checkbox-input').forEach(checkbox => {
            checkbox.checked = false;
        });
    },

    // Add selected clients to route
    _addSelectedClients() {
        const clients = Storage.loadClients();
        const selectedIds = Array.from(this.state.selectedClientIds);

        if (selectedIds.length === 0) {
            this._showToast('Selecione pelo menos um cliente', 'error');
            return;
        }

        selectedIds.forEach(clientId => {
            const client = clients.find(c => c.id === clientId);
            if (client) {
                this.state.stops.push({
                    id: Date.now() + clientId,
                    name: client.name,
                    address: client.address,
                    postalCode: client.postalCode,
                    city: client.city,
                    notes: `${client.phone ? `📱 ${client.phone}` : ''}${client.phone && client.email ? ' | ' : ''}${client.email ? `✉️ ${client.email}` : ''}${client.notes ? ` | 📝 ${client.notes}` : ''}`,
                    lat: client.lat,
                    lon: client.lon,
                    completed: false
                });
            }
        });

        this._saveState();
        this._renderStops();
        this.state.selectedClientIds.clear();
        this._hideModal('selectClientsModal');
        this._showToast(`${selectedIds.length} clientes adicionados à rota`, 'success');
    },

    // Show select start point modal
    _showSelectStartPointModal() {
        document.getElementById('searchStartPoints').value = '';
        this._renderStartPointsList();
        document.getElementById('selectStartPointModal').classList.remove('hidden');
    },

    // Render start points list
    _renderStartPointsList(filter = '') {
        const startPoints = Storage.loadStartPoints();
        const container = document.getElementById('startPointsList');
        container.innerHTML = '';

        // Filter start points by name
        const filteredStartPoints = filter 
            ? startPoints.filter(sp => 
                sp.name.toLowerCase().includes(filter.toLowerCase()) ||
                sp.address.toLowerCase().includes(filter.toLowerCase())
              )
            : startPoints;

        if (filteredStartPoints.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">Sem locais guardados. Adicione um novo local.</p>';
            return;
        }

        filteredStartPoints.forEach(startPoint => {
            const card = document.createElement('div');
            card.className = 'client-card';
            card.style.cursor = 'pointer';
            card.innerHTML = `
                <div class="client-info">
                    <div class="client-name">${this._escapeHtml(startPoint.name)}</div>
                    <div class="client-address">${this._escapeHtml(startPoint.address)}</div>
                </div>
                <div class="client-actions">
                    <button class="btn btn-secondary btn-small" onclick="App._deleteStartPoint(${startPoint.id})">🗑️</button>
                </div>
            `;
            card.addEventListener('click', (e) => {
                if (!e.target.closest('button')) {
                    this._selectStartPoint(startPoint);
                }
            });
            container.appendChild(card);
        });
    },

    // Filter start points by search
    _filterStartPoints(filter) {
        this._renderStartPointsList(filter);
    },

    // Select start point
    async _selectStartPoint(startPoint) {
        this.state.startPoint = {
            name: startPoint.name,
            address: startPoint.address,
            lat: startPoint.lat,
            lon: startPoint.lon
        };

        document.getElementById('startPoint').value = startPoint.address;
        document.getElementById('startPointCoords').textContent = 
            `📍 ${startPoint.lat.toFixed(6)}, ${startPoint.lon.toFixed(6)} | ${startPoint.name}`;

        this._saveState();
        this._hideModal('selectStartPointModal');
        this._showToast(`Ponto de partida selecionado: ${startPoint.name}`, 'success');
    },

    // Show add start point modal
    _showAddStartPointModal() {
        document.getElementById('addStartPointForm').reset();
        document.getElementById('addStartPointModal').classList.remove('hidden');
    },

    // Add start point
    async _addStartPoint() {
        const name = document.getElementById('startPointName').value.trim();
        const address = document.getElementById('startPointAddress').value.trim();
        const postalCode = document.getElementById('startPointPostalCode').value.trim();
        const city = document.getElementById('startPointCity').value.trim();

        if (!name || !address) {
            this._showToast('Nome e morada são obrigatórios', 'error');
            return;
        }

        const fullAddress = [address, postalCode, city].filter(Boolean).join(', ');

        this._showLoading('A localizar morada...');
        const coords = await Geocoder.geocodeAddress(fullAddress);
        this._hideLoading();

        if (!coords) {
            this._showToast('Não foi possível localizar esta morada', 'error');
            return;
        }

        const startPoint = {
            name,
            address: fullAddress,
            postalCode,
            city,
            lat: coords.lat,
            lon: coords.lon
        };

        Storage.addStartPoint(startPoint);
        this._hideModal('addStartPointModal');
        this._renderStartPointsList();
        this._showSelectStartPointModal();
        this._showToast('Local adicionado', 'success');
    },

    // Delete start point
    _deleteStartPoint(startPointId) {
        if (confirm('Tem a certeza que deseja eliminar este local?')) {
            Storage.deleteStartPoint(startPointId);
            this._renderStartPointsList();
            this._showToast('Local eliminado', 'info');
        }
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
