import { propertyService } from '../../services/property/property.service.js';
import { showToast } from '../../utils/helpers.js';

export class UnitManagement {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.units = [];
        this.initialize();
    }

    async initialize() {
        await this.loadUnits();
        this.render();
        this.setupEventListeners();
    }

    async loadUnits() {
        try {
            this.units = await propertyService.getUnits();
        } catch (error) {
            showToast('Error loading units', 'error');
        }
    }

    render() {
        if (!this.container) return;

        this.container.innerHTML = `
            <div class="card">
                <div class="card-content">
                    <span class="card-title">Unit Management</span>
                    <div class="row">
                        <div class="col s12">
                            <table class="striped highlight">
                                <thead>
                                    <tr>
                                        <th>Unit Number</th>
                                        <th>Floor</th>
                                        <th>Owner</th>
                                        <th>Tenant</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${this.units.map(unit => this.renderUnitRow(unit)).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderUnitRow(unit) {
        return `
            <tr data-unit-id="${unit.id}">
                <td>${unit.unitNumber}</td>
                <td>${unit.floor}</td>
                <td>${unit.ownerName || 'Not Assigned'}</td>
                <td>${unit.tenantName || 'Not Assigned'}</td>
                <td>
                    <span class="status-badge ${unit.status.toLowerCase()}">
                        ${unit.status}
                    </span>
                </td>
                <td>
                    <button class="btn-small waves-effect waves-light blue edit-unit">
                        <i class="material-icons">edit</i>
                    </button>
                    <button class="btn-small waves-effect waves-light green assign-tenant">
                        <i class="material-icons">person_add</i>
                    </button>
                </td>
            </tr>
        `;
    }

    setupEventListeners() {
        this.container.addEventListener('click', (e) => {
            const unitId = e.target.closest('tr')?.dataset.unitId;
            if (!unitId) return;

            if (e.target.closest('.edit-unit')) {
                this.handleEditUnit(unitId);
            } else if (e.target.closest('.assign-tenant')) {
                this.handleAssignTenant(unitId);
            }
        });
    }

    async handleEditUnit(unitId) {
        // Implementation for editing unit
    }

    async handleAssignTenant(unitId) {
        // Implementation for assigning tenant
    }
}
