# Sea Battle CLI Game

This is a modern command-line interface (CLI) implementation of the classic Sea Battle (Battleship) game, written in JavaScript using ES6+ features and object-oriented design patterns.

## Features

- **Modern JavaScript**: Built with ES6+ classes, modules, and async/await
- **Object-Oriented Architecture**: Well-structured code with clear separation of concerns
- **Intelligent AI**: CPU opponent with hunt and target strategy
- **Clean UI**: Side-by-side board display for easy gameplay
- **Robust Error Handling**: Comprehensive input validation and error messages

## Gameplay

You play against a CPU opponent. Both players place their ships on a 10x10 grid. Players take turns guessing coordinates to hit the opponent's ships. The first player to sink all of the opponent's ships wins.

- `~` represents water (unknown).
- `S` represents your ships on your board.
- `X` represents a hit (on either board).
- `O` represents a miss (on either board).

## Requirements

- **Node.js** version 14.0.0 or higher
- No additional dependencies required (uses built-in Node.js modules)

## Installation & Setup

1. **Ensure you have Node.js installed.** You can download it from [https://nodejs.org/](https://nodejs.org/).

2. **Navigate to the project directory** in your terminal:

   ```bash
   cd path/to/seabattle-game
   ```

3. **Install the project** (optional, for npm script support):
   ```bash
   npm install
   ```

## How to Run

### Option 1: Using npm script (recommended)

```bash
npm start
```

### Option 2: Direct node execution

```bash
node seabattle.js
```

4. **Follow the prompts** to enter your guesses (e.g., `00` for the top-left corner, `99` for the bottom-right).

## Game Architecture

The refactored codebase follows modern JavaScript best practices:

- **`Ship`** - Represents individual ships with hit tracking
- **`Board`** - Manages game board state and ship placement
- **`CPUPlayer`** - Implements AI logic with hunt/target modes
- **`GameDisplay`** - Handles all UI rendering and messaging
- **`SeaBattleGame`** - Main game controller orchestrating gameplay

## Development

This codebase uses ES6 modules. The `package.json` includes:

- ES module support (`"type": "module"`)
- Node.js version requirements
- Start script for easy execution

For more details about the refactoring process, see [refactoring.md](./refactoring.md).

Enjoy the game! 🚢⚓
