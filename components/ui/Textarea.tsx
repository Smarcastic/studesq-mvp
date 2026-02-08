/**
 * Textarea Component
 * 
 * Multi-line text input with character count and auto-resize option.
 */

import { TextareaHTMLAttributes, forwardRef, useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  helperText?: string
  showCharCount?: boolean
  autoResize?: boolean
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      helperText,
      showCharCount = false,
      autoResize = false,
      className,
      id,
      maxLength,
      onChange,
      value,
      ...props
    },
    ref
  ) => {
    const [charCount, setCharCount] = useState(0)
    const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-')

    useEffect(() => {
      if (value) {
        setCharCount(String(value).length)
      }
    }, [value])

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setCharCount(e.target.value.length)
      if (onChange) onChange(e)
    }

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-sm font-medium text-slate-700 mb-1.5"
          >
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        
        <textarea
          ref={ref}
          id={textareaId}
          maxLength={maxLength}
          value={value}
          onChange={handleChange}
          className={cn(
            'w-full px-4 py-2.5 rounded-lg border transition-all duration-200',
            'text-slate-900 placeholder:text-slate-400',
            'focus:outline-none focus:ring-2 focus:ring-offset-1',
            error
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
              : 'border-slate-300 focus:border-primary-500 focus:ring-primary-500',
            props.disabled && 'bg-slate-50 cursor-not-allowed',
            autoResize && 'resize-none',
            className
          )}
          {...props}
        />
        
        <div className="flex justify-between items-center mt-1.5">
          <div className="flex-1">
            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
            
            {helperText && !error && (
              <p className="text-sm text-slate-500">{helperText}</p>
            )}
          </div>
          
          {showCharCount && maxLength && (
            <p className="text-sm text-slate-400 ml-2">
              {charCount}/{maxLength}
            </p>
          )}
        </div>
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'
