// Translate category/subtype/status cells on history pages
document.addEventListener('DOMContentLoaded', () => {
    function translateHistoryTable() {
        document.querySelectorAll('.cat-cell').forEach(cell => {
            const category = cell.getAttribute('data-category');
            if (category) cell.textContent = categoryLabel(category);
        });
        document.querySelectorAll('.subtype-cell').forEach(cell => {
            const subType = cell.getAttribute('data-subtype');
            if (subType && subType !== 'null' && subType !== '') {
                cell.textContent = subTypeLabel(subType);
            } else {
                cell.textContent = '—';
            }
        });
        document.querySelectorAll('.status-badge').forEach(badge => {
            const classes = badge.className.split(' ');
            const statusClass = classes.find(c => c.startsWith('status-') && c !== 'status-badge');
            if (statusClass) {
                badge.textContent = statusLabel(statusClass.replace('status-', ''));
            }
        });
    }

    translateHistoryTable();
    document.addEventListener('languageChanged', translateHistoryTable);
});
