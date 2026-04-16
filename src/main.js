import './style.css'
import ApiService from './api.js'

const ICONS = {
  plus: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" width="16" height="16"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>`,
  xMark: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" width="16" height="16"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>`,
  photo: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="15" height="15"><path stroke-linecap="round" stroke-linejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" /></svg>`,
  pencil: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="14" height="14"><path stroke-linecap="round" stroke-linejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg>`,
  trash: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" width="14" height="14"><path stroke-linecap="round" stroke-linejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>`,
  chevronLeft: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" width="20" height="20"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg>`,
  chevronRight: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" width="20" height="20"><path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>`,
}

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
      document.getElementById('mini-dialog').showModal()
    })

    document.getElementById('mini-dialog-close').addEventListener('click', () => this.resetForm())
    document.getElementById('mini-dialog-cancel').addEventListener('click', () => this.resetForm())

    document.getElementById('mini-dialog').addEventListener('click', (e) => {
      if (e.target === e.currentTarget) this.resetForm()
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
    btn.innerHTML = count === 0 ? `${ICONS.photo} Gallery` : `${ICONS.photo} Gallery (${count})`
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

    document.getElementById('mini-dialog-title').textContent = 'Edit Mini'
    document.querySelector('#mini-form button[type="submit"]').textContent = 'Update Mini'
    document.getElementById('mini-dialog').showModal()
  }

  resetForm() {
    document.getElementById('mini-form').reset()
    this.editingId = null
    document.getElementById('mini-dialog-title').textContent = 'Add Mini'
    document.querySelector('#mini-form button[type="submit"]').textContent = 'Add Mini'
    document.getElementById('mini-dialog').close()
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
            <div class="mini-actions">
              <button class="edit-btn" onclick="miniTracker.editMini('${mini.id}')" title="Edit">${ICONS.pencil}</button>
              <button class="delete-btn" onclick="miniTracker.deleteMini('${mini.id}')" title="Delete">${ICONS.trash}</button>
            </div>
          </div>
        </div>
        ${imageHtml}
        ${tagsHtml}
        <div class="mini-date">added: ${dateAdded}</div>
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
