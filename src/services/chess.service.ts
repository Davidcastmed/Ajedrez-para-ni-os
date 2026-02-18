
import { Injectable, signal, computed } from '@angular/core';
import { Square, Piece, Position, PieceType, Level } from '../models/chess.model';

const BOARD_SIZE = 6;
export const WINS_TO_UNLOCK = 3;

export const LEVELS: Level[] = [
  { piece: 'knight', target: 'star', name: 'Caballo Saltador', description: '¡Lleva el caballo a la estrella!' },
  { piece: 'rook', target: 'castle', name: 'Torre Recta', description: '¡Ayuda a la torre a llegar a su castillo!' },
  { piece: 'pawn', target: 'crown', name: 'Peón Valiente', description: '¡Lleva al peón al otro lado para coronarlo!'},
  { piece: 'bishop', target: 'diamond', name: 'Alfil Diagonal', description: '¡Mueve el alfil en diagonal a la gema!'},
  { piece: 'queen', target: 'shield', name: 'Reina Poderosa', description: '¡La reina va donde quiere! Llévala al escudo.'},
  { piece: 'king', target: 'home', name: 'Rey Cauteloso', description: '¡El rey da un pasito a la vez a su hogar!'},
  { 
    piece: 'rook',
    target: 'star', 
    name: 'Puzzle: Torre y Peón', 
    description: '¡Usa la torre para capturar la estrella! El peón negro bloquea el camino.',
    setups: [
      // Setup 1
      [
        { position: { row: 5, col: 0 }, piece: { type: 'rook', color: 'white' } },
        { position: { row: 2, col: 0 }, piece: { type: 'pawn', color: 'black' } },
        { position: { row: 2, col: 3 }, piece: { type: 'star', color: 'black' } }
      ],
      // Setup 2
      [
        { position: { row: 5, col: 5 }, piece: { type: 'rook', color: 'white' } },
        { position: { row: 1, col: 5 }, piece: { type: 'pawn', color: 'black' } },
        { position: { row: 1, col: 1 }, piece: { type: 'star', color: 'black' } }
      ]
    ]
  },
  { 
    piece: 'knight',
    target: 'diamond', 
    name: 'Puzzle: Elige la Pieza', 
    description: 'Usa el caballo o la torre para capturar la gema. ¿Cuál es mejor?',
    setups: [
      // Setup 1
      [
        { position: { row: 5, col: 1 }, piece: { type: 'knight', color: 'white' } },
        { position: { row: 5, col: 5 }, piece: { type: 'rook', color: 'white' } },
        { position: { row: 0, col: 2 }, piece: { type: 'diamond', color: 'black' } },
        { position: { row: 1, col: 2 }, piece: { type: 'pawn', color: 'black' } },
      ],
      // Setup 2
      [
        { position: { row: 4, col: 0 }, piece: { type: 'knight', color: 'white' } },
        { position: { row: 5, col: 4 }, piece: { type: 'rook', color: 'white' } },
        { position: { row: 0, col: 3 }, piece: { type: 'diamond', color: 'black' } },
        { position: { row: 0, col: 2 }, piece: { type: 'pawn', color: 'black' } },
      ]
    ]
  },
];

@Injectable({
  providedIn: 'root',
})
export class ChessService {
  boardState = signal<Square[][]>([]);
  selectedPiece = signal<{ piece: Piece; position: Position } | null>(null);
  currentLevelIndex = signal(0);
  currentLevel = computed(() => LEVELS[this.currentLevelIndex()]);
  winsByLevel = signal<{ [levelIndex: number]: number }>({});
  unlockedLevels = signal<boolean[]>(new Array(LEVELS.length).fill(false));
  
  possibleMoves = computed<Position[]>(() => {
    const selection = this.selectedPiece();
    if (!selection) return [];
    
    switch (selection.piece.type) {
        case 'knight':
            return this.calculateKnightMoves(selection.position);
        case 'rook':
            return this.calculateRookMoves(selection.position);
        case 'pawn':
            return this.calculatePawnMoves(selection.position);
        case 'bishop':
            return this.calculateBishopMoves(selection.position);
        case 'queen':
            return this.calculateQueenMoves(selection.position);
        case 'king':
            return this.calculateKingMoves(selection.position);
        default:
            return [];
    }
  });
  targetPosition = signal<Position | null>(null);
  gameWon = signal(false);

  constructor() {
    this.unlockedLevels.update(levels => {
      levels[0] = true;
      return levels;
    });
    this.resetLevel();
  }

  setLevel(levelIndex: number): void {
    this.currentLevelIndex.set(levelIndex);
    this.resetLevel();
  }

  resetLevel(): void {
    this.gameWon.set(false);
    this.selectedPiece.set(null);
    const newBoard = this.createEmptyBoard();
    const level = this.currentLevel();
    
    if (level.setups && level.setups.length > 0) {
      const randomSetup = level.setups[Math.floor(Math.random() * level.setups.length)];
      let targetPos: Position | null = null;
      for (const item of randomSetup) {
        newBoard[item.position.row][item.position.col].piece = item.piece;
        if (item.piece.type === level.target) {
          targetPos = item.position;
        }
      }
      this.targetPosition.set(targetPos);
    } else {
      // Standard level setup
      let piecePos: Position;
      let targetPos: Position;

      if (level.piece === 'pawn') {
          piecePos = { row: BOARD_SIZE - 2, col: Math.floor(Math.random() * BOARD_SIZE) };
          targetPos = { row: 0, col: piecePos.col };
      } else {
          do {
            piecePos = this.getRandomPosition();
            targetPos = this.getRandomPosition();
          } while (piecePos.row === targetPos.row && piecePos.col === targetPos.col);
      }
      newBoard[piecePos.row][piecePos.col].piece = { type: level.piece, color: 'white' };
      newBoard[targetPos.row][targetPos.col].piece = { type: level.target, color: 'white' };
      this.targetPosition.set(targetPos);
    }

    this.boardState.set(newBoard);
  }

  selectPieceAt(pos: Position): void {
    const square = this.boardState()[pos.row][pos.col];
    if (square.piece && square.piece.color === 'white') {
      this.selectedPiece.set({ piece: square.piece, position: square.position });
    }
  }

  deselectPiece(): void {
    this.selectedPiece.set(null);
  }

  handleMove(from: Position, to: Position): void {
    const isValidMove = this.possibleMoves().some(
      (move) => move.row === to.row && move.col === to.col
    );
    if (isValidMove) {
      this.movePiece(from, to);
    }
  }
  
  forceUnlockNextLevel(): void {
    const levelIndex = this.currentLevelIndex();
    // Mark current level as won
    this.winsByLevel.update(wins => {
        wins[levelIndex] = WINS_TO_UNLOCK;
        return wins;
    });
    // Unlock next level
    if (levelIndex + 1 < LEVELS.length) {
        this.unlockedLevels.update(levels => {
            levels[levelIndex + 1] = true;
            return levels;
        });
    }
  }

  resetWinsForLevel(levelIndex: number): void {
    this.winsByLevel.update(wins => {
      wins[levelIndex] = 0;
      return wins;
    });
  }

  private movePiece(from: Position, to: Position): void {
    const newBoard = this.boardState().map(r => r.map(s => ({...s})));
    const pieceToMove = newBoard[from.row][from.col].piece;
    const targetPiece = newBoard[to.row][to.col].piece;
    
    newBoard[from.row][from.col].piece = null;
    newBoard[to.row][to.col].piece = pieceToMove;

    this.boardState.set(newBoard);
    this.selectedPiece.set(null);

    const targetPos = this.targetPosition();
    const level = this.currentLevel();

    let won = false;
    if (targetPos && to.row === targetPos.row && to.col === targetPos.col) {
      if (level.setups) { // Puzzle mode: capture
        if (targetPiece?.type === level.target) {
          won = true;
        }
      } else { // Learning mode: reach
        won = true;
        if (level.piece === 'pawn') {
          newBoard[to.row][to.col].piece = { type: 'crown', color: 'white' };
        } else {
          newBoard[to.row][to.col].piece = { type: level.target, color: 'white' };
        }
      }
    }

    if (won) {
      this.gameWon.set(true);
      const levelIndex = this.currentLevelIndex();
      
      const currentWins = (this.winsByLevel()[levelIndex] || 0) + 1;
      this.winsByLevel.update(wins => {
          wins[levelIndex] = currentWins;
          return wins;
      });

      if (currentWins >= WINS_TO_UNLOCK && levelIndex + 1 < LEVELS.length) {
        this.unlockedLevels.update(levels => {
          levels[levelIndex + 1] = true;
          return levels;
        });
      }
    }
  }
  
  private calculateKnightMoves(from: Position): Position[] {
    const moves: Position[] = [];
    const deltas = [
      { row: 1, col: 2 }, { row: 1, col: -2 },
      { row: -1, col: 2 }, { row: -1, col: -2 },
      { row: 2, col: 1 }, { row: 2, col: -1 },
      { row: -2, col: 1 }, { row: -2, col: -1 },
    ];
    const board = this.boardState();
    for (const delta of deltas) {
      const newRow = from.row + delta.row;
      const newCol = from.col + delta.col;
      if (this.isWithinBounds(newRow, newCol)) {
        const destinationSquare = board[newRow][newCol];
        if (!destinationSquare.piece || destinationSquare.piece.color === 'black') {
          moves.push({ row: newRow, col: newCol });
        }
      }
    }
    return moves;
  }

  private calculateRookMoves(from: Position): Position[] {
    const moves: Position[] = [];
    const board = this.boardState();
    const directions = [{r:0, c:1}, {r:0, c:-1}, {r:1, c:0}, {r:-1, c:0}];
    for(const dir of directions) {
      let r = from.row + dir.r;
      let c = from.col + dir.c;
      while(this.isWithinBounds(r, c)) {
        const square = board[r][c];
        if (square.piece) {
          if (square.piece.color === 'black') {
            moves.push({row: r, col: c}); // Can capture
          }
          break; // Blocked by a piece
        }
        moves.push({row: r, col: c});
        r += dir.r;
        c += dir.c;
      }
    }
    return moves;
  }
  
  private calculatePawnMoves(from: Position): Position[] {
    const moves: Position[] = [];
    // Move one step forward
    const newRow = from.row - 1;
    if (this.isWithinBounds(newRow, from.col) && !this.boardState()[newRow][from.col].piece) {
        moves.push({ row: newRow, col: from.col });
    }
    return moves;
  }

  private calculateBishopMoves(from: Position): Position[] {
    const moves: Position[] = [];
    const board = this.boardState();
    const directions = [{r: 1, c: 1}, {r: 1, c: -1}, {r: -1, c: 1}, {r: -1, c: -1}];
    for (const dir of directions) {
        let r = from.row + dir.r;
        let c = from.col + dir.c;
        while (this.isWithinBounds(r, c)) {
            const square = board[r][c];
            if (square.piece) {
              if (square.piece.color === 'black') {
                moves.push({ row: r, col: c }); // Can capture
              }
              break; // Blocked
            }
            moves.push({ row: r, col: c });
            r += dir.r;
            c += dir.c;
        }
    }
    return moves;
  }

  private calculateQueenMoves(from: Position): Position[] {
    return [
        ...this.calculateRookMoves(from),
        ...this.calculateBishopMoves(from),
    ];
  }

  private calculateKingMoves(from: Position): Position[] {
      const moves: Position[] = [];
      const board = this.boardState();
      const deltas = [
          { row: 1, col: 0 }, { row: -1, col: 0 },
          { row: 0, col: 1 }, { row: 0, col: -1 },
          { row: 1, col: 1 }, { row: 1, col: -1 },
          { row: -1, col: 1 }, { row: -1, col: -1 },
      ];
      for (const delta of deltas) {
          const newRow = from.row + delta.row;
          const newCol = from.col + delta.col;
          if (this.isWithinBounds(newRow, newCol)) {
              const destinationSquare = board[newRow][newCol];
              if (!destinationSquare.piece || destinationSquare.piece.color === 'black') {
                moves.push({ row: newRow, col: newCol });
              }
          }
      }
      return moves;
  }

  private isWithinBounds(row: number, col: number): boolean {
    return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
  }
  
  private createEmptyBoard(): Square[][] {
    return Array.from({ length: BOARD_SIZE }, (_, row) =>
      Array.from({ length: BOARD_SIZE }, (_, col) => ({
        piece: null,
        position: { row, col },
      }))
    );
  }

  private getRandomPosition(): Position {
    return {
      row: Math.floor(Math.random() * BOARD_SIZE),
      col: Math.floor(Math.random() * BOARD_SIZE),
    };
  }
}