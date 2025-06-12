import readline from "readline";
import { pathToFileURL } from "url";

/**
 * Represents a ship in the game
 */
class Ship {
  constructor(locations) {
    this.locations = locations;
    this.hits = new Array(locations.length).fill(false);
  }

  /**
   * Attempts to hit the ship at a specific location
   * @param {string} location - The location string (e.g., "34")
   * @returns {boolean} - True if hit, false if miss
   */
  hit(location) {
    const index = this.locations.indexOf(location);
    if (index >= 0 && !this.hits[index]) {
      this.hits[index] = true;
      return true;
    }
    return false;
  }

  /**
   * Checks if the ship is completely sunk
   * @returns {boolean} - True if sunk, false otherwise
   */
  isSunk() {
    return this.hits.every((hit) => hit);
  }

  /**
   * Checks if a location is part of this ship
   * @param {string} location - The location to check
   * @returns {boolean} - True if location is part of ship
   */
  hasLocation(location) {
    return this.locations.includes(location);
  }
}

/**
 * Manages the game board state and operations
 */
class Board {
  constructor(size = 10) {
    this.size = size;
    this.grid = this.createEmptyGrid();
    this.ships = [];
  }

  /**
   * Creates an empty grid filled with water
   * @returns {Array<Array<string>>} - Empty grid
   */
  createEmptyGrid() {
    return Array(this.size)
      .fill(null)
      .map(() => Array(this.size).fill("~"));
  }

  /**
   * Places ships randomly on the board
   * @param {number} numShips - Number of ships to place
   * @param {number} shipLength - Length of each ship
   */
  placeShipsRandomly(numShips, shipLength) {
    let placedShips = 0;

    while (placedShips < numShips) {
      const ship = this.generateRandomShip(shipLength);
      if (ship && this.canPlaceShip(ship.locations)) {
        this.ships.push(ship);
        this.markShipOnGrid(ship.locations);
        placedShips++;
      }
    }
  }

  /**
   * Generates a random ship with valid locations
   * @param {number} length - Length of the ship
   * @returns {Ship|null} - Generated ship or null if invalid
   */
  generateRandomShip(length) {
    const isHorizontal = Math.random() < 0.5;
    let startRow, startCol;

    if (isHorizontal) {
      startRow = Math.floor(Math.random() * this.size);
      startCol = Math.floor(Math.random() * (this.size - length + 1));
    } else {
      startRow = Math.floor(Math.random() * (this.size - length + 1));
      startCol = Math.floor(Math.random() * this.size);
    }

    const locations = [];
    for (let i = 0; i < length; i++) {
      const row = isHorizontal ? startRow : startRow + i;
      const col = isHorizontal ? startCol + i : startCol;
      locations.push(`${row}${col}`);
    }

    return new Ship(locations);
  }

  /**
   * Checks if a ship can be placed at given locations
   * @param {Array<string>} locations - Ship locations to check
   * @returns {boolean} - True if placement is valid
   */
  canPlaceShip(locations) {
    return locations.every((location) => {
      const [row, col] = this.parseLocation(location);
      return this.isValidCoordinate(row, col) && this.grid[row][col] === "~";
    });
  }

  /**
   * Marks ship locations on the grid
   * @param {Array<string>} locations - Ship locations to mark
   */
  markShipOnGrid(locations) {
    locations.forEach((location) => {
      const [row, col] = this.parseLocation(location);
      this.grid[row][col] = "S";
    });
  }

  /**
   * Processes a guess and returns the result
   * @param {string} location - The guessed location
   * @returns {Object} - Result object with hit, sunk, and alreadyGuessed properties
   */
  processGuess(location, guessedLocations) {
    if (guessedLocations.has(location)) {
      return { hit: false, sunk: false, alreadyGuessed: true };
    }

    guessedLocations.add(location);
    const [row, col] = this.parseLocation(location);

    for (const ship of this.ships) {
      if (ship.hit(location)) {
        this.grid[row][col] = "X";
        return {
          hit: true,
          sunk: ship.isSunk(),
          alreadyGuessed: false,
        };
      }
    }

    this.grid[row][col] = "O";
    return { hit: false, sunk: false, alreadyGuessed: false };
  }

  /**
   * Parses location string into row and column numbers
   * @param {string} location - Location string (e.g., "34")
   * @returns {Array<number>} - [row, col]
   */
  parseLocation(location) {
    return [parseInt(location[0]), parseInt(location[1])];
  }

  /**
   * Checks if coordinates are valid
   * @param {number} row - Row coordinate
   * @param {number} col - Column coordinate
   * @returns {boolean} - True if valid
   */
  isValidCoordinate(row, col) {
    return row >= 0 && row < this.size && col >= 0 && col < this.size;
  }

  /**
   * Gets the number of remaining ships
   * @returns {number} - Number of ships not sunk
   */
  getRemainingShipsCount() {
    return this.ships.filter((ship) => !ship.isSunk()).length;
  }
}

/**
 * Handles game display and user interface
 */
class GameDisplay {
  /**
   * Prints both boards side by side
   * @param {Board} opponentBoard - Opponent's board (hidden ships)
   * @param {Board} playerBoard - Player's board (visible ships)
   */
  static printBoards(opponentBoard, playerBoard) {
    console.log("\n   --- OPPONENT BOARD ---          --- YOUR BOARD ---");

    const header =
      "  " + Array.from({ length: opponentBoard.size }, (_, i) => i).join(" ");
    console.log(header + "     " + header);

    for (let i = 0; i < opponentBoard.size; i++) {
      let rowStr = `${i} `;

      // Opponent board (hide ships)
      for (let j = 0; j < opponentBoard.size; j++) {
        const cell = opponentBoard.grid[i][j];
        rowStr += (cell === "S" ? "~" : cell) + " ";
      }

      rowStr += `    ${i} `;

      // Player board (show ships)
      for (let j = 0; j < playerBoard.size; j++) {
        rowStr += playerBoard.grid[i][j] + " ";
      }

      console.log(rowStr);
    }
    console.log("\n");
  }

  /**
   * Displays game messages
   * @param {string} message - Message to display
   */
  static showMessage(message) {
    console.log(message);
  }

  /**
   * Displays game over message
   * @param {boolean} playerWon - True if player won
   */
  static showGameOver(playerWon) {
    if (playerWon) {
      console.log("\n*** CONGRATULATIONS! You sunk all enemy battleships! ***");
    } else {
      console.log("\n*** GAME OVER! The CPU sunk all your battleships! ***");
    }
  }
}

/**
 * Represents a CPU player with AI behavior
 */
class CPUPlayer {
  constructor(boardSize) {
    this.boardSize = boardSize;
    this.guessedLocations = new Set();
    this.mode = "hunt"; // 'hunt' or 'target'
    this.targetQueue = [];
  }

  /**
   * Makes a CPU guess using hunt and target strategy
   * @returns {string} - The guessed location
   */
  makeGuess() {
    let guess;

    if (this.mode === "target" && this.targetQueue.length > 0) {
      guess = this.targetQueue.shift();

      if (this.guessedLocations.has(guess)) {
        if (this.targetQueue.length === 0) {
          this.mode = "hunt";
        }
        return this.makeGuess(); // Recursive call for next guess
      }
    } else {
      this.mode = "hunt";
      guess = this.makeRandomGuess();
    }

    return guess;
  }

  /**
   * Processes the result of a guess and updates AI state
   * @param {string} location - The location that was guessed
   * @param {boolean} wasHit - Whether the guess was a hit
   * @param {boolean} wasSunk - Whether a ship was sunk
   */
  processGuessResult(location, wasHit, wasSunk) {
    if (wasHit) {
      if (wasSunk) {
        this.mode = "hunt";
        this.targetQueue = [];
      } else {
        this.mode = "target";
        this.addAdjacentTargets(location);
      }
    } else if (this.mode === "target" && this.targetQueue.length === 0) {
      this.mode = "hunt";
    }
  }

  /**
   * Makes a random guess
   * @returns {string} - Random location string
   */
  makeRandomGuess() {
    let row, col, guess;

    do {
      row = Math.floor(Math.random() * this.boardSize);
      col = Math.floor(Math.random() * this.boardSize);
      guess = `${row}${col}`;
    } while (this.guessedLocations.has(guess));

    return guess;
  }

  /**
   * Adds adjacent locations to target queue after a hit
   * @param {string} location - The hit location
   */
  addAdjacentTargets(location) {
    const [row, col] = [parseInt(location[0]), parseInt(location[1])];
    const adjacent = [
      { r: row - 1, c: col },
      { r: row + 1, c: col },
      { r: row, c: col - 1 },
      { r: row, c: col + 1 },
    ];

    adjacent.forEach(({ r, c }) => {
      if (this.isValidCoordinate(r, c)) {
        const adjLocation = `${r}${c}`;
        if (
          !this.guessedLocations.has(adjLocation) &&
          !this.targetQueue.includes(adjLocation)
        ) {
          this.targetQueue.push(adjLocation);
        }
      }
    });
  }

  /**
   * Checks if coordinates are valid
   * @param {number} row - Row coordinate
   * @param {number} col - Column coordinate
   * @returns {boolean} - True if valid
   */
  isValidCoordinate(row, col) {
    return row >= 0 && row < this.boardSize && col >= 0 && col < this.boardSize;
  }
}

/**
 * Main game controller class
 */
class SeaBattleGame {
  constructor(boardSize = 10, numShips = 3, shipLength = 3) {
    this.boardSize = boardSize;
    this.numShips = numShips;
    this.shipLength = shipLength;

    this.playerBoard = new Board(boardSize);
    this.cpuBoard = new Board(boardSize);
    this.cpu = new CPUPlayer(boardSize);

    this.playerGuesses = new Set();

    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  }

  /**
   * Initializes and starts the game
   */
  async startGame() {
    console.log("\n=== Sea Battle Game ===");
    console.log("Setting up the game...");

    this.setupGame();

    console.log("\nLet's play Sea Battle!");
    console.log(`Try to sink the ${this.numShips} enemy ships.`);

    await this.gameLoop();
  }

  /**
   * Sets up the game by placing ships on both boards
   */
  setupGame() {
    this.playerBoard.placeShipsRandomly(this.numShips, this.shipLength);
    this.cpuBoard.placeShipsRandomly(this.numShips, this.shipLength);

    console.log(`${this.numShips} ships placed for both Player and CPU.`);
  }

  /**
   * Main game loop
   */
  async gameLoop() {
    // Check win conditions
    if (this.cpuBoard.getRemainingShipsCount() === 0) {
      GameDisplay.showGameOver(true);
      GameDisplay.printBoards(this.cpuBoard, this.playerBoard);
      this.rl.close();
      return;
    }

    if (this.playerBoard.getRemainingShipsCount() === 0) {
      GameDisplay.showGameOver(false);
      GameDisplay.printBoards(this.cpuBoard, this.playerBoard);
      this.rl.close();
      return;
    }

    GameDisplay.printBoards(this.cpuBoard, this.playerBoard);

    try {
      const playerGuess = await this.getPlayerGuess();
      const playerGuessResult = await this.processPlayerTurn(playerGuess);

      if (playerGuessResult && this.cpuBoard.getRemainingShipsCount() > 0) {
        await this.processCPUTurn();
      }

      // Continue game loop
      setImmediate(() => this.gameLoop());
    } catch (error) {
      console.error("Error in game loop:", error);
      this.rl.close();
    }
  }

  /**
   * Gets player's guess input
   * @returns {Promise<string>} - Player's guess
   */
  getPlayerGuess() {
    return new Promise((resolve) => {
      this.rl.question("Enter your guess (e.g., 00): ", (answer) => {
        resolve(answer);
      });
    });
  }

  /**
   * Processes player's turn
   * @param {string} guess - Player's guess
   * @returns {Promise<boolean>} - True if valid guess was made
   */
  async processPlayerTurn(guess) {
    if (!this.isValidGuessFormat(guess)) {
      GameDisplay.showMessage(
        "Oops, input must be exactly two digits (e.g., 00, 34, 98)."
      );
      return false;
    }

    const [row, col] = [parseInt(guess[0]), parseInt(guess[1])];

    if (!this.cpuBoard.isValidCoordinate(row, col)) {
      GameDisplay.showMessage(
        `Oops, please enter valid row and column numbers between 0 and ${
          this.boardSize - 1
        }.`
      );
      return false;
    }

    if (this.playerGuesses.has(guess)) {
      GameDisplay.showMessage("You already guessed that location!");
      return false;
    }

    const result = this.cpuBoard.processGuess(guess, this.playerGuesses);

    if (result.hit) {
      GameDisplay.showMessage("PLAYER HIT!");
      if (result.sunk) {
        GameDisplay.showMessage("You sunk an enemy battleship!");
      }
    } else {
      GameDisplay.showMessage("PLAYER MISS.");
    }

    return true;
  }

  /**
   * Processes CPU's turn
   */
  async processCPUTurn() {
    console.log("\n--- CPU's Turn ---");

    const cpuGuess = this.cpu.makeGuess();
    console.log(`CPU targets: ${cpuGuess}`);

    const result = this.playerBoard.processGuess(
      cpuGuess,
      this.cpu.guessedLocations
    );

    if (result.hit) {
      GameDisplay.showMessage(`CPU HIT at ${cpuGuess}!`);
      if (result.sunk) {
        GameDisplay.showMessage("CPU sunk your battleship!");
      }
    } else {
      GameDisplay.showMessage(`CPU MISS at ${cpuGuess}.`);
    }

    this.cpu.processGuessResult(cpuGuess, result.hit, result.sunk);
  }

  /**
   * Validates guess format
   * @param {string} guess - The guess to validate
   * @returns {boolean} - True if valid format
   */
  isValidGuessFormat(guess) {
    return guess && guess.length === 2 && /^\d{2}$/.test(guess);
  }
}

// Export classes for testing
export { Ship, Board, CPUPlayer, GameDisplay, SeaBattleGame };

// Start the game only when run directly (not when imported for testing)
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const game = new SeaBattleGame();
  game.startGame().catch(console.error);
}
