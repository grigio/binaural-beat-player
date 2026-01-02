# Binaural Beat Player - Development Guide

## Project Overview
A Next.js-based binaural beat player with Web Audio API integration, migrated from Node.js to Bun runtime for improved performance and reduced bundle size.

## Technology Stack
- **Runtime**: Bun (>=1.0.0)
 - **Framework**: Next.js 14.2.15 with React 18.3.1
- **Styling**: Tailwind CSS v4
 - **Audio**: Web Audio API
 - **Icons**: Lucide React & React Icons
- **Deployment**: GitHub Pages (static export)

## Development Commands

### Core Commands
```bash
# Install dependencies
bun install

# Start development server with Turbopack
bun run dev

# Build for production
bun run build

# Start production server
bun run start

# Run linting
bun run lint

# Deploy to GitHub Pages
bun run deploy
```

## Key Features
- **Binaural Beat Generation**: Real-time audio synthesis using Web Audio API
- **Pattern Mode**: JSON-based frequency sequences with timing control
- **Manual Mode**: Direct frequency control with range sliders (1-600 Hz)
- **Visualizer**: Real-time waveform visualization using Canvas API
- **Volume Control**: Frequency-aware volume adjustment
- **Responsive Design**: Mobile-first approach with Tailwind CSS

## Project Structure
```
├── app/                    # Next.js App Router
│   ├── page.tsx           # Main binaural player component
│   ├── layout.tsx         # Root layout
│   └── globals.css        # Global styles
├── components/            # Reusable components
│   └── Footer.tsx         # Footer with donate links
├── bineural-songs/        # Predefined patterns
│   ├── ai-gemini.json     # AI-focused pattern
│   ├── creative.json      # Creativity enhancement
│   ├── intro.json         # Introduction pattern
│   ├── relaxing.json      # Relaxation pattern
│   └── scala.json         # Scala tuning pattern
└── public/               # Static assets
```

## Audio Implementation Details

### Web Audio API Architecture
- **AudioContext**: Main audio processing context
- **OscillatorNodes**: Generate left/right channel frequencies
- **StereoPannerNodes**: Channel separation (-1 left, +1 right)
- **GainNode**: Volume control with frequency-based scaling

### Frequency Scaling
Volume automatically adjusts based on average frequency:
- 1 Hz: 100% volume
- 600 Hz: 30% volume
- Linear interpolation between endpoints

### Pattern Format
```json
{
  "pattern": [
    [left_frequency, right_frequency, duration_ms],
    // ... more steps
  ]
}
```

## Migration Notes (Node.js → Bun)

### Removed Dependencies
- `@types/node`: No longer needed with Bun's built-in Node.js compatibility
- `tone`: Removed to prevent localStorage SSR issues
- `recharts`: Removed to prevent localStorage SSR issues
- `package-lock.json`: Replaced with `bun.lockb`

### Configuration Changes
- **next.config.js**: Renamed from .ts for compatibility, static export for production
- **package.json**: Added Bun engine requirement
- **.gitignore**: Added `bun.lockb` and `bun-debug.log*`

### Version Compatibility
- Downgraded Next.js from 15.3.1 to 14.2.15 for stability
- Downgraded React from 19 to 18.3.1 for better SSR compatibility
- Changed font from Geist to Inter for Next.js 14 compatibility

### Performance Benefits
- Faster installation times
- Reduced bundle size
- Improved runtime performance
- Built-in TypeScript support

## Development Guidelines

### Code Style
- Use TypeScript with strict mode
- Follow React functional component patterns
- Implement proper cleanup in useEffect hooks
- Use semantic HTML with ARIA labels

### Audio Best Practices
- Always handle AudioContext state changes (suspended/resumed)
- Implement proper oscillator cleanup
- Use smooth transitions (linearRampToValueAtTime)
- Handle browser compatibility gracefully

### State Management
- Keep audio state separate from UI state
- Use refs for persistent audio objects
- Implement proper error boundaries

## Deployment
The app builds as a static site for GitHub Pages:
- Output directory: `out/`
- Base path: `/binaural-beat-player` (production only)
- Automatic .nojekyll file generation

## Browser Compatibility
- Modern browsers with Web Audio API support
- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Partial support (may require user interaction)

## Deployment
The app builds as a static site for GitHub Pages:
- Output directory: `out/`
- Base path: `/binaural-beat-player` (production only)
- Automatic .nojekyll file generation

## Browser Compatibility
- Modern browsers with Web Audio API support
- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Partial support (may require user interaction)

## Troubleshooting
- **Audio not playing**: Check browser autoplay policies
- **Context suspended**: Call `audioContext.resume()` after user interaction
- **Performance issues**: Monitor oscillator cleanup and gain node connections
- **SSR Issues**: Use `typeof window === 'undefined'` checks for browser APIs