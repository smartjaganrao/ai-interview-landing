import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface UserData extends Record<string, unknown> {
  email: string;
  name: string;
  plan: string;
  createdAt: number;
  phone?: string;
  fullName?: string;
  whatsapp?: string;
  experienceLevel?: string;
  jobRole?: string;
  city?: string;
  referralSource?: string;
  profileCompleted?: boolean;
  acquisition?: {
    customerSelectedSource?: string;
    firstTouchSource?: string;
    firstTouchMedium?: string;
    firstTouchCampaign?: string;
    firstTouchContent?: string;
    firstTouchTerm?: string;
    firstTouchReferrer?: string;
    firstTouchLandingPage?: string;
    firstTouchAt?: number;
    lastTouchSource?: string;
    lastTouchMedium?: string;
    lastTouchCampaign?: string;
    lastTouchContent?: string;
    lastTouchAt?: number;
    referralCode?: string;
    creatorCode?: string;
  };
}

interface UserState {
  data: UserData | null;
  lastSyncedAt: number;
  isSyncing: boolean;
}

const initialState: UserState = {
  data: null,
  lastSyncedAt: 0,
  isSyncing: false,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<UserData>) => {
      state.data = action.payload;
      state.lastSyncedAt = Date.now();
    },
    setUserSyncing: (state, action: PayloadAction<boolean>) => {
      state.isSyncing = action.payload;
    },
    clearUser: (state) => {
      state.data = null;
      state.lastSyncedAt = 0;
      state.isSyncing = false;
    },
  },
});

export const { setUser, setUserSyncing, clearUser } = userSlice.actions;
export default userSlice.reducer;
