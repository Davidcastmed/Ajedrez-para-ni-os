
import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChessService } from '../../services/chess.service';
import { Position } from '../../models/chess.model';

@Component({
  selector: 'app-board',
  imports: [CommonModule],
  templateUrl: './board.component.html',
  styleUrl: './board.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoardComponent {
  chessService = inject(ChessService);

  board = this.chessService.boardState;
  possibleMoves = this.chessService.possibleMoves;
  
  ranks = ['6', '5', '4', '3', '2', '1'];
  files = ['a', 'b', 'c', 'd', 'e', 'f'];

  handleDragStart(event: DragEvent, row: number, col: number): void {
    const square = this.board()[row][col];
    if (square.piece && square.piece.color === 'white') {
      if (event.dataTransfer) {
        event.dataTransfer.setData('text/plain', JSON.stringify({ row, col }));
        event.dataTransfer.effectAllowed = 'move';
      }
      this.chessService.selectPieceAt({ row, col });
      (event.target as HTMLElement).classList.add('dragging');
    } else {
      event.preventDefault(); // Prevent dragging black pieces
    }
  }

  handleDragOver(event: DragEvent): void {
    event.preventDefault(); // This is necessary to allow a drop
  }
  
  handleDrop(event: DragEvent, toRow: number, toCol: number): void {
    event.preventDefault();
    if(event.dataTransfer) {
      const fromPos: Position = JSON.parse(event.dataTransfer.getData('text/plain'));
      this.chessService.handleMove(fromPos, { row: toRow, col: toCol });
    }
    this.clearDragStyles();
  }
  
  handleDragEnd(event: DragEvent): void {
    this.chessService.deselectPiece();
    (event.target as HTMLElement).classList.remove('dragging');
    this.clearDragStyles();
  }

  // FIX: Corrected the type of the 'col' parameter from the string literal 'number' to the type number.
  isPossibleMove(row: number, col: number): boolean {
    return this.possibleMoves().some(move => move.row === row && move.col === col);
  }

  isSelected(row: number, col: number): boolean {
    const selection = this.chessService.selectedPiece();
    return !!selection && selection.position.row === row && selection.position.col === col;
  }
  
  // --- Drag Styling ---
  handleDragEnter(event: DragEvent): void {
    (event.currentTarget as HTMLElement).classList.add('drag-over');
  }

  handleDragLeave(event: DragEvent): void {
     (event.currentTarget as HTMLElement).classList.remove('drag-over');
  }

  private clearDragStyles(): void {
    document.querySelectorAll('.drag-over').forEach(el => {
      el.classList.remove('drag-over');
    });
  }
}
