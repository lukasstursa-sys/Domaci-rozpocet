import React, { useState, useEffect } from 'react';
import api from '../../services/api';

export default function AIWidget() {
  const [insights, setInsights] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    api.getAIInsights()
      .then((data) => setInsights(data.insights))
      .catch(() => {
        setInsights([
          'Sledujte své výdaje pravidelně pro lepší přehled.',
          'Budování pasivních příjmů je klíč k finanční svobodě.',
        ]);
      });
  }, []);

  const next = () => setCurrentIndex((i) => (i + 1) % insights.length);
  const prev = () => setCurrentIndex((i) => (i - 1 + insights.length) % insights.length);

  if (insights.length === 0) return null;

  return (
    <div className="card bg-gradient-to-br from-primary-500 to-primary-700 text-white">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">🤖</span>
        <h3 className="text-sm font-semibold uppercase tracking-wider opacity-80">
          AI Poradce
        </h3>
      </div>

      <p className="text-sm leading-relaxed min-h-[60px]">
        {insights[currentIndex]}
      </p>

      <div className="flex items-center justify-between mt-4">
        <div className="flex gap-1">
          {insights.map((_, i) => (
            <div
              key={i}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${
                i === currentIndex ? 'bg-white' : 'bg-white/30'
              }`}
            />
          ))}
        </div>

        <div className="flex gap-2">
          <button
            onClick={prev}
            className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-sm"
          >
            ‹
          </button>
          <button
            onClick={next}
            className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-sm"
          >
            ›
          </button>
        </div>
      </div>
    </div>
  );
}
