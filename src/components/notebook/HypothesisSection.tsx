'use client';

import { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Save, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

import { Hypothesis } from '@/types';

interface HypothesisSectionProps {
  hypotheses: Hypothesis[];
  onHypothesesChange: (hypotheses: Hypothesis[]) => void;
}

export default function HypothesisSection({
  hypotheses,
  onHypothesesChange,
}: HypothesisSectionProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-save with 2-second delay
  const triggerAutoSave = () => {
    setIsSaving(true);
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      setIsSaving(false);
      setLastSaved(new Date());
      // TODO: Save to backend API here
      console.log('Auto-saved hypotheses');
    }, 2000);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const addHypothesis = () => {
    const newHypothesis: Hypothesis = {
      id: `hypothesis-${Date.now()}`,
      projectId: '', // Will be set by the parent component
      content: '',
      position: hypotheses.length,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = [...hypotheses, newHypothesis];
    onHypothesesChange(updated);
    setEditingId(newHypothesis.id);
  };

  const updateHypothesis = (id: string, content: string) => {
    const updated = hypotheses.map(h =>
      h.id === id ? { ...h, content } : h
    );
    onHypothesesChange(updated);
    triggerAutoSave();
  };

  const deleteHypothesis = (id: string) => {
    if (window.confirm('Delete this hypothesis?')) {
      const updated = hypotheses.filter(h => h.id !== id);
      onHypothesesChange(updated);
      triggerAutoSave();
    }
  };

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {/* <h3 className="text-sm font-semibold text-purple-900">Research Hypotheses</h3> */}
          {isSaving && (
            <span className="text-xs text-purple-600 flex items-center gap-1">
              <Save size={12} className="animate-pulse" />
              Saving...
            </span>
          )}
          {!isSaving && lastSaved && (
            <span className="text-xs text-purple-600 flex items-center gap-1">
              <Check size={12} />
              Saved
            </span>
          )}
        </div>
      </div>
  
      {/* Moved button here, outside the flex container */}
      <Button
  onClick={addHypothesis}
  size="sm"
  variant="outline"
  className="ml-4 mb-3 text-purple-700 border-purple-300 hover:bg-purple-50"
>
  <Plus size={14} className="mr-0.5" />
  Add Hypothesis
</Button>
  
      {hypotheses.length === 0 ? (
        <div 
        //   className="p-6 rounded-lg border-2 border-dashed text-center"
                    className="text-center"
        //   style={{ backgroundColor: '#F3E5F5', borderColor: '#CE93D8' }}
        >
          <p className="text-sm text-purple-700 mb-3">
            No hypotheses yet. Add your first research hypothesis to begin.
          </p>
          {/* <Button
            onClick={addHypothesis}
            size="sm"
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Plus size={14} className="mr-1" />
            Add First Hypothesis
          </Button> */}
        </div>
      ) : (
        <div className="space-y-3 px-4">
          {hypotheses.map((hypothesis, index) => (
            <div
              key={hypothesis.id}
              className="p-3 rounded-lg border transition-all"
              style={{ 
                backgroundColor: '#F3E5F5',
                borderColor: editingId === hypothesis.id ? '#9C27B0' : '#E1BEE7',
                borderWidth: editingId === hypothesis.id ? '2px' : '1px'
              }}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold text-white"
                    style={{ backgroundColor: '#9C27B0' }}
                  >
                    H{index + 1}
                  </div>
                </div>
                
                <div className="flex-1">
                  <textarea
                    value={hypothesis.content}
                    onChange={(e) => updateHypothesis(hypothesis.id, e.target.value)}
                    onFocus={() => setEditingId(hypothesis.id)}
                    onBlur={() => setEditingId(null)}
                    placeholder="Enter your research hypothesis..."
                    className="w-full p-1 rounded border border-purple-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:outline-none resize-none bg-white text-gray-900"
                    rows={2}
                    style={{ minHeight: '50px' }}
                  />
                </div>

                <Button
                  onClick={() => deleteHypothesis(hypothesis.id)}
                  size="sm"
                  variant="ghost"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}