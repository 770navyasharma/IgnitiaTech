document.addEventListener('DOMContentLoaded', function () {
    // --- Sidebar Logic ---
    const toggleBtn = document.getElementById('sidebar-toggle-btn');
    const html = document.documentElement;
    window.addEventListener('load', () => document.body.classList.add('transitions-enabled'));
    function toggleSidebar() {
        const state = html.dataset.sidebarState === 'collapsed' ? 'open' : 'collapsed';
        html.dataset.sidebarState = state;
        localStorage.setItem('sidebarState', state);
    }
    if (toggleBtn) toggleBtn.addEventListener('click', toggleSidebar);

    // --- Main App Modal Logic ---
    const openModalBtn = document.getElementById('open-modal-btn');
    const newInvModalOverlay = document.getElementById('new-investigation-modal-overlay');
    if (openModalBtn) openModalBtn.addEventListener('click', (e) => { e.preventDefault(); if (newInvModalOverlay) newInvModalOverlay.classList.add('active'); });
    if (newInvModalOverlay) {
        newInvModalOverlay.querySelector('#modal-close-btn').addEventListener('click', () => newInvModalOverlay.classList.remove('active'));
        newInvModalOverlay.addEventListener('click', (e) => { if (e.target === newInvModalOverlay) newInvModalOverlay.classList.remove('active'); });
    }

    // --- Dynamic Flash Message Logic (updated) ---
    // Auto-dismiss only non-persistent alerts
    document.querySelectorAll('.alert').forEach(alert => {
    // If this is a persistent alert, skip auto-dismiss
    if (alert.classList.contains('alert-persistent')) {
        // still add an animationend listener to remove only when fadeOut happens (e.g. when user clicks close)
        alert.addEventListener('animationend', (e) => {
        if (e.animationName === 'fadeOut') alert.remove();
        });
        return;
    }

    // For normal alerts: add progress & auto fade
    const timeout = 5000;
    const timer = setTimeout(() => {
        alert.classList.add('fade-out');
    }, timeout);

    // When fadeOut animation finishes, remove the node
    alert.addEventListener('animationend', (e) => {
        if (e.animationName === 'fadeOut') alert.remove();
    });

    // If user manually closes before timeout, clear the timeout
    const closeBtn = alert.querySelector('.alert-close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
        clearTimeout(timer);
        alert.classList.add('fade-out');
        });
    }
    });

    // --- Edit Modal Logic ---
    const editModalOverlay = document.getElementById('edit-investigation-modal-overlay');
    if (editModalOverlay) {
        editModalOverlay.querySelector('#edit-modal-close-btn').addEventListener('click', () => editModalOverlay.classList.remove('active'));
    }
    const editFileBtn = document.getElementById('edit_drone_photo');
    if (editFileBtn) {
        const editFileChosen = document.getElementById('edit-file-chosen');
        editFileBtn.addEventListener('change', function(){
            editFileChosen.textContent = this.files.length > 0 ? this.files[0].name : 'No new file selected';
        });
    }

    // --- Universal Confirmation Modal Handler ---
    const confirmationModalOverlay = document.getElementById('confirmation-modal-overlay');
    if (confirmationModalOverlay) {
        const closeBtn = confirmationModalOverlay.querySelector('#confirmation-modal-close-btn');
        const cancelBtn = confirmationModalOverlay.querySelector('#confirmation-cancel-btn');
        const closeConfirmationModal = () => confirmationModalOverlay.classList.remove('active');
        if(closeBtn) closeBtn.addEventListener('click', closeConfirmationModal);
        if(cancelBtn) cancelBtn.addEventListener('click', closeConfirmationModal);
    }

    // Function to open the confirmation modal
    function showConfirmationModal(config) {
        const titleEl = document.getElementById('confirmation-title');
        const messageEl = document.getElementById('confirmation-message');
        const confirmBtnEl = document.getElementById('confirmation-confirm-btn');
        const formEl = document.getElementById('confirmation-form');
        
        formEl.querySelectorAll('input[type="hidden"]').forEach(input => input.remove());
        titleEl.textContent = config.title;
        messageEl.innerHTML = config.message;
        confirmBtnEl.textContent = config.confirmText;
        confirmBtnEl.style.background = config.buttonColor === 'red' ? 'var(--accent-red)' : '';
        formEl.action = config.formAction;
        
        if (config.newStatus) {
            const statusInput = document.createElement('input');
            statusInput.type = 'hidden';
            statusInput.name = 'new_status';
            statusInput.value = config.newStatus;
            formEl.appendChild(statusInput);
        }
        if (config.goLive) {
            const goLiveInput = document.createElement('input');
            goLiveInput.type = 'hidden';
            goLiveInput.name = 'go_live';
            goLiveInput.value = 'true';
            formEl.appendChild(goLiveInput);
        }
        
        confirmationModalOverlay.classList.add('active');
    }
    
    function showCustomFlash(message) {
        const container = document.querySelector('.flash-messages');
        if (!container) {
            console.warn('Flash container not found: .flash-messages');
            return;
        }

        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-persistent';

        // Accessibility
        alertDiv.setAttribute('role', 'status');
        alertDiv.setAttribute('aria-live', 'polite');

        const alertContent = document.createElement('div');
        alertContent.className = 'alert-content';

        const alertIcon = document.createElement('div');
        alertIcon.className = 'alert-icon';
        alertIcon.innerHTML = '<i class="fas fa-exclamation-triangle" aria-hidden="true"></i>';

        const alertMessage = document.createElement('div');
        alertMessage.className = 'alert-message';
        // message expected to contain safe HTML like an <a href="...">; keep as innerHTML
        alertMessage.innerHTML = message;

        const closeBtn = document.createElement('button');
        closeBtn.className = 'alert-close-btn';
        closeBtn.setAttribute('aria-label', 'Close alert');
        closeBtn.innerHTML = '<i class="fas fa-times" aria-hidden="true"></i>';

        // Close handler: start fadeOut and remove only after animation ends
        closeBtn.addEventListener('click', () => {
            // Add fade-out class to play animation
            alertDiv.classList.add('fade-out');
        });

        // Make sure we remove only after our fadeOut animation runs
        alertDiv.addEventListener('animationend', (e) => {
            if (e.animationName === 'fadeOut') {
            alertDiv.remove();
            }
        });

        alertContent.appendChild(alertIcon);
        alertContent.appendChild(alertMessage);
        alertDiv.appendChild(alertContent);
        alertDiv.appendChild(closeBtn);

        // Put newest on top
        container.prepend(alertDiv);

        // Focus the close button for keyboard accessibility
        closeBtn.focus();
    }

    // =============================================
    // UNIFIED EVENT LISTENER FOR ALL CARD GRIDS
    // =============================================
    const mainContentArea = document.querySelector('.content-area');
    if(mainContentArea) {
        mainContentArea.addEventListener('click', function(e) {
            const card = e.target.closest('.inv-card');
            if (!card) return; // Exit if the click wasn't on or inside a card

            const isDashboard = card.closest('.dashboard-grid');
            const actionButton = e.target.closest('.inv-action-btn');

            const id = card.dataset.id;
            const title = card.dataset.title;
            const status = card.dataset.status;
            const timestamp = card.dataset.timestamp;

            // --- Logic for Dashboard Cards ---
            if (isDashboard) {
                if (status === 'Live' || status === 'Pending') {
                    showConfirmationModal({
                        title: status === 'Live' ? 'Start Investigation' : 'Continue Investigation',
                        message: `Open live screen for <strong>${title}</strong>?`,
                        confirmText: status === 'Live' ? 'Yes, Start' : 'Yes, Continue',
                        newStatus: 'Live',
                        goLive: true,
                        formAction: `/investigation/${id}/update_status`
                    });
                } else if (status === 'Completed') {
                    const investigationsPageUrl = `/investigations#${timestamp}`;
                    const message = `This investigation is complete. You can <a href="${investigationsPageUrl}">view or delete it</a>.`;
                    showCustomFlash(message);
                }
            // --- Logic for Investigations Page Cards (only if an action button was clicked) ---
            } else if (actionButton) {
                const action = actionButton.dataset.action;
                if (action === 'edit') {
                    const editForm = document.getElementById('edit-investigation-form');
                    editForm.querySelector('[name="title"]').value = card.dataset.title;
                    editForm.querySelector('[name="location"]').value = card.dataset.location;
                    editForm.querySelector('[name="description"]').value = card.dataset.description;
                    editForm.action = `/investigation/${id}/edit`;
                    if (editModalOverlay) editModalOverlay.classList.add('active');
                } else if (action === 'delete') {
                    showConfirmationModal({
                        title: 'Confirm Deletion', message: `Delete <strong>${title}</strong>?`,
                        confirmText: 'Yes, Delete', buttonColor: 'red',
                        formAction: `/investigation/${id}/delete`
                    });
                } else if (action === 'start' || action === 'continue') {
                    showConfirmationModal({
                        title: action === 'start' ? 'Start Investigation' : 'Continue Investigation',
                        message: `Open live screen for <strong>${title}</strong>?`,
                        confirmText: action === 'start' ? 'Yes, Start' : 'Yes, Continue',
                        newStatus: 'Live', goLive: true,
                        formAction: `/investigation/${id}/update_status`
                    });
                }
            }
        });
    }


    
    // --- LIVE INVESTIGATION PAGE LOGIC ---
    const livePageContainer = document.querySelector('.live-modal-container');
    if (livePageContainer) {
        // Camera, capture, and time logic (remains unchanged)
        const video = document.getElementById('camera-feed');
        if (video && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.getUserMedia({ video: true })
                .then(stream => { video.srcObject = stream; })
                .catch(err => { console.error("Error accessing camera: ", err); });
        }
        const captureBtn = document.getElementById('capture-btn');
        if (captureBtn) {
            captureBtn.addEventListener('click', () => {
                const canvas = document.getElementById('canvas');
                const capturesGrid = document.getElementById('captures-grid');
                // THIS IS THE FIX: 'd' is changed to '2d'
                const context = canvas.getContext('2d'); 
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                const img = document.createElement('img');
                img.src = canvas.toDataURL('image/jpeg');
                img.classList.add('capture-thumbnail');
                capturesGrid.prepend(img);
            });
        }
        const timeElement = document.getElementById('live-time');
        if (timeElement) {
            const updateTime = () => timeElement.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            setInterval(updateTime, 1000);
            updateTime();
        }

        // This listener handles all the buttons on the live modal
        livePageContainer.addEventListener('click', function(e) {
            // Find which button was clicked, if any
            const pauseButton = e.target.closest('.status-action-btn.pause');
            const completeButton = e.target.closest('.status-action-btn.complete');
            const closeButton = e.target.closest('#live-modal-close-btn');

            // If none of our target buttons were clicked, do nothing
            if (!pauseButton && !completeButton && !closeButton) {
                return;
            }

            e.preventDefault();

            const id = livePageContainer.dataset.investigationId;
            const title = livePageContainer.dataset.investigationTitle;

            // Handle Pause and Close the exact same way
            if (pauseButton || closeButton) {
                showConfirmationModal({
                    title: 'Pause Investigation',
                    message: `This will pause the investigation and return you to the main screen. Proceed?`,
                    confirmText: 'Yes, Pause',
                    newStatus: 'Pending',
                    formAction: `/investigation/${id}/update_status`
                });
            } 
            // Handle Complete Button
            else if (completeButton) {
                 showConfirmationModal({
                    title: 'Complete Investigation',
                    message: `Are you sure you want to mark <strong>${title}</strong> as complete?`,
                    confirmText: 'Yes, Complete',
                    newStatus: 'Completed',
                    formAction: `/investigation/${id}/update_status`
                });
            }
        });
    }
});