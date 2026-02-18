import { Component, ChangeDetectionStrategy, inject, signal, computed, effect } from '@angular/core';
import { BoardComponent } from './components/board/board.component';
import { ChessService, LEVELS, WINS_TO_UNLOCK } from './services/chess.service';
import { CommonModule } from '@angular/common';
import { GeminiService } from './services/gemini.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  imports: [CommonModule, BoardComponent],
  // FIX: Corrected typo 'ChangeDirectionStrategy' to 'ChangeDetectionStrategy'.
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  chessService = inject(ChessService);
  geminiService = inject(GeminiService);

  rewards = ['ruby', 'emerald', 'sapphire', 'amethyst', 'diamond'];
  
  showWinModal = this.chessService.gameWon;
  currentReward = signal<string | null>(null);
  collectedGems = signal<string[]>([]);
  private hasGrantedRewardForWin = signal(false);

  pieceStory = this.geminiService.pieceStory;
  isLoading = this.geminiService.isLoading;
  
  levels = LEVELS;
  currentLevel = this.chessService.currentLevel;
  WINS_TO_UNLOCK = WINS_TO_UNLOCK;

  pieceNames: { [key: string]: string } = {
    'knight': 'el Caballo',
    'rook': 'la Torre',
    'pawn': 'el Peón',
    'bishop': 'el Alfil',
    'queen': 'la Reina',
    'king': 'el Rey'
  };

  constructor() {
    effect(() => {
      if (this.showWinModal() && !this.hasGrantedRewardForWin()) {
        const randomReward = this.rewards[Math.floor(Math.random() * this.rewards.length)];
        this.currentReward.set(randomReward);
        this.collectedGems.update(gems => [...gems, randomReward]);
        this.hasGrantedRewardForWin.set(true);
      }
    });
  }

  resetGame() {
    this.chessService.resetLevel();
    this.currentReward.set(null);
    this.geminiService.clearStory();
    this.hasGrantedRewardForWin.set(false);
  }

  selectLevel(index: number) {
    if (!this.isLevelUnlocked(index)) return;
    
    // Reset win count for mastered levels to allow replaying them from zero
    if (this.getWinsForLevel(index) >= WINS_TO_UNLOCK) {
      this.chessService.resetWinsForLevel(index);
    }

    this.chessService.setLevel(index);
    this.currentReward.set(null);
    this.geminiService.clearStory();
    this.hasGrantedRewardForWin.set(false);
  }

  getPieceStory() {
    const pieceType = this.currentLevel().piece;
    this.geminiService.generatePieceStory(pieceType);
  }

  isLevelUnlocked(index: number): boolean {
    return this.chessService.unlockedLevels()[index];
  }

  getWinsForLevel(index: number): number {
    return this.chessService.winsByLevel()[index] || 0;
  }
  
  skipLevel() {
    this.chessService.forceUnlockNextLevel();
    // After forcing an unlock, we might want to select the newly available level
    const nextLevelIndex = this.chessService.currentLevelIndex() + 1;
    if (this.isLevelUnlocked(nextLevelIndex) && nextLevelIndex < this.levels.length) {
      this.selectLevel(nextLevelIndex);
    }
  }
}