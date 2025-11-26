import type Quill from "quill";

declare module "quill-image-resize-module" {
  export default class ImageResize {
    constructor(quill: Quill, options?: unknown);
  }
}
