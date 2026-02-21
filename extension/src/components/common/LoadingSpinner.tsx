import React from 'react';

export default function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass = { sm: 'w-5 h-5', md: 'w-8 h-8', lg: 'w-12 h-12' }[size];

  return (
    <div className="flex items-center justify-center p-8">
      <div
        className={`${sizeClass} border-3 border-gray-200 dark:border-gray-700 border-t-primary-500 rounded-full animate-spin`}
        style={{ borderWidth: '3px' }}
      />
    </div>
  );
}
