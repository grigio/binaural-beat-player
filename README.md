# Binaural Beat Player 🎧

A web application built with Next.js, React, and TypeScript to generate and play binaural beats. Users can manually control frequencies, play predefined patterns, adjust volume, and visualize the audio waves.

<p align="center">
  <img src="public/binaural-beat-player.png" alt="Binaural Beat Player Screenshot" width="80%">
</p>
<p align="center">
  <em>Main interface of the Binaural Beat Player showing frequency controls and visualization.</em>
</p>
<p align="center">Go to 
  <a href="https://grigio.github.io/binaural-beat-player/" target="_blank">🎧 Binaural Beat Player</a>
</p>

## ✨ Features

*   **Manual Frequency Control:** Set specific frequencies (1-600 Hz) for the left and right audio channels using sliders.
*   **Pattern Mode:** Play sequences of binaural beats defined in a JSON format. Each step includes left frequency, right frequency, and duration.
*   **Volume Control:** Adjust the overall volume of the generated audio.
*   **Audio Visualization:** See a real-time representation of the left (blue) and right (green) audio waves on a canvas.
*   **Play/Pause Control:** Easily start and stop the audio playback.
*   **Mode Switching:** Toggle between Manual and Pattern modes.
*   **Responsive Design:** Adapts to different screen sizes using Tailwind CSS.
*   **Icons:** Uses `react-icons` for UI elements like play/pause buttons.

## 🚀 Getting Started

1.  **Clone the repository (if you haven't already):**
    ```bash
    git clone <your-repository-url>
    cd binaural-beat-player
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    # or
    pnpm install
    ```
3.  **Run the development server:**
    ```bash
    npm run dev
    # or
    yarn dev
    # or
    pnpm dev
    ```
4.  Open [http://localhost:3000](http://localhost:3000) in your browser to use the player.

## 🛠️ Technology Stack

*   [Next.js](https://nextjs.org/) - React framework for server-side rendering and static site generation.
*   [React](https://reactjs.org/) - JavaScript library for building user interfaces.
*   [TypeScript](https://www.typescriptlang.org/) - Typed superset of JavaScript.
*   [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework.
*   [React Icons](https://react-icons.github.io/react-icons/) - Library for including popular icons in React projects.
*   [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) - Used for generating and manipulating audio directly in the browser.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details (if applicable).
