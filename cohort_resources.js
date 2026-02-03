// ============================================
// COHORT LINKS & VIDEOS MANAGEMENT
// ============================================

// Global storage
let cohortLinks = {};
let cohortVideos = {};

// LOAD DATA FROM SUPABASE
async function loadCohortLinks(cohortName) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/cohort-links/${encodeURIComponent(cohortName)}`);
        const data = await response.json();
        cohortLinks[cohortName] = data || [];
        return data || [];
    } catch (error) {
        console.error(`❌ Error loading cohort links for ${cohortName}:`, error);
        return [];
    }
}

async function loadCohortVideos(cohortName) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/cohort-videos/${encodeURIComponent(cohortName)}`);
        const data = await response.json();
        cohortVideos[cohortName] = data || [];
        return data || [];
    } catch (error) {
        console.error(`❌ Error loading cohort videos for ${cohortName}:`, error);
        return [];
    }
}

// ADD NEW LINK
async function addCohortLink(cohortName) {
    const modal = document.getElementById('addLinkModal');
    if (!modal) return;
    
    const name = document.getElementById('linkName')?.value?.trim();
    const url = document.getElementById('linkUrl')?.value?.trim();
    
    if (!name || !url) {
        showToast('Please enter both name and URL', 'warning');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/cohort-links`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cohort_name: cohortName, name, url })
        });
        
        if (response.ok) {
            showToast('Link added successfully', 'success');
            modal.style.display = 'none';
            await loadCohortLinks(cohortName);
            await renderCohortLinks(cohortName);
        } else {
            showToast('Error adding link', 'error');
        }
    } catch (error) {
        console.error('❌ Error adding link:', error);
        showToast('Error adding link', 'error');
    }
}

// EDIT LINK
async function editCohortLink(cohortName, linkId) {
    const modal = document.getElementById('editLinkModal');
    if (!modal) return;
    
    const name = document.getElementById('editLinkName')?.value?.trim();
    const url = document.getElementById('editLinkUrl')?.value?.trim();
    
    if (!name || !url) {
        showToast('Please enter both name and URL', 'warning');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/cohort-links/${linkId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, url })
        });
        
        if (response.ok) {
            showToast('Link updated successfully', 'success');
            modal.style.display = 'none';
            await loadCohortLinks(cohortName);
            await renderCohortLinks(cohortName);
        } else {
            showToast('Error updating link', 'error');
        }
    } catch (error) {
        console.error('❌ Error updating link:', error);
        showToast('Error updating link', 'error');
    }
}

// DELETE LINK
async function deleteCohortLink(cohortName, linkId) {
    if (!confirm('Delete this link?')) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/cohort-links/${linkId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showToast('Link deleted successfully', 'success');
            await loadCohortLinks(cohortName);
            await renderCohortLinks(cohortName);
        } else {
            showToast('Error deleting link', 'error');
        }
    } catch (error) {
        console.error('❌ Error deleting link:', error);
        showToast('Error deleting link', 'error');
    }
}

// ADD NEW VIDEO
async function addCohortVideo(cohortName) {
    const modal = document.getElementById('addVideoModal');
    if (!modal) return;
    
    const name = document.getElementById('videoName')?.value?.trim();
    const thumbnailFile = document.getElementById('videoThumbnail')?.files?.[0];
    const url = document.getElementById('videoUrl')?.value?.trim();
    
    if (!name || !url) {
        showToast('Please enter name and URL (thumbnail is optional)', 'warning');
        return;
    }
    
    let thumbnail = null;
    if (thumbnailFile) {
        thumbnail = await fileToBase64(thumbnailFile);
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/cohort-videos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                cohort_name: cohortName, 
                name, 
                thumbnail: thumbnail || null, 
                url 
            })
        });
        
        if (response.ok) {
            showToast('Video added successfully', 'success');
            modal.style.display = 'none';
            await loadCohortVideos(cohortName);
            await renderCohortVideos(cohortName);
        } else {
            showToast('Error adding video', 'error');
        }
    } catch (error) {
        console.error('❌ Error adding video:', error);
        showToast('Error adding video', 'error');
    }
}

// EDIT VIDEO
async function editCohortVideo(cohortName, videoId) {
    const modal = document.getElementById('editVideoModal');
    if (!modal) return;
    
    const name = document.getElementById('editVideoName')?.value?.trim();
    const thumbnailFile = document.getElementById('editVideoThumbnail')?.files?.[0];
    const url = document.getElementById('editVideoUrl')?.value?.trim();
    
    if (!name || !url) {
        showToast('Please enter name and URL (thumbnail is optional)', 'warning');
        return;
    }
    
    let thumbnail = null;
    if (thumbnailFile) {
        thumbnail = await fileToBase64(thumbnailFile);
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/cohort-videos/${videoId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                name, 
                thumbnail: thumbnail || null, 
                url 
            })
        });
        
        if (response.ok) {
            showToast('Video updated successfully', 'success');
            modal.style.display = 'none';
            await loadCohortVideos(cohortName);
            await renderCohortVideos(cohortName);
        } else {
            showToast('Error updating video', 'error');
        }
    } catch (error) {
        console.error('❌ Error updating video:', error);
        showToast('Error updating video', 'error');
    }
}

// DELETE VIDEO
async function deleteCohortVideo(cohortName, videoId) {
    if (!confirm('Delete this video?')) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/cohort-videos/${videoId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showToast('Video deleted successfully', 'success');
            await loadCohortVideos(cohortName);
            await renderCohortVideos(cohortName);
        } else {
            showToast('Error deleting video', 'error');
        }
    } catch (error) {
        console.error('❌ Error deleting video:', error);
        showToast('Error deleting video', 'error');
    }
}

// RENDER LINKS SECTION
async function renderCohortLinks(cohortName) {
    const container = document.getElementById(`links-container-${cohortName.replace(/[^a-z0-9]/gi, '')}`);
    if (!container) return;
    
    const links = await loadCohortLinks(cohortName);
    
    let html = `
        <div class="cohort-section links">
            <div class="cohort-section-header">
                <h3 class="cohort-section-title">
                    <i class="fas fa-link links-icon"></i>
                    Important Links
                </h3>
                <button onclick="openAddLinkModal('${cohortName.replace(/'/g, "\\'")}', '${container.id}')" class="btn-primary">
                    <i class="fas fa-plus"></i> Add Link
                </button>
            </div>
            <div id="links-list-${cohortName.replace(/[^a-z0-9]/gi, '')}" class="links-list">
    `;
    
    if (links.length === 0) {
        html += '<p class="empty-message-placeholder">No links added yet</p>';
    } else {
        links.forEach(link => {
            html += `
                <div class="link-item">
                    <div class="link-item-content">
                        <a href="${link.url}" target="_blank" rel="noopener noreferrer" class="link-item-name">
                            ${link.name}
                        </a>
                        <div class="link-item-url">${link.url}</div>
                    </div>
                    <div class="link-item-actions">
                        <button onclick="openEditLinkModal('${cohortName.replace(/'/g, "\\'")}', ${link.id}, '${link.name.replace(/'/g, "\\'")}', '${link.url.replace(/'/g, "\\'")}')" class="btn-secondary">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="deleteCohortLink('${cohortName.replace(/'/g, "\\'")}', ${link.id})" class="btn-danger">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        });
    }
    
    html += `</div></div>`;
    container.innerHTML = html;
}

// RENDER VIDEOS SECTION
async function renderCohortVideos(cohortName) {
    const container = document.getElementById(`videos-container-${cohortName.replace(/[^a-z0-9]/gi, '')}`);
    if (!container) return;
    
    const videos = await loadCohortVideos(cohortName);
    
    let html = `
        <div class="cohort-section videos">
            <div class="cohort-section-header">
                <h3 class="cohort-section-title">
                    <i class="fas fa-video videos-icon"></i>
                    Session Recordings
                </h3>
                <button onclick="openAddVideoModal('${cohortName.replace(/'/g, "\\'")}', '${container.id}')" class="btn-primary">
                    <i class="fas fa-plus"></i> Add Video
                </button>
            </div>
            <div id="videos-list-${cohortName.replace(/[^a-z0-9]/gi, '')}" class="videos-grid">
    `;
    
    if (videos.length === 0) {
        html += '<p class="empty-message-placeholder empty-full-width">No videos added yet</p>';
    } else {
        videos.forEach(video => {
            html += `
                <div class="video-card">
                    ${video.thumbnail ? `<img src="${video.thumbnail}" alt="${video.name}" class="video-card-thumbnail">` : `<div class="video-card-placeholder"><i class="fas fa-video"></i></div>`}
                    <div class="video-card-content">
                        <h4 class="video-card-title">${video.name}</h4>
                        <a href="${video.url}" target="_blank" rel="noopener noreferrer" class="video-card-link">Open video →</a>
                        <div class="video-card-actions">
                            <button onclick="openEditVideoModal('${cohortName.replace(/'/g, "\\'")}', ${video.id}, '${video.name.replace(/'/g, "\\'")}', '${(video.thumbnail || '').replace(/'/g, "\\'")}', '${video.url.replace(/'/g, "\\'")}')" class="btn-secondary">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                            <button onclick="deleteCohortVideo('${cohortName.replace(/'/g, "\\'")}', ${video.id})" class="btn-danger">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });
    }
    
    html += `</div></div>`;
    container.innerHTML = html;
}

// MODAL FUNCTIONS
function openAddLinkModal(cohortName, containerId) {
    const modal = document.getElementById('addLinkModal');
    if (!modal) createAddLinkModal();
    // Clear the form fields
    document.getElementById('linkName').value = '';
    document.getElementById('linkUrl').value = '';
    document.getElementById('addLinkModal').style.display = 'block';
    document.getElementById('addLinkModal').dataset.cohortName = cohortName;
}

function openEditLinkModal(cohortName, linkId, name, url) {
    const modal = document.getElementById('editLinkModal');
    if (!modal) createEditLinkModal();
    const editModal = document.getElementById('editLinkModal');
    editModal.style.display = 'block';
    editModal.dataset.cohortName = cohortName;
    editModal.dataset.linkId = linkId;
    document.getElementById('editLinkName').value = name;
    document.getElementById('editLinkUrl').value = url;
}

function openAddVideoModal(cohortName, containerId) {
    const modal = document.getElementById('addVideoModal');
    if (!modal) createAddVideoModal();
    // Clear the form fields
    document.getElementById('videoName').value = '';
    document.getElementById('videoThumbnail').value = '';
    document.getElementById('videoThumbnailPreview').innerHTML = '';
    document.getElementById('videoUrl').value = '';
    document.getElementById('addVideoModal').style.display = 'block';
    document.getElementById('addVideoModal').dataset.cohortName = cohortName;
}

function openEditVideoModal(cohortName, videoId, name, thumbnail, url) {
    const modal = document.getElementById('editVideoModal');
    if (!modal) createEditVideoModal();
    const editModal = document.getElementById('editVideoModal');
    editModal.style.display = 'block';
    editModal.dataset.cohortName = cohortName;
    editModal.dataset.videoId = videoId;
    document.getElementById('editVideoName').value = name;
    document.getElementById('editVideoUrl').value = url;
    // Clear file input and show thumbnail if exists
    document.getElementById('editVideoThumbnail').value = '';
    const preview = document.getElementById('editVideoThumbnailPreview');
    if (thumbnail) {
        preview.innerHTML = `<img src="${thumbnail}">`;
    } else {
        preview.innerHTML = '';
    }
}

// CREATE MODALS IF THEY DON'T EXIST
function createAddLinkModal() {
    const html = `
        <div id="addLinkModal" class="modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Add Important Link</h2>
                    <button class="modal-close" onclick="document.getElementById('addLinkModal').style.display='none'">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label>Link Name *</label>
                        <input type="text" id="linkName" placeholder="e.g., Design Kit, Documentation" class="form-input">
                    </div>
                    <div class="form-group">
                        <label>URL *</label>
                        <input type="url" id="linkUrl" placeholder="https://..." class="form-input">
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary" onclick="document.getElementById('addLinkModal').style.display='none'">Cancel</button>
                    <button class="btn-primary" onclick="addCohortLink(document.getElementById('addLinkModal').dataset.cohortName)">Add Link</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
}

function createEditLinkModal() {
    const html = `
        <div id="editLinkModal" class="modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Edit Link</h2>
                    <button class="modal-close" onclick="document.getElementById('editLinkModal').style.display='none'">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label>Link Name *</label>
                        <input type="text" id="editLinkName" class="form-input">
                    </div>
                    <div class="form-group">
                        <label>URL *</label>
                        <input type="url" id="editLinkUrl" class="form-input">
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary" onclick="document.getElementById('editLinkModal').style.display='none'">Cancel</button>
                    <button class="btn-primary" onclick="editCohortLink(document.getElementById('editLinkModal').dataset.cohortName, document.getElementById('editLinkModal').dataset.linkId)">Update Link</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
}

function createAddVideoModal() {
    const html = `
        <div id="addVideoModal" class="modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Add Session Recording</h2>
                    <button class="modal-close" onclick="document.getElementById('addVideoModal').style.display='none'">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label>Video Name *</label>
                        <input type="text" id="videoName" placeholder="e.g., Week 1: Introduction" class="form-input">
                    </div>
                    <div class="form-group">
                        <label>Thumbnail Image (optional)</label>
                        <input type="file" id="videoThumbnail" accept="image/*" class="form-input">
                        <div id="videoThumbnailPreview" class="thumbnail-preview"></div>
                    </div>
                    <div class="form-group">
                        <label>Video URL *</label>
                        <input type="url" id="videoUrl" placeholder="https://..." class="form-input">
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary" onclick="document.getElementById('addVideoModal').style.display='none'">Cancel</button>
                    <button class="btn-primary" onclick="addCohortVideo(document.getElementById('addVideoModal').dataset.cohortName)">Add Video</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
    document.getElementById('videoThumbnail').addEventListener('change', previewVideoThumbnail);
}

function createEditVideoModal() {
    const html = `
        <div id="editVideoModal" class="modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Edit Video</h2>
                    <button class="modal-close" onclick="document.getElementById('editVideoModal').style.display='none'">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label>Video Name *</label>
                        <input type="text" id="editVideoName" class="form-input">
                    </div>
                    <div class="form-group">
                        <label>Thumbnail Image (optional)</label>
                        <input type="file" id="editVideoThumbnail" accept="image/*" class="form-input">
                        <div id="editVideoThumbnailPreview" class="thumbnail-preview"></div>
                    </div>
                    <div class="form-group">
                        <label>Video URL *</label>
                        <input type="url" id="editVideoUrl" class="form-input">
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary" onclick="document.getElementById('editVideoModal').style.display='none'">Cancel</button>
                    <button class="btn-primary" onclick="editCohortVideo(document.getElementById('editVideoModal').dataset.cohortName, document.getElementById('editVideoModal').dataset.videoId)">Update Video</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);
    document.getElementById('editVideoThumbnail').addEventListener('change', previewEditVideoThumbnail);
}

// FILE UPLOAD UTILITIES
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function previewVideoThumbnail(e) {
    const file = e.target.files[0];
    const preview = document.getElementById('videoThumbnailPreview');
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            preview.innerHTML = `<img src="${event.target.result}">`;
        };
        reader.readAsDataURL(file);
    } else {
        preview.innerHTML = '';
    }
}

function previewEditVideoThumbnail(e) {
    const file = e.target.files[0];
    const preview = document.getElementById('editVideoThumbnailPreview');
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            preview.innerHTML = `<img src="${event.target.result}">`;
        };
        reader.readAsDataURL(file);
    } else {
        preview.innerHTML = '';
    }
}

// Close modals when clicking outside
window.addEventListener('click', function(event) {
    ['addLinkModal', 'editLinkModal', 'addVideoModal', 'editVideoModal'].forEach(modalId => {
        const modal = document.getElementById(modalId);
        if (modal && event.target === modal) {
            modal.style.display = 'none';
        }
    });
});
