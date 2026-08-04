import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface SubscriptionData {
  plan: string;
  status: string;
  billing?: 'monthly' | 'yearly' | 'one-time';
  amount?: number;
  startedAt?: number;
  renewalDate?: number;
  paymentId?: string;
  cancelAtPeriodEnd?: boolean;
  planType?: 'one-time' | 'subscription';
  hoursPurchased?: number;
  hoursRemaining?: number;
  expiresAt?: number;
}

interface SubscriptionState {
  data: SubscriptionData | null;
  lastSyncedAt: number;
  isSyncing: boolean;
}

const initialState: SubscriptionState = {
  data: null,
  lastSyncedAt: 0,
  isSyncing: false,
};

const subscriptionSlice = createSlice({
  name: 'subscription',
  initialState,
  reducers: {
    setSubscription: (state, action: PayloadAction<SubscriptionData>) => {
      state.data = action.payload;
      state.lastSyncedAt = Date.now();
    },
    setSubscriptionSyncing: (state, action: PayloadAction<boolean>) => {
      state.isSyncing = action.payload;
    },
    clearSubscription: (state) => {
      state.data = null;
      state.lastSyncedAt = 0;
      state.isSyncing = false;
    },
  },
});

export const { setSubscription, setSubscriptionSyncing, clearSubscription } = subscriptionSlice.actions;
export default subscriptionSlice.reducer;
