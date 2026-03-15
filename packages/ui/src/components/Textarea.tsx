import type { TextareaHTMLAttributes } from 'react';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

// Layout classes (flex-1, w-*, min-w-0, etc.) that must go on the wrapper div, not the textarea
const LAYOUT_PATTERN = /\b(flex-1|flex-auto|flex-none|w-\S+|min-w-\S+|max-w-\S+|grow|shrink)\b/g;

export function Textarea({ label, error, className = '', id, ...props }: TextareaProps) {
  const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-');

  const layoutClasses = (className.match(LAYOUT_PATTERN) || []).join(' ');
  const innerClasses = className.replace(LAYOUT_PATTERN, '').replace(/\s+/g, ' ').trim();

  return (
    <div className={`flex flex-col gap-1 ${layoutClasses}`}>
      {label && (
        <label htmlFor={textareaId} className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-y dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400 ${
          error ? 'border-red-500' : 'border-gray-300'
        } ${innerClasses}`}
        {...props}
      />
      {error && <span className="text-sm text-red-500">{error}</span>}
    </div>
  );
}
