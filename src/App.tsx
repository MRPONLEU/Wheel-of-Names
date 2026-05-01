import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  RotateCcw, 
  Trash2, 
  Play, 
  History as HistoryIcon, 
  Settings2,
  Trophy,
  X,
  Volume2,
  VolumeX,
  Maximize,
  Minimize
} from 'lucide-react';
import { Wheel } from './components/Wheel';
import { Confetti } from './components/Confetti';

const INITIAL_NAMES = [
  'Alice', 'Bob', 'Charlie', 'David', 'Eva', 
  'Frank', 'Grace', 'Hannah', 'Isaac', 'Jack'
];

const PALETTES = {
  default: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F06292', '#AED581', '#FFD54F', '#4DB6AC', '#7986CB', '#9575CD', '#FF8A65', '#81C784', '#64B5F6', '#DCE775'],
  pastel: ['#ffb3ba', '#ffdfba', '#ffffba', '#baffc9', '#bae1ff', '#e8baff', '#ffbaf2'],
  ocean: ['#00b4d8', '#0096c7', '#0077b6', '#023e8a', '#03045e', '#48cae4', '#90e0ef'],
  sunset: ['#ffcdb2', '#ffb4a2', '#e5989b', '#b5838d', '#6d6875', '#f4978e', '#f8ad9d'],
  neon: ['#ff00ff', '#00ffff', '#00ff00', '#ffff00', '#ff0000', '#ff00aa', '#aa00ff']
};

type PaletteType = keyof typeof PALETTES;
type SoundTheme = 'tick' | 'pop' | 'electronic';

interface WheelSettings {
  soundEnabled: boolean;
  soundTheme: SoundTheme;
  enableConfetti: boolean;
  spinDuration: number;
  palette: PaletteType;
  volume: number;
  fontFamily: string;
  fontSize: number;
}

interface SavedList {
  id: string;
  name: string;
  names: string[];
}

export default function App() {
  const [names, setNames] = useState<string[]>(() => {
    const saved = localStorage.getItem('wheel-names');
    return saved ? JSON.parse(saved) : INITIAL_NAMES;
  });
  const [newName, setNewName] = useState('');
  const [winner, setWinner] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>(() => {
    const saved = localStorage.getItem('wheel-history');
    return saved ? JSON.parse(saved) : [];
  });
  const [isSpinning, setIsSpinning] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const [settings, setSettings] = useState<WheelSettings>(() => {
    const saved = localStorage.getItem('wheel-settings');
    return saved ? JSON.parse(saved) : {
      soundEnabled: true,
      soundTheme: 'tick',
      enableConfetti: true,
      spinDuration: 5,
      palette: 'default',
      volume: 0.5,
      fontFamily: 'Outfit',
      fontSize: 24
    };
  });
  const [showSettings, setShowSettings] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const [savedLists, setSavedLists] = useState<SavedList[]>(() => {
    const saved = localStorage.getItem('wheel-saved-lists');
    return saved ? JSON.parse(saved) : [];
  });
  const [savingList, setSavingList] = useState(false);
  const [newListName, setNewListName] = useState('');
  
  const wheelContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      wheelContainerRef.current?.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    localStorage.setItem('wheel-names', JSON.stringify(names));
  }, [names]);

  useEffect(() => {
    localStorage.setItem('wheel-history', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem('wheel-settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('wheel-saved-lists', JSON.stringify(savedLists));
  }, [savedLists]);

  const updateSetting = (key: keyof WheelSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const updateNamesAndSync = (newNames: string[]) => {
    setNames(newNames);
    if (newListName.trim()) {
       const trimmedName = newListName.trim();
       const existingIndex = savedLists.findIndex(l => l.name === trimmedName);
       if (existingIndex >= 0) {
          const newLists = [...savedLists];
          newLists[existingIndex].names = newNames;
          setSavedLists(newLists);
       }
    }
  };

  const handleAddName = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newName.trim()) return;
    
    // Support comma, newline, or tab separated names (from Excel/Sheets)
    const splitNames = newName
      .split(/[,\n\t]/)
      .map(n => n.trim())
      .filter(n => n.length > 0);
      
    updateNamesAndSync([...names, ...splitNames]);
    setNewName('');
  };

  const handleRemoveName = (index: number) => {
    const newNames = names.filter((_, i) => i !== index);
    updateNamesAndSync(newNames);
  };


  const handleReset = () => {
    if (confirm('Are you sure you want to reset all names?')) {
      setNames(INITIAL_NAMES);
      setHistory([]);
      setWinner(null);
    }
  };

  const handleSpinComplete = (winnerName: string) => {
    setWinner(winnerName);
    setHistory(prev => [winnerName, ...prev].slice(0, 50));
    setIsSpinning(false);
    if (settings.enableConfetti) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);
    }
  };

  const removeWinner = () => {
    if (winner) {
      updateNamesAndSync(names.filter(n => n !== winner));
      setWinner(null);
    }
  };

  const shuffleNames = () => {
    setNames([...names].sort(() => Math.random() - 0.5));
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-4 md:p-8 flex flex-col gap-6 font-sans">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-800">Wheel of Names</h1>
          <p className="text-slate-500 font-medium">Randomize your decisions with style.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowSettings(true)}
            className="px-4 py-3 bg-white border border-slate-200 rounded-xl shadow-sm text-slate-600 hover:bg-slate-50 transition-colors"
            title="Settings"
          >
            <Settings2 size={20} />
          </button>
          <button 
            onClick={handleReset}
            className="px-6 py-3 bg-white border border-slate-200 rounded-xl shadow-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Reset
          </button>
          <button 
            onClick={() => setIsSpinning(true)}
            disabled={isSpinning || names.length < 2}
            className="px-8 py-3 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-200 font-bold hover:bg-indigo-700 transition-all disabled:opacity-50"
          >
            Spin Now
          </button>
        </div>
      </header>

      {/* Main Content Grid */}
      <main className="grid grid-cols-1 md:grid-cols-12 gap-6 flex-1 min-h-0">
        
        {/* Left Column: Names Input (3 cols) */}
        <section className="md:col-span-3 flex flex-col gap-4 min-h-[400px] md:min-h-0">
          <div className="bg-white rounded-3xl border border-slate-200 p-5 flex flex-col flex-1 shadow-sm overflow-hidden">
            <div className="flex flex-col gap-2 mb-2">
              <div className="flex items-center gap-2">
                <input 
                  type="text"
                  value={newListName}
                  onChange={e => setNewListName(e.target.value)}
                  placeholder="Enter Group Name..."
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button 
                  onClick={() => {
                    if (newListName.trim() && names.length > 0) {
                      const trimmedName = newListName.trim();
                      const existingIndex = savedLists.findIndex(l => l.name === trimmedName);
                      if (existingIndex >= 0) {
                         const newLists = [...savedLists];
                         newLists[existingIndex].names = [...names];
                         setSavedLists(newLists);
                      } else {
                         setSavedLists([...savedLists, { id: Date.now().toString(), name: trimmedName, names: [...names] }]);
                      }
                      setNewListName('');
                    } else if (names.length === 0) {
                      alert('Please enter some names first.');
                    } else {
                      alert('Please enter a group name.');
                    }
                  }}
                  className="px-4 py-2 bg-indigo-100 text-indigo-700 font-bold rounded-lg text-sm hover:bg-indigo-200 transition-colors whitespace-nowrap"
                >
                  Save Group
                </button>
              </div>
              {savedLists.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  {savedLists.map((list) => (
                    <div key={list.id} className="flex items-stretch bg-indigo-50 border border-indigo-100 rounded-md overflow-hidden">
                      <button
                        onClick={() => {
                          setNames([...list.names]);
                          setNewListName(list.name);
                        }}
                        className="px-3 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition-colors text-left"
                      >
                        {list.name} <span className="opacity-60 ml-1">({list.names.length})</span>
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete group "${list.name}"?`)) {
                            setSavedLists(savedLists.filter(l => l.id !== list.id));
                            if (newListName === list.name) setNewListName('');
                          }
                        }}
                        className="px-2 flex items-center justify-center text-indigo-300 hover:text-red-500 hover:bg-red-50 transition-colors border-l border-indigo-100"
                        title="Delete Group"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                  <button 
                    onClick={() => {
                      const allNames = savedLists.flatMap(l => l.names);
                      setNames(allNames);
                      setNewListName('ទាំងអស់ (All)');
                    }}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors px-2 ml-auto"
                  >
                    Select All
                  </button>
                  <button 
                    onClick={() => {
                      if (confirm('Are you sure you want to delete all saved groups?')) {
                        setSavedLists([]);
                        setNewListName('');
                      }
                    }}
                    className="text-xs font-bold text-red-400 hover:text-red-600 transition-colors px-2"
                  >
                    Clear All
                  </button>
                </div>
              )}
            </div>
            
            <label className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 mt-2">
              Add Names
            </label>
            <textarea 
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Paste from Excel or type names separated by line..."
              className="flex-1 w-full bg-slate-50 border-0 rounded-2xl p-4 text-slate-700 focus:ring-2 focus:ring-indigo-500 resize-none font-medium leading-relaxed custom-scrollbar outline-none"
            />
            <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center bg-white z-10">
              <span className="text-xs font-semibold text-slate-500 uppercase">{names.length} Names</span>
              <div className="flex gap-3 items-center">
                {names.length > 0 && (
                  <button 
                    onClick={() => {
                      if (confirm('Are you sure you want to clear all current names?')) {
                        setNames([]);
                        setNewName('');
                        setNewListName('');
                      }
                    }}
                    className="text-xs font-bold text-slate-400 hover:text-red-500 transition-colors"
                  >
                    Clear Names
                  </button>
                )}
                <button 
                  onClick={shuffleNames}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                >
                  Shuffle
                </button>
                <button 
                  onClick={() => handleAddName()}
                  className="px-3 py-1 bg-indigo-600 text-white rounded text-xs font-bold hover:bg-indigo-700 transition-colors"
                >
                  Add Names
                </button>
              </div>
            </div>
            
            <div className="mt-4 max-h-[200px] overflow-y-auto custom-scrollbar pr-1">
              <AnimatePresence initial={false}>
                {names.map((name, index) => (
                  <motion.div
                    key={`${name}-${index}`}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex items-center justify-between p-2 mb-1 bg-slate-50 rounded-xl group"
                  >
                    <input
                      value={name}
                      onChange={(e) => {
                        const next = [...names];
                        next[index] = e.target.value;
                        updateNamesAndSync(next);
                      }}
                      className="text-sm font-medium text-slate-600 bg-transparent border-none focus:ring-0 w-full"
                    />
                    <button 
                      onClick={() => handleRemoveName(index)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-red-500 transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </section>

        {/* Center Column: The Wheel (6 cols) */}
        <section ref={wheelContainerRef} className={`md:col-span-6 bg-white border border-slate-200 p-4 shadow-xl flex items-center justify-center relative overflow-hidden min-h-[400px] ${isFullscreen ? 'rounded-none' : 'rounded-3xl'}`}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(99,102,241,0.05)_0%,_transparent_70%)] pointer-events-none"></div>
          
          <button 
            onClick={toggleFullscreen} 
            className="absolute top-4 right-4 z-20 p-2 text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors shadow-sm"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
          </button>
          
          {savedLists.length > 0 && (
            <div className="absolute top-4 left-4 z-20 max-w-[200px] w-full">
              <select 
                className="w-full bg-white/90 backdrop-blur-sm border border-slate-200 border-b-2 border-b-indigo-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 outline-none cursor-pointer focus:ring-2 focus:ring-indigo-500 shadow-sm transition-all hover:bg-white"
                value={newListName === 'ទាំងអស់ (All)' ? 'all' : savedLists.find(l => l.name === newListName)?.id || ""}
                onChange={(e) => {
                  if (e.target.value === 'all') {
                    const allNames = savedLists.flatMap(l => l.names);
                    setNames(allNames);
                    setNewListName('ទាំងអស់ (All)');
                  } else if (e.target.value) {
                    const lst = savedLists.find(l => l.id === e.target.value);
                    if (lst) {
                      setNames([...lst.names]);
                      setNewListName(lst.name);
                    }
                  } else {
                    setNewListName('');
                  }
                }}
              >
                <option value="">ជ្រើសរើសក្រុម / Select Group...</option>
                <option value="all">ជ្រើសរើសទាំងអស់ / Select All</option>
                {savedLists.map((l) => (
                  <option key={l.id} value={l.id}>{l.name} ({l.names.length})</option>
                ))}
              </select>
            </div>
          )}

          <div className={`relative w-full aspect-square flex items-center justify-center ${isFullscreen ? 'max-w-[95vh] max-h-[95vh]' : 'max-w-lg'}`}>
            <Wheel 
              names={names} 
              colors={PALETTES[settings.palette] || PALETTES.default} 
              isSpinning={isSpinning} 
              onSpinComplete={handleSpinComplete}
              soundEnabled={settings.soundEnabled}
              soundTheme={settings.soundTheme}
              spinDuration={settings.spinDuration}
              volume={settings.volume}
              fontFamily={settings.fontFamily}
              fontSize={settings.fontSize}
              onSpinClick={names.length >= 2 ? () => setIsSpinning(true) : undefined}
            />
          </div>

          {/* Render absolute overlays inside fullscreen container */}
          <AnimatePresence>
            {showConfetti && <Confetti absolute={true} />}
          </AnimatePresence>

          <AnimatePresence>
            {winner && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
              >
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  className="bg-white rounded-[40px] p-8 md:p-12 max-w-lg w-full text-center shadow-2xl relative border border-slate-100"
                >
                  <button 
                    onClick={() => setWinner(null)}
                    className="absolute top-6 right-6 p-2 text-slate-300 hover:text-slate-600 transition-colors"
                  >
                    <X size={24} />
                  </button>
                  
                  <div className="w-20 h-20 bg-amber-50 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-amber-100">
                    <Trophy size={40} className="text-amber-500" />
                  </div>
                  
                  <h3 className="text-sm font-bold text-slate-400 mb-2 uppercase tracking-[0.2em]">
                    Winner Found!
                  </h3>
                  <p className="text-4xl md:text-5xl font-display font-black text-slate-900 break-words mb-10 leading-tight">
                    {winner}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => setWinner(null)}
                      className="px-6 py-4 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-2xl font-bold transition-colors"
                    >
                      Close
                    </button>
                    <button 
                      onClick={removeWinner}
                      className="px-6 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold shadow-lg shadow-indigo-200 transition-all"
                    >
                      Remove Name
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Right Column: Winners & Settings (3 cols) */}
        <section className="md:col-span-3 flex flex-col gap-6">
          {/* Winners Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm flex flex-col flex-1 min-h-[400px] md:min-h-0">
            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2 uppercase tracking-wide">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              Winner History
            </h3>
            <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-2 pr-1">
              <AnimatePresence initial={false}>
                {history.map((name, i) => (
                  <motion.div 
                    key={`${name}-${i}`}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`flex justify-between items-center p-3 rounded-xl border ${
                      i === 0 
                        ? 'bg-amber-50 border-amber-100' 
                        : 'bg-slate-50 border-slate-100 opacity-70'
                    }`}
                  >
                    <span className={`font-bold ${i === 0 ? 'text-amber-900' : 'text-slate-700'}`}>
                      {name}
                    </span>
                    {i === 0 && <span className="text-[10px] uppercase font-black text-amber-500">Latest</span>}
                  </motion.div>
                ))}
              </AnimatePresence>
              {history.length === 0 && (
                <div className="flex-1 flex items-center justify-center text-slate-300 italic text-sm">
                  Waiting for a spin...
                </div>
              )}
            </div>
            {history.length > 0 && (
              <button 
                onClick={() => setHistory([])}
                className="mt-4 text-center text-xs font-bold text-red-400 hover:text-red-600 transition-colors"
              >
                Clear History
              </button>
            )}
          </div>
        </section>
      </main>

      {/* Footer Info */}
      <footer className="flex flex-col md:flex-row justify-between items-center px-6 py-3 bg-slate-200/50 rounded-2xl gap-4">
        <div className="flex flex-wrap gap-6 justify-center">
          <span className="text-[10px] text-slate-500 uppercase">
            <strong>Storage:</strong> Enabled ({names.length} names)
          </span>
          <span className="text-[10px] text-slate-500 uppercase">
            <strong>Fairness:</strong> CSPRNG Unbiased
          </span>
        </div>
        <div className="flex gap-4">
          <span className="text-[10px] font-black text-slate-400">v2.4.0-BENTO</span>
        </div>
      </footer>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl relative border border-slate-100"
            >
              <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <Settings2 size={24} className="text-indigo-600" />
                  Settings
                </h2>
                <button 
                  onClick={() => setShowSettings(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-sm font-bold text-slate-700 block">Sound Effects</span>
                    <span className="text-xs text-slate-500">Play sounds while spinning</span>
                  </div>
                  <button 
                    onClick={() => updateSetting('soundEnabled', !settings.soundEnabled)}
                    className={`w-12 h-6 rounded-full relative transition-colors ${settings.soundEnabled ? 'bg-indigo-500' : 'bg-slate-200'}`}
                  >
                    <motion.div 
                      animate={{ x: settings.soundEnabled ? 24 : 0 }}
                      className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" 
                    />
                  </button>
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-sm font-bold text-slate-700 block">Sound Theme</span>
                  </div>
                  <select 
                     value={settings.soundTheme}
                     onChange={(e) => updateSetting('soundTheme', e.target.value as SoundTheme)}
                     className="bg-slate-50 text-sm text-slate-700 font-bold border border-slate-200 rounded-lg px-3 py-2 outline-none cursor-pointer focus:ring-2 focus:ring-indigo-500"
                  >
                     <option value="tick">Tick Tick</option>
                     <option value="pop">Pop Drops</option>
                     <option value="electronic">Synthesizer</option>
                  </select>
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-sm font-bold text-slate-700 block">Color Palette</span>
                  </div>
                  <select 
                     value={settings.palette}
                     onChange={(e) => updateSetting('palette', e.target.value as PaletteType)}
                     className="bg-slate-50 text-sm text-slate-700 font-bold border border-slate-200 rounded-lg px-3 py-2 outline-none cursor-pointer focus:ring-2 focus:ring-indigo-500"
                  >
                     <option value="default">Default</option>
                     <option value="pastel">Pastel</option>
                     <option value="ocean">Ocean</option>
                     <option value="sunset">Sunset</option>
                     <option value="neon">Neon</option>
                  </select>
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-sm font-bold text-slate-700 block">Font Style</span>
                  </div>
                  <select 
                     value={settings.fontFamily}
                     onChange={(e) => updateSetting('fontFamily', e.target.value)}
                     className="bg-slate-50 text-sm text-slate-700 font-bold border border-slate-200 rounded-lg px-3 py-2 outline-none cursor-pointer focus:ring-2 focus:ring-indigo-500"
                  >
                     <option value="Outfit">Outfit (Default)</option>
                     <option value="'Kantumruy Pro'">Kantumruy Pro (Khmer)</option>
                     <option value="'Siemreap'">Siemreap (Khmer)</option>
                     <option value="'Battambang'">Battambang (Khmer)</option>
                     <option value="'Moul'">Moul (Khmer Decorative)</option>
                     <option value="'Hanuman'">Hanuman (Khmer Serif)</option>
                     <option value="'Content'">Content (Khmer)</option>
                     <option value="Inter">Inter (Sans)</option>
                     <option value="Caveat">Caveat (Handwriting)</option>
                     <option value="'Playfair Display'">Playfair (Serif)</option>
                     <option value="'JetBrains Mono'">JetBrains (Mono)</option>
                     <option value="'Comic Sans MS', cursive, sans-serif">Comic Sans</option>
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-slate-700 block">Font Size ({settings.fontSize}px)</span>
                  </div>
                  <input 
                    type="range"
                    min="10"
                    max="64"
                    value={settings.fontSize}
                    onChange={(e) => updateSetting('fontSize', parseInt(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-sm font-bold text-slate-700 block">Confetti</span>
                    <span className="text-xs text-slate-500">Celebrate the winner</span>
                  </div>
                  <button 
                    onClick={() => updateSetting('enableConfetti', !settings.enableConfetti)}
                    className={`w-12 h-6 rounded-full relative transition-colors ${settings.enableConfetti ? 'bg-indigo-500' : 'bg-slate-200'}`}
                  >
                    <motion.div 
                      animate={{ x: settings.enableConfetti ? 24 : 0 }}
                      className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" 
                    />
                  </button>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-slate-700 block">Spin Duration ({settings.spinDuration}s)</span>
                  </div>
                  <input 
                    type="range"
                    min="1"
                    max="10"
                    value={settings.spinDuration}
                    onChange={(e) => updateSetting('spinDuration', parseInt(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                </div>

                {settings.soundEnabled && (
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-slate-700 block">Master Volume ({Math.round(settings.volume * 100)}%)</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <VolumeX size={16} className="text-slate-400" />
                      <input 
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={settings.volume}
                        onChange={(e) => updateSetting('volume', parseFloat(e.target.value))}
                        className="w-full accent-indigo-600 focus:outline-none"
                      />
                      <Volume2 size={16} className="text-slate-400" />
                    </div>
                  </div>
                )}
                
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

