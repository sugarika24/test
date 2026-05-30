import AsyncStorage from "@react-native-async-storage/async-storage";

const TOKEN_KEY = "homigo_token";
const USER_KEY = "homigo_user";
const authClearedListeners = new Set<() => void>();

export function onAuthCleared(listener: () => void) {
  authClearedListeners.add(listener);

  return () => {
    authClearedListeners.delete(listener);
  };
}

function notifyAuthCleared() {
  authClearedListeners.forEach((listener) => listener());
}

export async function saveAuth(token: string, user: any) {
  await AsyncStorage.setItem(TOKEN_KEY, token);
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
}

export async function getToken() {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function getStoredUser() {
  const user = await AsyncStorage.getItem(USER_KEY);
  return user ? JSON.parse(user) : null;
}

export async function clearAuth() {
  await AsyncStorage.removeItem(TOKEN_KEY);
  await AsyncStorage.removeItem(USER_KEY);
  notifyAuthCleared();
}