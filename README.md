# Mini Painting Tracker

Track your miniature painting collection and progress.

## Setup

```bash
npm install
npm run dev:full
```

Open `http://localhost:5173` in your browser.

The app runs a Vite dev server for the frontend and an Express API server (port 3001) for data persistence.

## Usage

- Add minis with name, type (32mm/75mm/statue/bust), status, tags, and an optional image
- Edit or delete existing entries
- Search and filter by tags, type, or status
- View painted minis in the gallery carousel

Data is stored as JSON in `data/minis.json`.

## Project Structure

```
index.html        - Entry point
server.js         - Express API server
src/main.js       - App logic
src/api.js        - API client
src/style.css     - Styles with dark/light mode
data/minis.json   - Mini data
```

## Build

```bash
npm run build
```

Output goes to `dist/`.
