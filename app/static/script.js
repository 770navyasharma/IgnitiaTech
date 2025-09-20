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

    // --- Dynamic Flash Message Logic ---
    document.querySelectorAll('.alert').forEach(alert => {
        setTimeout(() => alert.classList.add('fade-out'), 5000);
        alert.addEventListener('animationend', (e) => { if (e.animationName === 'fadeOut') alert.remove(); });
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

    // Function to open the confirmation modal with specific details
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

    // Event listener for the main investigations page
    const investigationsContainer = document.querySelector('.investigations-grid');
    if (investigationsContainer) {
        investigationsContainer.addEventListener('click', function(e) {
            const button = e.target.closest('.inv-action-btn');
            if (!button) return;
            
            const card = button.closest('.inv-card');
            const id = card.dataset.id;
            const title = card.dataset.title;
            const action = button.dataset.action;

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
            } else if (action === 'start') {
                showConfirmationModal({
                    title: 'Start Investigation', message: `Open live screen for <strong>${title}</strong>?`,
                    confirmText: 'Yes, Start', newStatus: 'Live', goLive: true,
                    formAction: `/investigation/${id}/update_status`
                });
            } else if (action === 'continue') {
                showConfirmationModal({
                    title: 'Continue Investigation', message: `Resume live investigation for <strong>${title}</strong>?`,
                    confirmText: 'Yes, Continue', newStatus: 'Live', goLive: true,
                    formAction: `/investigation/${id}/update_status`
                });
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
                const context = canvas.getContext('d');
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

        // =============================================
        //  This listener will now work because the CSS fix allows clicks to reach it.
        // =============================================
        livePageContainer.addEventListener('click', function(e) {
            // Find which button was clicked, if any
            const pauseButton = e.target.closest('.status-action-btn.pause');
            const completeButton = e.target.closest('.status-action-btn.complete');
            const closeButton = e.target.closest('#live-modal-close-btn');

            // If none of our target buttons were clicked, do nothing
            if (!pauseButton && !completeButton && !closeButton) {
                return;
            }

            // Stop the default button/link behavior
            e.preventDefault();

            const id = livePageContainer.dataset.investigationId;
            const title = livePageContainer.dataset.investigationTitle;

            // **HANDLE PAUSE AND CLOSE THE EXACT SAME WAY**
            if (pauseButton || closeButton) {
                showConfirmationModal({
                    title: 'Pause Investigation',
                    message: `This will pause the investigation and return you to the main screen. Proceed?`,
                    confirmText: 'Yes, Pause',
                    newStatus: 'Pending', // Set status to Pending
                    formAction: `/investigation/${id}/update_status`
                });
            } 
            // **HANDLE COMPLETE BUTTON**
            else if (completeButton) {
                 showConfirmationModal({
                    title: 'Complete Investigation',
                    message: `Are you sure you want to mark <strong>${title}</strong> as complete?`,
                    confirmText: 'Yes, Complete',
                    buttonColor: 'red',
                    newStatus: 'Completed', // Set status to Completed
                    formAction: `/investigation/${id}/update_status`
                });
            }
        });
    }
});