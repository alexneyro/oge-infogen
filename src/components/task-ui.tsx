import React from 'react';

export interface StatementBlockProps {
  children: React.ReactNode;
  className?: string;
}

export function StatementBlock({ children, className = '' }: StatementBlockProps) {
  return (
    <div
      className={`rounded-xl border border-theme-statement-border bg-theme-statement-bg p-5 shadow-sm space-y-4 ${className}`}
    >
      {children}
    </div>
  );
}

export interface StatementTextProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children?: React.ReactNode;
  className?: string;
}

export function StatementText({ children, className = '', ...props }: StatementTextProps) {
  return (
    <p
      className={`text-base leading-relaxed font-semibold text-theme-statement-text whitespace-pre-line ${className}`}
      {...props}
    >
      {children}
    </p>
  );
}

export interface StatementNoteProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children?: React.ReactNode;
  className?: string;
}

export function StatementNote({ children, className = '', ...props }: StatementNoteProps) {
  return (
    <p
      className={`text-base leading-relaxed font-normal text-theme-statement-text whitespace-pre-line ${className}`}
      {...props}
    >
      {children}
    </p>
  );
}

export interface StatementQuestionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children?: React.ReactNode;
  className?: string;
}

export function StatementQuestion({ children, className = '', ...props }: StatementQuestionProps) {
  return (
    <p
      className={`text-base leading-relaxed font-bold text-theme-statement-text whitespace-pre-line ${className}`}
      {...props}
    >
      {children}
    </p>
  );
}

export interface SubBlockProps {
  children: React.ReactNode;
  className?: string;
}

export function SubBlock({ children, className = '' }: SubBlockProps) {
  return (
    <div
      className={`rounded-lg border border-theme-border bg-theme-bg/60 p-4 space-y-2 ${className}`}
    >
      {children}
    </div>
  );
}

export interface BlockLabelProps {
  children: React.ReactNode;
  className?: string;
}

export function BlockLabel({ children, className = '' }: BlockLabelProps) {
  return (
    <div
      className={`text-xs font-bold uppercase tracking-wider text-theme-text-muted mb-2 ${className}`}
    >
      {children}
    </div>
  );
}

export interface CodeBlockProps {
  children: React.ReactNode;
  label?: string;
  className?: string;
}

export function CodeBlock({ children, label, className = '' }: CodeBlockProps) {
  return (
    <div
      className={`rounded-xl border border-slate-800 bg-slate-900 overflow-hidden shadow-md ${className}`}
    >
      {label && (
        <div className="px-4 py-2 border-b border-slate-800 bg-slate-900/60 text-xs font-bold uppercase tracking-wider text-slate-400">
          {label}
        </div>
      )}
      <pre className="p-4 overflow-x-auto font-mono text-xs sm:text-sm leading-relaxed text-slate-100 whitespace-pre">
        {children}
      </pre>
    </div>
  );
}

export interface DataBlockProps {
  children: React.ReactNode;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function DataBlock({
  children,
  label,
  size = 'md',
  className = '',
}: DataBlockProps) {
  const sizeClass = size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-2xl' : 'text-base';

  return (
    <div
      className={`rounded-xl border border-theme-border bg-theme-input-bg overflow-hidden shadow-sm ${className}`}
    >
      {label && (
        <div className="px-4 py-2 border-b border-theme-border bg-theme-bg/60 text-xs font-bold uppercase tracking-wider text-theme-text-muted">
          {label}
        </div>
      )}
      <div
        className={`p-4 overflow-x-auto font-mono text-theme-text whitespace-pre-wrap break-words ${sizeClass}`}
      >
        {children}
      </div>
    </div>
  );
}

export interface DataTableProps {
  children: React.ReactNode;
  className?: string;
  tableClassName?: string;
}

export function DataTable({ children, className = '', tableClassName = '' }: DataTableProps) {
  return (
    <div className={`overflow-x-auto rounded-lg border border-theme-table-border ${className}`}>
      <table className={`w-full border-collapse text-sm text-center ${tableClassName}`}>
        {children}
      </table>
    </div>
  );
}

export interface TableCellProps {
  children?: React.ReactNode;
  className?: string;
  colSpan?: number;
  rowSpan?: number;
}

export function Th({ children, className = '', colSpan, rowSpan }: TableCellProps) {
  return (
    <th
      colSpan={colSpan}
      rowSpan={rowSpan}
      className={`border border-theme-table-border border-b-2 border-b-theme-table-border bg-theme-bg px-3 py-2.5 font-bold text-theme-text text-center ${className}`}
    >
      {children}
    </th>
  );
}

export function Td({ children, className = '', colSpan, rowSpan }: TableCellProps) {
  return (
    <td
      colSpan={colSpan}
      rowSpan={rowSpan}
      className={`border border-theme-table-border px-3 py-2 text-theme-text ${className}`}
    >
      {children}
    </td>
  );
}

export interface AnswerFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  mono?: boolean;
  maxWidth?: 'xs' | 'sm' | 'md';
  className?: string;
  disabled?: boolean;
  autoFocus?: boolean;
}

export function AnswerField({
  label,
  value,
  onChange,
  placeholder,
  mono = false,
  maxWidth = 'md',
  className = '',
  disabled = false,
  autoFocus = false,
}: AnswerFieldProps) {
  const maxWClass =
    maxWidth === 'xs' ? 'max-w-xs' : maxWidth === 'sm' ? 'max-w-sm' : 'max-w-md';

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="no-print">
        <label className="block text-sm font-semibold text-theme-text">{label}</label>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          autoFocus={autoFocus}
          className={`w-full ${maxWClass} px-4 py-2.5 text-sm rounded-xl border border-theme-border bg-theme-input-bg text-theme-input-text shadow-inner font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none ${
            mono ? 'font-mono' : ''
          }`}
        />
      </div>
      <div className="print-only text-sm font-semibold pt-1">
        Ответ: ____________________________________
      </div>
    </div>
  );
}

export interface HintBoxProps {
  children: React.ReactNode;
  className?: string;
}

export function HintBox({ children, className = '' }: HintBoxProps) {
  return (
    <div
      className={`rounded-lg border border-theme-hint-border bg-theme-hint-bg p-4 text-sm text-theme-hint-text ${className}`}
    >
      {children}
    </div>
  );
}

export interface VerdictBoxProps {
  status: 'correct' | 'partial' | 'wrong';
  children: React.ReactNode;
  className?: string;
}

export function VerdictBox({ status, children, className = '' }: VerdictBoxProps) {
  const statusColorClass =
    status === 'correct'
      ? 'bg-status-correct-bg text-status-correct border-status-correct-border'
      : status === 'partial'
      ? 'bg-status-partial-bg text-status-partial border-status-partial-border'
      : 'bg-status-wrong-bg text-status-wrong border-status-wrong-border';

  return (
    <div className={`no-print rounded-lg border p-4 text-sm font-semibold ${statusColorClass} ${className}`}>
      {children}
    </div>
  );
}

export interface AnswerChipProps {
  children: React.ReactNode;
  className?: string;
}

export function AnswerChip({ children, className = '' }: AnswerChipProps) {
  return (
    <code
      className={`px-2 py-0.5 rounded font-mono font-bold text-theme-text bg-theme-input-bg border border-theme-border ${className}`}
    >
      {children}
    </code>
  );
}

export interface ActionButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
  icon?: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

export function ActionButton({
  children,
  onClick,
  variant = 'primary',
  icon,
  disabled = false,
  className = '',
}: ActionButtonProps) {
  const variantClass =
    variant === 'primary'
      ? 'bg-blue-600 hover:bg-blue-500 text-white'
      : 'border border-theme-border bg-theme-bg/60 text-theme-text hover:bg-theme-bg';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm shadow-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${variantClass} ${className}`}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </button>
  );
}

export interface ChoiceButtonProps {
  children: React.ReactNode;
  selected?: boolean;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}

export function ChoiceButton({
  children,
  selected = false,
  onClick,
  disabled = false,
  className = '',
}: ChoiceButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`px-4 py-3 rounded-xl border text-base font-mono font-semibold transition-all shadow-sm ${
        selected
          ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:border-blue-500/40 dark:text-blue-300 ring-2 ring-blue-500/30'
          : 'border-theme-border bg-theme-bg/60 text-theme-text hover:bg-theme-bg'
      } ${disabled ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
    >
      {children}
    </button>
  );
}
