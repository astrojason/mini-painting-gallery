<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Mini Painting Tracker

This is a web application for tracking miniature painting progress. The application features:

- **Dark/Light Mode**: Toggle between themes with CSS custom properties
- **Mini Types**: Support for 32mm, 75mm, statue, and bust miniatures
- **Status Tracking**: Track progress from bare → primed → painting → painted
- **Image Upload**: Store images locally using base64 encoding
- **Sorting**: Sort by date, name, type, or status
- **Gallery Carousel**: View completed painted minis with images
- **Local Storage**: All data persisted in JSON format using localStorage

## Tech Stack
- Vanilla JavaScript (ES6+ classes)
- CSS with custom properties for theming
- Vite for build tooling
- Local file storage for images (base64)
- localStorage for data persistence

## Key Features
- Responsive design with CSS Grid and Flexbox
- Keyboard navigation support in carousel
- Form validation and error handling
- Smooth animations and transitions
- Mobile-friendly interface
