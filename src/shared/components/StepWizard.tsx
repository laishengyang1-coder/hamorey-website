// ============================================================
// StepWizard — 分步向导（质保登记用）
// ============================================================

import React from 'react';
import { cn } from '../../lib/cn';

export interface Step {
  key: string;
  title: string;
  description?: string;
}

interface StepWizardProps {
  steps: Step[];
  currentStep: number;
  onStepClick?: (index: number) => void;
  children: React.ReactNode;
  className?: string;
}

export function StepWizard({
  steps,
  currentStep,
  onStepClick,
  children,
  className,
}: StepWizardProps) {
  return (
    <div className={cn('flex flex-col gap-6', className)}>
      {/* 步骤指示器 */}
      <nav className="flex items-center gap-0" aria-label="Progress">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isClickable = onStepClick && (isCompleted || index <= currentStep + 1);

          return (
            <React.Fragment key={step.key}>
              {index > 0 && (
                <div
                  className={cn(
                    'flex-1 h-px mx-2',
                    index <= currentStep ? 'bg-gray-900' : 'bg-gray-200',
                  )}
                />
              )}
              <button
                type="button"
                disabled={!isClickable}
                onClick={() => isClickable && onStepClick?.(index)}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-3 py-2 transition-colors',
                  isClickable && 'cursor-pointer hover:bg-gray-50',
                  !isClickable && 'cursor-default',
                )}
              >
                <span
                  className={cn(
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                    isCompleted && 'bg-gray-900 text-white',
                    isCurrent && 'border-2 border-gray-900 text-gray-900',
                    !isCompleted && !isCurrent && 'border-2 border-gray-200 text-gray-400',
                  )}
                >
                  {isCompleted ? (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </span>
                <div className="text-left hidden sm:block">
                  <p
                    className={cn(
                      'text-sm font-medium',
                      isCurrent ? 'text-gray-900' : isCompleted ? 'text-gray-700' : 'text-gray-400',
                    )}
                  >
                    {step.title}
                  </p>
                  {step.description && (
                    <p className="text-xs text-gray-400">{step.description}</p>
                  )}
                </div>
              </button>
            </React.Fragment>
          );
        })}
      </nav>

      {/* 步骤内容 */}
      <div>{children}</div>
    </div>
  );
}
