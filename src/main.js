import './style.css'
import ApiService from './api.js'

class MiniTracker {
  constructor() {
    this.api = new ApiService()
    this.minis = []
    this.currentCarouselIndex = 0
    this.currentFilters = []
    this.currentSearch = ''
    this.init()
  }

  async init() {
    try {
      // Check if server is running
      const isServerRunning = await this.api.checkHealth()
      if (!isServerRunning) {
        this.showError('Server is not running. Please start the server with "npm run server"')
        return
      }

      await this.loadMinis()
      this.setupEventListeners()
      this.populateFilterOptions()
      this.renderMinis()
    } catch (error) {
      console.error('Error initializing app:', error)
      this.showError('Failed to initialize the application')
    }
  }

  setupEventListeners() {
    // Form submission
    document.getElementById('mini-form').addEventListener('submit', (e) => {
      e.preventDefault()
      this.addMini()
    })

    // Sort functionality
    document.getElementById('sort-by').addEventListener('change', (e) => {
      this.sortMinis(e.target.value)
    })

    // Search functionality
    document.getElementById('search-input').addEventListener('input', (e) => {
      this.currentSearch = e.target.value.toLowerCase()
      this.renderMinis()
    })

    // Filter functionality (multiple selection)
    document.getElementById('filter-tag').addEventListener('change', (e) => {
      this.currentFilters = Array.from(e.target.selectedOptions).map(option => option.value).filter(v => v !== '')
      this.renderMinis()
    })

    // Carousel modal
    document.getElementById('show-carousel').addEventListener('click', () => {
      this.showCarousel()
    })

    // Modal close
    document.querySelector('.close').addEventListener('click', () => {
      this.closeCarousel()
    })

    // Carousel navigation
    document.getElementById('carousel-prev').addEventListener('click', () => {
      this.prevCarouselItem()
    })

    document.getElementById('carousel-next').addEventListener('click', () => {
      this.nextCarouselItem()
    })

    // Close modal on outside click
    document.getElementById('carousel-modal').addEventListener('click', (e) => {
      if (e.target.id === 'carousel-modal') {
        this.closeCarousel()
      }
    })

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (document.getElementById('carousel-modal').style.display === 'block') {
        if (e.key === 'Escape') {
          this.closeCarousel()
        } else if (e.key === 'ArrowLeft') {
          this.prevCarouselItem()
        } else if (e.key === 'ArrowRight') {
          this.nextCarouselItem()
        }
      }
    })

    // Image preview hover handlers
    document.addEventListener('mouseover', (e) => {
      if (e.target.closest('.mini-thumbnail')) {
        this.showImagePreview(e.target.closest('.mini-thumbnail'))
      }
    })

    document.addEventListener('mouseout', (e) => {
      if (e.target.closest('.mini-thumbnail')) {
        this.hideImagePreview()
      }
    })
  }

  async addMini() {
    const form = document.getElementById('mini-form')
    const formData = new FormData(form)
    const imageFile = document.getElementById('mini-image').files[0]
    
    const mini = {
      id: Date.now().toString(),
      name: document.getElementById('mini-name').value,
      type: document.getElementById('mini-type').value,
      status: document.getElementById('mini-status').value,
      tags: this.parseTags(document.getElementById('mini-tags').value),
      dateAdded: new Date().toISOString(),
      dateModified: new Date().toISOString(),
      image: null
    }

    if (imageFile) {
      const reader = new FileReader()
      reader.onload = async (e) => {
        mini.image = e.target.result
        await this.saveMini(mini)
      }
      reader.readAsDataURL(imageFile)
    } else {
      await this.saveMini(mini)
    }
  }

  async saveMini(mini) {
    try {
      this.minis.push(mini)
      await this.saveMinis()
      this.populateFilterOptions()
      this.renderMinis()
      document.getElementById('mini-form').reset()
    } catch (error) {
      console.error('Error saving mini:', error)
      this.showError('Failed to save mini')
    }
  }

  populateFilterOptions() {
    const filterSelect = document.getElementById('filter-tag')
    const allTags = new Set()
    
    this.minis.forEach(mini => {
      // Add regular tags
      if (mini.tags) {
        mini.tags.forEach(tag => allTags.add(tag))
      }
      // Add type and status
      allTags.add(mini.type)
      allTags.add(mini.status)
    })
    
    // Clear existing options except "All"
    filterSelect.innerHTML = '<option value="">All</option>'
    
    // Add sorted tag options
    Array.from(allTags).sort().forEach(tag => {
      const option = document.createElement('option')
      option.value = tag
      option.textContent = tag
      filterSelect.appendChild(option)
    })
    
    // Update filter display
    this.updateFilterDisplay()
  }

  updateGalleryButton() {
    const galleryBtn = document.getElementById('show-carousel')
    const minisWithImages = this.minis.filter(mini => mini.image)
    
    if (minisWithImages.length === 0) {
      galleryBtn.disabled = true
      galleryBtn.textContent = 'View Gallery (No Images)'
      galleryBtn.style.opacity = '0.5'
      galleryBtn.style.cursor = 'not-allowed'
    } else {
      galleryBtn.disabled = false
      galleryBtn.textContent = `View Gallery (${minisWithImages.length})`
      galleryBtn.style.opacity = '1'
      galleryBtn.style.cursor = 'pointer'
    }
  }

  updateFilterDisplay() {
    // Add visual feedback for active filters
    const filterSelect = document.getElementById('filter-tag')
    const searchInput = document.getElementById('search-input')
    
    // Update placeholder to show active state
    if (this.currentFilters.length > 0) {
      filterSelect.style.borderColor = 'var(--accent)'
    } else {
      filterSelect.style.borderColor = 'var(--border)'
    }
    
    if (this.currentSearch) {
      searchInput.style.borderColor = 'var(--accent)'
    } else {
      searchInput.style.borderColor = 'var(--border)'
    }
  }

  editMini(id) {
    // Simple implementation - could be expanded
    this.deleteMini(id, false)
  }

  async deleteMini(id, confirm = true) {
    if (confirm && !window.confirm('Are you sure you want to delete this mini?')) {
      return
    }

    try {
      this.minis = this.minis.filter(m => m.id !== id)
      await this.saveMinis()
      this.populateFilterOptions()
      this.renderMinis()
    } catch (error) {
      console.error('Error deleting mini:', error)
      this.showError('Failed to delete mini')
    }
  }

  sortMinis(sortBy) {
    switch (sortBy) {
      case 'date-newest':
        this.minis.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded))
        break
      case 'date-oldest':
        this.minis.sort((a, b) => new Date(a.dateAdded) - new Date(b.dateAdded))
        break
      case 'name':
        this.minis.sort((a, b) => a.name.localeCompare(b.name))
        break
      case 'type':
        this.minis.sort((a, b) => a.type.localeCompare(b.type))
        break
      case 'status':
        this.minis.sort((a, b) => a.status.localeCompare(b.status))
        break
    }
    this.renderMinis()
  }

  renderMinis() {
    const container = document.getElementById('minis-container')
    
    // Update filter display to show active state
    this.updateFilterDisplay()
    
    // Update gallery button state
    this.updateGalleryButton()
    
    // Filter minis based on search and tags
    let filteredMinis = this.minis
    
    // Apply search filter
    if (this.currentSearch) {
      filteredMinis = filteredMinis.filter(mini => {
        const searchableText = [
          mini.name,
          mini.type,
          mini.status,
          ...(mini.tags || [])
        ].join(' ').toLowerCase()
        
        return searchableText.includes(this.currentSearch)
      })
    }
    
    // Apply tag filters (must match ALL selected tags)
    if (this.currentFilters.length > 0) {
      filteredMinis = filteredMinis.filter(mini => {
        const allTags = [...(mini.tags || []), mini.type, mini.status]
        return this.currentFilters.every(filter => 
          allTags.some(tag => tag.toLowerCase().includes(filter.toLowerCase()))
        )
      })
    }
    
    if (filteredMinis.length === 0) {
      let message = 'No minis found'
      let subMessage = 'Try adjusting your search or filters!'
      
      if (!this.currentSearch && this.currentFilters.length === 0) {
        message = 'No minis added yet'
        subMessage = 'Start by adding your first miniature above!'
      }
        
      container.innerHTML = `
        <div class="empty-state">
          <h3>${message}</h3>
          <p>${subMessage}</p>
        </div>
      `
      
      // Update count display
      document.getElementById('mini-count').textContent = ''
      return
    }

    // Update count display
    const totalMinis = this.minis.length
    const countText = filteredMinis.length === totalMinis 
      ? `(${totalMinis} mini${totalMinis === 1 ? '' : 's'})`
      : `(${filteredMinis.length} of ${totalMinis} mini${totalMinis === 1 ? '' : 's'})`
    document.getElementById('mini-count').textContent = countText

    container.innerHTML = filteredMinis.map(mini => this.createMiniCard(mini)).join('')
  }

  createMiniCard(mini) {
    const dateAdded = new Date(mini.dateAdded).toLocaleDateString()
    
    // Show small circular image next to name if available
    const imageHtml = mini.image 
      ? `<div class="mini-thumbnail" data-image="${mini.image}" data-name="${mini.name}">
           <img src="${mini.image}" alt="${mini.name}">
         </div>` 
      : ''
    
    // Combine all tags including type and status
    const allTags = [
      ...(mini.tags || []),
      mini.type,
      mini.status
    ]
    
    const tagsHtml = `
      <div class="mini-tags">
        ${allTags.map(tag => this.createTagElement(tag, mini.type, mini.status)).join('')}
      </div>
    `

    return `
      <div class="mini-card">
        <div class="mini-header">
          <div class="mini-header-content">
            <h3>${mini.name}</h3>
            ${imageHtml}
          </div>
        </div>
        ${tagsHtml}
        <div class="mini-actions">
          <button class="edit-btn" onclick="miniTracker.editMini('${mini.id}')">Edit</button>
          <button class="delete-btn" onclick="miniTracker.deleteMini('${mini.id}')">Delete</button>
        </div>
        <div class="mini-date">Added: ${dateAdded}</div>
      </div>
    `
  }

  showCarousel() {
    const minisWithImages = this.minis.filter(mini => mini.image)
    
    if (minisWithImages.length === 0) {
      return // Button should be disabled, but just in case
    }

    // Prefer painted minis, but show all minis with images if no painted ones
    const paintedMinis = this.minis.filter(mini => mini.status === 'painted' && mini.image)
    const displayMinis = paintedMinis.length > 0 ? paintedMinis : minisWithImages

    const carousel = document.getElementById('carousel')
    carousel.innerHTML = displayMinis.map((mini, index) => `
      <div class="carousel-item">
        <img src="${mini.image}" alt="${mini.name}">
        <h3>${mini.name}</h3>
        <p>${mini.type} • ${mini.status === 'painted' ? 'Completed' : 'Status: ' + mini.status} • ${new Date(mini.dateModified).toLocaleDateString()}</p>
      </div>
    `).join('')

    this.currentCarouselIndex = 0
    this.updateCarouselPosition()
    document.getElementById('carousel-modal').style.display = 'block'
  }

  closeCarousel() {
    document.getElementById('carousel-modal').style.display = 'none'
  }

  prevCarouselItem() {
    const items = document.querySelectorAll('.carousel-item')
    if (items.length === 0) return
    
    this.currentCarouselIndex = (this.currentCarouselIndex - 1 + items.length) % items.length
    this.updateCarouselPosition()
  }

  nextCarouselItem() {
    const items = document.querySelectorAll('.carousel-item')
    if (items.length === 0) return
    
    this.currentCarouselIndex = (this.currentCarouselIndex + 1) % items.length
    this.updateCarouselPosition()
  }

  updateCarouselPosition() {
    const carousel = document.getElementById('carousel')
    const translateX = -this.currentCarouselIndex * 100
    carousel.style.transform = `translateX(${translateX}%)`
  }

  async loadMinis() {
    try {
      this.minis = await this.api.getMinis()
      return this.minis
    } catch (error) {
      console.error('Error loading minis:', error)
      this.showError('Failed to load minis from server')
      this.minis = []
      return []
    }
  }

  async saveMinis() {
    try {
      await this.api.saveMinis(this.minis)
    } catch (error) {
      console.error('Error saving minis:', error)
      this.showError('Failed to save minis to server')
    }
  }

  parseTags(tagString) {
    if (!tagString || tagString.trim() === '') return []
    
    const tags = []
    let currentTag = ''
    let inQuotes = false
    let quoteChar = ''
    
    for (let i = 0; i < tagString.length; i++) {
      const char = tagString[i]
      
      if ((char === '"' || char === "'") && !inQuotes) {
        // Start of quoted string
        inQuotes = true
        quoteChar = char
      } else if (char === quoteChar && inQuotes) {
        // End of quoted string
        inQuotes = false
        quoteChar = ''
        if (currentTag.trim()) {
          tags.push(currentTag.trim())
          currentTag = ''
        }
      } else if (char === ' ' && !inQuotes) {
        // Space outside quotes - separator
        if (currentTag.trim()) {
          tags.push(currentTag.trim())
          currentTag = ''
        }
      } else {
        // Regular character
        currentTag += char
      }
    }
    
    // Add any remaining tag
    if (currentTag.trim()) {
      tags.push(currentTag.trim())
    }
    
    return tags.filter(tag => tag.length > 0)
  }

  createTagElement(tag, miniType, miniStatus) {
    let tagClass = 'tag'
    
    // Check if this is the type or status
    if (tag === miniType) {
      tagClass += ' type-tag'
    } else if (tag === miniStatus) {
      tagClass += ` status-tag status-${tag}`
    } else if (tag.toLowerCase().includes('final girl')) {
      tagClass += ' series'
    } else if (tag.toLowerCase().includes('horrified')) {
      tagClass += ' series'
    } else if (tag.toLowerCase().includes('horror') || tag.toLowerCase().includes('carnage') || tag.toLowerCase().includes('frightmare') || tag.toLowerCase().includes('terror') || tag.toLowerCase().includes('haunting') || tag.toLowerCase().includes('slaughter')) {
      tagClass += ' movie'
    } else if (tag.toLowerCase().includes('killer') || tag.toLowerCase().includes('final girl') || tag.toLowerCase().includes('minion') || tag.toLowerCase().includes('monster') || tag.toLowerCase().includes('cryptid')) {
      tagClass += ' role'
    }
    
    return `<span class="${tagClass}" data-tag="${tag}">${tag}</span>`
  }

  showError(message) {
    // Create a simple error notification
    const errorDiv = document.createElement('div')
    errorDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background-color: var(--btn-danger-bg);
      color: var(--btn-danger-text);
      padding: 1rem;
      border-radius: 6px;
      z-index: 1000;
      max-width: 300px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    `
    errorDiv.textContent = message
    document.body.appendChild(errorDiv)

    // Remove after 5 seconds
    setTimeout(() => {
      if (errorDiv.parentNode) {
        errorDiv.parentNode.removeChild(errorDiv)
      }
    }, 5000)
  }

  showImagePreview(thumbnailElement) {
    const imageUrl = thumbnailElement.dataset.image
    const imageName = thumbnailElement.dataset.name
    
    if (!imageUrl) return

    // Remove any existing preview
    this.hideImagePreview()

    // Get thumbnail position
    const rect = thumbnailElement.getBoundingClientRect()
    
    // Calculate modal position (to the right of thumbnail)
    const modalLeft = rect.right + 10
    const modalTop = rect.top - 10

    // Create preview modal
    const modal = document.createElement('div')
    modal.id = 'image-preview-modal'
    modal.style.cssText = `
      position: fixed;
      top: ${modalTop}px;
      left: ${modalLeft}px;
      width: 300px;
      height: 200px;
      background: var(--bg-primary);
      border: 2px solid var(--border);
      border-radius: 8px;
      box-shadow: 0 8px 24px var(--shadow);
      z-index: 10000;
      pointer-events: none;
      overflow: hidden;
    `

    // Adjust position if modal would go off screen
    const modalRect = {
      right: modalLeft + 300,
      bottom: modalTop + 200
    }
    
    // If modal goes off right edge, position it to the left of thumbnail
    if (modalRect.right > window.innerWidth) {
      modal.style.left = (rect.left - 310) + 'px'
    }
    
    // If modal goes off bottom, move it up
    if (modalRect.bottom > window.innerHeight) {
      modal.style.top = (rect.bottom - 210) + 'px'
    }

    const img = document.createElement('img')
    img.src = imageUrl
    img.alt = imageName
    img.style.cssText = `
      width: 100%;
      height: 100%;
      object-fit: cover;
    `

    modal.appendChild(img)
    document.body.appendChild(modal)
  }

  hideImagePreview() {
    const existingModal = document.getElementById('image-preview-modal')
    if (existingModal) {
      existingModal.remove()
    }
  }
}

// Initialize the app
const miniTracker = new MiniTracker()

// Make it globally accessible for button onclick handlers
window.miniTracker = miniTracker
