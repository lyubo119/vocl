import { VocabItem } from '../db/schema';

export const selectVocabForDailyChallenge = (vocabItems: VocabItem[], count: number = 10): VocabItem[] => {
  if (vocabItems.length === 0) return [];

  // Simple implementation: weighted random selection based on weight
  // Higher weight = more likely to be selected
  const totalWeight = vocabItems.reduce((sum, item) => sum + item.weight, 0);

  const selected: VocabItem[] = [];
  const availableItems = [...vocabItems];

  // Ensure we include at least one "mastered" item (weight < 0.2) if available
  const masteredItems = availableItems.filter(item => item.weight < 0.2);
  if (masteredItems.length > 0 && count > 0) {
    const randomMastered = masteredItems[Math.floor(Math.random() * masteredItems.length)];
    selected.push(randomMastered);
    // Remove from available pool
    availableItems.splice(availableItems.indexOf(randomMastered), 1);
    count--;
  }

  // Fill remaining slots with weighted random selection
  while (selected.length < count && availableItems.length > 0) {
    const randomValue = Math.random() * totalWeight;
    let cumulativeWeight = 0;
    let selectedIndex = 0;

    for (let i = 0; i < availableItems.length; i++) {
      cumulativeWeight += availableItems[i].weight;
      if (randomValue <= cumulativeWeight) {
        selectedIndex = i;
        break;
      }
    }

    selected.push(availableItems[selectedIndex]);
    availableItems.splice(selectedIndex, 1);
  }

  return selected;
};