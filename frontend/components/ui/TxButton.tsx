"use client";

import type { TxStatus } from "@/types";

interface TxButtonProps {
  onClick: () => void;
  status?: TxStatus;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function TxButton({ onClick, status = "idle", disabled, className = "", children }: TxButtonProps) {
  const isLoading = status === "pending";
  const isSuccess = status === "success";
  const isDisabled = disabled || isLoading;

  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      className={`
        relative px-6 py-3 rounded-lg font-semibold text-sm transition-all duration-200
        ${isDisabled
          ? "bg-gray-700 text-gray-400 cursor-not-allowed"
          : "bg-neon-green text-gray-950 hover:bg-neon-green/90 active:scale-95"
        }
        ${isSuccess ? "bg-green-500 text-white" : ""}
        ${className}
      `}
    >
      {isLoading && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2">
          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </span>
      )}
      {isSuccess ? "Done!" : children}
    </button>
  );
}
