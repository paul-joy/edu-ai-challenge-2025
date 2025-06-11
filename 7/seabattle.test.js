import {
  describe,
  test,
  expect,
  beforeEach,
  afterEach,
  afterAll,
  vi,
} from "vitest";
import {
  Ship,
  Board,
  CPUPlayer,
  GameDisplay,
  SeaBattleGame,
} from "./seabattle.js";

// Mock console methods to prevent output during tests
const mockConsoleLog = vi.spyOn(console, "log").mockImplementation(() => {});
const mockConsoleError = vi
  .spyOn(console, "error")
  .mockImplementation(() => {});

describe("Ship", () => {
  let ship;

  beforeEach(() => {
    ship = new Ship(["12", "22", "32"]);
  });

  describe("constructor", () => {
    test("should initialize ship with correct locations", () => {
      expect(ship.locations).toEqual(["12", "22", "32"]);
      expect(ship.hits).toEqual([false, false, false]);
    });

    test("should create empty ship with no locations", () => {
      const emptyShip = new Ship([]);
      expect(emptyShip.locations).toEqual([]);
      expect(emptyShip.hits).toEqual([]);
    });
  });

  describe("hit", () => {
    test("should return true and mark hit for valid location", () => {
      const result = ship.hit("22");
      expect(result).toBe(true);
      expect(ship.hits[1]).toBe(true);
    });

    test("should return false for invalid location", () => {
      const result = ship.hit("99");
      expect(result).toBe(false);
      expect(ship.hits).toEqual([false, false, false]);
    });

    test("should return false for already hit location", () => {
      ship.hit("22");
      const result = ship.hit("22");
      expect(result).toBe(false);
      expect(ship.hits[1]).toBe(true);
    });

    test("should handle multiple hits correctly", () => {
      expect(ship.hit("12")).toBe(true);
      expect(ship.hit("32")).toBe(true);
      expect(ship.hits).toEqual([true, false, true]);
    });
  });

  describe("isSunk", () => {
    test("should return false when ship is not sunk", () => {
      ship.hit("12");
      expect(ship.isSunk()).toBe(false);
    });

    test("should return true when all locations are hit", () => {
      ship.hit("12");
      ship.hit("22");
      ship.hit("32");
      expect(ship.isSunk()).toBe(true);
    });

    test("should return true for empty ship", () => {
      const emptyShip = new Ship([]);
      expect(emptyShip.isSunk()).toBe(true);
    });
  });

  describe("hasLocation", () => {
    test("should return true for valid location", () => {
      expect(ship.hasLocation("22")).toBe(true);
    });

    test("should return false for invalid location", () => {
      expect(ship.hasLocation("99")).toBe(false);
    });
  });
});

describe("Board", () => {
  let board;

  beforeEach(() => {
    board = new Board(5); // Use smaller board for testing
  });

  describe("constructor", () => {
    test("should create board with correct size", () => {
      expect(board.size).toBe(5);
      expect(board.grid).toHaveLength(5);
      expect(board.grid[0]).toHaveLength(5);
      expect(board.ships).toEqual([]);
    });

    test("should initialize grid with water tiles", () => {
      board.grid.forEach((row) => {
        row.forEach((cell) => {
          expect(cell).toBe("~");
        });
      });
    });

    test("should use default size of 10", () => {
      const defaultBoard = new Board();
      expect(defaultBoard.size).toBe(10);
    });
  });

  describe("parseLocation", () => {
    test("should parse location string correctly", () => {
      expect(board.parseLocation("23")).toEqual([2, 3]);
      expect(board.parseLocation("00")).toEqual([0, 0]);
      expect(board.parseLocation("44")).toEqual([4, 4]);
    });
  });

  describe("isValidCoordinate", () => {
    test("should return true for valid coordinates", () => {
      expect(board.isValidCoordinate(0, 0)).toBe(true);
      expect(board.isValidCoordinate(4, 4)).toBe(true);
      expect(board.isValidCoordinate(2, 3)).toBe(true);
    });

    test("should return false for invalid coordinates", () => {
      expect(board.isValidCoordinate(-1, 0)).toBe(false);
      expect(board.isValidCoordinate(0, -1)).toBe(false);
      expect(board.isValidCoordinate(5, 0)).toBe(false);
      expect(board.isValidCoordinate(0, 5)).toBe(false);
    });
  });

  describe("canPlaceShip", () => {
    test("should return true for valid placement", () => {
      const locations = ["12", "22", "32"];
      expect(board.canPlaceShip(locations)).toBe(true);
    });

    test("should return false for out of bounds placement", () => {
      const locations = ["45", "46", "47"];
      expect(board.canPlaceShip(locations)).toBe(false);
    });

    test("should return false for overlapping ship placement", () => {
      board.markShipOnGrid(["12", "22", "32"]);
      const overlappingLocations = ["22", "23", "24"];
      expect(board.canPlaceShip(overlappingLocations)).toBe(false);
    });
  });

  describe("markShipOnGrid", () => {
    test("should mark ship locations on grid", () => {
      const locations = ["12", "22", "32"];
      board.markShipOnGrid(locations);

      expect(board.grid[1][2]).toBe("S");
      expect(board.grid[2][2]).toBe("S");
      expect(board.grid[3][2]).toBe("S");
    });
  });

  describe("processGuess", () => {
    let guessedLocations;

    beforeEach(() => {
      guessedLocations = new Set();
      const ship = new Ship(["12", "22", "32"]);
      board.ships.push(ship);
      board.markShipOnGrid(ship.locations);
    });

    test("should return already guessed for repeated guess", () => {
      guessedLocations.add("12");
      const result = board.processGuess("12", guessedLocations);

      expect(result).toEqual({
        hit: false,
        sunk: false,
        alreadyGuessed: true,
      });
    });

    test("should return hit for successful guess", () => {
      const result = board.processGuess("12", guessedLocations);

      expect(result.hit).toBe(true);
      expect(result.sunk).toBe(false);
      expect(result.alreadyGuessed).toBe(false);
      expect(board.grid[1][2]).toBe("X");
    });

    test("should return miss for unsuccessful guess", () => {
      const result = board.processGuess("44", guessedLocations);

      expect(result.hit).toBe(false);
      expect(result.sunk).toBe(false);
      expect(result.alreadyGuessed).toBe(false);
      expect(board.grid[4][4]).toBe("O");
    });

    test("should return sunk when ship is completely hit", () => {
      board.processGuess("12", guessedLocations);
      board.processGuess("22", guessedLocations);
      const result = board.processGuess("32", guessedLocations);

      expect(result.hit).toBe(true);
      expect(result.sunk).toBe(true);
      expect(result.alreadyGuessed).toBe(false);
    });
  });

  describe("generateRandomShip", () => {
    test("should generate ship with correct length", () => {
      const ship = board.generateRandomShip(3);
      expect(ship).toBeInstanceOf(Ship);
      expect(ship.locations).toHaveLength(3);
    });

    test("should generate valid ship locations", () => {
      const ship = board.generateRandomShip(2);
      ship.locations.forEach((location) => {
        const [row, col] = board.parseLocation(location);
        expect(board.isValidCoordinate(row, col)).toBe(true);
      });
    });
  });

  describe("getRemainingShipsCount", () => {
    test("should return correct count of unsunk ships", () => {
      const ship1 = new Ship(["12", "22"]);
      const ship2 = new Ship(["34", "44"]);
      board.ships = [ship1, ship2];

      expect(board.getRemainingShipsCount()).toBe(2);

      ship1.hit("12");
      ship1.hit("22");
      expect(board.getRemainingShipsCount()).toBe(1);
    });
  });
});

describe("CPUPlayer", () => {
  let cpu;

  beforeEach(() => {
    cpu = new CPUPlayer(5);
  });

  describe("constructor", () => {
    test("should initialize CPU player correctly", () => {
      expect(cpu.boardSize).toBe(5);
      expect(cpu.guessedLocations).toBeInstanceOf(Set);
      expect(cpu.mode).toBe("hunt");
      expect(cpu.targetQueue).toEqual([]);
    });
  });

  describe("isValidCoordinate", () => {
    test("should validate coordinates correctly", () => {
      expect(cpu.isValidCoordinate(0, 0)).toBe(true);
      expect(cpu.isValidCoordinate(4, 4)).toBe(true);
      expect(cpu.isValidCoordinate(5, 0)).toBe(false);
      expect(cpu.isValidCoordinate(-1, 0)).toBe(false);
    });
  });

  describe("makeRandomGuess", () => {
    test("should return valid guess format", () => {
      const guess = cpu.makeRandomGuess();
      expect(guess).toMatch(/^\d{2}$/);
    });

    test("should not repeat already guessed locations", () => {
      // Fill most of the board
      for (let i = 0; i < 24; i++) {
        const row = Math.floor(i / 5);
        const col = i % 5;
        cpu.guessedLocations.add(`${row}${col}`);
      }

      const guess = cpu.makeRandomGuess();
      expect(cpu.guessedLocations.has(guess)).toBe(false);
    });
  });

  describe("addAdjacentTargets", () => {
    test("should add valid adjacent targets", () => {
      cpu.addAdjacentTargets("22");

      expect(cpu.targetQueue).toContain("12");
      expect(cpu.targetQueue).toContain("32");
      expect(cpu.targetQueue).toContain("21");
      expect(cpu.targetQueue).toContain("23");
    });

    test("should not add out of bounds targets", () => {
      cpu.addAdjacentTargets("00");

      // For position "00", adjacent positions would be:
      // Row -1, Col 0: "-10" - out of bounds (invalid)
      // Row 1, Col 0: "10" - valid
      // Row 0, Col -1: "0-1" - out of bounds (invalid)
      // Row 0, Col 1: "01" - valid

      // Only valid adjacent positions should be added
      expect(cpu.targetQueue).toContain("10");
      expect(cpu.targetQueue).toContain("01");
      expect(cpu.targetQueue).toHaveLength(2); // Only 2 valid adjacent positions
    });

    test("should not add already guessed targets", () => {
      cpu.guessedLocations.add("12");
      cpu.addAdjacentTargets("22");

      expect(cpu.targetQueue).not.toContain("12");
    });
  });

  describe("processGuessResult", () => {
    test("should enter target mode on hit", () => {
      cpu.processGuessResult("22", true, false);

      expect(cpu.mode).toBe("target");
      expect(cpu.targetQueue.length).toBeGreaterThan(0);
    });

    test("should return to hunt mode on sunk", () => {
      cpu.mode = "target";
      cpu.targetQueue = ["12", "32"];
      cpu.processGuessResult("22", true, true);

      expect(cpu.mode).toBe("hunt");
      expect(cpu.targetQueue).toEqual([]);
    });

    test("should stay in hunt mode on miss", () => {
      cpu.processGuessResult("22", false, false);

      expect(cpu.mode).toBe("hunt");
      expect(cpu.targetQueue).toEqual([]);
    });
  });

  describe("makeGuess", () => {
    test("should use target queue when in target mode", () => {
      cpu.mode = "target";
      cpu.targetQueue = ["12", "32"];

      const guess = cpu.makeGuess();
      expect(["12", "32"]).toContain(guess);
    });

    test("should make random guess in hunt mode", () => {
      cpu.mode = "hunt";
      const guess = cpu.makeGuess();

      expect(guess).toMatch(/^\d{2}$/);
    });
  });
});

describe("GameDisplay", () => {
  beforeEach(() => {
    mockConsoleLog.mockClear();
  });

  describe("showMessage", () => {
    test("should display message via console.log", () => {
      GameDisplay.showMessage("Test message");
      expect(mockConsoleLog).toHaveBeenCalledWith("Test message");
    });
  });

  describe("showGameOver", () => {
    test("should show victory message for player win", () => {
      GameDisplay.showGameOver(true);
      expect(mockConsoleLog).toHaveBeenCalledWith(
        "\n*** CONGRATULATIONS! You sunk all enemy battleships! ***"
      );
    });

    test("should show defeat message for player loss", () => {
      GameDisplay.showGameOver(false);
      expect(mockConsoleLog).toHaveBeenCalledWith(
        "\n*** GAME OVER! The CPU sunk all your battleships! ***"
      );
    });
  });

  describe("printBoards", () => {
    test("should print both boards", () => {
      const board1 = new Board(3);
      const board2 = new Board(3);

      GameDisplay.printBoards(board1, board2);

      expect(mockConsoleLog).toHaveBeenCalled();
      expect(
        mockConsoleLog.mock.calls.some((call) =>
          call[0].includes("OPPONENT BOARD")
        )
      ).toBe(true);
    });
  });
});

describe("SeaBattleGame", () => {
  let game;

  beforeEach(() => {
    game = new SeaBattleGame(5, 2, 2); // Smaller game for testing
  });

  afterEach(() => {
    if (game.rl) {
      game.rl.close();
    }
  });

  describe("constructor", () => {
    test("should initialize game with correct parameters", () => {
      expect(game.boardSize).toBe(5);
      expect(game.numShips).toBe(2);
      expect(game.shipLength).toBe(2);
      expect(game.playerBoard).toBeInstanceOf(Board);
      expect(game.cpuBoard).toBeInstanceOf(Board);
      expect(game.cpu).toBeInstanceOf(CPUPlayer);
      expect(game.playerGuesses).toBeInstanceOf(Set);
    });

    test("should use default parameters", () => {
      const defaultGame = new SeaBattleGame();
      expect(defaultGame.boardSize).toBe(10);
      expect(defaultGame.numShips).toBe(3);
      expect(defaultGame.shipLength).toBe(3);
      defaultGame.rl.close();
    });
  });

  describe("setupGame", () => {
    test("should place ships on both boards", () => {
      game.setupGame();

      expect(game.playerBoard.ships).toHaveLength(2);
      expect(game.cpuBoard.ships).toHaveLength(2);
    });
  });

  describe("isValidGuessFormat", () => {
    test("should accept valid guess formats", () => {
      expect(game.isValidGuessFormat("00")).toBe(true);
      expect(game.isValidGuessFormat("99")).toBe(true);
      expect(game.isValidGuessFormat("45")).toBe(true);
    });

    test("should reject invalid guess formats", () => {
      expect(game.isValidGuessFormat("0")).toBe(false);
      expect(game.isValidGuessFormat("123")).toBe(false);
      expect(game.isValidGuessFormat("ab")).toBe(false);
      expect(game.isValidGuessFormat("")).toBeFalsy(); // Empty string is falsy
      expect(game.isValidGuessFormat(null)).toBeFalsy(); // null is falsy
    });
  });

  describe("processPlayerTurn", () => {
    beforeEach(() => {
      game.setupGame();
    });

    test("should reject invalid format", async () => {
      const result = await game.processPlayerTurn("abc");
      expect(result).toBe(false);
    });

    test("should reject out of bounds coordinates", async () => {
      const result = await game.processPlayerTurn("99"); // Out of bounds for 5x5
      expect(result).toBe(false);
    });

    test("should reject already guessed location", async () => {
      game.playerGuesses.add("22");
      const result = await game.processPlayerTurn("22");
      expect(result).toBe(false);
    });

    test("should process valid guess", async () => {
      const result = await game.processPlayerTurn("22");
      expect(result).toBe(true);
      expect(game.playerGuesses.has("22")).toBe(true);
    });
  });
});

describe("Integration Tests", () => {
  test("should complete a full ship sinking sequence", () => {
    const board = new Board(5);
    const ship = new Ship(["22", "23", "24"]);
    board.ships.push(ship);
    board.markShipOnGrid(ship.locations);

    const guessedLocations = new Set();

    // Hit all ship locations
    const result1 = board.processGuess("22", guessedLocations);
    expect(result1.hit).toBe(true);
    expect(result1.sunk).toBe(false);

    const result2 = board.processGuess("23", guessedLocations);
    expect(result2.hit).toBe(true);
    expect(result2.sunk).toBe(false);

    const result3 = board.processGuess("24", guessedLocations);
    expect(result3.hit).toBe(true);
    expect(result3.sunk).toBe(true);

    expect(board.getRemainingShipsCount()).toBe(0);
  });

  test("should handle CPU AI state transitions correctly", () => {
    const cpu = new CPUPlayer(5);

    // Start in hunt mode
    expect(cpu.mode).toBe("hunt");

    // Hit should switch to target mode
    cpu.processGuessResult("22", true, false);
    expect(cpu.mode).toBe("target");
    expect(cpu.targetQueue.length).toBeGreaterThan(0);

    // Sunk should return to hunt mode
    cpu.processGuessResult("23", true, true);
    expect(cpu.mode).toBe("hunt");
    expect(cpu.targetQueue).toEqual([]);
  });
});

// Clean up mocks after all tests
afterAll(() => {
  mockConsoleLog.mockRestore();
  mockConsoleError.mockRestore();
});
