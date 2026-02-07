import './style.css'
import ApiService from './api.js'

class MiniTracker {
  constructor() {
    this.api = new ApiService()
    this.minis = []
    this.editingId = null
    this.currentCarouselIndex = 0
    this.currentFilters = []
    this.currentSearch = ''
    this.init()
  }

  async init() {
    const isServerRunning = await this.api.checkHealth()
    if (!isServerRunning) {
      this.showError('Server is not running. Start it with "npm run server"')
      return
    }

    await this.loadMinis()
    this.setupEventListeners()
    this.populateFilterOptions()
    this.renderMinis()
  }

  setupEventListeners() {
    document.getElementById('add-mini-toggle').addEventListener('click', () => {
      document.getElementById('add-mini-form').classList.toggle('open')
    })

    document.getElementById('mini-form').addEventListener('submit', (e) => {
      e.preventDefault()
      this.addMini()
    })

    document.getElementById('sort-by').addEventListener('change', (e) => this.sortMinis(e.target.value))
    document.getElementById('search-input').addEventListener('input', (e) => {
      this.currentSearch = e.target.value.toLowerCase()
      this.renderMinis()
    })
    document.getElementById('filter-tag').addEventListener('change', (e) => {
      this.currentFilters = Array.from(e.target.selectedOptions).map(o => o.value).filter(v => v)
      this.renderMinis()
    })

    document.getElementById('show-carousel').addEventListener('click', () => this.showCarousel())
    document.querySelector('.close').addEventListener('click', () => this.closeCarousel())
    document.getElementById('carousel-prev').addEventListener('click', () => this.prevCarouselItem())
    document.getElementById('carousel-next').addEventListener('click', () => this.nextCarouselItem())

    document.getElementById('carousel-modal').addEventListener('click', (e) => {
      if (e.target.id === 'carousel-modal') this.closeCarousel()
    })

    document.addEventListener('keydown', (e) => {
      if (document.getElementById('carousel-modal').style.display !== 'block') return
      if (e.key === 'Escape') this.closeCarousel()
      else if (e.key === 'ArrowLeft') this.prevCarouselItem()
      else if (e.key === 'ArrowRight') this.nextCarouselItem()
    })

    document.addEventListener('click', (e) => {
      const tag = e.target.closest('.tag[data-tag]')
      if (tag) this.toggleTagFilter(tag.dataset.tag)
    })

    document.addEventListener('mouseover', (e) => {
      const thumb = e.target.closest('.mini-thumbnail')
      if (thumb) this.showImagePreview(thumb)
    })
    document.addEventListener('mouseout', (e) => {
      if (e.target.closest('.mini-thumbnail')) this.hideImagePreview()
    })
  }

  async addMini() {
    const imageFile = document.getElementById('mini-image').files[0]

    const mini = {
      id: this.editingId || Date.now().toString(),
      name: document.getElementById('mini-name').value,
      type: document.getElementById('mini-type').value,
      status: document.getElementById('mini-status').value,
      tags: this.parseTags(document.getElementById('mini-tags').value),
      dateAdded: new Date().toISOString(),
      dateModified: new Date().toISOString(),
      image: null
    }

    if (this.editingId) {
      const existing = this.minis.find(m => m.id === this.editingId)
      if (existing) {
        mini.dateAdded = existing.dateAdded
        mini.image = existing.image
      }
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
    if (this.editingId) {
      const index = this.minis.findIndex(m => m.id === this.editingId)
      if (index !== -1) this.minis[index] = mini
      this.editingId = null
    } else {
      this.minis.push(mini)
    }

    await this.saveMinis()
    this.populateFilterOptions()
    this.renderMinis()
    this.resetForm()
  }

  populateFilterOptions() {
    const filterSelect = document.getElementById('filter-tag')
    const allTags = new Set()

    this.minis.forEach(mini => {
      if (mini.tags) mini.tags.forEach(tag => allTags.add(tag))
      allTags.add(mini.type)
      allTags.add(mini.status)
    })

    filterSelect.innerHTML = '<option value="">All</option>'
    Array.from(allTags).sort().forEach(tag => {
      const option = document.createElement('option')
      option.value = tag
      option.textContent = tag
      filterSelect.appendChild(option)
    })

    this.updateFilterDisplay()
  }

  updateGalleryButton() {
    const btn = document.getElementById('show-carousel')
    const count = this.minis.filter(m => m.image).length
    btn.disabled = count === 0
    btn.textContent = count === 0 ? 'Gallery' : `Gallery (${count})`
    btn.style.opacity = count === 0 ? '0.4' : '1'
  }

  toggleTagFilter(tag) {
    const index = this.currentFilters.indexOf(tag)
    if (index === -1) {
      this.currentFilters.push(tag)
    } else {
      this.currentFilters.splice(index, 1)
    }

    const filterSelect = document.getElementById('filter-tag')
    Array.from(filterSelect.options).forEach(o => {
      o.selected = this.currentFilters.includes(o.value)
    })

    this.renderMinis()
  }

  updateFilterDisplay() {
    const filterSelect = document.getElementById('filter-tag')
    const searchInput = document.getElementById('search-input')
    filterSelect.style.borderColor = this.currentFilters.length > 0 ? 'var(--accent)' : 'var(--border)'
    searchInput.style.borderColor = this.currentSearch ? 'var(--accent)' : 'var(--border)'
  }

  editMini(id) {
    const mini = this.minis.find(m => m.id === id)
    if (!mini) return

    this.editingId = id
    document.getElementById('mini-name').value = mini.name
    document.getElementById('mini-type').value = mini.type
    document.getElementById('mini-status').value = mini.status
    document.getElementById('mini-tags').value = (mini.tags || []).join(' ')

    document.getElementById('add-mini-form').classList.add('open')
    document.getElementById('add-mini-toggle').textContent = 'Cancel Edit'
    document.querySelector('#mini-form button[type="submit"]').textContent = 'Update Mini'

    document.getElementById('add-mini-form').scrollIntoView({ behavior: 'smooth' })
  }

  resetForm() {
    document.getElementById('mini-form').reset()
    this.editingId = null
    document.getElementById('add-mini-toggle').textContent = '+ Add Mini'
    document.querySelector('#mini-form button[type="submit"]').textContent = 'Add Mini'
    document.getElementById('add-mini-form').classList.remove('open')
  }

  async deleteMini(id) {
    if (!window.confirm('Are you sure you want to delete this mini?')) return

    this.minis = this.minis.filter(m => m.id !== id)
    await this.saveMinis()
    this.populateFilterOptions()
    this.renderMinis()
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
    this.updateFilterDisplay()
    this.updateGalleryButton()

    let filteredMinis = this.minis

    if (this.currentSearch) {
      filteredMinis = filteredMinis.filter(mini => {
        const text = [mini.name, mini.type, mini.status, ...(mini.tags || [])].join(' ').toLowerCase()
        return text.includes(this.currentSearch)
      })
    }

    if (this.currentFilters.length > 0) {
      filteredMinis = filteredMinis.filter(mini => {
        const allTags = [...(mini.tags || []), mini.type, mini.status]
        return this.currentFilters.every(f => allTags.some(t => t.toLowerCase().includes(f.toLowerCase())))
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
      
      document.getElementById('mini-count').textContent = ''
      return
    }

    const total = this.minis.length
    const shown = filteredMinis.length
    const s = total === 1 ? '' : 's'
    document.getElementById('mini-count').textContent =
      shown === total ? `(${total} mini${s})` : `(${shown} of ${total} mini${s})`

    container.innerHTML = filteredMinis.map(mini => this.createMiniCard(mini)).join('')
  }

  createMiniCard(mini) {
    const dateAdded = new Date(mini.dateAdded).toLocaleDateString()

    const imageHtml = mini.image
      ? `<div class="mini-thumbnail" data-image="${mini.image}" data-name="${mini.name}">
           <img src="${mini.image}" alt="${mini.name}">
         </div>`
      : ''

    const allTags = [...(mini.tags || []), mini.type, mini.status]
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
    const minisWithImages = this.minis.filter(m => m.image)
    if (minisWithImages.length === 0) return

    const paintedMinis = this.minis.filter(m => m.status === 'painted' && m.image)
    const displayMinis = paintedMinis.length > 0 ? paintedMinis : minisWithImages

    const carousel = document.getElementById('carousel')
    carousel.innerHTML = displayMinis.map(mini => `
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
    } catch (error) {
      console.error('Failed to load minis:', error)
      this.minis = []
    }
  }

  async saveMinis() {
    await this.api.saveMinis(this.minis)
  }

  parseTags(tagString) {
    if (!tagString || !tagString.trim()) return []

    const tags = []
    let current = ''
    let inQuotes = false
    let quoteChar = ''

    for (const char of tagString) {
      if ((char === '"' || char === "'") && !inQuotes) {
        inQuotes = true
        quoteChar = char
      } else if (char === quoteChar && inQuotes) {
        inQuotes = false
        quoteChar = ''
        if (current.trim()) {
          tags.push(current.trim())
          current = ''
        }
      } else if (char === ' ' && !inQuotes) {
        if (current.trim()) {
          tags.push(current.trim())
          current = ''
        }
      } else {
        current += char
      }
    }

    if (current.trim()) tags.push(current.trim())
    return tags
  }

  createTagElement(tag, miniType, miniStatus) {
    const t = tag.toLowerCase()
    let cls = 'tag'

    if (tag === miniType) cls += ' type-tag'
    else if (tag === miniStatus) cls += ` status-tag status-${tag}`
    else if (t.includes('final girl') || t.includes('horrified')) cls += ' series'
    else if (['horror', 'carnage', 'frightmare', 'terror', 'haunting', 'slaughter'].some(w => t.includes(w))) cls += ' movie'
    else if (['killer', 'minion', 'monster', 'cryptid'].some(w => t.includes(w))) cls += ' role'

    return `<span class="${cls}" data-tag="${tag}">${tag}</span>`
  }

  showError(message) {
    const el = document.createElement('div')
    el.style.cssText = `
      position: fixed; top: 20px; right: 20px;
      background-color: var(--btn-danger-bg); color: var(--btn-danger-text);
      padding: 1rem; border-radius: 6px; z-index: 1000;
      max-width: 300px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    `
    el.textContent = message
    document.body.appendChild(el)
    setTimeout(() => el.remove(), 5000)
  }

  showImagePreview(thumbnailElement) {
    const imageUrl = thumbnailElement.dataset.image
    if (!imageUrl) return

    this.hideImagePreview()

    const rect = thumbnailElement.getBoundingClientRect()
    let left = rect.right + 10
    let top = rect.top - 10

    if (left + 300 > window.innerWidth) left = rect.left - 310
    if (top + 200 > window.innerHeight) top = rect.bottom - 210

    const modal = document.createElement('div')
    modal.id = 'image-preview-modal'
    modal.style.cssText = `
      position: fixed; top: ${top}px; left: ${left}px;
      width: 300px; height: 200px; background: var(--bg-primary);
      border: 2px solid var(--border); border-radius: 8px;
      box-shadow: 0 8px 24px var(--shadow); z-index: 10000;
      pointer-events: none; overflow: hidden;
    `

    const img = document.createElement('img')
    img.src = imageUrl
    img.alt = thumbnailElement.dataset.name
    img.style.cssText = 'width: 100%; height: 100%; object-fit: cover;'

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

const miniTracker = new MiniTracker()
window.miniTracker = miniTracker
