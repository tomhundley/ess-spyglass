import { globalShortcut } from 'electron';
import { getMainWindow } from './windows';
import store from '../store';

let registeredShortcut: string | null = null;

export function registerGlobalShortcut(shortcut?: string): boolean {
  // Unregister existing shortcut
  if (registeredShortcut) {
    globalShortcut.unregister(registeredShortcut);
    registeredShortcut = null;
  }

  const hotkeyToRegister = shortcut || (store.get('globalHotkey', 'CommandOrControl+Shift+Space') as string);

  try {
    const success = globalShortcut.register(hotkeyToRegister, () => {
      const win = getMainWindow();
      if (win) {
        if (win.isVisible() && win.isFocused()) {
          win.hide();
        } else {
          win.show();
          win.focus();
        }
      }
    });

    if (success) {
      registeredShortcut = hotkeyToRegister;
      return true;
    }
    return false;
  } catch (e) {
    console.error('Failed to register global shortcut:', e);
    return false;
  }
}

export function unregisterGlobalShortcut(): void {
  if (registeredShortcut) {
    globalShortcut.unregister(registeredShortcut);
    registeredShortcut = null;
  }
}

export function isShortcutRegistered(): boolean {
  return registeredShortcut !== null;
}

export function getRegisteredShortcut(): string | null {
  return registeredShortcut;
}
