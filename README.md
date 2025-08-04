# Mini Painting Tracker

A web application to track your miniature painting progress with dark mode support, image uploads, and gallery features.

## Features

- ✨ **Dark/Light Mode**: Toggle between themes
- 🎯 **Mini Types**: Support for 32mm, 75mm, statue, and bust miniatures
- 📊 **Status Tracking**: Track progress from bare → primed → painting → painted
- 📸 **Image Upload**: Store and view images of your minis
- 🔄 **Sorting**: Sort by date, name, type, or status
- 🎠 **Gallery Carousel**: View completed painted minis in a beautiful carousel
- 💾 **Local Storage**: All data stored locally in JSON format

## Getting Started

### Prerequisites
- Node.js (version 14 or higher)
- npm or yarn

### Installation

1. Clone the repository or download the files
2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Usage

### Adding a Mini
1. Fill out the form with your mini's details
2. Select the type (32mm, 75mm, statue, or bust)
3. Choose the current status (defaults to "bare")
4. Optionally upload an image
5. Click "Add Mini"

### Managing Minis
- **Edit**: Click the edit button to modify a mini's details
- **Delete**: Click the delete button to remove a mini
- **Sort**: Use the sort dropdown to organize your collection

### Gallery View
- Click "View Gallery" to see a carousel of your painted minis with images
- Use arrow keys or click the navigation buttons to browse
- Press Escape to close the gallery

### Theme Toggle
Click the moon/sun icon in the header to switch between light and dark themes.

## Data Storage

All data is stored locally in your browser using localStorage. Your data includes:
- Mini details (name, type, status, dates)
- Images (stored as base64 strings)
- Theme preference

## Browser Compatibility

This application works in all modern browsers that support:
- ES6 classes
- CSS custom properties
- FileReader API
- localStorage

## Development

The project structure:
```
├── index.html          # Main HTML file
├── src/
│   ├── main.js         # JavaScript application logic
│   └── style.css       # CSS styles with theming
├── package.json        # Dependencies and scripts
└── .github/
    └── copilot-instructions.md
```

## Contributing

Feel free to submit issues and enhancement requests!

## License

This project is open source and available under the [MIT License](LICENSE).
