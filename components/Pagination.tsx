"use client";

import { useTheme } from "@/lib/context/ThemeContext";
import { useState, useRef, useEffect } from "react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onNextPage: () => void;
  onPreviousPage: () => void;
  onItemsPerPageChange?: (items: number) => void;
}

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onNextPage,
  onPreviousPage,
  onItemsPerPageChange,
}: PaginationProps) {
  const { theme } = useTheme();
  const isLightTheme = theme === "light";
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const textPrimary = isLightTheme ? "text-slate-900" : "text-white";
  const textSecondary = isLightTheme ? "text-slate-600" : "text-slate-400";

  const itemsPerPageOptions = [5, 8, 12, 16, 24, 32, 50];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Calculate visible page numbers
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      if (currentPage > 3) {
        pages.push("...");
      }

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push("...");
      }

      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  if (totalPages <= 1 && !onItemsPerPageChange) return null;

  return (
    <div className="w-full">
      {/* Main Container */}
      <div
        className={`rounded-3xl p-6 transition-all duration-300 ${
          isLightTheme
            ? "bg-gradient-to-br from-white to-slate-50 border border-slate-200/80 shadow-xl shadow-slate-200/60"
            : "bg-gradient-to-br from-slate-800/90 to-slate-900/90 border border-slate-700/50 shadow-2xl shadow-black/40 backdrop-blur-xl"
        }`}
      >
        <div className="flex items-center justify-between gap-6 flex-wrap">
          {/* Left Section: Items per page + Total items */}
          <div className="flex items-center gap-4">
            {/* Items Per Page Selector */}
            {onItemsPerPageChange && (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className={`group px-5 h-11 flex items-center gap-3 rounded-2xl font-semibold text-sm transition-all duration-200 ${
                    isLightTheme
                      ? "bg-white border-2 border-slate-200 text-slate-700 hover:border-indigo-300 hover:bg-indigo-50/50 shadow-lg shadow-slate-200/50"
                      : "bg-slate-700/50 border-2 border-slate-600/50 text-white hover:border-indigo-500/50 hover:bg-slate-600/50 shadow-lg shadow-black/30"
                  }`}
                >
                  <span className={`${textSecondary} text-xs font-medium`}>عرض</span>
                  <span className={`${textPrimary} font-bold text-base`}>{itemsPerPage}</span>
                  <svg
                    className={`w-4 h-4 transition-all duration-300 ${
                      isDropdownOpen ? "rotate-180" : ""
                    } ${textSecondary}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isDropdownOpen && (
                  <div
                    className={`absolute right-0 mt-3 py-2 rounded-2xl shadow-2xl z-50 min-w-[140px] ${
                      isLightTheme
                        ? "bg-white border-2 border-slate-200"
                        : "bg-slate-800 border-2 border-slate-700 backdrop-blur-xl"
                    }`}
                  >
                    {itemsPerPageOptions.map((option) => (
                      <button
                        key={option}
                        onClick={() => {
                          onItemsPerPageChange(option);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full px-5 py-3 text-sm font-bold text-right transition-all duration-150 ${
                          option === itemsPerPage
                            ? isLightTheme
                              ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white"
                              : "bg-gradient-to-r from-indigo-500 to-purple-600 text-white"
                            : isLightTheme
                            ? "text-slate-700 hover:bg-slate-100"
                            : "text-slate-300 hover:bg-slate-700/70"
                        }`}
                      >
                        {option} عناصر
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Total Items Display */}
            <div
              className={`px-5 h-11 flex items-center gap-2 rounded-2xl font-semibold text-sm border-2 ${
                isLightTheme
                  ? "bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200 text-indigo-700 shadow-md shadow-indigo-100/50"
                  : "bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-indigo-500/30 text-indigo-300 shadow-lg shadow-indigo-500/10"
              }`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <span className="font-bold text-base">{totalItems}</span>
              <span className="text-xs font-medium opacity-80">إجمالي</span>
            </div>
          </div>

          {/* Center Section: Page Navigation */}
          <div className="flex items-center gap-2">
            {/* Previous Arrow - يشير لليسار ← */}
            <button
              onClick={onPreviousPage}
              disabled={currentPage === 1}
              className={`w-11 h-11 flex items-center justify-center rounded-xl transition-all duration-200 ${
                currentPage === 1
                  ? isLightTheme
                    ? "bg-slate-100 text-slate-300 cursor-not-allowed"
                    : "bg-slate-800/50 text-slate-600 cursor-not-allowed"
                  : isLightTheme
                  ? "bg-gradient-to-br from-slate-100 to-slate-200 hover:from-slate-200 hover:to-slate-300 text-slate-700 hover:text-slate-900 shadow-lg shadow-slate-300/50 hover:shadow-xl active:scale-95"
                  : "bg-gradient-to-br from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 text-slate-300 hover:text-white shadow-lg shadow-black/30 hover:shadow-xl active:scale-95"
              }`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* Page Numbers */}
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl ${
                isLightTheme
                  ? "bg-white border-2 border-slate-200"
                  : "bg-slate-700/40 border-2 border-slate-600/40"
              }`}
            >
              {getPageNumbers().map((page, index) =>
                page === "..." ? (
                  <span
                    key={`ellipsis-${index}`}
                    className={`w-9 h-9 flex items-center justify-center ${textSecondary} font-bold`}
                  >
                    ...
                  </span>
                ) : (
                  <button
                    key={page}
                    onClick={() => onPageChange(page as number)}
                    className={`w-9 h-9 flex items-center justify-center rounded-lg font-bold text-sm transition-all duration-200 ${
                      page === currentPage
                        ? isLightTheme
                          ? "bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/40 scale-110"
                          : "bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/50 scale-110"
                        : isLightTheme
                        ? "text-slate-600 hover:bg-slate-100 hover:text-slate-900 active:scale-95"
                        : "text-slate-300 hover:bg-slate-600/50 hover:text-white active:scale-95"
                    }`}
                  >
                    {page}
                  </button>
                )
              )}
            </div>

            {/* Next Arrow - يشير لليمين → */}
            <button
              onClick={onNextPage}
              disabled={currentPage === totalPages}
              className={`w-11 h-11 flex items-center justify-center rounded-xl transition-all duration-200 ${
                currentPage === totalPages
                  ? isLightTheme
                    ? "bg-slate-100 text-slate-300 cursor-not-allowed"
                    : "bg-slate-800/50 text-slate-600 cursor-not-allowed"
                  : isLightTheme
                  ? "bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/40 hover:shadow-xl hover:shadow-indigo-500/60 active:scale-95"
                  : "bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/70 active:scale-95"
              }`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </div>

          {/* Right Section: Page Info */}
          <div
            className={`px-5 h-11 flex items-center gap-2 rounded-2xl font-semibold text-sm border-2 ${
              isLightTheme
                ? "bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200 text-purple-700 shadow-md shadow-purple-100/50"
                : "bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/30 text-purple-300 shadow-lg shadow-purple-500/10"
            }`}
          >
            <span className="text-xs font-medium opacity-80">صفحة</span>
            <span className="font-bold text-base">{currentPage}</span>
            <span className="text-xs font-medium opacity-60">من</span>
            <span className="font-bold text-base">{totalPages}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
