/**
 * Custom fetch implementation that uses the Electron main process as a proxy
 * to avoid CORS issues when making API calls to external services.
 */
export async function proxyFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  // Convert input to string URL
  const url =
    typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url
  const options = init || {}
  try {
    // Extract the relevant parts of the fetch options
    const { method, headers, body } = options

    // Convert headers from Headers to a plain object
    const headerObj: Record<string, string> = {}
    if (headers instanceof Headers) {
      headers.forEach((value, key) => {
        headerObj[key] = value
      })
    } else if (headers && typeof headers === 'object') {
      Object.assign(headerObj, headers)
    }

    // Call the proxy API exposed by the preload script
    const response = await window.api.proxyAiRequest({
      url,
      method,
      headers: headerObj,
      body: body ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined
    })

    // Create a Response object from the proxy response
    return new Response(JSON.stringify(response.data), {
      status: response.status,
      headers: new Headers(response.headers as Record<string, string>)
    })
  } catch (error) {
    console.error('Error in proxyFetch:', error)
    throw error
  }
}
