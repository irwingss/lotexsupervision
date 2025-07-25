// Page Loader for Supervisiones X
// Handles dynamic loading of page content

class PageLoader {
    constructor() {
        this.currentPage = null;
        this.pageCache = new Map();
        this.init();
    }

    init() {
        this.setupTabEventListeners();
    }

    setupTabEventListeners() {
        // Listen for tab changes
        const tabButtons = document.querySelectorAll('#mainTabs button[data-bs-toggle="tab"]');
        tabButtons.forEach(button => {
            button.addEventListener('shown.bs.tab', (event) => {
                const targetId = event.target.getAttribute('data-bs-target').replace('#', '');
                this.loadPage(targetId);
            });
        });
    }

    async loadPage(pageId) {
        if (this.currentPage === pageId) {
            return; // Page already loaded
        }

        const container = document.getElementById('mainTabsContent');
        
        try {
            // Show loading indicator
            this.showLoading(container);
            
            // Check cache first
            let pageContent = this.pageCache.get(pageId);
            
            if (!pageContent) {
                // Load page from file
                pageContent = await this.fetchPageContent(pageId);
                this.pageCache.set(pageId, pageContent);
            }
            
            // Clear container and add new content
            container.innerHTML = pageContent;
            
            // Initialize page-specific functionality
            this.initializePage(pageId);
            
            this.currentPage = pageId;
            
        } catch (error) {
            console.error(`Error loading page ${pageId}:`, error);
            this.showError(container, pageId);
        }
    }

    async fetchPageContent(pageId) {
        const response = await fetch(`pages/${pageId}.html`);
        if (!response.ok) {
            throw new Error(`Failed to load page: ${pageId}`);
        }
        return await response.text();
    }

    showLoading(container) {
        container.innerHTML = `
            <div class="d-flex justify-content-center align-items-center" style="min-height: 300px;">
                <div class="text-center">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Cargando...</span>
                    </div>
                    <div class="mt-3">
                        <h5>Cargando página...</h5>
                        <p class="text-muted">Por favor espere un momento</p>
                    </div>
                </div>
            </div>
        `;
    }

    showError(container, pageId) {
        container.innerHTML = `
            <div class="alert alert-danger" role="alert">
                <div class="d-flex align-items-center">
                    <i class="fas fa-exclamation-triangle fa-2x me-3"></i>
                    <div>
                        <h5 class="alert-heading">Error al cargar la página</h5>
                        <p class="mb-0">No se pudo cargar el contenido de la página "${pageId}". 
                        Por favor, verifique su conexión e intente nuevamente.</p>
                        <hr>
                        <button class="btn btn-outline-danger btn-sm" onclick="pageLoader.loadPage('${pageId}')">
                            <i class="fas fa-redo me-1"></i>Reintentar
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    initializePage(pageId) {
        switch (pageId) {
            case 'dashboard':
                this.initializeDashboard();
                break;
            case 'update':
                this.initializeUpdate();
                break;
            case 'logs':
                this.initializeLogs();
                break;
            case 'excel':
                this.initializeExcel();
                break;
            case 'settings':
                this.initializeSettings();
                break;
        }
    }

    initializeDashboard() {
        // Dashboard-specific initialization
        if (window.supervisionesX) {
            window.supervisionesX.updateDashboard();
            window.supervisionesX.initializeCharts();
            window.supervisionesX.updateDataTable();
            window.supervisionesX.populateLocationFilters();
        }
    }

    initializeUpdate() {
        // Update page initialization
        if (window.supervisionesX) {
            window.supervisionesX.initializeUpdateMode();
            window.supervisionesX.populateLocationSelects(['bulkLocation', 'multiLocation', 'replanteoLocation', 'newPointLocation']);
        }
    }

    initializeLogs() {
        // Logs page initialization
        if (window.supervisionesX) {
            window.supervisionesX.updateLogsTable();
            window.supervisionesX.populateLogsFilters();
        }
    }

    initializeExcel() {
        // Excel management initialization
        if (window.excelManager) {
            window.excelManager.updateExcelFilesList();
            window.excelManager.updateCurrentExcelInfo();
        }
    }

    initializeSettings() {
        // Settings page initialization
        if (window.supervisionesX) {
            window.supervisionesX.populateGitHubForm();
            window.supervisionesX.updateGitHubStatus();
            window.supervisionesX.loadSystemSettings();
            
            // Show user management section if admin
            if (window.supervisionesX.isAdmin) {
                document.getElementById('userManagementSection').style.display = 'block';
                window.supervisionesX.loadUsersManagement();
            }
        }
    }

    // Method to preload all pages for better performance
    async preloadAllPages() {
        const pages = ['dashboard', 'update', 'logs', 'excel', 'settings'];
        
        for (const pageId of pages) {
            try {
                if (!this.pageCache.has(pageId)) {
                    const content = await this.fetchPageContent(pageId);
                    this.pageCache.set(pageId, content);
                }
            } catch (error) {
                console.warn(`Failed to preload page ${pageId}:`, error);
            }
        }
        
        console.log('All pages preloaded successfully');
    }

    // Method to clear cache and force reload
    clearCache() {
        this.pageCache.clear();
        this.currentPage = null;
    }

    // Method to get current page
    getCurrentPage() {
        return this.currentPage;
    }
}

// Initialize page loader when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.pageLoader = new PageLoader();
    
    // Load dashboard by default
    setTimeout(() => {
        window.pageLoader.loadPage('dashboard');
    }, 100);
    
    // Preload other pages in background
    setTimeout(() => {
        window.pageLoader.preloadAllPages();
    }, 1000);
});
