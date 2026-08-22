import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, ChevronDown, Check, Languages, X } from "lucide-react";
import { UNIQUE_LANGUAGES, Language } from "../data/languages";

interface LanguageSelectorProps {
  selectedLanguageCode: string;
  onSelect: (code: string) => void;
  className?: string;
}

export default function LanguageSelector({ selectedLanguageCode, onSelect, className = "" }: LanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedData = UNIQUE_LANGUAGES.find(l => l.code === selectedLanguageCode) || UNIQUE_LANGUAGES.find(l => l.code === "en")!;

  const filteredLanguages = UNIQUE_LANGUAGES.filter(l => 
    l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.nativeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (code: string) => {
    onSelect(code);
    setIsOpen(false);
    setSearchQuery("");
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 bg-slate-50/80 hover:bg-slate-100 border border-slate-200/80 rounded-lg px-2.5 h-8 transition-all shadow-2xs cursor-pointer outline-none group"
      >
        <span className="text-base leading-none">{selectedData.flag}</span>
        <span className="text-xs font-black text-slate-800 uppercase">
          {selectedData.code}
        </span>
        <ChevronDown className={`h-3 w-3 text-slate-400 transition-transform duration-300 ml-0.5 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Searchable Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute top-full mt-2 right-0 w-[280px] sm:w-[320px] bg-white border border-slate-200 rounded-2xl shadow-2xl z-[100] overflow-hidden backdrop-blur-xl"
          >
            {/* Search Input */}
            <div className="p-3 border-b border-slate-100 flex items-center gap-2 sticky top-0 bg-white/90 backdrop-blur-md z-10">
              <Search className="h-4 w-4 text-slate-400 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search language or code..."
                className="w-full bg-transparent border-none outline-none text-sm font-bold text-slate-800 placeholder:text-slate-300 placeholder:font-medium"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="p-1 hover:bg-slate-100 rounded-full transition-colors">
                  <X className="h-3 w-3 text-slate-400" />
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-[300px] overflow-y-auto overflow-x-hidden custom-scrollbar">
              {filteredLanguages.length > 0 ? (
                filteredLanguages.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => handleSelect(l.code)}
                    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50/50 transition-colors group relative ${
                      selectedLanguageCode === l.code ? "bg-blue-50/30" : ""
                    }`}
                  >
                    <span className="text-xl shrink-0 group-hover:scale-110 transition-transform">{l.flag}</span>
                    <div className="flex flex-col items-start min-w-0">
                      <span className={`text-[13px] font-black truncate leading-tight ${selectedLanguageCode === l.code ? "text-blue-600" : "text-slate-800"}`}>
                        {l.nativeName}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 truncate uppercase">
                        {l.name} • {l.code}
                      </span>
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                      {l.direction === "rtl" && (
                        <span className="text-[9px] font-black text-blue-500 bg-blue-50 px-1 rounded">RTL</span>
                      )}
                      {selectedLanguageCode === l.code && (
                        <Check className="h-4 w-4 text-blue-600 shrink-0" />
                      )}
                    </div>
                  </button>
                ))
              ) : (
                <div className="py-12 px-4 text-center">
                  <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Languages className="h-6 w-6 text-slate-300" />
                  </div>
                  <p className="text-sm font-bold text-slate-400">No matching languages found</p>
                  <p className="text-xs font-medium text-slate-300 mt-1">Try searching by native or English name</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-2.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-center">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                Global Multilingual Engine
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
