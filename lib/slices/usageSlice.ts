import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface UsageData {
  tokensUsed: number;
  voiceMinutes: number;
  screenshotsUsed: number;
}

interface UsageState {
  data: UsageData | null;
  lastSyncedAt: number;
  isSyncing: boolean;
}

const initialState: UsageState = {
  data: null,
  lastSyncedAt: 0,
  isSyncing: false,
};

const usageSlice = createSlice({
  name: 'usage',
  initialState,
  reducers: {
    setUsage: (state, action: PayloadAction<UsageData>) => {
      state.data = action.payload;
      state.lastSyncedAt = Date.now();
    },
    setUsageSyncing: (state, action: PayloadAction<boolean>) => {
      state.isSyncing = action.payload;
    },
    clearUsage: (state) => {
      state.data = null;
      state.lastSyncedAt = 0;
      state.isSyncing = false;
    },
  },
});

export const { setUsage, setUsageSyncing, clearUsage } = usageSlice.actions;
export default usageSlice.reducer;
