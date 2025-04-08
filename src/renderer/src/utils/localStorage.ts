/**
 * Local storage utility functions for Electron.
 * These functions provide a simple interface for storing and retrieving data in localStorage
 * within the renderer process of an Electron application.
 */

/**
 * Retrieves a value from localStorage by key.
 * @param key - The key to retrieve
 * @param defaultValue - Value to return if key doesn't exist
 * @returns The stored value (parsed if JSON) or the defaultValue
 */
export function getFromLocalStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key)

    // Return default value if item doesn't exist
    if (item === null) {
      return defaultValue
    }

    // Try to parse the item as JSON, fall back to raw value if parsing fails
    try {
      return JSON.parse(item) as T
    } catch (e) {
      return item as unknown as T
    }
  } catch (error) {
    console.error(`Error reading "${key}" from localStorage:`, error)
    return defaultValue
  }
}

/**
 * Saves a value to localStorage.
 * @param key - The key to store the value under
 * @param value - The value to store (will be stringified if object/array)
 * @returns true if successful, false otherwise
 */
export function saveToLocalStorage<T>(key: string, value: T): boolean {
  try {
    if (value === undefined) {
      localStorage.removeItem(key)
    } else {
      // Convert objects/arrays to JSON strings
      const valueToStore =
        typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value)

      localStorage.setItem(key, valueToStore)
    }
    return true
  } catch (error) {
    console.error(`Error saving "${key}" to localStorage:`, error)
    return false
  }
}

/**
 * Removes an item from localStorage.
 * @param key - The key to remove
 * @returns true if successful, false otherwise
 */
export function removeFromLocalStorage(key: string): boolean {
  try {
    localStorage.removeItem(key)
    return true
  } catch (error) {
    console.error(`Error removing "${key}" from localStorage:`, error)
    return false
  }
}

/**
 * Clears all items from localStorage.
 * @returns true if successful, false otherwise
 */
export function clearLocalStorage(): boolean {
  try {
    localStorage.clear()
    return true
  } catch (error) {
    console.error('Error clearing localStorage:', error)
    return false
  }
}
