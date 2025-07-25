// Excel Management Module for Supervisiones X
class ExcelManager {
    constructor(app) {
        this.app = app;
        this.adminPassword = 'admin.lotex2025';
        this.currentExcelFile = localStorage.getItem('supervisionesX_currentExcel') || 'muestra_final.xlsx';
        this.excelFiles = JSON.parse(localStorage.getItem('supervisionesX_excelFiles') || '[]');
        
        // Initialize GitHub integration with hardcoded config
        this.github = new GitHubIntegration();
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.initializeExcelManagement();
    }
    
    setupEventListeners() {
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
            this.app.data = this.transformExcelData(jsonData);
            localStorage.setItem('supervisionesX_data', JSON.stringify(this.app.data));
            
            // Update UI
            this.updateExcelManagementUI();
            this.app.populateLocationFilters();
            this.app.updateDashboard();
            this.app.initializeCharts();
            this.app.updateDataTable();
            
            // Upload to GitHub automatically
            try {
                console.log('Uploading Excel file to GitHub...');
                const githubResult = await this.github.uploadExcelFile(
                    jsonData, 
                    newFileName, 
                    `Upload new Excel file: ${newFileName} with ${jsonData.length} points`
                );
                console.log('Excel file uploaded to GitHub successfully:', githubResult);
            } catch (githubError) {
                console.error('Error uploading to GitHub:', githubError);
                // Don't fail the entire process if GitHub upload fails
                alert(`Archivo subido localmente, pero error al sincronizar con GitHub: ${githubError.message}`);
            }
            
            // Clear form
            document.getElementById('adminPassword').value = '';
            fileInput.value = '';
            
            alert(`Excel subido exitosamente como: ${newFileName}\nPuntos cargados: ${jsonData.length}\nSincronizado con GitHub automáticamente`);
            
        } catch (error) {
            console.error('Error uploading Excel:', error);
            alert(`Error al subir el archivo: ${error.message}`);
        }
    }
    
    validateExcelStructure(data) {
        if (!data || data.length === 0) return false;
        
        const requiredColumns = ['LOCACION', 'COD_CELDA', 'COD_GRILLA', 'Este', 'Norte', 'PROF', 'COD_PUNTO_CAMPO', 'COD_COLECTORA'];
        const firstRow = data[0];
        
        return requiredColumns.every(col => firstRow.hasOwnProperty(col));
    }
    
    transformExcelData(jsonData) {
        return jsonData.map(row => ({
            locacion: row.LOCACION || '',
            codCelda: row.COD_CELDA || '',
            codGrilla: row.COD_GRILLA || '',
            este: parseFloat(row.Este) || 0,
            norte: parseFloat(row.Norte) || 0,
            prof: parseFloat(row.PROF) || 0,
            codPuntoCampo: row.COD_PUNTO_CAMPO || '',
            codColectora: row.COD_COLECTORA || '',
            estadoMarcado: 'pendiente',
            estadoMonitoreo: 'pendiente',
            fechaActualizacion: null,
            usuarioActualizacion: null,
            razonDescarte: null
        }));
    }
    
    async handleExcelChange() {
        const selectedFile = document.getElementById('excelFileSelect').value;
        
        if (!selectedFile) {
            alert('Por favor seleccione un archivo Excel');
            return;
        }
        
        // Ask for admin password
        const adminPassword = prompt('Ingrese la contraseña de administrador para cambiar el Excel activo:');
        
        if (adminPassword !== this.adminPassword) {
            alert('Contraseña de administrador incorrecta');
            return;
        }
        
        try {
            // Find the selected Excel file
            const excelFile = this.excelFiles.find(f => f.fileName === selectedFile);
            
            if (!excelFile) {
                alert('Archivo no encontrado');
                return;
            }
            
            // Set as current active Excel
            this.currentExcelFile = selectedFile;
            localStorage.setItem('supervisionesX_currentExcel', selectedFile);
            
            // Load data from selected Excel
            this.app.data = this.transformExcelData(excelFile.data);
            localStorage.setItem('supervisionesX_data', JSON.stringify(this.app.data));
            
            // Update UI
            this.updateExcelManagementUI();
            this.app.populateLocationFilters();
            this.app.updateDashboard();
            this.app.initializeCharts();
            this.app.updateDataTable();
            
            alert(`Excel activo cambiado a: ${selectedFile}`);
            
        } catch (error) {
            console.error('Error changing Excel:', error);
            alert(`Error al cambiar el Excel: ${error.message}`);
        }
    }
    
    previewExcelChange(fileName) {
        if (!fileName) return;
        
        const excelFile = this.excelFiles.find(f => f.fileName === fileName);
        if (excelFile) {
            console.log(`Preview: ${fileName} - ${excelFile.pointCount} puntos`);
        }
    }
    
    updateExcelManagementUI() {
        // Update current Excel display
        const currentExcelDiv = document.getElementById('currentExcelFile');
        if (currentExcelDiv) {
            currentExcelDiv.innerHTML = `<span class="badge bg-primary">${this.currentExcelFile}</span>`;
        }
        
        // Update Excel file select dropdown
        const excelSelect = document.getElementById('excelFileSelect');
        if (excelSelect) {
            excelSelect.innerHTML = '<option value="">Seleccione un archivo...</option>';
            
            this.excelFiles.forEach(file => {
                const option = document.createElement('option');
                option.value = file.fileName;
                option.textContent = `${file.fileName} (${file.pointCount} puntos)`;
                if (file.fileName === this.currentExcelFile) {
                    option.selected = true;
                }
                excelSelect.appendChild(option);
            });
        }
        
        // Update Excel history table
        this.updateExcelHistoryTable();
    }
    
    updateExcelHistoryTable() {
        const tbody = document.getElementById('excelHistoryTable');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        
        // Sort by upload date (newest first)
        const sortedFiles = [...this.excelFiles].sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));
        
        sortedFiles.forEach(file => {
            const row = document.createElement('tr');
            const uploadDate = new Date(file.uploadDate);
            const isActive = file.fileName === this.currentExcelFile;
            
            row.innerHTML = `
                <td>
                    ${file.fileName}
                    ${isActive ? '<span class="badge bg-success ms-2">Activo</span>' : ''}
                </td>
                <td>${uploadDate.toLocaleString('es-ES')}</td>
                <td>${(file.size / 1024).toFixed(1)} KB</td>
                <td>${file.pointCount}</td>
                <td>
                    ${isActive ? 
                        '<span class="badge bg-success">En uso</span>' : 
                        '<span class="badge bg-secondary">Disponible</span>'
                    }
                </td>
                <td>
                    ${!isActive ? 
                        `<button class="btn btn-sm btn-outline-primary" onclick="window.excelManager.activateExcel('${file.fileName}')">Activar</button>` : 
                        '<span class="text-muted">Archivo activo</span>'
                    }
                </td>
            `;
            
            tbody.appendChild(row);
        });
    }
    
    async activateExcel(fileName) {
        // Ask for admin password
        const adminPassword = prompt('Ingrese la contraseña de administrador:');
        
        if (adminPassword !== this.adminPassword) {
            alert('Contraseña de administrador incorrecta');
            return;
        }
        
        // Set the selected file in dropdown and trigger change
        const excelSelect = document.getElementById('excelFileSelect');
        if (excelSelect) {
            excelSelect.value = fileName;
            await this.handleExcelChange();
        }
    }
    
    initializeExcelManagement() {
        // Load Excel files list if exists
        if (this.excelFiles.length === 0) {
            // Add default file if no files exist
            const defaultFile = {
                fileName: 'muestra_final.xlsx',
                originalName: 'muestra_final.xlsx',
                uploadDate: new Date().toISOString(),
                size: 0,
                pointCount: this.app ? this.app.data.length : 0,
                data: []
            };
            this.excelFiles.push(defaultFile);
            localStorage.setItem('supervisionesX_excelFiles', JSON.stringify(this.excelFiles));
        }
        
        this.updateExcelManagementUI();
    }
    
    getCurrentExcelFile() {
        return this.currentExcelFile;
    }
    
    getExcelFiles() {
        return this.excelFiles;
    }
}
