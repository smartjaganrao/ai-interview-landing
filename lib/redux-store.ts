import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import { persistReducer as rpPersistReducer } from 'redux-persist';
import createWebStorage from 'redux-persist/lib/storage/createWebStorage';
import userReducer from './slices/userSlice';
import subscriptionReducer from './slices/subscriptionSlice';
import usageReducer from './slices/usageSlice';

const persistConfig = {
  key: 'root',
  storage: createWebStorage('local'),
  whitelist: ['user', 'subscription', 'usage'],
};

const rootReducer = combineReducers({
  user: userReducer,
  subscription: subscriptionReducer,
  usage: usageReducer,
});

const persistedReducer = rpPersistReducer(persistConfig, rootReducer);

export const makeStore = () => {
  const store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
        },
      }),
  });
  const persistor = persistStore(store);
  return { store, persistor };
};

export const { store, persistor } = makeStore();

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
