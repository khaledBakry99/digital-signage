export interface DisplayTarget {
  id: string;
  number: number;
  label: string;
  isPrimary: boolean;
  left: number;
  top: number;
  width: number;
  height: number;
  nativeScreen?: DetailedScreen;
}

export interface DetailedScreen {
  label?: string;
  isPrimary?: boolean;
  availLeft: number;
  availTop: number;
  availWidth: number;
  availHeight: number;
}

interface ScreenDetails {
  screens: readonly DetailedScreen[];
}

declare global {
  interface Window {
    getScreenDetails?: () => Promise<ScreenDetails>;
  }

  interface FullscreenOptions {
    screen?: DetailedScreen;
  }
}

function toDisplayTarget(screen: DetailedScreen, index: number): DisplayTarget {
  const number = index + 1;

  return {
    id: `${screen.label ?? "display"}-${screen.availLeft}-${screen.availTop}-${screen.availWidth}-${screen.availHeight}`,
    number,
    label: screen.label?.trim() || `شاشة الكمبيوتر ${number}`,
    isPrimary: screen.isPrimary ?? false,
    left: screen.availLeft,
    top: screen.availTop,
    width: screen.availWidth,
    height: screen.availHeight,
    nativeScreen: screen,
  };
}

export function supportsWindowManagement(): boolean {
  return typeof window !== "undefined" && typeof window.getScreenDetails === "function";
}

export async function getAvailableDisplays(): Promise<DisplayTarget[]> {
  if (!supportsWindowManagement()) {
    return [];
  }

  const details = await window.getScreenDetails!();
  return details.screens.map(toDisplayTarget);
}

export function getCurrentDisplay(): DisplayTarget {
  const screen = window.screen as Screen & {
    availLeft?: number;
    availTop?: number;
  };

  return {
    id: "current-display",
    number: 1,
    label: "الشاشة الحالية",
    isPrimary: true,
    left: screen.availLeft ?? 0,
    top: screen.availTop ?? 0,
    width: screen.availWidth,
    height: screen.availHeight,
  };
}
