import { Injectable, signal } from '@angular/core';
import { GoogleGenAI } from '@google/genai';
import { Level } from '../models/chess.model';

@Injectable({
  providedIn: 'root',
})
export class GeminiService {
  private genAI: GoogleGenAI | null = null;
  
  isLoading = signal(false);
  pieceStory = signal<string | null>(null);

  constructor() {
    // IMPORTANT: The API_KEY is provided by the environment. Do not hardcode it.
    // The user of this applet must have process.env.API_KEY configured.
    if (process.env.API_KEY) {
      this.genAI = new GoogleGenAI({ apiKey: process.env.API_KEY });
    } else {
      console.error("API Key for Gemini is not configured.");
    }
  }
  
  clearStory() {
    this.pieceStory.set(null);
  }

  async generatePieceStory(pieceType: 'knight' | 'rook' | 'pawn' | 'bishop' | 'queen' | 'king'): Promise<void> {
    if (!this.genAI) {
      this.pieceStory.set("Lo siento, no puedo contar una historia ahora mismo.");
      return;
    }

    this.isLoading.set(true);
    this.pieceStory.set(null);

    let prompt = '';
    switch (pieceType) {
      case 'knight':
        prompt = "Tell me a fun, one-sentence story for a 5-year-old about a friendly chess knight who loves to jump. Keep it very simple and encouraging. Please respond in Spanish.";
        break;
      case 'rook':
        prompt = "Tell me a fun, one-sentence story for a 5-year-old about a strong chess rook who moves in straight lines. Keep it very simple and encouraging. Please respond in Spanish.";
        break;
      case 'pawn':
        prompt = "Tell me a fun, one-sentence story for a 5-year-old about a brave little chess pawn who can only move forward. Keep it very simple and encouraging. Please respond in Spanish.";
        break;
      case 'bishop':
        prompt = "Tell me a fun, one-sentence story for a 5-year-old about a silly chess bishop who only slides sideways. Keep it very simple and encouraging. Please respond in Spanish.";
        break;
      case 'queen':
        prompt = "Tell me a fun, one-sentence story for a 5-year-old about a powerful chess queen who can go anywhere she wants. Keep it very simple and encouraging. Please respond in Spanish.";
        break;
      case 'king':
        prompt = "Tell me a fun, one-sentence story for a 5-year-old about a careful chess king who only takes one step at a time. Keep it very simple and encouraging. Please respond in Spanish.";
        break;
    }

    try {
      const response = await this.genAI.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          temperature: 0.8,
          maxOutputTokens: 50,
          // FIX: Per @google/genai guidelines, when using maxOutputTokens with gemini-2.5-flash,
          // it's best to also set a thinkingBudget to reserve tokens for the response.
          thinkingConfig: { thinkingBudget: 25 },
        }
      });
      
      this.pieceStory.set(response.text);
    // FIX: Corrected catch block syntax and removed corrupted code.
    } catch (error) {
      console.error("Error generating piece story:", error);
      this.pieceStory.set("Lo siento, hubo un problema al generar la historia. Por favor, intenta de nuevo.");
    } finally {
        this.isLoading.set(false);
    }
  }
}