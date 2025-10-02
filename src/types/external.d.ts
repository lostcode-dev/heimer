declare module 'html-to-image' {
  const content: any
  export = content
}

declare module 'jspdf' {
  export class jsPDF {
    constructor(orientation?: any, unit?: any, format?: any)
    addImage(imageData: string, format: string, x: number, y: number, width: number, height: number): void
    getImageProperties(imageData: string): { width: number; height: number }
    save(filename?: string): void
    internal: { pageSize: { getWidth(): number; getHeight(): number } }
  }
}
