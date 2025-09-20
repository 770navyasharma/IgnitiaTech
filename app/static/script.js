document.addEventListener('DOMContentLoaded', function () {
    // --- Sidebar Logic (Keep As Is) ---
    const toggleBtn = document.getElementById('sidebar-toggle-btn');
    const html = document.documentElement;

    window.addEventListener('load', () => {
        document.body.classList.add('transitions-enabled');
    });

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

    if (toggleBtn) {
        toggleBtn.addEventListener('click', toggleSidebar);
    }

    // --- Main App Modal Logic ---
    const openModalBtn = document.getElementById('open-modal-btn');
    const modalOverlay = document.getElementById('new-investigation-modal-overlay');
    const modalCloseBtn = document.getElementById('modal-close-btn');

    function openModal() {
        if (modalOverlay) modalOverlay.classList.add('active');
    }
    function closeModal() {
        if (modalOverlay) modalOverlay.classList.remove('active');
    }
    if (openModalBtn) openModalBtn.addEventListener('click', (e) => { e.preventDefault(); openModal(); });
    if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);
    if (modalOverlay) modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) closeModal(); });

    // --- Dynamic Flash Message Logic ---
    const allAlerts = document.querySelectorAll('.alert');
    allAlerts.forEach(alert => {
        setTimeout(() => { alert.classList.add('fade-out'); }, 5000);
        alert.addEventListener('animationend', (event) => { if (event.animationName === 'fadeOut') alert.remove(); });
    });

    // --- Main App Confirmation & Edit Modals Logic ---
    const editModalOverlay = document.getElementById('edit-investigation-modal-overlay');
    const editModalCloseBtn = document.getElementById('edit-modal-close-btn');
    const confirmationModalOverlay = document.getElementById('confirmation-modal-overlay');
    const investigationsContainer = document.querySelector('.page-content');

    function closeEditModal() { if (editModalOverlay) editModalOverlay.classList.remove('active'); }
    function closeConfirmationModal() { if (confirmationModalOverlay) confirmationModalOverlay.classList.remove('active'); }
    if (editModalCloseBtn) editModalCloseBtn.addEventListener('click', closeEditModal);
    
    const confirmationModalCloseBtn = document.getElementById('confirmation-modal-close-btn');
    const confirmationCancelBtn = document.getElementById('confirmation-cancel-btn');
    if (confirmationModalCloseBtn) confirmationModalCloseBtn.addEventListener('click', closeConfirmationModal);
    if (confirmationCancelBtn) confirmationCancelBtn.addEventListener('click', closeConfirmationModal);

    if (investigationsContainer) {
        investigationsContainer.addEventListener('click', function(e) {
            const button = e.target.closest('.inv-action-btn');
            if (!button) return;
            
            const card = button.closest('.inv-card');
            const investigationId = card.dataset.id;
            const action = button.dataset.action;
            const editForm = document.getElementById('edit-investigation-form');

            if (action === 'edit') {
                editForm.querySelector('[name="title"]').value = card.dataset.title;
                editForm.querySelector('[name="location"]').value = card.dataset.location;
                editForm.querySelector('[name="description"]').value = card.dataset.description;
                editForm.action = `/investigation/${investigationId}/edit`;
                if (editModalOverlay) editModalOverlay.classList.add('active');
            } else {
                const title = document.getElementById('confirmation-title');
                const message = document.getElementById('confirmation-message');
                const confirmBtn = document.getElementById('confirmation-confirm-btn');
                const newStatusInput = document.getElementById('new-status-input');
                const confirmationForm = document.getElementById('confirmation-form');
                
                newStatusInput.value = '';

                if (action === 'delete') {
                    title.textContent = 'Confirm Deletion';
                    message.innerHTML = `Are you sure you want to permanently delete: <br><strong>${card.dataset.title}</strong>?`;
                    confirmBtn.textContent = 'Yes, Delete';
                    confirmBtn.style.background = 'var(--accent-red)';
                    confirmationForm.action = `/investigation/${investigationId}/delete`;
                } else if (action === 'start' || action === 'continue') {
                    title.textContent = 'Start Investigation';
                    message.innerHTML = `This will open the live screen for: <br><strong>${card.dataset.title}</strong>. Proceed?`;
                    confirmBtn.textContent = 'Yes, Start';
                    confirmBtn.style.background = '';
                    confirmationForm.action = `/investigation/${investigationId}/update_status`;
                    newStatusInput.value = button.dataset.status;
                } else if (action === 'pause') {
                    title.textContent = 'Pause Investigation';
                    message.innerHTML = `Are you sure you want to pause: <br><strong>${card.dataset.title}</strong>?`;
                    confirmBtn.textContent = 'Yes, Pause';
                    confirmBtn.style.background = '';
                    confirmationForm.action = `/investigation/${investigationId}/update_status`;
                    newStatusInput.value = button.dataset.status;
                }
                
                if (confirmationModalOverlay) confirmationModalOverlay.classList.add('active');
            }
        });
    }

    // --- LIVE INVESTIGATION PAGE LOGIC ---
    const livePageContainer = document.querySelector('.live-modal-container');
    if (livePageContainer) {
        
        const video = document.getElementById('camera-feed');
        const captureBtn = document.getElementById('capture-btn');
        const capturesGrid = document.getElementById('captures-grid');
        const canvas = document.getElementById('canvas');
        
        if (video && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.getUserMedia({ video: true })
                .then(stream => { video.srcObject = stream; })
                .catch(err => { console.error("Error accessing camera: ", err); });
        }

        if (captureBtn) {
            captureBtn.addEventListener('click', () => {
                const context = canvas.getContext('2d');
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                const dataUrl = canvas.toDataURL('image/jpeg');
                const img = document.createElement('img');
                img.src = dataUrl;
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

        // ***** THIS IS THE FIX *****
        // This logic is duplicated from above, but scoped to this page
        const liveActionButtons = livePageContainer.querySelectorAll('.status-action-btn');
        const liveConfirmationModal = livePageContainer.querySelector('#confirmation-modal-overlay');

        if (liveConfirmationModal) {
            // Add listeners for the close/cancel buttons inside the modal on THIS page
            liveConfirmationModal.querySelector('#confirmation-modal-close-btn').addEventListener('click', () => liveConfirmationModal.classList.remove('active'));
            liveConfirmationModal.querySelector('#confirmation-cancel-btn').addEventListener('click', () => liveConfirmationModal.classList.remove('active'));

            liveActionButtons.forEach(button => {
                button.addEventListener('click', () => {
                    const investigationId = button.dataset.id;
                    const investigationTitle = button.dataset.title;
                    const action = button.dataset.action;
                    const newStatus = button.dataset.status;
                    
                    // Get the modal elements that are specific to this page
                    const title = liveConfirmationModal.querySelector('#confirmation-title');
                    const message = liveConfirmationModal.querySelector('#confirmation-message');
                    const confirmBtn = liveConfirmationModal.querySelector('#confirmation-confirm-btn');
                    const newStatusInput = liveConfirmationModal.querySelector('#new-status-input');
                    const confirmationForm = liveConfirmationModal.querySelector('#confirmation-form');

                    if (action === 'pause') {
                        title.textContent = 'Pause Investigation';
                        message.innerHTML = `This will return you to the main screen. Proceed with <br><strong>${investigationTitle}</strong>?`;
                        confirmBtn.textContent = 'Yes, Pause';
                        confirmBtn.style.background = '';
                        newStatusInput.value = newStatus;
                        confirmationForm.action = `/investigation/${investigationId}/update_status`;
                    } else if (action === 'complete') {
                        title.textContent = 'Complete Investigation';
                        message.innerHTML = `Mark investigation as complete? <br><strong>${investigationTitle}</strong>?`;
                        confirmBtn.textContent = 'Yes, Complete';
                        confirmBtn.style.background = 'var(--accent-red)';
                        newStatusInput.value = newStatus;
                        confirmationForm.action = `/investigation/${investigationId}/update_status`;
                    }

                    liveConfirmationModal.classList.add('active');
                });
            });
        }
    }

    // --- ADD THIS NEW SCRIPT FOR THE EDIT MODAL FILE INPUT ---
    const editFileBtn = document.getElementById('edit_drone_photo');
    if (editFileBtn) {
        const editFileChosen = document.getElementById('edit-file-chosen');
        editFileBtn.addEventListener('change', function(){
            if (this.files.length > 0) {
                editFileChosen.textContent = this.files[0].name;
            } else {
                editFileChosen.textContent = 'No new file selected';
            }
        });
    }
});