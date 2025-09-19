// static/script.js
document.addEventListener('DOMContentLoaded', function () {
    const toggleBtn = document.getElementById('sidebar-toggle-btn');
    const html = document.documentElement; // Target the <html> element

    // Enable transitions only after the page has fully loaded.
    window.addEventListener('load', () => {
        document.body.classList.add('transitions-enabled');
    });

    // Function to handle the toggle
    function toggleSidebar() {
        const currentState = html.dataset.sidebarState;
        
        if (currentState === 'collapsed') {
            html.dataset.sidebarState = 'open';
            localStorage.setItem('sidebarState', 'open');
        } else {
            html.dataset.sidebarState = 'collapsed';
            localStorage.setItem('sidebarState', 'collapsed');
        }
    }

    // Attach the click event listener
    if (toggleBtn) {
        toggleBtn.addEventListener('click', toggleSidebar);
    }
});