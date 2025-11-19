
# Phaser Basic Web Template

A lightweight web template for building JavaScript-based games using Phaser and Vite.

## 🚀 Features

- **Modern Build Tool**: Vite for fast development and optimized builds
- **TypeScript Support**: Full TypeScript integration for better development experience
- **Phaser Framework**: Latest Phaser game engine for creating interactive games
- **Hot Reload**: Instant updates during development
- **Production Ready**: Optimized builds for deployment

## 🛠️ Tech Stack

- **Build Tool**: Vite
- **Language**: TypeScript
- **Game Framework**: Phaser 3
- **Package Manager**: pnpm

## 📁 Project Structure

```
site/
├── src/
│   ├── components/     # TypeScript components
│   ├── game/          # Phaser game source files
│   │   ├── assets/    # Game assets
│   │   └── scenes/    # Game scenes and logic
│   └── pages/         # Page components
├── public/            # Static assets
└── dist/              # Production build output
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- pnpm package manager

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd phaser-basic-web-template
```

2. Navigate to the site directory and install dependencies:
```bash
cd site
pnpm install
```

### Development

Start the development server:

```bash
pnpm dev
```

The game will be available at `http://localhost:5173` (or the port shown in your terminal).

### Building for Production

Create an optimized production build:

```bash
pnpm build
```

The production build will be output to the `dist` directory and can be served by any static hosting service.

## 🎮 Development

### Site Development

The site layer handles the web page structure and integration:

- **Page Components**: `src/pages/` - Main page entry points and routing
- **UI Components**: `src/components/` - Reusable TypeScript components (e.g., game wrapper)
- **Styles**: `src/styles/` - Global CSS and styling
- **Static Assets**: `public/` - Static files served as-is (favicons, images, etc.)

### Game Development

The game is self-contained and can be easily swapped out:

- **Game Entry**: `src/game/main.js` - Phaser configuration and initialization
- **Game Scenes**: `src/game/scenes/` - All game logic and scene definitions
- **Game Assets**: `src/game/assets/` - Bundled game assets (sprites, audio, etc.)

**Note**: The `src/game/` folder is designed to be modular. You can replace it with another game by updating the game configuration and ensuring the entry point exports are compatible.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.