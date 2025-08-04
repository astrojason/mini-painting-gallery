class ApiService {
  constructor() {
    this.baseUrl = 'http://localhost:3001/api'
  }

  async getMinis() {
    try {
      const response = await fetch(`${this.baseUrl}/minis`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      return await response.json()
    } catch (error) {
      console.error('Error fetching minis:', error)
      throw error
    }
  }

  async saveMinis(minis) {
    try {
      const response = await fetch(`${this.baseUrl}/minis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(minis)
      })
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      return await response.json()
    } catch (error) {
      console.error('Error saving minis:', error)
      throw error
    }
  }

  async addMini(mini) {
    try {
      const response = await fetch(`${this.baseUrl}/minis/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mini)
      })
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      return await response.json()
    } catch (error) {
      console.error('Error adding mini:', error)
      throw error
    }
  }

  async updateMini(id, mini) {
    try {
      const response = await fetch(`${this.baseUrl}/minis/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mini)
      })
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      return await response.json()
    } catch (error) {
      console.error('Error updating mini:', error)
      throw error
    }
  }

  async deleteMini(id) {
    try {
      const response = await fetch(`${this.baseUrl}/minis/${id}`, {
        method: 'DELETE'
      })
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      return await response.json()
    } catch (error) {
      console.error('Error deleting mini:', error)
      throw error
    }
  }

  async checkHealth() {
    try {
      const response = await fetch(`${this.baseUrl}/health`)
      return response.ok
    } catch (error) {
      return false
    }
  }
}

export default ApiService
