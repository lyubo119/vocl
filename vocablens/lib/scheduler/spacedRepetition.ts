import { VocabItem } from '../db/schema';

export const updateVocabWeight = (vocabItem: VocabItem, isCorrect: boolean): VocabItem => {
  let newWeight: number;

  if (isCorrect) {
    // Correct answer: decrease weight (easier)
    newWeight = Math.max(0, vocabItem.weight - 0.15 * (1 + vocabItem.correct_streak * 0.1));
  } else {
    // Incorrect answer: increase weight (harder)
    newWeight = Math.min(1, vocabItem.weight + 0.25);
  }

  return {
    ...vocabItem,
    weight: newWeight,
    last_seen: new Date().toISOString(),
    correct_streak: isCorrect ? vocabItem.correct_streak + 1 : 0,
    total_attempts: vocabItem.total_attempts + 1,
    total_correct: isCorrect ? vocabItem.total_correct + 1 : vocabItem.total_correct
  };
};

export const getNewVocabItem = (workspaceId: string, word: string, translation: string, notes?: string): Omit<VocabItem, 'id' | 'created_at' | 'correct_streak' | 'total_attempts' | 'total_correct'> => {
  return {
    workspace_id: workspaceId,
    word,
    translation,
    notes,
    weight: 0.7 // New vocab starts at 0.7
  };
};