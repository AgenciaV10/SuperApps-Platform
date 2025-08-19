import React from 'react';
import './index.css';

function App() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Test Primary Colors - bolt.diy UnoCSS Fix
        </h1>
        
        {/* Test bg-primary classes */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-800">Background Primary Classes</h2>
          
          <div className="bg-primary p-4 rounded-lg">
            <p className="text-white font-medium">bg-primary (100% opacity)</p>
          </div>
          
          <div className="bg-primary/90 p-4 rounded-lg">
            <p className="text-white font-medium">bg-primary/90 (90% opacity)</p>
          </div>
          
          <div className="bg-primary/80 p-4 rounded-lg">
            <p className="text-white font-medium">bg-primary/80 (80% opacity) - This was causing the error!</p>
          </div>
          
          <div className="bg-primary/70 p-4 rounded-lg">
            <p className="text-white font-medium">bg-primary/70 (70% opacity)</p>
          </div>
          
          <div className="bg-primary/50 p-4 rounded-lg">
            <p className="text-gray-900 font-medium">bg-primary/50 (50% opacity)</p>
          </div>
          
          <div className="bg-primary/20 p-4 rounded-lg border">
            <p className="text-gray-900 font-medium">bg-primary/20 (20% opacity)</p>
          </div>
        </div>
        
        {/* Test text-primary classes */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-800">Text Primary Classes</h2>
          
          <div className="bg-white p-4 rounded-lg border space-y-2">
            <p className="text-primary font-medium">text-primary (100% opacity)</p>
            <p className="text-primary/80 font-medium">text-primary/80 (80% opacity)</p>
            <p className="text-primary/60 font-medium">text-primary/60 (60% opacity)</p>
            <p className="text-primary/40 font-medium">text-primary/40 (40% opacity)</p>
          </div>
        </div>
        
        {/* Test buttons with primary colors */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-800">Button Examples</h2>
          
          <div className="flex flex-wrap gap-4">
            <button className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-lg font-medium transition-colors">
              Primary Button
            </button>
            
            <button className="bg-primary/80 hover:bg-primary text-white px-6 py-3 rounded-lg font-medium transition-colors">
              Primary/80 Button
            </button>
            
            <button className="border-2 border-primary text-primary hover:bg-primary/10 px-6 py-3 rounded-lg font-medium transition-colors">
              Outline Primary
            </button>
          </div>
        </div>
        
        {/* Success message */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">
                ✅ If you can see this page without PostCSS errors, the bg-primary/80 fix is working!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;