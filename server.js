import express from 'express'
import cors from 'cors'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = 3001
const DATA_FILE = path.join(__dirname, 'data', 'minis.json')

app.use(cors())
app.use(express.json({ limit: '50mb' }))

async function readMinis() {
  const data = await fs.readFile(DATA_FILE, 'utf-8')
  return JSON.parse(data)
}

async function writeMinis(minis) {
  await fs.writeFile(DATA_FILE, JSON.stringify(minis, null, 2))
}

app.get('/api/minis', async (req, res) => {
  try {
    res.json(await readMinis())
  } catch (error) {
    res.status(500).json({ error: 'Failed to read minis' })
  }
})

app.post('/api/minis', async (req, res) => {
  try {
    await writeMinis(req.body)
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: 'Failed to save minis' })
  }
})

app.post('/api/minis/add', async (req, res) => {
  try {
    const minis = await readMinis()
    minis.push(req.body)
    await writeMinis(minis)
    res.json({ success: true, mini: req.body })
  } catch (error) {
    res.status(500).json({ error: 'Failed to add mini' })
  }
})

app.put('/api/minis/:id', async (req, res) => {
  try {
    const minis = await readMinis()
    const index = minis.findIndex(m => m.id === req.params.id)
    if (index === -1) return res.status(404).json({ error: 'Mini not found' })

    minis[index] = req.body
    await writeMinis(minis)
    res.json({ success: true, mini: req.body })
  } catch (error) {
    res.status(500).json({ error: 'Failed to update mini' })
  }
})

app.delete('/api/minis/:id', async (req, res) => {
  try {
    const minis = await readMinis()
    const filtered = minis.filter(m => m.id !== req.params.id)
    if (filtered.length === minis.length) return res.status(404).json({ error: 'Mini not found' })

    await writeMinis(filtered)
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete mini' })
  }
})

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

async function start() {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true })
  try { await fs.access(DATA_FILE) } catch { await writeMinis([]) }

  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`))
}

start()
