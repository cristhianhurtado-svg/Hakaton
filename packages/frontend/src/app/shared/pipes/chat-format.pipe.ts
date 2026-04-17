import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({ name: 'chatFormat', standalone: true })
export class ChatFormatPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(value: string): SafeHtml {
    if (!value) return '';

    let html = value
      // Bold **text**
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      // Inline code `text`
      .replace(/`([^`]+)`/g, '<code style="background:#F3F4F6;padding:1px 5px;border-radius:4px;font-size:0.75rem;font-family:monospace;">$1</code>')
      // Line breaks
      .replace(/\n/g, '<br/>');

    return this.sanitizer.bypassSecurityTrustHtml(html);
  }
}
