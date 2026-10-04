import { Injectable } from '@nestjs/common';

const FILLER_WORDS = [
  'uh',
  'um',
  'like',
  'you know',
  'so',
  'actually',
  'basically',
  'literally',
  'right',
  'okay',
];

export interface VoiceMetrics {
  wpm: number;
  fillerWordCount: number;
  fillerWords: string[];
}

@Injectable()
export class VoiceMetricsService {
  calculate(text: string, durationSeconds: number): VoiceMetrics {
    const words = text.trim().split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    const minutes = durationSeconds / 60;
    const wpm = minutes > 0 ? Math.round(wordCount / minutes) : 0;

    const lowerText = text.toLowerCase();
    const foundFillers: string[] = [];
    let fillerWordCount = 0;

    for (const filler of FILLER_WORDS) {
      const regex = new RegExp(`\\b${filler}\\b`, 'g');
      const matches = lowerText.match(regex);
      if (matches) {
        foundFillers.push(filler);
        fillerWordCount += matches.length;
      }
    }

    return { wpm, fillerWordCount, fillerWords: foundFillers };
  }
}
