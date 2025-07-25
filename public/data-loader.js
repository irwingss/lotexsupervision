// Data Loader for Supervisiones X
// Handles loading and parsing data from Excel files and text formats

class DataLoader {
    constructor() {
        this.rawData = [];
        this.processedData = [];
    }

    // Load data from the provided text format (converted from Excel)
    async loadFromTextData() {
        const textData = `LOCACION	COD_CELDA	COD_GRILLA	Este	Norte	PROF	P_SUPERPOS	COD_PUNTO_CAMPO	COD_COLECTORA	DISTANCIA
BAT-CE10-950	SUE-BAT-CE10-950-149	BAT-CE10-950_SUE-BAT-CE10-950-149_009	479379.877	9527479.093	0.1	SUE-BAT-CE10-950-149 21.606%, SUE-BAT-CE10-950-149 78.394%	L-X,6,PZBAT-CE10-950-1	BAT-CE10-950-1	Punto de muestreo de suelo ubicado aproximadamente a 73 metros con dirección al oeste de la locación BAT-CE10-950
BAT-CE10-950	SUE-BAT-CE10-950-149	BAT-CE10-950_SUE-BAT-CE10-950-149_004	479379.9224	9527477.399	0.1	SUE-BAT-CE10-950-149 100.000%	L-X,6,PZBAT-CE10-950-2	BAT-CE10-950-2	Punto de muestreo de suelo ubicado aproximadamente a 72 metros con dirección al oeste de la locación BAT-CE10-950
BAT-CE10-950	SUE-BAT-CE10-950-149	BAT-CE10-950_SUE-BAT-CE10-950-149_006	479381.5476	9527477.448	0.1	SUE-BAT-CE10-950-149 100.000%	L-X,6,PZBAT-CE10-950-3	BAT-CE10-950-3	Punto de muestreo de suelo ubicado aproximadamente a 71 metros con dirección al oeste de la locación BAT-CE10-950
BAT-CE10-950	SUE-BAT-CE10-950-149	BAT-CE10-950_SUE-BAT-CE10-950-149_008	479381.6058	9527479.09	0.1	SUE-BAT-CE10-950-149 100.000%	L-X,6,PZBAT-CE10-950-4	BAT-CE10-950-4	Punto de muestreo de suelo ubicado aproximadamente a 71 metros con dirección al oeste de la locación BAT-CE10-950
BAT-CE10-950	SUE-BAT-CE10-950-069	BAT-CE10-950_SUE-BAT-CE10-950-069_033	479385.0732	9527486.021	0.4	SUE-BAT-CE10-950-069 100.000%	L-X,6,PZBAT-CE10-950-5	BAT-CE10-950-5	Punto de muestreo de suelo ubicado aproximadamente a 69 metros con dirección al oeste de la locación BAT-CE10-950
BAT-CE10-950	SUE-BAT-CE10-950-069	BAT-CE10-950_SUE-BAT-CE10-950-069_044	479385.0732	9527489.486	0.4	SUE-BAT-CE10-950-069 100.000%	L-X,6,PZBAT-CE10-950-6	BAT-CE10-950-6	Punto de muestreo de suelo ubicado aproximadamente a 70 metros con dirección al oeste de la locación BAT-CE10-950
BAT-CE10-950	SUE-BAT-CE10-950-069	BAT-CE10-950_SUE-BAT-CE10-950-069_061	479386.8052	9527489.486	0.4	SUE-BAT-CE10-950-069 100.000%	L-X,6,PZBAT-CE10-950-7	BAT-CE10-950-7	Punto de muestreo de suelo ubicado aproximadamente a 68 metros con dirección al oeste de la locación BAT-CE10-950
BAT-CE10-950	SUE-BAT-CE10-950-069	BAT-CE10-950_SUE-BAT-CE10-950-069_027	479386.8052	9527491.218	0.4	SUE-BAT-CE10-950-069 100.000%	L-X,6,PZBAT-CE10-950-8	BAT-CE10-950-8	Punto de muestreo de suelo ubicado aproximadamente a 69 metros con dirección al oeste de la locación BAT-CE10-950
BAT-CE10-950	SUE-BAT-CE10-950-069	BAT-CE10-950_SUE-BAT-CE10-950-069_053	479388.5373	9527491.218	0.4	SUE-BAT-CE10-950-069 100.000%	L-X,6,PZBAT-CE10-950-9	BAT-CE10-950-9	Punto de muestreo de suelo ubicado aproximadamente a 67 metros con dirección al oeste de la locación BAT-CE10-950
BAT-CE10-950	SUE-BAT-CE10-950-069	BAT-CE10-950_SUE-BAT-CE10-950-069_041	479385.0732	9527492.95	0.4	SUE-BAT-CE10-950-069 100.000%	L-X,6,PZBAT-CE10-950-10	BAT-CE10-950-10	Punto de muestreo de suelo ubicado aproximadamente a 71 metros con dirección al oeste de la locación BAT-CE10-950
BAT-CE10-950	SUE-BAT-CE10-950-069	BAT-CE10-950_SUE-BAT-CE10-950-069_006	479383.3411	9527496.414	0.4	SUE-BAT-CE10-950-069 100.000%	L-X,6,PZBAT-CE10-950-11	BAT-CE10-950-11	Punto de muestreo de suelo ubicado aproximadamente a 74 metros con dirección al oeste de la locación BAT-CE10-950
BAT-CE10-950	SUE-BAT-CE10-950-069	BAT-CE10-950_SUE-BAT-CE10-950-069_051	479390.2694	9527486.021	0.4	SUE-BAT-CE10-950-069 100.000%	L-X,6,PZBAT-CE10-950-12	BAT-CE10-950-12	Punto de muestreo de suelo ubicado aproximadamente a 64 metros con dirección al oeste de la locación BAT-CE10-950
BAT-CE10-950	SUE-BAT-CE10-950-069	BAT-CE10-950_SUE-BAT-CE10-950-069_046	479391.9821	9527484.318	0.4	SUE-BAT-CE10-950-069 100.000%	L-X,6,PZBAT-CE10-950-13	BAT-CE10-950-13	Punto de muestreo de suelo ubicado aproximadamente a 62 metros con dirección al oeste de la locación BAT-CE10-950
BAT-CE10-950	SUE-BAT-CE10-950-069	BAT-CE10-950_SUE-BAT-CE10-950-069_019	479393.7334	9527486.021	0.4	SUE-BAT-CE10-950-069 100.000%	L-X,6,PZBAT-CE10-950-14	BAT-CE10-950-14	Punto de muestreo de suelo ubicado aproximadamente a 61 metros con dirección al oeste de la locación BAT-CE10-950
BAT-ZA01	SUE-BAT-ZA01-1102	BAT-ZA01_SUE-BAT-ZA01-1102_001	483980.2039	9527894.785	0.05	SUE-BAT-ZA01-1102 100.000%	L-X,6,PZBAT-ZA01-1	BAT-ZA01-1	Punto de muestreo de suelo ubicado aproximadamente a 385 metros con dirección al suroeste de la locación BAT-ZA01
BAT-ZA01	SUE-BAT-ZA01-1102	BAT-ZA01_SUE-BAT-ZA01-1102_002	483981.8972	9527894.782	0.05	SUE-BAT-ZA01-1102 100.000%	L-X,6,PZBAT-ZA01-2	BAT-ZA01-2	Punto de muestreo de suelo ubicado aproximadamente a 384 metros con dirección al suroeste de la locación BAT-ZA01
BAT-ZA01	SUE-BAT-ZA01-1102	BAT-ZA01_SUE-BAT-ZA01-1102_003	483981.8688	9527896.517	0.05	SUE-BAT-ZA01-1102 100.000%	L-X,6,PZBAT-ZA01-3	BAT-ZA01-3	Punto de muestreo de suelo ubicado aproximadamente a 382 metros con dirección al suroeste de la locación BAT-ZA01
BAT-ZA01	SUE-BAT-ZA01-456	BAT-ZA01_SUE-BAT-ZA01-456_005	483982.0002	9527910.323	0.1	SUE-BAT-ZA01-456 100.000%	L-X,6,PZBAT-ZA01-4	BAT-ZA01-4	Punto de muestreo de suelo ubicado aproximadamente a 370 metros con dirección al suroeste de la locación BAT-ZA01
BAT-ZA01	SUE-BAT-ZA01-456	BAT-ZA01_SUE-BAT-ZA01-456_003	483983.4013	9527910.364	0.1	SUE-BAT-ZA01-456 100.000%	L-X,6,PZBAT-ZA01-5	BAT-ZA01-5	Punto de muestreo de suelo ubicado aproximadamente a 369 metros con dirección al suroeste de la locación BAT-ZA01
BAT-ZA01	SUE-BAT-ZA01-456	BAT-ZA01_SUE-BAT-ZA01-456_004	483983.6069	9527913.861	0.1	SUE-BAT-ZA01-456 100.000%	L-X,6,PZBAT-ZA01-6	BAT-ZA01-6	Punto de muestreo de suelo ubicado aproximadamente a 366 metros con dirección al suroeste de la locación BAT-ZA01`;

        return this.parseTextData(textData);
    }

    // Parse tab-separated text data
    parseTextData(textData) {
        const lines = textData.trim().split('\n');
        const headers = lines[0].split('\t');
        const data = [];

        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split('\t');
            const row = {};
            
            headers.forEach((header, index) => {
                row[header] = values[index] || '';
            });
            
            data.push(row);
        }

        this.rawData = data;
        return this.processData();
    }

    // Process raw data into the format expected by the application
    processData() {
        this.processedData = this.rawData.map(row => ({
            locacion: row.LOCACION || '',
            codCelda: row.COD_CELDA || '',
            codGrilla: row.COD_GRILLA || '',
            este: parseFloat(row.Este) || 0,
            norte: parseFloat(row.Norte) || 0,
            prof: parseFloat(row.PROF) || 0,
            pSuperpos: row.P_SUPERPOS || '',
            codPuntoCampo: row.COD_PUNTO_CAMPO || '',
            codColectora: row.COD_COLECTORA || '',
            distancia: row.DISTANCIA || '',
            
            // Add tracking fields
            estadoMarcado: 'pendiente',
            estadoMonitoreo: 'pendiente',
            fechaActualizacion: null,
            usuarioActualizacion: null,
            razonDescarte: null,
            
            // Metadata
            fechaCreacion: new Date().toISOString().split('T')[0],
            activo: true
        }));

        return this.processedData;
    }

    // Load data from Excel file using SheetJS
    async loadFromExcelFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    
                    // Get first worksheet
                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];
                    
                    // Convert to JSON
                    const jsonData = XLSX.utils.sheet_to_json(worksheet);
                    
                    this.rawData = jsonData;
                    const processed = this.processData();
                    resolve(processed);
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = () => reject(new Error('Error reading file'));
            reader.readAsArrayBuffer(file);
        });
    }

    // Export data to Excel format
    exportToExcel(data, filename = 'supervisiones_x_export.xlsx') {
        // Prepare data for export
        const exportData = data.map(item => ({
            LOCACION: item.locacion,
            COD_CELDA: item.codCelda,
            COD_GRILLA: item.codGrilla,
            Este: item.este,
            Norte: item.norte,
            PROF: item.prof,
            P_SUPERPOS: item.pSuperpos,
            COD_PUNTO_CAMPO: item.codPuntoCampo,
            COD_COLECTORA: item.codColectora,
            DISTANCIA: item.distancia,
            ESTADO_MARCADO: item.estadoMarcado,
            ESTADO_MONITOREO: item.estadoMonitoreo,
            FECHA_ACTUALIZACION: item.fechaActualizacion,
            USUARIO_ACTUALIZACION: item.usuarioActualizacion,
            RAZON_DESCARTE: item.razonDescarte
        }));

        // Create workbook
        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Supervisiones");
        
        // Auto-size columns
        const colWidths = [];
        const headers = Object.keys(exportData[0] || {});
        headers.forEach((header, i) => {
            const maxLength = Math.max(
                header.length,
                ...exportData.map(row => String(row[header] || '').length)
            );
            colWidths[i] = { width: Math.min(maxLength + 2, 50) };
        });
        ws['!cols'] = colWidths;

        // Save file
        XLSX.writeFile(wb, filename);
    }

    // Get statistics from the data
    getStatistics() {
        if (!this.processedData.length) return null;

        const stats = {
            total: this.processedData.length,
            locations: [...new Set(this.processedData.map(item => item.locacion))].length,
            marcado: {
                completado: this.processedData.filter(item => item.estadoMarcado === 'completado').length,
                pendiente: this.processedData.filter(item => item.estadoMarcado === 'pendiente').length,
                descartado: this.processedData.filter(item => item.estadoMarcado === 'descartado').length
            },
            monitoreo: {
                completado: this.processedData.filter(item => item.estadoMonitoreo === 'completado').length,
                pendiente: this.processedData.filter(item => item.estadoMonitoreo === 'pendiente').length,
                descartado: this.processedData.filter(item => item.estadoMonitoreo === 'descartado').length
            },
            byLocation: {}
        };

        // Calculate stats by location
        const locations = [...new Set(this.processedData.map(item => item.locacion))];
        locations.forEach(location => {
            const locationData = this.processedData.filter(item => item.locacion === location);
            stats.byLocation[location] = {
                total: locationData.length,
                marcado: {
                    completado: locationData.filter(item => item.estadoMarcado === 'completado').length,
                    pendiente: locationData.filter(item => item.estadoMarcado === 'pendiente').length,
                    descartado: locationData.filter(item => item.estadoMarcado === 'descartado').length
                },
                monitoreo: {
                    completado: locationData.filter(item => item.estadoMonitoreo === 'completado').length,
                    pendiente: locationData.filter(item => item.estadoMonitoreo === 'pendiente').length,
                    descartado: locationData.filter(item => item.estadoMonitoreo === 'descartado').length
                }
            };
        });

        return stats;
    }

    // Validate data integrity
    validateData() {
        const errors = [];
        const warnings = [];

        this.processedData.forEach((item, index) => {
            // Required fields validation
            if (!item.locacion) errors.push(`Row ${index + 1}: Missing LOCACION`);
            if (!item.codPuntoCampo) errors.push(`Row ${index + 1}: Missing COD_PUNTO_CAMPO`);
            if (!item.codColectora) errors.push(`Row ${index + 1}: Missing COD_COLECTORA`);
            
            // Coordinate validation
            if (!item.este || item.este === 0) warnings.push(`Row ${index + 1}: Missing or zero Este coordinate`);
            if (!item.norte || item.norte === 0) warnings.push(`Row ${index + 1}: Missing or zero Norte coordinate`);
            
            // Depth validation
            if (item.prof < 0) warnings.push(`Row ${index + 1}: Negative depth value`);
        });

        return { errors, warnings };
    }

    // Get data for a specific location
    getLocationData(location) {
        return this.processedData.filter(item => item.locacion === location);
    }

    // Search data by various criteria
    searchData(criteria) {
        return this.processedData.filter(item => {
            let matches = true;
            
            if (criteria.location && item.locacion !== criteria.location) matches = false;
            if (criteria.estadoMarcado && item.estadoMarcado !== criteria.estadoMarcado) matches = false;
            if (criteria.estadoMonitoreo && item.estadoMonitoreo !== criteria.estadoMonitoreo) matches = false;
            if (criteria.usuario && item.usuarioActualizacion !== criteria.usuario) matches = false;
            
            if (criteria.searchTerm) {
                const searchTerm = criteria.searchTerm.toLowerCase();
                const searchableFields = [
                    item.locacion,
                    item.codPuntoCampo,
                    item.codColectora,
                    item.distancia
                ].join(' ').toLowerCase();
                
                if (!searchableFields.includes(searchTerm)) matches = false;
            }
            
            return matches;
        });
    }

    // Get processed data
    getData() {
        return this.processedData;
    }

    // Update a specific data point
    updateDataPoint(codColectora, updates) {
        const index = this.processedData.findIndex(item => item.codColectora === codColectora);
        if (index !== -1) {
            this.processedData[index] = { ...this.processedData[index], ...updates };
            return this.processedData[index];
        }
        return null;
    }

    // Add new data point (for new points)
    addDataPoint(newPoint) {
        // Generate new codes if not provided
        if (!newPoint.codColectora) {
            const locationPoints = this.processedData.filter(item => item.locacion === newPoint.locacion);
            const maxNumber = Math.max(...locationPoints.map(item => {
                const match = item.codColectora.match(/-(\d+)$/);
                return match ? parseInt(match[1]) : 0;
            }));
            
            newPoint.codColectora = `${newPoint.locacion}-${maxNumber + 1}N`;
            newPoint.codPuntoCampo = `${newPoint.codPuntoCampo || 'L-X,6,PZ' + newPoint.locacion}-${maxNumber + 1}N`;
        }

        this.processedData.push({
            ...newPoint,
            fechaCreacion: new Date().toISOString().split('T')[0],
            activo: true
        });

        return newPoint;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataLoader;
} else {
    window.DataLoader = DataLoader;
}
