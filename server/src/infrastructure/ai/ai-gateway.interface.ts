import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import type { Readable } from 'stream';
import { z } from 'zod';

export const AI_GATEWAY_TOKEN = Symbol('AI_GATEWAY_TOKEN');

export type ChatTask = 'question-generation' | 'feedback' | 'report';

export interface ChatCompletionParams {
  messages: ChatCompletionMessageParam[];
  model?: string;
  temperature: number;
  maxTokens: number;
  responseFormat?: 'json_object';
  task?: ChatTask;
  timeoutMs?: number;
}

export interface TranscribeParams {
  audioBuffer: Buffer;
  mimeType: 'audio/webm' | 'audio/mp4' | 'audio/wav';
  language?: 'vi' | 'en';
  timeoutMs?: number;
}

export interface TranscribeResult {
  text: string;
  durationSeconds: number;
}

export interface VoiceMetricsResult {
  wpm: number;
  fillerWordCount: number;
  fillerWords: string[];
  pauseCount: number;
  totalPauseDurationSeconds: number;
  speechDurationSeconds: number;
  confidenceScore: number;
}

export interface STTWordTimestampResult {
  word: string;
  start: number;
  end: number;
  probability: number;
}

export interface TranscribeWithMetricsResult {
  text: string;
  language: string;
  durationSeconds: number;
  metrics: VoiceMetricsResult;
  words?: STTWordTimestampResult[];
}

export interface SynthesizeSpeechParams {
  text: string;
  language?: 'vi' | 'en';
}

export interface SynthesizeSpeechResult {
  stream: Readable;
  contentType: string;
}

export interface GenerateStructuredParams<T> {
  systemPrompt: string;
  userPrompt: string;
  schema: z.ZodSchema<T>;
  schemaName?: string;
  temperature?: number;
  maxTokens?: number;
  task?: ChatTask;
  timeoutMs?: number;
  model?: string;
}

export interface GenerateTextParams {
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
  task?: ChatTask;
  timeoutMs?: number;
  model?: string;
}

export interface TranscribeAudioParams {
  audioBuffer: Buffer;
  mimeType?: 'audio/webm' | 'audio/mp4' | 'audio/wav' | (string & {});
  language?: 'vi' | 'en';
  timeoutMs?: number;
}

export interface IAIGateway {
  /**
   * Existing low-level chat completion contract.
   */
  chatCompletion(params: ChatCompletionParams): Promise<string>;

  /**
   * Existing low-level speech-to-text contract.
   */
  transcribe(params: TranscribeParams): Promise<TranscribeResult>;

  /**
   * High-level speech-to-text with speech metrics.
   */
  transcribeWithMetrics(
    params: TranscribeAudioParams,
  ): Promise<TranscribeWithMetricsResult>;

  /**
   * Speech synthesis (TTS) returning an audio stream.
   */
  synthesizeSpeech(
    params: SynthesizeSpeechParams,
  ): Promise<SynthesizeSpeechResult>;

  /**
   * High-level structured generation with Zod validation.
   */
  generateStructured<T>(params: GenerateStructuredParams<T>): Promise<T>;

  /**
   * High-level free-text generation.
   */
  generateText(params: GenerateTextParams): Promise<string>;

  /**
   * High-level audio transcription.
   */
  transcribeAudio(params: TranscribeAudioParams): Promise<TranscribeResult>;

  /**
   * Model resolution helper.
   */
  getChatModel(task?: ChatTask): string;
}
