export class AssetUrl {
  url: URL

  constructor(url: string) {
    this.url = new URL(url)
  }

  get isNodeModule(): boolean {
    return this.url.pathname.startsWith('/node_modules')
  }

  get relativeUrl(): string {
    if (this.isNodeModule) {
      return this.url.pathname.replace('/node_modules/', '')
    } else {
      return this.url.pathname.replace(/^\//, '')
    }
  }
}
