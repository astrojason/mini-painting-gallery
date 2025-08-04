import express from 'express'
import cors from 'cors'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = 3001
const DATA_FILE = path.join(__dirname, 'data', 'minis.json')

// Middleware
app.use(cors())
app.use(express.json({ limit: '50mb' })) // Increased limit for base64 images

// Ensure data directory exists
async function ensureDataDir() {
  const dataDir = path.dirname(DATA_FILE)
  try {
    await fs.access(dataDir)
  } catch {
    await fs.mkdir(dataDir, { recursive: true })
  }
}

// Initialize data file if it doesn't exist
async function initializeDataFile() {
  try {
    await fs.access(DATA_FILE)
  } catch {
    // File doesn't exist, create it with empty array
    await fs.writeFile(DATA_FILE, JSON.stringify([], null, 2))
  }
}

// Get all minis
app.get('/api/minis', async (req, res) => {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf-8')
    const minis = JSON.parse(data)
    res.json(minis)
  } catch (error) {
    console.error('Error reading minis:', error)
    res.status(500).json({ error: 'Failed to read minis data' })
  }
})

// Save all minis (replace entire dataset)
app.post('/api/minis', async (req, res) => {
  try {
    const minis = req.body
    await fs.writeFile(DATA_FILE, JSON.stringify(minis, null, 2))
    res.json({ success: true, message: 'Minis saved successfully' })
  } catch (error) {
    console.error('Error saving minis:', error)
    res.status(500).json({ error: 'Failed to save minis data' })
  }
})

// Add a single mini
app.post('/api/minis/add', async (req, res) => {
  try {
    const newMini = req.body
    const data = await fs.readFile(DATA_FILE, 'utf-8')
    const minis = JSON.parse(data)
    
    minis.push(newMini)
    await fs.writeFile(DATA_FILE, JSON.stringify(minis, null, 2))
    
    res.json({ success: true, mini: newMini })
  } catch (error) {
    console.error('Error adding mini:', error)
    res.status(500).json({ error: 'Failed to add mini' })
  }
})

// Update a mini
app.put('/api/minis/:id', async (req, res) => {
  try {
    const miniId = req.params.id
    const updatedMini = req.body
    
    const data = await fs.readFile(DATA_FILE, 'utf-8')
    const minis = JSON.parse(data)
    
    const index = minis.findIndex(mini => mini.id === miniId)
    if (index === -1) {
      return res.status(404).json({ error: 'Mini not found' })
    }
    
    minis[index] = updatedMini
    await fs.writeFile(DATA_FILE, JSON.stringify(minis, null, 2))
    
    res.json({ success: true, mini: updatedMini })
  } catch (error) {
    console.error('Error updating mini:', error)
    res.status(500).json({ error: 'Failed to update mini' })
  }
})

// Delete a mini
app.delete('/api/minis/:id', async (req, res) => {
  try {
    const miniId = req.params.id
    
    const data = await fs.readFile(DATA_FILE, 'utf-8')
    const minis = JSON.parse(data)
    
    const filteredMinis = minis.filter(mini => mini.id !== miniId)
    
    if (filteredMinis.length === minis.length) {
      return res.status(404).json({ error: 'Mini not found' })
    }
    
    await fs.writeFile(DATA_FILE, JSON.stringify(filteredMinis, null, 2))
    
    res.json({ success: true, message: 'Mini deleted successfully' })
  } catch (error) {
    console.error('Error deleting mini:', error)
    res.status(500).json({ error: 'Failed to delete mini' })
  }
})

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running', timestamp: new Date().toISOString() })
})

// Initialize and start server
async function startServer() {
  try {
    await ensureDataDir()
    await initializeDataFile()
    
    app.listen(PORT, () => {
      console.log(`Mini Painting Tracker API server running on http://localhost:${PORT}`)
      console.log(`Data file: ${DATA_FILE}`)
    })
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

startServer()
