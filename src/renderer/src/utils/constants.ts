/**
 * Application constants
 *
 * This file contains all the constant values used throughout the renderer process.
 * These values are mirrored from src/lib/consts.ts to make them easily accessible in the renderer.
 */

/**
 * localStorage keys
 */
export const LOCAL_STORAGE_KEYS = {
  /**
   * Key for storing the selected folder path
   */
  SELECTED_FOLDER: 'nebline:selectedFolder'
} as const
