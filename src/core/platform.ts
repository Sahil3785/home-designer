/**
 * Platform and runtime environment detection utilities.
 */

export type OperatingSystem = 'mac' | 'windows' | 'linux' | 'ios' | 'android' | 'other';

/**
 * Checks if the current app is running inside native Tauri desktop runtime (macOS / Windows / Linux app).
 */
export function isNativeDesktop(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    '__TAURI_INTERNALS__' in window ||
    '__TAURI__' in window ||
    window.navigator.userAgent.includes('Tauri')
  );
}

/**
 * Detects the client's operating system from userAgent / platform string.
 */
export function getClientOS(): OperatingSystem {
  if (typeof window === 'undefined') return 'other';
  const ua = window.navigator.userAgent.toLowerCase();
  const platform = (window.navigator as any).userAgentData?.platform?.toLowerCase() || window.navigator.platform.toLowerCase();

  if (platform.includes('mac') || ua.includes('macintosh') || ua.includes('mac os')) {
    return 'mac';
  }
  if (platform.includes('win') || ua.includes('windows')) {
    return 'windows';
  }
  if (platform.includes('linux') || ua.includes('linux')) {
    return 'linux';
  }
  if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ipod')) {
    return 'ios';
  }
  if (ua.includes('android')) {
    return 'android';
  }
  return 'other';
}

/**
 * Default download links for releases hosted on GitHub.
 */
export const GITHUB_REPO_URL = 'https://github.com/sahil3785/home-designer';
export const GITHUB_RELEASES_URL = `${GITHUB_REPO_URL}/releases/latest`;
export const GITHUB_MAC_DMG_DOWNLOAD = `${GITHUB_REPO_URL}/releases/latest/download/HomeDesigner_1.0.0_aarch64.dmg`;
export const GITHUB_WIN_EXE_DOWNLOAD = `${GITHUB_REPO_URL}/releases/latest/download/HomeDesigner_1.0.0_x64_en-US.msi`;
