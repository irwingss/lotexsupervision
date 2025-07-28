// Supervisiones X - Main Application Logic
class SupervisionesX {
    constructor() {
        this.password = 'lotex2025';
        this.adminPassword = 'admin.lotex2025';
        this.currentUser = null;
        this.isAdmin = false;
        this.currentSupervision = null;
        this.supervisions = [];
        this.data = [];
        this.charts = {};
        this.accessLogs = JSON.parse(localStorage.getItem('supervisionesX_logs') || '[]');
        this.dataLoader = new DataLoader();
        this.github = new GitHubIntegration();
        this.isGitHubConfigured = false;
        this.excelManager = null; // Will be initialized after DOM is ready
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadStoredData();
        this.checkLoginStatus();
    }

    setupEventListeners() {
        // Login form
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // User selection form
        document.getElementById('userSelectionForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleUserSelection();
        });

        // Admin button
        document.getElementById('adminBtn').addEventListener('click', () => {
            this.handleAdminAccess();
        });

        // Logout button
        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.logout();
        });

        // Admin panel event listeners
        document.getElementById('createSupervisionForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.createSupervision();
        });
        
        document.getElementById('clearSupervisionForm').addEventListener('click', () => {
            this.clearSupervisionForm();
        });
        
        document.getElementById('supervisionFiles').addEventListener('change', (e) => {
            this.handleFileSelection(e);
        });

        // File management event listeners
        document.getElementById('closeFileManagementBtn').addEventListener('click', () => {
            this.closeFileManagement();
        });

        document.getElementById('uploadFileForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleFileUpload();
        });

        document.getElementById('backToLoginBtn').addEventListener('click', () => {
            this.showLoginScreen();
        });

        // Dynamic Update Mode Selection
        document.querySelectorAll('input[name="updateMode"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.switchUpdateMode(e.target.value);
            });
        });

        // Bulk Location Update
        document.getElementById('bulkLocationForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleBulkLocationUpdate();
        });

        document.getElementById('bulkLocation').addEventListener('change', (e) => {
            this.updateBulkPreview(e.target.value);
        });

        document.getElementById('bulkStatus').addEventListener('change', (e) => {
            this.toggleBulkReasonField(e.target.value);
        });

        // Multi-Select Update
        document.getElementById('multiLocation').addEventListener('change', (e) => {
            this.filterPointsTable(e.target.value);
        });

        document.getElementById('multiStatus').addEventListener('change', (e) => {
            this.toggleMultiReasonField(e.target.value);
        });

        document.getElementById('selectAllPoints').addEventListener('change', (e) => {
            this.toggleAllPointsSelection(e.target.checked);
        });

        document.getElementById('applyMultiUpdate').addEventListener('click', () => {
            this.handleMultiUpdate();
        });

        // Replanteo Mode
        document.getElementById('replanteoForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleReplanteoCreation();
        });

        document.getElementById('replanteoLocation').addEventListener('change', (e) => {
            this.populateReplanteoPoints(e.target.value);
        });

        document.getElementById('replanteoPoint').addEventListener('change', (e) => {
            this.updateReplanteoPreview(e.target.value);
        });

        // New Point Mode
        document.getElementById('newPointForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleNewPointCreation();
        });

        document.getElementById('newPointLocation').addEventListener('change', (e) => {
            this.populateNewPointReferences(e.target.value);
            this.updateNewPointPreview();
        });

        document.getElementById('newPointReference').addEventListener('change', (e) => {
            this.updateNewPointPreview();
        });

        // Refresh data button
        document.getElementById('refreshData').addEventListener('click', () => {
            this.refreshData();
        });

        // Location filter
        document.getElementById('locationFilter').addEventListener('change', (e) => {
            this.applyFilters();
        });
        
        // Status filter
        document.getElementById('statusFilter').addEventListener('change', (e) => {
            this.applyFilters();
        });
        
        // Date filters
        document.getElementById('dateFromFilter').addEventListener('change', (e) => {
            this.applyFilters();
        });
        
        document.getElementById('dateToFilter').addEventListener('change', (e) => {
            this.applyFilters();
        });
        
        document.getElementById('clearDateFilter').addEventListener('click', () => {
            this.clearDateFilter();
        });
        
        // Download Excel button
        document.getElementById('downloadActiveExcel').addEventListener('click', () => {
            this.downloadActiveExcel();
        });
        
        // GitHub configuration form
        document.getElementById('githubConfigForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleGitHubConfiguration();
        });
        
        // Test GitHub connection
        document.getElementById('testGitHubConnection').addEventListener('click', () => {
            this.testGitHubConnection();
        });
        
        // Sync buttons
        document.getElementById('syncToGitHub').addEventListener('click', () => {
            this.saveToGitHub();
        });
        
        document.getElementById('loadFromGitHub').addEventListener('click', () => {
            this.loadFromGitHub();
        });
        
        // Export/Import Excel
        document.getElementById('exportExcel').addEventListener('click', () => {
            this.exportToExcel();
        });
        
        document.getElementById('importExcel').addEventListener('change', (e) => {
            this.handleExcelImport(e.target.files[0]);
        });
        
        // Settings
        document.getElementById('changePassword').addEventListener('click', () => {
            this.changePassword();
        });
        
        document.getElementById('clearData').addEventListener('click', () => {
            this.clearLocalData();
        });
        
        // Excel Management
        document.getElementById('uploadExcelForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleExcelUpload();
        });
        
        document.getElementById('changeExcelBtn').addEventListener('click', () => {
            this.handleExcelChange();
        });
        
        document.getElementById('excelFileSelect').addEventListener('change', (e) => {
            this.previewExcelChange(e.target.value);
        });
    }

    checkLoginStatus() {
        const storedUser = localStorage.getItem('supervisionesX_currentUser');
        if (storedUser) {
            this.currentUser = storedUser;
            this.showMainApp();
        } else {
            this.showLoginScreen();
        }
    }

    handleLogin() {
        const passwordInput = document.getElementById('password');
        const errorDiv = document.getElementById('loginError');
        
        if (passwordInput.value === this.adminPassword) {
            this.isAdmin = true;
            errorDiv.classList.add('d-none');
            this.showAdminPanel();
        } else if (passwordInput.value === this.password) {
            this.isAdmin = false;
            errorDiv.classList.add('d-none');
            this.showUserSelection();
        } else {
            errorDiv.classList.remove('d-none');
            passwordInput.value = '';
            passwordInput.focus();
        }
    }

    handleUserSelection() {
        const userSelect = document.getElementById('userSelect');
        const selectedUser = userSelect.value;
        
        if (selectedUser) {
            this.currentUser = selectedUser;
            localStorage.setItem('supervisionesX_currentUser', selectedUser);
            this.logAccess();
            this.showMainApp();
        }
    }

    handleAdminAccess() {
        const adminPassword = prompt('Ingrese la contraseña de administrador:');
        
        if (adminPassword === this.adminPassword) {
            this.isAdmin = true;
            this.showAdminPanel();
        } else if (adminPassword !== null) { // User didn't cancel
            alert('Contraseña de administrador incorrecta');
        }
    }

    async logAccess() {
        try {
            const position = await this.getCurrentPosition();
            const accessLog = {
                timestamp: new Date().toISOString(),
                user: this.currentUser,
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                location: await this.getLocationName(position.coords.latitude, position.coords.longitude)
            };
            
            this.accessLogs.push(accessLog);
            localStorage.setItem('supervisionesX_logs', JSON.stringify(this.accessLogs));
            this.updateLogsTable();
        } catch (error) {
            console.warn('Could not get location:', error);
            // Log without location if geolocation fails
            const accessLog = {
                timestamp: new Date().toISOString(),
                user: this.currentUser,
                latitude: null,
                longitude: null,
                location: 'Ubicación no disponible'
            };
            
            this.accessLogs.push(accessLog);
            localStorage.setItem('supervisionesX_logs', JSON.stringify(this.accessLogs));
            this.updateLogsTable();
        }
    }

    getCurrentPosition() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation not supported'));
                return;
            }
            
            navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 300000
            });
        });
    }

    async getLocationName(lat, lon) {
        try {
            // Using a simple reverse geocoding service (you might want to use a different one)
            const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=es`);
            const data = await response.json();
            return data.city || data.locality || data.principalSubdivision || 'Ubicación desconocida';
        } catch (error) {
            return 'Ubicación desconocida';
        }
    }

    showLoginScreen() {
        document.getElementById('loginScreen').classList.remove('d-none');
        document.getElementById('userSelectionScreen').classList.add('d-none');
        document.getElementById('mainApp').classList.add('d-none');
    }

    async showUserSelection() {
        document.getElementById('loginScreen').classList.add('d-none');
        document.getElementById('userSelectionScreen').classList.remove('d-none');
        document.getElementById('mainApp').classList.add('d-none');
        
        // Load users dynamically from TXT
        await this.loadUsersFromTxt();
    }

    showMainApp() {
        document.getElementById('loginScreen').classList.add('d-none');
        document.getElementById('userSelectionScreen').classList.add('d-none');
        document.getElementById('adminScreen').classList.add('d-none');
        document.getElementById('mainApp').classList.remove('d-none');
        
        document.getElementById('currentUser').textContent = this.currentUser;
        this.initializeMainApp();
    }

    async showAdminPanel() {
        document.getElementById('loginScreen').classList.add('d-none');
        document.getElementById('userSelectionScreen').classList.add('d-none');
        document.getElementById('mainApp').classList.add('d-none');
        document.getElementById('adminScreen').classList.remove('d-none');
        
        await this.loadSupervisions();
        this.updateSupervisionsTable();
    }

    async showUserSelection() {
        document.getElementById('loginScreen').classList.add('d-none');
        document.getElementById('userSelectionScreen').classList.remove('d-none');
        document.getElementById('mainApp').classList.add('d-none');
        document.getElementById('adminScreen').classList.add('d-none');
        
        await this.loadUsersFromTxt();
    }

    async loadSupervisions() {
        try {
            // Check uploads directory for supervision folders
            const response = await fetch('/api/supervisions');
            if (response.ok) {
                this.supervisions = await response.json();
            } else {
                // Fallback: load from localStorage or create empty array
                this.supervisions = JSON.parse(localStorage.getItem('supervisions') || '[]');
            }
        } catch (error) {
            console.error('Error loading supervisions:', error);
            this.supervisions = JSON.parse(localStorage.getItem('supervisions') || '[]');
        }
    }

    updateSupervisionsTable() {
        const tbody = document.getElementById('supervisionsTableBody');
        tbody.innerHTML = '';
        
        this.supervisions.forEach((supervision, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${supervision.name}</td>
                <td>${supervision.createdDate}</td>
                <td>${supervision.filesCount || 0} archivos</td>
                <td>
                    <button class="btn btn-sm btn-primary me-1" onclick="supervisionesX.selectSupervision('${supervision.name}')">
                        <i class="fas fa-play"></i> Usar
                    </button>
                    <button class="btn btn-sm btn-info me-1" onclick="supervisionesX.manageSupervisionFiles('${supervision.name}')">
                        <i class="fas fa-file-upload"></i> Archivos
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="supervisionesX.deleteSupervision(${index})">
                        <i class="fas fa-trash"></i> Eliminar
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    async createSupervision() {
        const nameInput = document.getElementById('newSupervisionName');
        const filesInput = document.getElementById('supervisionFiles');
        const name = nameInput.value.trim();
        
        if (!name) {
            alert('Por favor ingrese un nombre para la supervisión');
            return;
        }
        
        if (this.supervisions.some(s => s.name === name)) {
            alert('Ya existe una supervisión con ese nombre');
            return;
        }
        
        // Show loading state
        const submitBtn = document.getElementById('createSupervisionBtn');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Creando...';
        submitBtn.disabled = true;
        
        try {
            // Process selected files
            const files = [];
            if (filesInput.files.length > 0) {
                for (let i = 0; i < filesInput.files.length; i++) {
                    const file = filesInput.files[i];
                    const content = await this.readFileContent(file);
                    files.push({
                        name: file.name,
                        content: content
                    });
                }
            }
            
            // Create supervision folder via API
            const response = await fetch('/api/supervisions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, files })
            });
            
            if (response.ok) {
                const result = await response.json();
                const newSupervision = {
                    name: name,
                    createdDate: new Date().toLocaleDateString('es-ES'),
                    filesCount: files.length
                };
                
                this.supervisions.push(newSupervision);
                localStorage.setItem('supervisions', JSON.stringify(this.supervisions));
                this.updateSupervisionsTable();
                this.clearSupervisionForm();
                
                alert(`Supervisión "${name}" creada exitosamente con ${files.length} archivo(s)`);
            } else {
                const error = await response.json();
                throw new Error(error.error || 'Error creating supervision folder');
            }
        } catch (error) {
            console.error('Error creating supervision:', error);
            alert(`Error al crear la supervisión: ${error.message}`);
        } finally {
            // Restore button state
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    async selectSupervision(name) {
        // Show confirmation dialog
        const confirmSwitch = confirm(
            `¿Desea cambiar a la supervisión "${name}"?\n\n` +
            `Esto lo llevará a la pantalla de selección de usuario para comenzar a trabajar con esta supervisión.`
        );
        
        if (!confirmSwitch) {
            return;
        }
        
        // Show loading state
        const useButtons = document.querySelectorAll(`button[onclick*="selectSupervision('${name}')"]`);
        useButtons.forEach(btn => {
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cargando...';
            btn.disabled = true;
        });
        
        try {
            // Set current supervision
            this.currentSupervision = name;
            localStorage.setItem('currentSupervision', name);
            
            // Update supervision indicator in admin panel
            this.updateCurrentSupervisionIndicator(name);
            
            // Load users and show user selection
            await this.loadUsersFromTxt();
            document.getElementById('adminScreen').classList.add('d-none');
            document.getElementById('userSelectionScreen').classList.remove('d-none');
            
            // Update user selection screen title
            const userScreenTitle = document.querySelector('#userSelectionScreen .card-title');
            if (userScreenTitle) {
                userScreenTitle.innerHTML = `<i class="fas fa-users me-2"></i>Seleccionar Usuario - Supervisión: ${name}`;
            }
            
        } catch (error) {
            console.error('Error selecting supervision:', error);
            alert(`Error al cambiar a la supervisión: ${error.message}`);
            
            // Restore button state on error
            useButtons.forEach(btn => {
                btn.innerHTML = '<i class="fas fa-play"></i> Usar';
                btn.disabled = false;
            });
        }
    }

    async deleteSupervision(index) {
        const supervision = this.supervisions[index];
        
        // Show custom confirmation dialog
        const confirmationText = prompt(
            `ATENCIÓN: Esta acción eliminará permanentemente la supervisión "${supervision.name}" y todos sus archivos.\n\n` +
            `Para confirmar la eliminación, escriba exactamente: eliminar`
        );
        
        if (confirmationText === 'eliminar') {
            // Show loading state
            const deleteButtons = document.querySelectorAll(`button[onclick*="deleteSupervision(${index})"]`);
            deleteButtons.forEach(btn => {
                btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Eliminando...';
                btn.disabled = true;
            });
            
            try {
                // Delete supervision folder via API
                const response = await fetch(`/api/supervisions/${supervision.name}`, {
                    method: 'DELETE'
                });
                
                if (response.ok) {
                    this.supervisions.splice(index, 1);
                    localStorage.setItem('supervisions', JSON.stringify(this.supervisions));
                    this.updateSupervisionsTable();
                    
                    alert(`Supervisión "${supervision.name}" eliminada exitosamente`);
                } else {
                    const error = await response.json();
                    throw new Error(error.error || 'Error deleting supervision folder');
                }
            } catch (error) {
                console.error('Error deleting supervision:', error);
                alert(`Error al eliminar la supervisión: ${error.message}`);
                // Restore button state on error
                this.updateSupervisionsTable();
            }
        } else if (confirmationText !== null) {
            // User entered something but not "eliminar"
            alert('Texto de confirmación incorrecto. La supervisión no fue eliminada.');
        }
        // If confirmationText is null, user cancelled - do nothing
    }

    async manageSupervisionFiles(supervisionName) {
        this.currentSupervisionForFiles = supervisionName;
        
        // Show file management section
        document.getElementById('supervisionsListSection').classList.add('d-none');
        document.getElementById('fileManagementSection').classList.remove('d-none');
        
        // Update the title
        document.getElementById('currentSupervisionName').textContent = supervisionName;
        
        // Load current files
        await this.loadSupervisionFiles(supervisionName);
    }

    async loadSupervisionFiles(supervisionName) {
        try {
            const response = await fetch(`/api/supervisions/${supervisionName}/files`);
            if (response.ok) {
                const files = await response.json();
                this.updateFilesList(files);
            } else {
                console.error('Error loading supervision files');
                this.updateFilesList([]);
            }
        } catch (error) {
            console.error('Error loading supervision files:', error);
            this.updateFilesList([]);
        }
    }

    updateFilesList(files) {
        const filesList = document.getElementById('currentFilesList');
        
        if (files.length === 0) {
            filesList.innerHTML = `
                <div class="text-center py-4">
                    <i class="fas fa-folder-open fa-3x text-muted mb-3"></i>
                    <p class="text-muted mb-0">No hay archivos en esta supervisión.</p>
                    <small class="text-muted">Puede subir archivos usando el formulario de arriba.</small>
                </div>
            `;
            return;
        }
        
        const filesHtml = files.map((file, index) => {
            const fileExtension = file.name.split('.').pop().toLowerCase();
            const fileIcon = this.getFileIcon(fileExtension);
            const isTextFile = ['txt', 'csv', 'log'].includes(fileExtension);
            
            return `
                <div class="card mb-2">
                    <div class="card-body py-2">
                        <div class="d-flex justify-content-between align-items-center">
                            <div class="d-flex align-items-center">
                                <i class="${fileIcon} me-3 text-primary fa-lg"></i>
                                <div>
                                    <strong>${file.name}</strong>
                                    <br>
                                    <small class="text-muted">
                                        ${this.formatFileSize(file.size)} • 
                                        ${new Date(file.modified).toLocaleDateString('es-ES')}
                                    </small>
                                </div>
                            </div>
                            <div class="btn-group" role="group">
                                ${isTextFile ? `
                                    <button class="btn btn-sm btn-outline-primary" 
                                            onclick="supervisionesX.previewFile('${this.currentSupervisionForFiles}', '${file.name}')" 
                                            title="Vista previa">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                ` : ''}
                                <button class="btn btn-sm btn-outline-success" 
                                        onclick="supervisionesX.downloadFile('${this.currentSupervisionForFiles}', '${file.name}')" 
                                        title="Descargar">
                                    <i class="fas fa-download"></i>
                                </button>
                                <button class="btn btn-sm btn-outline-danger" 
                                        onclick="supervisionesX.deleteFile('${this.currentSupervisionForFiles}', '${file.name}')" 
                                        title="Eliminar">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        filesList.innerHTML = filesHtml;
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    async handleFileUpload() {
        const fileInput = document.getElementById('fileInput');
        const fileTypeSelect = document.getElementById('fileTypeSelect');
        
        if (!fileInput.files[0]) {
            alert('Por favor seleccione un archivo');
            return;
        }
        
        if (!fileTypeSelect.value) {
            alert('Por favor seleccione el tipo de archivo');
            return;
        }
        
        const file = fileInput.files[0];
        const fileType = fileTypeSelect.value;
        
        // Validate file extension
        if (!file.name.toLowerCase().endsWith('.txt')) {
            alert('Solo se permiten archivos TXT');
            return;
        }
        
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('fileType', fileType);
            
            const response = await fetch(`/api/supervisions/${this.currentSupervisionForFiles}/upload`, {
                method: 'POST',
                body: formData
            });
            
            if (response.ok) {
                alert('Archivo subido exitosamente');
                
                // Reset form
                fileInput.value = '';
                fileTypeSelect.value = '';
                
                // Reload files list
                await this.loadSupervisionFiles(this.currentSupervisionForFiles);
                
                // Update supervisions table to reflect new file count
                await this.loadSupervisions();
                this.updateSupervisionsTable();
            } else {
                const error = await response.text();
                alert(`Error al subir archivo: ${error}`);
            }
        } catch (error) {
            console.error('Error uploading file:', error);
            alert('Error al subir archivo. Verifique la conexión.');
        }
    }

    closeFileManagement() {
        document.getElementById('fileManagementSection').classList.add('d-none');
        document.getElementById('supervisionsListSection').classList.remove('d-none');
        this.currentSupervisionForFiles = null;
    }

    async loadUsersFromTxt() {
        try {
            const response = await fetch('uploads/usuarios.txt');
            if (!response.ok) {
                throw new Error('No se pudo cargar el archivo de usuarios');
            }
            
            const text = await response.text();
            const lines = text.split('\n').filter(line => line.trim());
            
            const userSelect = document.getElementById('userSelect');
            userSelect.innerHTML = '<option value="">Seleccione un usuario...</option>';
            
            lines.forEach(line => {
                const parts = line.split(',');
                if (parts.length >= 3) {
                    const nombre = parts[0].trim();
                    const cargo = parts[1].trim();
                    const activo = parts[2].trim().toLowerCase() === 'true';
                    
                    if (activo) {
                        const option = document.createElement('option');
                        option.value = nombre;
                        option.textContent = `${nombre} (${cargo})`;
                        userSelect.appendChild(option);
                    }
                }
            });
        } catch (error) {
            console.error('Error loading users:', error);
            const userSelect = document.getElementById('userSelect');
            userSelect.innerHTML = '<option value="">Error cargando usuarios</option>';
        }
    }

    logout() {
        localStorage.removeItem('supervisionesX_currentUser');
        this.currentUser = null;
        this.showLoginScreen();
    }

    // Helper function to read file content
    async readFileContent(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(e);
            reader.readAsText(file);
        });
    }

    // Handle file selection for supervision creation
    handleFileSelection(event) {
        const files = event.target.files;
        const previewContainer = document.getElementById('filePreviewContainer');
        const previewList = document.getElementById('filePreviewList');
        
        if (files.length === 0) {
            previewContainer.style.display = 'none';
            return;
        }
        
        let previewHtml = '';
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            previewHtml += `
                <div class="d-flex justify-content-between align-items-center mb-2 p-2 border rounded">
                    <div>
                        <i class="fas fa-file-alt me-2 text-primary"></i>
                        <strong>${file.name}</strong>
                        <small class="text-muted ms-2">(${this.formatFileSize(file.size)})</small>
                    </div>
                    <small class="text-muted">${file.type || 'text/plain'}</small>
                </div>
            `;
        }
        
        previewList.innerHTML = previewHtml;
        previewContainer.style.display = 'block';
    }

    // Clear supervision creation form
    clearSupervisionForm() {
        document.getElementById('newSupervisionName').value = '';
        document.getElementById('supervisionFiles').value = '';
        document.getElementById('filePreviewContainer').style.display = 'none';
        document.getElementById('filePreviewList').innerHTML = '';
    }

    // Get appropriate icon for file type
    getFileIcon(extension) {
        const iconMap = {
            'txt': 'fas fa-file-alt',
            'csv': 'fas fa-file-csv',
            'xlsx': 'fas fa-file-excel',
            'xls': 'fas fa-file-excel',
            'pdf': 'fas fa-file-pdf',
            'doc': 'fas fa-file-word',
            'docx': 'fas fa-file-word',
            'jpg': 'fas fa-file-image',
            'jpeg': 'fas fa-file-image',
            'png': 'fas fa-file-image',
            'gif': 'fas fa-file-image',
            'zip': 'fas fa-file-archive',
            'rar': 'fas fa-file-archive',
            'log': 'fas fa-file-alt'
        };
        return iconMap[extension] || 'fas fa-file';
    }

    // Preview file content (for text files)
    async previewFile(supervisionName, fileName) {
        try {
            const response = await fetch(`/api/supervisions/${supervisionName}/files/${fileName}`);
            if (response.ok) {
                const content = await response.text();
                this.showFilePreviewModal(fileName, content);
            } else {
                alert('Error al cargar el archivo para vista previa');
            }
        } catch (error) {
            console.error('Error previewing file:', error);
            alert('Error al mostrar vista previa del archivo');
        }
    }

    // Show file preview in modal
    showFilePreviewModal(fileName, content) {
        // Create modal if it doesn't exist
        let modal = document.getElementById('filePreviewModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'filePreviewModal';
            modal.className = 'modal fade';
            modal.innerHTML = `
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Vista Previa: <span id="previewFileName"></span></h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <pre id="previewContent" class="bg-light p-3 rounded" style="max-height: 400px; overflow-y: auto;"></pre>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }
        
        // Update content
        document.getElementById('previewFileName').textContent = fileName;
        document.getElementById('previewContent').textContent = content;
        
        // Show modal
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
    }

    // Download file
    async downloadFile(supervisionName, fileName) {
        try {
            const response = await fetch(`/api/supervisions/${supervisionName}/files/${fileName}`);
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = fileName;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            } else {
                alert('Error al descargar el archivo');
            }
        } catch (error) {
            console.error('Error downloading file:', error);
            alert('Error al descargar el archivo');
        }
    }

    // Delete file
    async deleteFile(supervisionName, fileName) {
        const confirmationText = prompt(
            `ATENCIÓN: Esta acción eliminará permanentemente el archivo "${fileName}".\n\n` +
            `Para confirmar la eliminación, escriba exactamente: eliminar`
        );
        
        if (confirmationText === 'eliminar') {
            try {
                const response = await fetch(`/api/supervisions/${supervisionName}/files/${fileName}`, {
                    method: 'DELETE'
                });
                
                if (response.ok) {
                    alert(`Archivo "${fileName}" eliminado exitosamente`);
                    // Reload files list
                    await this.loadSupervisionFiles(supervisionName);
                } else {
                    const error = await response.json();
                    throw new Error(error.error || 'Error deleting file');
                }
            } catch (error) {
                console.error('Error deleting file:', error);
                alert(`Error al eliminar el archivo: ${error.message}`);
            }
        } else if (confirmationText !== null) {
            alert('Texto de confirmación incorrecto. El archivo no fue eliminado.');
        }
    }

    // Update current supervision indicator in admin panel
    updateCurrentSupervisionIndicator(supervisionName) {
        // Add or update supervision indicator in admin panel
        let indicator = document.getElementById('currentSupervisionIndicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'currentSupervisionIndicator';
            indicator.className = 'alert alert-info mb-3';
            
            // Insert after the admin panel header
            const adminHeader = document.querySelector('#adminScreen .card-header');
            if (adminHeader && adminHeader.parentNode) {
                adminHeader.parentNode.insertBefore(indicator, adminHeader.nextSibling);
            }
        }
        
        indicator.innerHTML = `
            <div class="d-flex align-items-center">
                <i class="fas fa-folder-open me-2"></i>
                <strong>Supervisión Activa:</strong>
                <span class="ms-2 badge bg-primary">${supervisionName}</span>
                <button class="btn btn-sm btn-outline-secondary ms-auto" onclick="supervisionesX.clearCurrentSupervision()">
                    <i class="fas fa-times me-1"></i>Limpiar Selección
                </button>
            </div>
        `;
    }

    // Clear current supervision selection
    clearCurrentSupervision() {
        this.currentSupervision = null;
        localStorage.removeItem('currentSupervision');
        
        const indicator = document.getElementById('currentSupervisionIndicator');
        if (indicator) {
            indicator.remove();
        }
        
        alert('Selección de supervisión limpiada. Puede seleccionar una nueva supervisión.');
    }

    initializeMainApp() {
        this.loadData();
        this.populateLocationFilters();
        this.updateDashboard();
        this.initializeCharts();
        this.updateDataTable();
        this.updateLogsTable();
        this.setupGitHubIntegration();
        this.loadStoredPassword();
        this.updateGitHubStatus();
        this.populateGitHubForm();
        
        // Initialize Excel Manager
        if (typeof ExcelManager !== 'undefined') {
            this.excelManager = new ExcelManager(this);
            window.excelManager = this.excelManager; // Make it globally accessible
        }
    }

    async loadData() {
        try {
            // First try to load from GitHub if configured
            if (this.isGitHubConfigured) {
                const githubData = await this.github.loadExcelData();
                if (githubData && githubData.data) {
                    this.data = githubData.data;
                    localStorage.setItem('supervisionesX_data', JSON.stringify(this.data));
                    console.log('Data loaded from GitHub successfully');
                    return;
                }
            }
            
            // Try to load from localStorage
            const storedData = localStorage.getItem('supervisionesX_data');
            if (storedData) {
                this.data = JSON.parse(storedData);
                console.log('Data loaded from localStorage');
                return;
            }
            
            // Try to load from supervision folder or uploads
            await this.loadInitialDataFromTxt();
            
        } catch (error) {
            console.error('Error loading data:', error);
            // Fallback to minimal sample data
            this.loadFallbackData();
        }
    }
    
    async loadInitialDataFromTxt() {
        try {
            // Determine the path based on current supervision
            const supervision = this.currentSupervision || localStorage.getItem('currentSupervision');
            const basePath = supervision ? `uploads/${supervision}` : 'uploads';
            
            console.log(`Attempting to load initial data from ${basePath}/muestra_final.txt`);
            
            // Load main data file
            const response = await fetch(`./${basePath}/muestra_final.txt`);
            if (!response.ok) {
                throw new Error('Could not fetch muestra_final.txt');
            }
            
            const txtText = await response.text();
            const lines = txtText.trim().split('\n');
            
            if (lines.length < 2) {
                throw new Error('Invalid data format in muestra_final.txt');
            }
            
            // Parse header and data
            const headers = lines[0].split('\t');
            const data = [];
            
            for (let i = 1; i < lines.length; i++) {
                const values = lines[i].split('\t');
                if (values.length >= headers.length) {
                    const row = {
                        locacion: values[0] || '',
                        codCelda: values[1] || '',
                        codGrilla: values[2] || '',
                        este: parseFloat(values[3]) || 0,
                        norte: parseFloat(values[4]) || 0,
                        prof: parseFloat(values[5]) || 0,
                        pSuperpos: values[6] || '',
                        codPuntoCampo: values[7] || '',
                        codColectora: values[8] || '',
                        distancia: values[9] || '',
                        estadoMarcado: 'pendiente',
                        estadoMonitoreo: 'pendiente',
                        fechaActualizacion: null,
                        usuarioActualizacion: null,
                        razonDescarte: null
                    };
                    data.push(row);
                }
            }
            
            this.data = data;
            localStorage.setItem('supervisionesX_data', JSON.stringify(this.data));
            console.log(`Initial data loaded successfully: ${this.data.length} points from ${basePath}`);
            
        } catch (error) {
            console.warn('Could not load from muestra_final.txt:', error);
            // Fallback to sample data from data-loader
            this.data = await this.dataLoader.loadFromTextData();
            localStorage.setItem('supervisionesX_data', JSON.stringify(this.data));
            console.log('Sample data loaded from data-loader');
        }
    }
    
    async loadUsersFromTxt() {
        try {
            console.log('Loading users from uploads/usuarios.txt');
            const response = await fetch('./uploads/usuarios.txt');
            if (!response.ok) {
                throw new Error('Could not fetch usuarios.txt file');
            }
            
            const txtText = await response.text();
            this.populateUsersFromTxt(txtText);
            
        } catch (error) {
            console.warn('Could not load users from TXT:', error);
            // Use fallback static users
            this.populateUserSelectFallback();
        }
    }
    
    populateUsersFromTxt(txtText) {
        const lines = txtText.trim().split('\n');
        const headers = lines[0].split(',');
        const users = [];
        
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',');
            const user = {};
            headers.forEach((header, index) => {
                user[header] = values[index] || '';
            });
            if (user.ACTIVO === 'SI') {
                users.push(user);
            }
        }
        
        this.populateUserSelect(users);
    }
    
    populateUserSelect(users) {
        const userSelect = document.getElementById('userSelect');
        userSelect.innerHTML = '<option value="">Seleccione un usuario...</option>';
        
        users.forEach(user => {
            if (user.ACTIVO === 'SI' || user.ACTIVO === undefined) {
                const option = document.createElement('option');
                option.value = user.NOMBRE;
                option.textContent = `${user.NOMBRE} - ${user.CARGO || 'Usuario'}`;
                userSelect.appendChild(option);
            }
        });
    }
    
    populateUserSelectFallback() {
        const userSelect = document.getElementById('userSelect');
        const fallbackUsers = [
            'Juan Pérez - Supervisor de Campo',
            'María García - Técnico de Monitoreo',
            'Carlos López - Coordinador de Marcado',
            'Ana Rodríguez - Especialista en Terreno',
            'Luis Martínez - Jefe de Operaciones'
        ];
        
        userSelect.innerHTML = '<option value="">Seleccione un usuario...</option>';
        fallbackUsers.forEach(user => {
            const option = document.createElement('option');
            option.value = user.split(' - ')[0];
            option.textContent = user;
            userSelect.appendChild(option);
        });
    }
    
    loadFallbackData() {
        this.data = [
            {
                locacion: 'BAT-CE10-950',
                codCelda: 'SUE-BAT-CE10-950-149',
                codGrilla: 'BAT-CE10-950_SUE-BAT-CE10-950-149_009',
                este: 479379.877,
                norte: 9527479.093,
                prof: 0.1,
                codPuntoCampo: 'L-X,6,PZBAT-CE10-950-1',
                codColectora: 'BAT-CE10-950-1',
                estadoMarcado: 'pendiente',
                estadoMonitoreo: 'pendiente',
                fechaActualizacion: null,
                usuarioActualizacion: null,
                razonDescarte: null
            }
        ];
        localStorage.setItem('supervisionesX_data', JSON.stringify(this.data));
    }

    loadStoredData() {
        const storedData = localStorage.getItem('supervisionesX_data');
        if (storedData) {
            this.data = JSON.parse(storedData);
        }
    }

    populateLocationFilters() {
        const locations = [...new Set(this.data.map(item => item.locacion))];
        const locationFilter = document.getElementById('locationFilter');
        const updateLocation = document.getElementById('updateLocation');
        
        // Clear existing options (except first)
        locationFilter.innerHTML = '<option value="">Todas las locaciones</option>';
        updateLocation.innerHTML = '<option value="">Seleccione una locación...</option>';
        
        locations.forEach(location => {
            locationFilter.innerHTML += `<option value="${location}">${location}</option>`;
            updateLocation.innerHTML += `<option value="${location}">${location}</option>`;
        });
    }

    populatePointsForLocation(location) {
        const updatePoint = document.getElementById('updatePoint');
        updatePoint.innerHTML = '<option value="">Seleccione un punto...</option>';
        
        if (location) {
            const points = this.data.filter(item => item.locacion === location);
            points.forEach(point => {
                updatePoint.innerHTML += `<option value="${point.codColectora}">${point.codColectora} - ${point.codPuntoCampo}</option>`;
            });
        }
    }

    updateDashboard(dataToShow = null) {
        const data = dataToShow || this.data;
        
        const totalPoints = data.length;
        const markedPoints = data.filter(item => item.estadoMarcado === 'completado').length;
        const monitoredPoints = data.filter(item => item.estadoMonitoreo === 'completado').length;
        const pendingPoints = data.filter(item => 
            item.estadoMarcado === 'pendiente' || item.estadoMonitoreo === 'pendiente'
        ).length;

        document.getElementById('totalPoints').textContent = totalPoints;
        document.getElementById('markedPoints').textContent = markedPoints;
        document.getElementById('monitoredPoints').textContent = monitoredPoints;
        document.getElementById('pendingPoints').textContent = pendingPoints;
    }

    initializeCharts() {
        this.createActivityChart();
        this.createLocationChart();
    }

    createActivityChart() {
        const ctx = document.getElementById('activityChart').getContext('2d');
        
        const markedComplete = this.data.filter(item => item.estadoMarcado === 'completado').length;
        const markedPending = this.data.filter(item => item.estadoMarcado === 'pendiente').length;
        const monitoredComplete = this.data.filter(item => item.estadoMonitoreo === 'completado').length;
        const monitoredPending = this.data.filter(item => item.estadoMonitoreo === 'pendiente').length;

        if (this.charts.activity) {
            this.charts.activity.destroy();
        }

        this.charts.activity = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Marcado', 'Monitoreo'],
                datasets: [
                    {
                        label: 'Completado',
                        data: [markedComplete, monitoredComplete],
                        backgroundColor: '#198754',
                        borderColor: '#146c43',
                        borderWidth: 1
                    },
                    {
                        label: 'Pendiente',
                        data: [markedPending, monitoredPending],
                        backgroundColor: '#ffc107',
                        borderColor: '#e0a800',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'top'
                    }
                }
            }
        });
    }

    createLocationChart() {
        const ctx = document.getElementById('locationChart').getContext('2d');
        
        const locations = [...new Set(this.data.map(item => item.locacion))];
        const locationData = locations.map(location => {
            const locationPoints = this.data.filter(item => item.locacion === location);
            const completed = locationPoints.filter(item => 
                item.estadoMarcado === 'completado' && item.estadoMonitoreo === 'completado'
            ).length;
            return {
                location,
                total: locationPoints.length,
                completed,
                percentage: Math.round((completed / locationPoints.length) * 100)
            };
        });

        if (this.charts.location) {
            this.charts.location.destroy();
        }

        this.charts.location = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: locationData.map(item => `${item.location} (${item.percentage}%)`),
                datasets: [{
                    data: locationData.map(item => item.completed),
                    backgroundColor: [
                        '#0d6efd',
                        '#198754',
                        '#0dcaf0',
                        '#ffc107',
                        '#dc3545',
                        '#6f42c1'
                    ],
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    updateDataTable(dataToShow = null) {
        const tbody = document.getElementById('pointsTableBody');
        tbody.innerHTML = '';
        
        const data = dataToShow || this.data;

        data.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.locacion}</td>
                <td>${item.codPuntoCampo}</td>
                <td>${item.codColectora}</td>
                <td>${item.este.toFixed(3)}</td>
                <td>${item.norte.toFixed(3)}</td>
                <td><span class="status-badge status-${item.estadoMarcado}">${item.estadoMarcado}</span></td>
                <td><span class="status-badge status-${item.estadoMonitoreo}">${item.estadoMonitoreo}</span></td>
                <td>${item.fechaActualizacion || 'N/A'}</td>
                <td>${item.usuarioActualizacion || 'N/A'}</td>
            `;
            tbody.appendChild(row);
        });
    }

    updateLogsTable() {
        const tbody = document.getElementById('logsTableBody');
        tbody.innerHTML = '';

        // Show most recent logs first
        const sortedLogs = [...this.accessLogs].reverse();
        
        sortedLogs.forEach(log => {
            const row = document.createElement('tr');
            const date = new Date(log.timestamp);
            row.innerHTML = `
                <td>${date.toLocaleString('es-ES')}</td>
                <td>${log.user}</td>
                <td>${log.latitude ? log.latitude.toFixed(6) : 'N/A'}</td>
                <td>${log.longitude ? log.longitude.toFixed(6) : 'N/A'}</td>
                <td>${log.location}</td>
            `;
            tbody.appendChild(row);
        });
    }

    applyFilters() {
        const locationFilter = document.getElementById('locationFilter').value;
        const statusFilter = document.getElementById('statusFilter').value;
        const dateFromFilter = document.getElementById('dateFromFilter').value;
        const dateToFilter = document.getElementById('dateToFilter').value;
        
        let filteredData = [...this.data];
        
        // Apply location filter
        if (locationFilter) {
            filteredData = filteredData.filter(point => point.locacion === locationFilter);
        }
        
        // Apply status filter
        if (statusFilter) {
            filteredData = filteredData.filter(point => {
                if (statusFilter === 'completado') {
                    return point.estadoMarcado === 'completado' && point.estadoMonitoreo === 'completado';
                } else if (statusFilter === 'pendiente') {
                    return point.estadoMarcado === 'pendiente' || point.estadoMonitoreo === 'pendiente';
                } else if (statusFilter === 'descartado') {
                    return point.razonDescarte;
                }
                return true;
            });
        }
        
        // Apply date filter
        if (dateFromFilter || dateToFilter) {
            filteredData = filteredData.filter(point => {
                if (!point.fechaActualizacion) return false;
                
                const pointDate = new Date(point.fechaActualizacion).toISOString().split('T')[0];
                
                if (dateFromFilter && pointDate < dateFromFilter) return false;
                if (dateToFilter && pointDate > dateToFilter) return false;
                
                return true;
            });
        }
        
        // Update UI with filtered data
        this.updateDataTable(filteredData);
        this.updateDashboard(filteredData);
        
        // Update charts with filtered data
        this.updateChartsWithFilteredData(filteredData);
    }

    clearDateFilter() {
        document.getElementById('dateFromFilter').value = '';
        document.getElementById('dateToFilter').value = '';
        this.applyFilters();
    }

    updateChartsWithFilteredData(filteredData) {
        // Store original data temporarily
        const originalData = this.data;
        
        // Temporarily replace data with filtered data
        this.data = filteredData;
        
        // Update charts
        this.createActivityChart();
        this.createLocationChart();
        
        // Restore original data
        this.data = originalData;
    }

    async downloadActiveExcel() {
        try {
            const currentExcelFile = localStorage.getItem('supervisionesX_currentExcel') || 'muestra_final.xlsx';
            
            // Prepare data for Excel export (convert back to original Excel format)
            const excelData = this.data.map(point => ({
                LOCACION: point.locacion,
                COD_CELDA: point.codCelda,
                COD_GRILLA: point.codGrilla,
                Este: point.este,
                Norte: point.norte,
                PROF: point.prof,
                COD_PUNTO_CAMPO: point.codPuntoCampo,
                COD_COLECTORA: point.codColectora,
                // Add tracking columns
                ESTADO_MARCADO: point.estadoMarcado,
                ESTADO_MONITOREO: point.estadoMonitoreo,
                FECHA_ACTUALIZACION: point.fechaActualizacion || '',
                USUARIO_ACTUALIZACION: point.usuarioActualizacion || '',
                RAZON_DESCARTE: point.razonDescarte || ''
            }));
            
            // Create Excel workbook
            const ws = XLSX.utils.json_to_sheet(excelData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Supervisiones");
            
            // Generate filename with current date
            const now = new Date();
            const dateStr = now.toISOString().split('T')[0];
            const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '');
            const downloadFileName = `${currentExcelFile.replace('.xlsx', '')}_actualizado_${dateStr}_${timeStr}.xlsx`;
            
            // Download file
            XLSX.writeFile(wb, downloadFileName);
            
            // Try to sync with GitHub if configured
            if (this.github && this.github.isConfigured()) {
                try {
                    await this.github.saveExcelData(this.data, null, this.currentUser);
                    console.log('Excel data synced to GitHub successfully');
                } catch (githubError) {
                    console.warn('Could not sync to GitHub:', githubError.message);
                }
            }
            
            alert(`Excel descargado exitosamente como: ${downloadFileName}`);
            
        } catch (error) {
            console.error('Error downloading Excel:', error);
            alert(`Error al descargar Excel: ${error.message}`);
        }
    }

    toggleFormFields(status) {
        const reasonContainer = document.getElementById('reasonContainer');
        const reasonField = document.getElementById('updateReason');
        
        if (status === 'descartado') {
            reasonContainer.style.display = 'block';
            reasonField.required = true;
        } else {
            reasonContainer.style.display = 'none';
            reasonField.required = false;
            reasonField.value = '';
        }
    }

    toggleActivityFields(activity) {
        const replanteoContainer = document.getElementById('replanteoContainer');
        const coordinatesContainer = document.getElementById('coordinatesContainer');
        
        if (activity === 'marcado') {
            replanteoContainer.style.display = 'block';
            
            // Show coordinates if replanteo is checked
            document.getElementById('isReplanteo').addEventListener('change', (e) => {
                if (e.target.checked) {
                    coordinatesContainer.style.display = 'block';
                } else {
                    coordinatesContainer.style.display = 'none';
                }
            });
        } else {
            replanteoContainer.style.display = 'none';
            coordinatesContainer.style.display = 'none';
        }
    }

    handleUpdateSubmission() {
        const formData = {
            location: document.getElementById('updateLocation').value,
            point: document.getElementById('updatePoint').value,
            activity: document.getElementById('updateActivity').value,
            status: document.getElementById('updateStatus').value,
            reason: document.getElementById('updateReason').value,
            isReplanteo: document.getElementById('isReplanteo').checked,
            newEste: document.getElementById('newEste').value,
            newNorte: document.getElementById('newNorte').value
        };

        // Find the point to update
        const pointIndex = this.data.findIndex(item => 
            item.locacion === formData.location && item.codColectora === formData.point
        );

        if (pointIndex !== -1) {
            const point = this.data[pointIndex];
            
            // Update the appropriate field
            if (formData.activity === 'marcado') {
                point.estadoMarcado = formData.status;
                
                // Handle replanteo logic
                if (formData.isReplanteo && formData.status === 'completado') {
                    if (!point.codPuntoCampo.endsWith('R')) {
                        point.codPuntoCampo += 'R';
                        point.codColectora += 'R';
                    }
                    
                    if (formData.newEste) point.este = parseFloat(formData.newEste);
                    if (formData.newNorte) point.norte = parseFloat(formData.newNorte);
                }
            } else if (formData.activity === 'monitoreo') {
                point.estadoMonitoreo = formData.status;
                
                if (formData.status === 'descartado') {
                    point.razonDescarte = formData.reason;
                }
            }
            
            // Update metadata
            point.fechaActualizacion = new Date().toISOString().split('T')[0];
            point.usuarioActualizacion = this.currentUser;
            
            // Save to localStorage
            localStorage.setItem('supervisionesX_data', JSON.stringify(this.data));
            
            // Refresh UI
            this.updateDashboard();
            this.initializeCharts();
            this.updateDataTable();
            
            // Reset form
            document.getElementById('updateForm').reset();
            this.toggleFormFields('');
            this.toggleActivityFields('');
            
            // Show success message
            alert('Actualización guardada exitosamente');
        }
    }

    refreshData() {
        // This would typically reload data from GitHub
        // For now, just refresh the UI
        this.updateDashboard();
        this.initializeCharts();
        this.updateDataTable();
        
        // Show loading state briefly
        const btn = document.getElementById('refreshData');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Actualizando...';
        btn.disabled = true;
        
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }, 1000);
    }

    // Excel export functionality (for future GitHub integration)
    exportToExcel() {
        const ws = XLSX.utils.json_to_sheet(this.data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Supervisiones");
        XLSX.writeFile(wb, "supervisiones_x_data.xlsx");
    }

    // GitHub integration methods
    setupGitHubIntegration() {
        // Check if GitHub configuration exists in localStorage
        const githubConfig = localStorage.getItem('supervisionesX_github_config');
        if (githubConfig) {
            try {
                const config = JSON.parse(githubConfig);
                this.github.configure(config.owner, config.repo, config.token, config.branch, config.filePath);
                this.isGitHubConfigured = true;
                console.log('GitHub integration configured');
            } catch (error) {
                console.error('Error setting up GitHub integration:', error);
            }
        }
    }
    
    loadStoredPassword() {
        const storedPassword = localStorage.getItem('supervisionesX_password');
        if (storedPassword) {
            this.password = storedPassword;
        }
    }
    
    populateGitHubForm() {
        const githubConfig = localStorage.getItem('supervisionesX_github_config');
        if (githubConfig) {
            try {
                const config = JSON.parse(githubConfig);
                document.getElementById('githubOwner').value = config.owner || '';
                document.getElementById('githubRepo').value = config.repo || '';
                document.getElementById('githubBranch').value = config.branch || 'main';
                document.getElementById('githubFilePath').value = config.filePath || 'data/supervisiones_data.xlsx';
                // Don't populate token for security
            } catch (error) {
                console.error('Error populating GitHub form:', error);
            }
        }
    }
    
    async configureGitHub(owner, repo, token, branch = 'main', filePath = 'data/supervisiones_data.xlsx') {
        try {
            this.github.configure(owner, repo, token, branch, filePath);
            
            // Test connection
            const testResult = await this.github.testConnection();
            if (testResult.success) {
                // Save configuration
                const config = { owner, repo, token, branch, filePath };
                localStorage.setItem('supervisionesX_github_config', JSON.stringify(config));
                this.isGitHubConfigured = true;
                
                alert(`GitHub configurado exitosamente: ${testResult.repoInfo.fullName}`);
                return true;
            } else {
                alert(`Error conectando a GitHub: ${testResult.message}`);
                return false;
            }
        } catch (error) {
            console.error('Error configuring GitHub:', error);
            alert(`Error configurando GitHub: ${error.message}`);
            return false;
        }
    }

    async saveToGitHub() {
        if (!this.isGitHubConfigured) {
            alert('GitHub no está configurado. Configure primero la integración.');
            return false;
        }
        
        try {
            const result = await this.github.syncData(this.data);
            alert('Datos guardados en GitHub exitosamente');
            return true;
        } catch (error) {
            console.error('Error saving to GitHub:', error);
            alert(`Error guardando en GitHub: ${error.message}`);
            return false;
        }
    }

    async loadFromGitHub() {
        if (!this.isGitHubConfigured) {
            alert('GitHub no está configurado. Configure primero la integración.');
            return false;
        }
        
        try {
            const githubData = await this.github.loadExcelData();
            if (githubData && githubData.data) {
                this.data = githubData.data;
                localStorage.setItem('supervisionesX_data', JSON.stringify(this.data));
                
                // Refresh UI
                this.populateLocationFilters();
                this.updateDashboard();
                this.initializeCharts();
                this.updateDataTable();
                
                alert('Datos cargados desde GitHub exitosamente');
                return true;
            } else {
                alert('No se encontraron datos en GitHub');
                return false;
            }
        } catch (error) {
            console.error('Error loading from GitHub:', error);
            alert(`Error cargando desde GitHub: ${error.message}`);
            return false;
        }
    }
    
    // Settings and configuration methods
    async handleGitHubConfiguration() {
        const owner = document.getElementById('githubOwner').value;
        const repo = document.getElementById('githubRepo').value;
        const token = document.getElementById('githubToken').value;
        const branch = document.getElementById('githubBranch').value;
        const filePath = document.getElementById('githubFilePath').value;
        
        if (!owner || !repo || !token) {
            alert('Por favor complete todos los campos requeridos');
            return;
        }
        
        const success = await this.configureGitHub(owner, repo, token, branch, filePath);
        if (success) {
            this.updateGitHubStatus();
        }
    }
    
    async testGitHubConnection() {
        const owner = document.getElementById('githubOwner').value;
        const repo = document.getElementById('githubRepo').value;
        const token = document.getElementById('githubToken').value;
        
        if (!owner || !repo || !token) {
            alert('Por favor complete los campos de configuración primero');
            return;
        }
        
        try {
            // Temporarily configure for testing
            const tempGitHub = new GitHubIntegration();
            tempGitHub.configure(owner, repo, token);
            
            const result = await tempGitHub.testConnection();
            if (result.success) {
                alert(`Conexión exitosa: ${result.repoInfo.fullName}`);
            } else {
                alert(`Error de conexión: ${result.message}`);
            }
        } catch (error) {
            alert(`Error probando conexión: ${error.message}`);
        }
    }
    
    updateGitHubStatus() {
        const statusDiv = document.getElementById('githubStatus');
        if (this.isGitHubConfigured) {
            statusDiv.className = 'alert alert-success';
            statusDiv.innerHTML = '<i class="fas fa-check-circle me-2"></i>GitHub configurado correctamente';
        } else {
            statusDiv.className = 'alert alert-secondary';
            statusDiv.innerHTML = '<i class="fas fa-info-circle me-2"></i>GitHub no configurado';
        }
    }
    
    async handleExcelImport(file) {
        if (!file) return;
        
        try {
            const importedData = await this.dataLoader.loadFromExcelFile(file);
            
            // Validate imported data
            const validation = this.dataLoader.validateData();
            if (validation.errors.length > 0) {
                alert(`Errores en el archivo: ${validation.errors.join(', ')}`);
                return;
            }
            
            if (validation.warnings.length > 0) {
                const proceed = confirm(`Advertencias encontradas: ${validation.warnings.join(', ')}. ¿Continuar?`);
                if (!proceed) return;
            }
            
            // Replace current data
            this.data = importedData;
            localStorage.setItem('supervisionesX_data', JSON.stringify(this.data));
            
            // Refresh UI
            this.populateLocationFilters();
            this.updateDashboard();
            this.initializeCharts();
            this.updateDataTable();
            
            alert(`Datos importados exitosamente: ${importedData.length} puntos`);
            
            // Clear file input
            document.getElementById('importExcel').value = '';
            
        } catch (error) {
            console.error('Error importing Excel:', error);
            alert(`Error importando archivo: ${error.message}`);
        }
    }
    
    changePassword() {
        const currentPassword = document.getElementById('appPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        
        if (!currentPassword || !newPassword) {
            alert('Por favor complete ambos campos de contraseña');
            return;
        }
        
        if (currentPassword !== this.password) {
            alert('La contraseña actual es incorrecta');
            return;
        }
        
        if (newPassword.length < 6) {
            alert('La nueva contraseña debe tener al menos 6 caracteres');
            return;
        }
        
        this.password = newPassword;
        localStorage.setItem('supervisionesX_password', newPassword);
        
        // Clear fields
        document.getElementById('appPassword').value = '';
        document.getElementById('newPassword').value = '';
        
        alert('Contraseña cambiada exitosamente');
    }
    
    clearLocalData() {
        const confirm = window.confirm('¿Está seguro de que desea limpiar todos los datos locales? Esta acción no se puede deshacer.');
        if (!confirm) return;
        
        // Clear all local storage data
        localStorage.removeItem('supervisionesX_data');
        localStorage.removeItem('supervisionesX_logs');
        localStorage.removeItem('supervisionesX_currentUser');
        localStorage.removeItem('supervisionesX_github_config');
        localStorage.removeItem('supervisionesX_currentExcel');
        localStorage.removeItem('supervisionesX_excelFiles');
        
        alert('Datos locales limpiados. La página se recargará.');
        location.reload();
    }
    
    // Excel Management Functions
    async handleExcelUpload() {
        const adminPassword = document.getElementById('adminPassword').value;
        const fileInput = document.getElementById('newExcelFile');
        const file = fileInput.files[0];
        
        // Validate admin password
        if (adminPassword !== this.adminPassword) {
            alert('Contraseña de administrador incorrecta');
            return;
        }
        
        if (!file) {
            alert('Por favor seleccione un archivo Excel');
            return;
        }
        
        // Validate file type
        if (!file.name.match(/\.(xlsx|xls)$/)) {
            alert('Solo se permiten archivos Excel (.xlsx, .xls)');
            return;
        }
        
        try {
            // Generate new filename with timestamp
            const now = new Date();
            const monthNames = [
                'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
            ];
            const month = monthNames[now.getMonth()];
            const year = now.getFullYear();
            const timestamp = now.getFullYear().toString() + 
                            (now.getMonth() + 1).toString().padStart(2, '0') + 
                            now.getDate().toString().padStart(2, '0') + 
                            now.getHours().toString().padStart(2, '0') + 
                            now.getMinutes().toString().padStart(2, '0');
            
            const newFileName = `${month}-${year}-${timestamp}.xlsx`;
            
            // Read and validate Excel structure
            const arrayBuffer = await file.arrayBuffer();
            const workbook = XLSX.read(arrayBuffer, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);
            
            // Validate Excel structure
            if (!this.validateExcelStructure(jsonData)) {
                alert('El archivo Excel no tiene la estructura correcta. Debe contener las columnas: LOCACION, COD_CELDA, COD_GRILLA, Este, Norte, PROF, COD_PUNTO_CAMPO, COD_COLECTORA');
                return;
            }
            
            // Save file information
            const excelFileInfo = {
                fileName: newFileName,
                originalName: file.name,
                uploadDate: now.toISOString(),
                size: file.size,
                pointCount: jsonData.length,
                data: jsonData
            };
            
            // Add to excel files list
            this.excelFiles.push(excelFileInfo);
            localStorage.setItem('supervisionesX_excelFiles', JSON.stringify(this.excelFiles));
            
            // Set as current active Excel
            this.currentExcelFile = newFileName;
            localStorage.setItem('supervisionesX_currentExcel', newFileName);
            
            // Load data from new Excel
            this.data = this.transformExcelData(jsonData);
            localStorage.setItem('supervisionesX_data', JSON.stringify(this.data));
            
            // Update UI
            this.updateExcelManagementUI();
            this.populateLocationFilters();
            this.updateDashboard();
            this.initializeCharts();
            this.updateDataTable();
            
            // Clear form
            document.getElementById('adminPassword').value = '';
            fileInput.value = '';
            
            alert(`Excel subido exitosamente como: ${newFileName}\nPuntos cargados: ${jsonData.length}`);
            
        } catch (error) {
            console.error('Error uploading Excel:', error);
            alert(`Error al subir el archivo: ${error.message}`);
        }
    }

    // Dynamic Update Mode Management
    switchUpdateMode(mode) {
        // Hide all panels
        document.getElementById('bulkLocationPanel').style.display = 'none';
        document.getElementById('multiSelectPanel').style.display = 'none';
        document.getElementById('replanteoPanel').style.display = 'none';
        document.getElementById('newPointPanel').style.display = 'none';
        
        // Show selected panel
        switch(mode) {
            case 'bulk-location':
                document.getElementById('bulkLocationPanel').style.display = 'block';
                this.initializeBulkLocationMode();
                break;
            case 'multi-select':
                document.getElementById('multiSelectPanel').style.display = 'block';
                this.initializeMultiSelectMode();
                break;
            case 'replanteo':
                document.getElementById('replanteoPanel').style.display = 'block';
                this.initializeReplanteoMode();
                break;
            case 'new-point':
                document.getElementById('newPointPanel').style.display = 'block';
                this.initializeNewPointMode();
                break;
        }
    }

    // Bulk Location Update Methods
    initializeBulkLocationMode() {
        this.populateLocationSelects(['bulkLocation']);
    }

    populateLocationSelects(selectIds) {
        const locations = [...new Set(this.data.map(item => item.locacion))].sort();
        
        selectIds.forEach(selectId => {
            const select = document.getElementById(selectId);
            if (select) {
                const currentValue = select.value;
                select.innerHTML = '<option value="">Seleccione una locación...</option>';
                
                locations.forEach(location => {
                    const option = document.createElement('option');
                    option.value = location;
                    option.textContent = location;
                    if (location === currentValue) option.selected = true;
                    select.appendChild(option);
                });
            }
        });
    }

    updateBulkPreview(location) {
        const preview = document.getElementById('bulkPreview');
        const pointCount = document.getElementById('bulkPointCount');
        const pointCountText = document.getElementById('pointCountText');
        
        if (!location) {
            preview.innerHTML = '<div class="text-muted">Seleccione una locación para ver los puntos que serán actualizados.</div>';
            pointCount.style.display = 'none';
            return;
        }
        
        const locationPoints = this.data.filter(item => item.locacion === location);
        pointCountText.textContent = `${locationPoints.length} puntos serán actualizados`;
        pointCount.style.display = 'block';
        
        let previewHtml = '<div class="small">';
        locationPoints.slice(0, 10).forEach(point => {
            previewHtml += `<div class="mb-1"><strong>${point.codColectora}</strong><br>`;
            previewHtml += `<small class="text-muted">Marcado: ${point.estadoMarcado || 'pendiente'} | Monitoreo: ${point.estadoMonitoreo || 'pendiente'}</small></div>`;
        });
        
        if (locationPoints.length > 10) {
            previewHtml += `<div class="text-muted">... y ${locationPoints.length - 10} puntos más</div>`;
        }
        previewHtml += '</div>';
        
        preview.innerHTML = previewHtml;
    }

    toggleBulkReasonField(status) {
        const reasonContainer = document.getElementById('bulkReasonContainer');
        reasonContainer.style.display = status === 'descartado' ? 'block' : 'none';
    }

    handleBulkLocationUpdate() {
        const location = document.getElementById('bulkLocation').value;
        const activity = document.getElementById('bulkActivity').value;
        const status = document.getElementById('bulkStatus').value;
        const reason = document.getElementById('bulkReason').value;
        
        if (!location || !activity || !status) {
            alert('Por favor complete todos los campos requeridos');
            return;
        }
        
        if (status === 'descartado' && !reason.trim()) {
            alert('Por favor proporcione una razón para el descarte');
            return;
        }
        
        const locationPoints = this.data.filter(item => item.locacion === location);
        let updatedCount = 0;
        
        locationPoints.forEach(point => {
            if (activity === 'marcado') {
                point.estadoMarcado = status;
            } else if (activity === 'monitoreo') {
                point.estadoMonitoreo = status;
                if (status === 'descartado') {
                    point.razonDescarte = reason;
                }
            }
            
            point.fechaActualizacion = new Date().toISOString().split('T')[0];
            point.usuarioActualizacion = this.currentUser;
            updatedCount++;
        });
        
        // Save to localStorage
        localStorage.setItem('supervisionesX_data', JSON.stringify(this.data));
        
        // Refresh UI
        this.updateDashboard();
        this.initializeCharts();
        this.updateDataTable();
        
        // Reset form
        document.getElementById('bulkLocationForm').reset();
        this.updateBulkPreview('');
        
        alert(`Actualización masiva completada: ${updatedCount} puntos actualizados en ${location}`);
    }

    // Multi-Select Update Methods
    initializeMultiSelectMode() {
        this.populateLocationSelects(['multiLocation']);
        this.populatePointsSelectionTable();
    }

    populatePointsSelectionTable(locationFilter = '') {
        const tbody = document.getElementById('pointsSelectionTable');
        const filteredData = locationFilter ? 
            this.data.filter(item => item.locacion === locationFilter) : 
            this.data;
        
        tbody.innerHTML = '';
        
        filteredData.forEach((point, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <input type="checkbox" class="form-check-input point-checkbox" 
                           data-index="${index}" data-location="${point.locacion}" 
                           data-point="${point.codColectora}">
                </td>
                <td>${point.locacion}</td>
                <td>${point.codColectora}</td>
                <td>
                    <span class="badge bg-${this.getStatusColor(point.estadoMarcado)}">
                        ${point.estadoMarcado || 'pendiente'}
                    </span>
                </td>
                <td>
                    <span class="badge bg-${this.getStatusColor(point.estadoMonitoreo)}">
                        ${point.estadoMonitoreo || 'pendiente'}
                    </span>
                </td>
            `;
            tbody.appendChild(row);
        });
        
        // Add event listeners to checkboxes
        document.querySelectorAll('.point-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.updateSelectedPointsCount();
            });
        });
    }

    getStatusColor(status) {
        switch(status) {
            case 'completado': return 'success';
            case 'descartado': return 'danger';
            case 'pendiente': 
            default: return 'warning';
        }
    }

    filterPointsTable(location) {
        this.populatePointsSelectionTable(location);
        this.updateSelectedPointsCount();
    }

    toggleAllPointsSelection(checked) {
        document.querySelectorAll('.point-checkbox').forEach(checkbox => {
            checkbox.checked = checked;
        });
        this.updateSelectedPointsCount();
    }

    updateSelectedPointsCount() {
        const selectedCheckboxes = document.querySelectorAll('.point-checkbox:checked');
        const count = selectedCheckboxes.length;
        const info = document.getElementById('selectedPointsInfo');
        const countText = document.getElementById('selectedPointsCount');
        const applyButton = document.getElementById('applyMultiUpdate');
        
        if (count > 0) {
            info.style.display = 'block';
            countText.textContent = `${count} puntos seleccionados`;
            applyButton.disabled = false;
        } else {
            info.style.display = 'none';
            applyButton.disabled = true;
        }
    }

    toggleMultiReasonField(status) {
        const reasonContainer = document.getElementById('multiReasonContainer');
        reasonContainer.style.display = status === 'descartado' ? 'block' : 'none';
    }

    handleMultiUpdate() {
        const activity = document.getElementById('multiActivity').value;
        const status = document.getElementById('multiStatus').value;
        const reason = document.getElementById('multiReason').value;
        const selectedCheckboxes = document.querySelectorAll('.point-checkbox:checked');
        
        if (!activity || !status) {
            alert('Por favor complete todos los campos requeridos');
            return;
        }
        
        if (status === 'descartado' && !reason.trim()) {
            alert('Por favor proporcione una razón para el descarte');
            return;
        }
        
        if (selectedCheckboxes.length === 0) {
            alert('Por favor seleccione al menos un punto');
            return;
        }
        
        let updatedCount = 0;
        selectedCheckboxes.forEach(checkbox => {
            const location = checkbox.dataset.location;
            const pointCode = checkbox.dataset.point;
            
            const point = this.data.find(item => 
                item.locacion === location && item.codColectora === pointCode
            );
            
            if (point) {
                if (activity === 'marcado') {
                    point.estadoMarcado = status;
                } else if (activity === 'monitoreo') {
                    point.estadoMonitoreo = status;
                    if (status === 'descartado') {
                        point.razonDescarte = reason;
                    }
                }
                
                point.fechaActualizacion = new Date().toISOString().split('T')[0];
                point.usuarioActualizacion = this.currentUser;
                updatedCount++;
            }
        });
        
        // Save to localStorage
        localStorage.setItem('supervisionesX_data', JSON.stringify(this.data));
        
        // Refresh UI
        this.updateDashboard();
        this.initializeCharts();
        this.updateDataTable();
        this.populatePointsSelectionTable(document.getElementById('multiLocation').value);
        
        // Reset selections
        document.getElementById('selectAllPoints').checked = false;
        this.updateSelectedPointsCount();
        
        alert(`Actualización múltiple completada: ${updatedCount} puntos actualizados`);
    }

    // Replanteo Mode Methods
    initializeReplanteoMode() {
        this.populateLocationSelects(['replanteoLocation']);
    }

    populateReplanteoPoints(location) {
        const select = document.getElementById('replanteoPoint');
        select.innerHTML = '<option value="">Seleccione un punto...</option>';
        
        if (location) {
            const points = this.data.filter(item => item.locacion === location);
            points.forEach(point => {
                const option = document.createElement('option');
                option.value = point.codColectora;
                option.textContent = `${point.codColectora} - ${point.codPuntoCampo}`;
                option.dataset.pointData = JSON.stringify(point);
                select.appendChild(option);
            });
        }
    }

    updateReplanteoPreview(pointCode) {
        const preview = document.getElementById('replanteoPreview');
        const select = document.getElementById('replanteoPoint');
        
        if (!pointCode) {
            preview.innerHTML = '<div class="text-muted">Seleccione un punto para ver su información.</div>';
            return;
        }
        
        const selectedOption = select.querySelector(`option[value="${pointCode}"]`);
        if (selectedOption) {
            const point = JSON.parse(selectedOption.dataset.pointData);
            preview.innerHTML = `
                <div class="small">
                    <div class="mb-2"><strong>Punto Original:</strong><br>${point.codPuntoCampo}</div>
                    <div class="mb-2"><strong>Código Colectora:</strong><br>${point.codColectora}</div>
                    <div class="mb-2"><strong>Coordenadas Actuales:</strong><br>
                        Este: ${point.este}<br>
                        Norte: ${point.norte}
                    </div>
                    <div class="mb-2"><strong>Profundidad:</strong><br>${point.prof}</div>
                    <hr>
                    <div class="text-info">
                        <strong>Nuevo Punto (Replanteo):</strong><br>
                        ${point.codPuntoCampo}R<br>
                        ${point.codColectora}R
                    </div>
                </div>
            `;
        }
    }

    handleReplanteoCreation() {
        const location = document.getElementById('replanteoLocation').value;
        const pointCode = document.getElementById('replanteoPoint').value;
        const newEste = parseFloat(document.getElementById('replanteoEste').value);
        const newNorte = parseFloat(document.getElementById('replanteoNorte').value);
        
        if (!location || !pointCode || !newEste || !newNorte) {
            alert('Por favor complete todos los campos requeridos');
            return;
        }
        
        const originalPoint = this.data.find(item => 
            item.locacion === location && item.codColectora === pointCode
        );
        
        if (!originalPoint) {
            alert('No se encontró el punto original');
            return;
        }
        
        // Check if replanteo already exists
        const replanteoExists = this.data.some(item => 
            item.codColectora === pointCode + 'R'
        );
        
        if (replanteoExists) {
            alert('Ya existe un replanteo para este punto');
            return;
        }
        
        // Create replanteo point
        const replanteoPoint = {
            ...originalPoint,
            codPuntoCampo: originalPoint.codPuntoCampo + 'R',
            codColectora: originalPoint.codColectora + 'R',
            este: newEste,
            norte: newNorte,
            estadoMarcado: 'completado', // Replanteo is automatically marked as completed
            estadoMonitoreo: 'pendiente',
            fechaActualizacion: new Date().toISOString().split('T')[0],
            usuarioActualizacion: this.currentUser,
            razonDescarte: null
        };
        
        // Add to data
        this.data.push(replanteoPoint);
        
        // Save to localStorage
        localStorage.setItem('supervisionesX_data', JSON.stringify(this.data));
        
        // Refresh UI
        this.updateDashboard();
        this.initializeCharts();
        this.updateDataTable();
        this.populateLocationFilters();
        
        // Reset form
        document.getElementById('replanteoForm').reset();
        this.updateReplanteoPreview('');
        
        alert(`Replanteo creado exitosamente: ${replanteoPoint.codColectora}`);
    }

    // New Point Mode Methods
    initializeNewPointMode() {
        this.populateLocationSelects(['newPointLocation']);
    }

    populateNewPointReferences(location) {
        const select = document.getElementById('newPointReference');
        select.innerHTML = '<option value="">Seleccione un punto de referencia...</option>';
        
        if (location) {
            const points = this.data.filter(item => item.locacion === location);
            points.forEach(point => {
                const option = document.createElement('option');
                option.value = point.codColectora;
                option.textContent = `${point.codColectora} - ${point.codPuntoCampo}`;
                option.dataset.pointData = JSON.stringify(point);
                select.appendChild(option);
            });
        }
    }

    updateNewPointPreview() {
        const preview = document.getElementById('newPointPreview');
        const location = document.getElementById('newPointLocation').value;
        const referenceCode = document.getElementById('newPointReference').value;
        
        if (!location) {
            preview.innerHTML = '<div class="text-muted">Complete los datos para ver la vista previa del nuevo punto.</div>';
            return;
        }
        
        // Generate new point number
        const locationPoints = this.data.filter(item => item.locacion === location);
        const newPointNumbers = locationPoints
            .filter(item => item.codColectora.includes('N'))
            .map(item => {
                const match = item.codColectora.match(/N(\d+)$/);
                return match ? parseInt(match[1]) : 0;
            });
        
        const nextNumber = newPointNumbers.length > 0 ? Math.max(...newPointNumbers) + 1 : 1;
        const newPointSuffix = `N${nextNumber}`;
        
        let previewHtml = `
            <div class="small">
                <div class="mb-2"><strong>Locación:</strong><br>${location}</div>
                <div class="mb-2"><strong>Nuevo Código:</strong><br>${location}-${nextNumber}${newPointSuffix}</div>
        `;
        
        if (referenceCode) {
            const referenceSelect = document.getElementById('newPointReference');
            const selectedOption = referenceSelect.querySelector(`option[value="${referenceCode}"]`);
            if (selectedOption) {
                const referencePoint = JSON.parse(selectedOption.dataset.pointData);
                previewHtml += `
                    <div class="mb-2"><strong>Punto de Referencia:</strong><br>${referencePoint.codPuntoCampo}</div>
                    <div class="mb-2"><strong>Coordenadas de Referencia:</strong><br>
                        Este: ${referencePoint.este}<br>
                        Norte: ${referencePoint.norte}
                    </div>
                `;
            }
        }
        
        previewHtml += `
                <hr>
                <div class="text-success">
                    <strong>Nuevo Punto:</strong><br>
                    Se creará con numeración correlativa
                </div>
            </div>
        `;
        
        preview.innerHTML = previewHtml;
    }

    handleNewPointCreation() {
        const location = document.getElementById('newPointLocation').value;
        const referenceCode = document.getElementById('newPointReference').value;
        const este = parseFloat(document.getElementById('newPointEste').value);
        const norte = parseFloat(document.getElementById('newPointNorte').value);
        const prof = parseFloat(document.getElementById('newPointProf').value);
        const superpos = parseFloat(document.getElementById('newPointSuperpos').value) || 0;
        const distance = document.getElementById('newPointDistance').value || '';
        
        if (!location || !este || !norte || !prof) {
            alert('Por favor complete todos los campos requeridos');
            return;
        }
        
        // Generate new point data
        const locationPoints = this.data.filter(item => item.locacion === location);
        const newPointNumbers = locationPoints
            .filter(item => item.codColectora.includes('N'))
            .map(item => {
                const match = item.codColectora.match(/N(\d+)$/);
                return match ? parseInt(match[1]) : 0;
            });
        
        const nextNumber = newPointNumbers.length > 0 ? Math.max(...newPointNumbers) + 1 : 1;
        const newPointSuffix = `N${nextNumber}`;
        
        // Use reference point as template or create from scratch
        let newPoint;
        if (referenceCode) {
            const referencePoint = this.data.find(item => 
                item.locacion === location && item.codColectora === referenceCode
            );
            
            if (referencePoint) {
                newPoint = {
                    ...referencePoint,
                    codPuntoCampo: referencePoint.codPuntoCampo + newPointSuffix,
                    codColectora: referencePoint.codColectora + newPointSuffix,
                    este: este,
                    norte: norte,
                    prof: prof,
                    pSuperpos: superpos,
                    distancia: distance,
                    estadoMarcado: 'pendiente',
                    estadoMonitoreo: 'pendiente',
                    fechaActualizacion: new Date().toISOString().split('T')[0],
                    usuarioActualizacion: this.currentUser,
                    razonDescarte: null
                };
            }
        } else {
            // Create new point from scratch
            newPoint = {
                locacion: location,
                codCelda: `SUE-${location}-${nextNumber}`,
                codGrilla: `${location}_SUE-${location}-${nextNumber}_${String(nextNumber).padStart(3, '0')}`,
                este: este,
                norte: norte,
                prof: prof,
                pSuperpos: superpos,
                codPuntoCampo: `L-X,6,PZ${location}-${nextNumber}${newPointSuffix}`,
                codColectora: `${location}-${nextNumber}${newPointSuffix}`,
                distancia: distance,
                estadoMarcado: 'pendiente',
                estadoMonitoreo: 'pendiente',
                fechaActualizacion: new Date().toISOString().split('T')[0],
                usuarioActualizacion: this.currentUser,
                razonDescarte: null
            };
        }
        
        if (!newPoint) {
            alert('Error creando el nuevo punto');
            return;
        }
        
        // Add to data
        this.data.push(newPoint);
        
        // Save to localStorage
        localStorage.setItem('supervisionesX_data', JSON.stringify(this.data));
        
        // Refresh UI
        this.updateDashboard();
        this.initializeCharts();
        this.updateDataTable();
        this.populateLocationFilters();
        
        // Reset form
        document.getElementById('newPointForm').reset();
        this.updateNewPointPreview();
        
        alert(`Nuevo punto creado exitosamente: ${newPoint.codColectora}`);
    }

    // Override the original populateLocationFilters to include new selects
    populateLocationFilters() {
        const locations = [...new Set(this.data.map(item => item.locacion))].sort();
        const selects = [
            'locationFilter',
            'bulkLocation', 
            'multiLocation', 
            'replanteoLocation', 
            'newPointLocation'
        ];
        
        selects.forEach(selectId => {
            const select = document.getElementById(selectId);
            if (select) {
                const currentValue = select.value;
                const isFilter = selectId === 'locationFilter';
                
                select.innerHTML = isFilter ? 
                    '<option value="">Todas las locaciones</option>' : 
                    '<option value="">Seleccione una locación...</option>';
                
                locations.forEach(location => {
                    const option = document.createElement('option');
                    option.value = location;
                    option.textContent = location;
                    if (location === currentValue) option.selected = true;
                    select.appendChild(option);
                });
            }
        });
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.supervisionesX = new SupervisionesX();
});
