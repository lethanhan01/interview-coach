export type OutputLanguage = 'vi' | 'en';

export function resolveOutputLanguage(
  language?: string | null,
): OutputLanguage {
  return language === 'en' ? 'en' : 'vi';
}

export function getLanguageInstruction(language?: string | null): string {
  const outputLanguage = resolveOutputLanguage(language);

  if (outputLanguage === 'en') {
    return [
      'Output language: English.',
      'Write every generated feedback/report field in English.',
      'Keep any verbatim quote copied from the candidate answer in its original language, spelling, and punctuation.',
    ].join(' ');
  }

  return [
    'Output language: Vietnamese.',
    'Write every generated feedback/report field in Vietnamese.',
    'Keep any verbatim quote copied from the candidate answer in its original language, spelling, and punctuation.',
  ].join(' ');
}
