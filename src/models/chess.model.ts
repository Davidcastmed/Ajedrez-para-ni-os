
export type PieceType = 'knight' | 'star' | 'rook' | 'castle' | 'pawn' | 'crown' | 'bishop' | 'queen' | 'king' | 'diamond' | 'shield' | 'home';
export type PieceColor = 'white' | 'black';

export interface Piece {
  type: PieceType;
  color: PieceColor;
}

export interface Position {
  row: number;
  col: number;
}

export interface Square {
  piece: Piece | null;
  position: Position;
}

export interface Level {
  piece: 'knight' | 'rook' | 'pawn' | 'bishop' | 'queen' | 'king';
  target: 'star' | 'castle' | 'crown' | 'diamond' | 'shield' | 'home';
  name: string;
  description: string;
  setups?: { position: Position, piece: Piece }[][];
}