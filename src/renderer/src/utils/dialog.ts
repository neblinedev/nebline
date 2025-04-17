/**
 * Utility functions for showing native dialog windows
 */

/**
 * Shows a native error dialog with the given message
 * @param message The error message to display
 * @param title Optional title for the dialog (defaults to "Error")
 * @param detail Optional detailed error message
 */
export async function showErrorDialog(
  message: string,
  title = 'Error',
  detail?: string
): Promise<void> {
  await window.api.showMessageBox({
    type: 'error',
    title,
    message,
    detail,
    buttons: ['OK'],
    defaultId: 0
  })
}

/**
 * Shows a native info dialog with the given message
 * @param message The info message to display
 * @param title Optional title for the dialog (defaults to "Information")
 * @param detail Optional detailed message
 */
export async function showInfoDialog(
  message: string,
  title = 'Information',
  detail?: string
): Promise<void> {
  await window.api.showMessageBox({
    type: 'info',
    title,
    message,
    detail,
    buttons: ['OK'],
    defaultId: 0
  })
}

/**
 * Shows a native warning dialog with the given message
 * @param message The warning message to display
 * @param title Optional title for the dialog (defaults to "Warning")
 * @param detail Optional detailed warning message
 */
export async function showWarningDialog(
  message: string,
  title = 'Warning',
  detail?: string
): Promise<void> {
  await window.api.showMessageBox({
    type: 'warning',
    title,
    message,
    detail,
    buttons: ['OK'],
    defaultId: 0
  })
}

/**
 * Shows a native confirmation dialog with the given message
 * @param message The confirmation message to display
 * @param title Optional title for the dialog (defaults to "Confirm")
 * @param detail Optional detailed message
 * @returns True if the user clicked "Yes", false otherwise
 */
export async function showConfirmDialog(
  message: string,
  title = 'Confirm',
  detail?: string
): Promise<boolean> {
  const { response } = await window.api.showMessageBox({
    type: 'question',
    title,
    message,
    detail,
    buttons: ['Yes', 'No'],
    defaultId: 0
  })
  return response === 0 // 0 = "Yes" button
}
