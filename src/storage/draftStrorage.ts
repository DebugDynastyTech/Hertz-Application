import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "PLANTATION_DRAFTS";

export const getDrafts = async (): Promise<any[]> => {
  try {
    const data = await AsyncStorage.getItem(KEY);
    if (!data) return [];
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    // Storage corrupted or malformed — return empty safely
    return [];
  }
};

export const saveDraft = async (draft: any): Promise<void> => {
  try {
    const existing = await getDrafts();
    existing.push(draft);
    await AsyncStorage.setItem(KEY, JSON.stringify(existing));
  } catch {
    console.warn("saveDraft: failed to save draft");
  }
};

export const deleteDraft = async (index: number): Promise<void> => {
  try {
    const existing = await getDrafts();
    existing.splice(index, 1);
    await AsyncStorage.setItem(KEY, JSON.stringify(existing));
  } catch {
    console.warn("deleteDraft: failed to delete draft at index", index);
  }
};

export const updateDraft = async (index: number, updated: any): Promise<void> => {
  try {
    const existing = await getDrafts();
    if (index < 0 || index >= existing.length) {
      console.warn("updateDraft: index out of bounds", index);
      return;
    }
    existing[index] = { ...existing[index], ...updated };
    await AsyncStorage.setItem(KEY, JSON.stringify(existing));
  } catch {
    console.warn("updateDraft: failed to update draft at index", index);
  }
};

// ── Read a single draft by index safely ──────────────────────────────────────
export const getDraftByIndex = async (index: number): Promise<any | null> => {
  try {
    const drafts = await getDrafts();
    if (index < 0 || index >= drafts.length) return null;
    return drafts[index] ?? null;
  } catch {
    return null;
  }
};