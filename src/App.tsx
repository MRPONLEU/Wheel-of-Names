import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  RotateCcw, 
  Trash2, 
  Play, 
  Save, 
  Check,
  Pencil,
  Copy,
  FileDown,
  FileUp,
  History as HistoryIcon, 
  Settings2,
  Trophy,
  Users,
  X,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  ChevronDown
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
  const [settings, setSettings] = useState<WheelSettings>(() => {
    const saved = localStorage.getItem('wheel-settings');
    return saved ? JSON.parse(saved) : {
      soundEnabled: true,
      soundTheme: 'tick',
      enableConfetti: true,
      spinDuration: 5,
      palette: 'default',
      volume: 0.5,
      fontFamily: "'Hanuman'",
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
  const [isSavedFeedback, setIsSavedFeedback] = useState(false);

  const [activeTab, setActiveTab] = useState<'wheel' | 'groups'>(() => {
    const saved = localStorage.getItem('wheel-active-tab');
    return (saved === 'wheel' || saved === 'groups') ? saved : 'wheel';
  });
  const [groupCount, setGroupCount] = useState(() => {
    const saved = localStorage.getItem('wheel-group-count');
    return saved ? parseInt(saved) : 2;
  });

  useEffect(() => {
    localStorage.setItem('wheel-active-tab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    localStorage.setItem('wheel-group-count', groupCount.toString());
  }, [groupCount]);
  const [generatedGroups, setGeneratedGroups] = useState<{ id: string; name: string; members: string[] }[]>(() => {
    const saved = localStorage.getItem('wheel-generated-groups');
    return saved ? JSON.parse(saved) : [];
  });
  const [isShufflingGroups, setIsShufflingGroups] = useState(false);
  const [shufflingNames, setShufflingNames] = useState<string[]>([]);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showClearHistoryConfirm, setShowClearHistoryConfirm] = useState(false);
  const [editingMember, setEditingMember] = useState<{ groupId: string; index: number; value: string } | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  const [newName, setNewName] = useState(() => {
    return localStorage.getItem('wheel-names-text') || '';
  });
  const [showSavedListsDropdown, setShowSavedListsDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowSavedListsDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const [names, setNames] = useState<string[]>(() => {
    const saved = localStorage.getItem('wheel-names');
    return saved ? JSON.parse(saved) : INITIAL_NAMES;
  });
  const [winner, setWinner] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>(() => {
    const saved = localStorage.getItem('wheel-history');
    return saved ? JSON.parse(saved) : [];
  });
  const [isSpinning, setIsSpinning] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const playTick = useCallback(() => {
    if (!settings.soundEnabled) return;
    
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    const ctx = audioContextRef.current;
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    if (settings.soundTheme === 'tick') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.03);
      gain.gain.setValueAtTime(0.4 * settings.volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001 * settings.volume, ctx.currentTime + 0.03);
    } else if (settings.soundTheme === 'pop') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.6 * settings.volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01 * settings.volume, ctx.currentTime + 0.05);
    } else if (settings.soundTheme === 'electronic') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.2 * settings.volume, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01 * settings.volume, ctx.currentTime + 0.08);
    }
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    const duration = settings.soundTheme === 'tick' ? 0.03 : 0.08;
    osc.stop(ctx.currentTime + duration);
  }, [settings.soundEnabled, settings.soundTheme, settings.volume]);

  useEffect(() => {
    let interval: any;
    if (isShufflingGroups) {
      const activeNames = newName.split('\n').map(n => n.trim()).filter(n => n !== '');
      if (activeNames.length > 0) {
        interval = setInterval(() => {
          const randomNames = Array.from({ length: groupCount }).map(() => {
            return activeNames[Math.floor(Math.random() * activeNames.length)];
          });
          setShufflingNames(randomNames);
          playTick();
        }, 100);
      }
    } else {
      setShufflingNames([]);
    }
    return () => clearInterval(interval);
  }, [isShufflingGroups, groupCount, newName, playTick]);
  
  
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
    localStorage.setItem('wheel-names-text', newName);
  }, [newName]);

  useEffect(() => {
    localStorage.setItem('wheel-names', JSON.stringify(names));
  }, [names]);

  useEffect(() => {
    localStorage.setItem('wheel-history', JSON.stringify(history));
  }, [history]);

  // Synchronize names and textarea with selected group whenever groups or selection changes
  useEffect(() => {
    if (selectedGroupId && selectedGroupId !== 'all') {
      const group = generatedGroups.find(g => g.id === selectedGroupId);
      if (group) {
        setNames(group.members);
        setNewName(group.members.join('\n'));
      }
    } else if (selectedGroupId === 'all') {
      const allMembers = generatedGroups.flatMap(g => g.members);
      if (allMembers.length > 0) {
        setNames(allMembers);
        setNewName(allMembers.join('\n'));
      }
    }
  }, [generatedGroups, selectedGroupId]);

  useEffect(() => {
    localStorage.setItem('wheel-settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('wheel-generated-groups', JSON.stringify(generatedGroups));
  }, [generatedGroups]);

  useEffect(() => {
    localStorage.setItem('wheel-saved-lists', JSON.stringify(savedLists));
  }, [savedLists]);

  useEffect(() => {
    // Sync textarea with names only if it's empty (first run with no saved text)
    if (!newName) {
      setNewName(names.join('\n'));
    }
  }, []);

  const updateSetting = (key: keyof WheelSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const updateNamesAndSync = (newNames: string[]) => {
    setNames(newNames);
    setNewName(newNames.join('\n'));
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
    if (!newName.trim()) {
      updateNamesAndSync([]);
      return;
    }
    
    // Support comma, newline, or tab separated names (from Excel/Sheets)
    const splitNames = newName
      .split(/[,\n\t]/)
      .map(n => n.trim())
      .filter(n => n.length > 0);
      
    updateNamesAndSync(splitNames);
  };

  const handleRemoveName = (index: number) => {
    setNames(prev => {
      const newNames = prev.filter((_, i) => i !== index);
      setNewName(newNames.join('\n'));
      
      // If we're editing a saved list, sync it too
      if (newListName.trim()) {
        const trimmedName = newListName.trim();
        setSavedLists(currentLists => {
          const existingIndex = currentLists.findIndex(l => l.name === trimmedName);
          if (existingIndex >= 0) {
            const updatedLists = [...currentLists];
            updatedLists[existingIndex] = {
              ...updatedLists[existingIndex],
              names: newNames
            };
            return updatedLists;
          }
          return currentLists;
        });
      }
      return newNames;
    });
  };

  const handleDeleteList = (id: string, name: string) => {
    setSavedLists(prev => prev.filter(l => l.id !== id));
    if (newListName === name) {
      setNewListName('');
    }
  };
  const shuffleArray = <T,>(array: T[]): T[] => {
    const list = [...array];
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
  };

  const handleGenerateGroups = () => {
    const activeNames = newName.split('\n').map(n => n.trim()).filter(n => n !== '');
    if (activeNames.length < groupCount) {
      alert(`ចំនួនសិស្សតិចជាងចំនួនក្រុម។ សូមបញ្ចូលឈ្មោះបន្ថែម។`);
      return;
    }

    setIsShufflingGroups(true);
    setGeneratedGroups([]);

    // Prepare structure
    const result: { id: string; name: string; members: string[] }[] = [];
    for (let i = 0; i < groupCount; i++) {
      result.push({ id: `gen-${i}`, name: `ក្រុមទី ${i + 1}`, members: [] });
    }

    // Animation duration: 3 seconds
    setTimeout(() => {
      // Perform multi-pass shuffle for maximum randomness
      let shuffled = [...activeNames];
      for (let i = 0; i < 3; i++) {
        shuffled = shuffleArray(shuffled);
      }

      // Distribute names
      shuffled.forEach((name: string, index: number) => {
        const groupIndex = index % groupCount;
        if (result[groupIndex]) {
          result[groupIndex].members.push(name);
        }
      });

      setGeneratedGroups(result);
      setIsShufflingGroups(false);
      setShowSuccessPopup(true);
      
      if (settings.soundEnabled) {
        const successSfx = new Audio('https://www.myinstants.com/media/sounds/ta-da.mp3');
        successSfx.volume = settings.volume;
        successSfx.play().catch(() => {});
      }
    }, 3000);

    // Initial shuffle sound removed to use playTick interval instead for consistency with wheel theme
  };

  const handleSaveList = (providedName?: string) => {
    const listName = providedName || newListName.trim();
    const namesToSave = newName.split('\n').map(n => n.trim()).filter(n => n !== '');
    
    if (!listName) {
      const name = prompt('សូមបញ្ចូលឈ្មោះបញ្ជីឈ្មោះ (ឧទាហរណ៍៖ សិស្សថ្នាក់ទី១២ក):');
      if (name) handleSaveList(name);
      return;
    }

    if (namesToSave.length === 0) {
      return;
    }

    const existingIndex = savedLists.findIndex(l => l.name === listName);
    if (existingIndex >= 0) {
      const newLists = [...savedLists];
      newLists[existingIndex].names = namesToSave;
      setSavedLists(newLists);
      setNewListName(listName);
    } else {
      setSavedLists([...savedLists, { id: Date.now().toString(), name: listName, names: namesToSave }]);
      setNewListName(listName);
    }

    // Success feedback
    setIsSavedFeedback(true);
    setTimeout(() => setIsSavedFeedback(false), 1500);
    
    if (settings.soundEnabled) {
      playTick();
    }
  };

  const handleExportCSV = () => {
    if (generatedGroups.length === 0) return;
    
    // Add UTF-8 BOM (\uFEFF) to make Excel recognize Khmer characters
    let csvContent = "\uFEFF"; 
    csvContent += "ឈ្មោះក្រុម (Group Name),សមាជិក (Member)\n";
    generatedGroups.forEach(group => {
      group.members.forEach(member => {
        // Use quotes to prevent issues with commas in names
        csvContent += `"${group.name}","${member}"\n`;
      });
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `groups_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const lines = content.split(/\r?\n/).map(l => l.trim()).filter(l => l !== '');
      
      const importedGroupsMap = new Map<string, string[]>();
      const allMembers: string[] = [];

      lines.forEach(line => {
        // Handle quoted values and commas
        const parts = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
        
        let groupName = "";
        let memberName = "";

        if (parts.length >= 2) {
          groupName = parts[0].trim().replace(/^"|"$/g, '').trim();
          memberName = parts[1].trim().replace(/^"|"$/g, '').trim();
        } else if (parts.length === 1) {
          memberName = parts[0].trim().replace(/^"|"$/g, '').trim();
        }

        const isHeader = (val: string) => {
          const lower = val.toLowerCase();
          return lower === 'name' || 
                 lower === 'member' || 
                 lower === 'ឈ្មោះក្រុម (group name)' || 
                 lower === 'សមាជិក (member)';
        };

        if (memberName && !isHeader(memberName)) {
          if (groupName && !isHeader(groupName)) {
            if (!importedGroupsMap.has(groupName)) {
              importedGroupsMap.set(groupName, []);
            }
            importedGroupsMap.get(groupName)?.push(memberName);
          }
          allMembers.push(memberName);
        }
      });
      
      if (allMembers.length > 0) {
        // If we found group data, reconstruct groups
        if (importedGroupsMap.size > 0) {
          const newGroups = Array.from(importedGroupsMap.entries()).map(([name, members], idx) => ({
            id: `imported-${idx}-${Date.now()}`,
            name,
            members
          }));
          setGeneratedGroups(newGroups);
          setGroupCount(newGroups.length);
        } else {
          // If just a plain list, we might want to clear groups to avoid confusion
          setGeneratedGroups([]);
        }

        setNewName(allMembers.join('\n'));
      }
    };
    reader.readAsText(file);
    if (e.target) e.target.value = '';
  };

  const handleEditMemberInGroup = (groupId: string, memberIndex: number) => {
    const group = generatedGroups.find(g => g.id === groupId);
    if (!group) return;
    
    setEditingMember({
      groupId,
      index: memberIndex,
      value: group.members[memberIndex]
    });
  };

  const handleSaveMemberEdit = () => {
    if (!editingMember) return;
    
    const { groupId, index, value } = editingMember;
    const trimmedValue = value.trim();
    
    if (trimmedValue !== '') {
      setGeneratedGroups(prev => prev.map(g => {
        if (g.id === groupId) {
          const newMembers = [...g.members];
          newMembers[index] = trimmedValue;
          
          // Force immediate sync to names if this group is selected
          if (selectedGroupId === groupId) {
            setNames(newMembers);
          }
          
          return { ...g, members: newMembers };
        }
        return g;
      }));
    }
    setEditingMember(null);
  };

  const handleDeleteMemberFromGroup = (groupId: string, memberIndex: number) => {
    setGeneratedGroups(prev => prev.map(group => {
      if (group.id === groupId) {
        return {
          ...group,
          members: group.members.filter((_, i) => i !== memberIndex)
        };
      }
      return group;
    }));
  };

  const handleEditGroupName = (groupId: string) => {
    const group = generatedGroups.find(g => g.id === groupId);
    if (!group) return;
    
    const newName = prompt('ប្តូរឈ្មោះក្រុម / Edit Group Name:', group.name);
    if (newName && newName.trim()) {
      setGeneratedGroups(prev => prev.map(g => 
        g.id === groupId ? { ...g, name: newName.trim() } : g
      ));
    }
  };

  const copyGroupsToClipboard = () => {
    if (generatedGroups.length === 0) return;
    
    const text = generatedGroups.map(g => {
      return `${g.name}:\n${g.members.join(', ')}`;
    }).join('\n\n');
    
    navigator.clipboard.writeText(text).then(() => {
      alert('លទ្ធផលត្រូវបានចម្លងទុក! / Copied to clipboard!');
    });
  };

  const handleSelectAllGroups = () => {
    const allMembers = generatedGroups.flatMap(g => g.members);
    if (allMembers.length > 0) {
      setNames(allMembers);
      setNewName(allMembers.join('\n'));
      setSelectedGroupId('all');
      setNewListName('ក្រុមទាំងអស់');
    }
  };

  const handleSelectGroup = (groupId: string) => {
    const group = generatedGroups.find(g => g.id === groupId);
    if (group) {
      setSelectedGroupId(groupId);
      setNames(group.members);
      setNewName(group.members.join('\n'));
      setActiveTab('wheel');
      
      // Sync names for saved lists if applicable
      setNewListName(group.name);
    }
  };

  const handleReset = () => {
    if (confirm('តើអ្នកប្រាកដថាចង់កំណត់ឈ្មោះទាំងអស់ឡើងវិញមែនទេ?')) {
      const resetNames = [...INITIAL_NAMES];
      setNames(resetNames);
      setNewName(resetNames.join('\n'));
      setHistory([]);
      setWinner(null);
    }
  };

  const handleSpinComplete = (winnerName: string) => {
    setWinner(winnerName);
    setHistory(prev => {
      const newHistory = [winnerName, ...prev].slice(0, 10);
      return newHistory;
    });
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
    const shuffled = [...names].sort(() => Math.random() - 0.5);
    setNames(shuffled);
    setNewName(shuffled.join('\n'));
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-4 md:p-8 flex flex-col gap-6 font-sans">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-800">កងវិលសំណាង</h1>
          <p className="text-slate-500 font-medium">ធ្វើការសម្រេចចិត្តដោយភាពងាយស្រួល និងរហ័ស។</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowSettings(true)}
            className="px-4 py-3 bg-white border border-slate-200 rounded-xl shadow-sm text-slate-600 hover:bg-slate-50 transition-colors"
            title="ការកំណត់"
          >
            <Settings2 size={20} />
          </button>
          <button 
            onClick={() => setActiveTab('groups')}
            className={`px-6 py-3 rounded-xl shadow-sm font-bold transition-all ${activeTab === 'groups' ? 'bg-indigo-600 text-white shadow-indigo-200' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
          >
            បង្កើតក្រុម
          </button>
          <button 
            onClick={() => setActiveTab('wheel')}
            className={`px-8 py-3 rounded-xl shadow-lg font-bold transition-all ${activeTab === 'wheel' ? 'bg-indigo-600 text-white shadow-indigo-200' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
          >
            កងវិលសំណាង
          </button>
        </div>
      </header>

      {/* Main Content Grid */}
      <main className="flex-1 min-h-0 overflow-hidden relative">
        <AnimatePresence mode="wait">
          {activeTab === 'groups' ? (
            <motion.div 
              key="groups-tab"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex flex-col h-full p-1"
            >
              {/* Group Management - Focused Central View */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col h-full shadow-sm overflow-hidden">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                  <div className="flex items-center gap-3">
                    <Users className="text-indigo-500" size={28} />
                    <h3 className="text-xl font-black text-slate-800">បែងចែកក្រុមសិស្ស</h3>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-4 bg-slate-50 border border-slate-100 px-4 py-2 rounded-2xl">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">ចំនួនក្រុម</span>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => setGroupCount(Math.max(2, groupCount - 1))}
                          className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors shadow-sm font-bold"
                        >
                          -
                        </button>
                        <span className="w-5 text-center font-black text-indigo-600 text-lg leading-none">{groupCount}</span>
                        <button 
                          onClick={() => setGroupCount(Math.min(20, groupCount + 1))}
                          className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors shadow-sm font-bold"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <button 
                      disabled={isShufflingGroups}
                      onClick={handleGenerateGroups}
                      className="px-6 py-3 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <Play size={18} fill="currentColor" />
                      ចាប់ផ្ដើមបែងចែក
                    </button>

                    <motion.button 
                      onClick={() => handleSaveList()}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.95 }}
                      className={`px-6 py-3 border transition-all duration-300 flex items-center justify-center gap-2 rounded-2xl shadow-sm font-bold min-w-[140px] ${
                        isSavedFeedback 
                          ? 'bg-green-500 border-green-600 text-white shadow-green-200' 
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <AnimatePresence mode="wait">
                        {isSavedFeedback ? (
                          <motion.div
                            key="check"
                            initial={{ y: 10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -10, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="flex items-center gap-2"
                          >
                            <Check size={18} />
                            <span>បានរក្សាទុក</span>
                          </motion.div>
                        ) : (
                          <motion.div
                            key="save"
                            initial={{ y: 10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -10, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="flex items-center gap-2"
                          >
                            <Save size={18} />
                            <span>រក្សាទុក</span>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.button>
                  </div>
                </div>
                
                <div className="flex-1 flex flex-col gap-6 h-full min-h-0">
                  <div className="flex gap-6 flex-1 min-h-0">
                    {/* Input Area */}
                    <div className="w-1/4 flex flex-col gap-3 min-w-[200px] relative" ref={dropdownRef}>
                      <div className="flex justify-between items-center px-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                          បញ្ជីឈ្មោះសិស្ស
                        </label>
                        <div className="flex items-center gap-2">
                          <div>
                            <button 
                              onClick={() => setShowSavedListsDropdown(!showSavedListsDropdown)}
                              className={`text-[10px] font-black text-slate-500 hover:text-indigo-600 flex items-center gap-1 bg-slate-100 px-2 py-1 rounded transition-colors ${showSavedListsDropdown ? 'bg-indigo-50 text-indigo-600' : ''}`}
                            >
                              <HistoryIcon size={12} /> បញ្ជីចាស់
                              <ChevronDown size={10} className={`transition-transform duration-200 ${showSavedListsDropdown ? 'rotate-180' : ''}`} />
                            </button>

                            <AnimatePresence>
                              {showSavedListsDropdown && (
                                <motion.div 
                                  initial={{ opacity: 0, scaleY: 0, originY: 0 }}
                                  animate={{ opacity: 1, scaleY: 1 }}
                                  exit={{ opacity: 0, scaleY: 0 }}
                                  className="absolute left-0 right-0 top-[35px] bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden"
                                >
                                  <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">
                                      បញ្ជីដែលបានរក្សាទុក ({savedLists.length})
                                    </h4>
                                    <button 
                                      onClick={() => setShowSavedListsDropdown(false)}
                                      className="p-1 hover:bg-slate-200 rounded-full transition-colors text-slate-400"
                                    >
                                      <Minimize size={14} />
                                    </button>
                                  </div>
                                  
                                  <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                                    {savedLists.length === 0 ? (
                                      <div className="p-10 text-center">
                                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-dashed border-slate-200">
                                          <HistoryIcon size={24} className="text-slate-300" />
                                        </div>
                                        <p className="text-sm text-slate-400 font-medium italic">មិនទាន់មានបញ្ជីនៅឡើយ</p>
                                      </div>
                                    ) : (
                                      <div className="p-2 space-y-1">
                                        {savedLists.map((list) => (
                                          <div 
                                            key={list.id} 
                                            className="group flex items-center justify-between p-3 hover:bg-indigo-50 rounded-xl transition-all cursor-pointer border border-transparent hover:border-indigo-100"
                                          >
                                            <button 
                                              onClick={() => {
                                                setNames(list.names);
                                                setNewName(list.names.join('\n'));
                                                setNewListName(list.name);
                                                setShowSavedListsDropdown(false);
                                              }}
                                              className="flex-1 text-left px-2 min-w-0"
                                            >
                                              <p className="text-base font-bold text-slate-700 truncate">{list.name}</p>
                                              <p className="text-xs text-slate-400 font-medium flex items-center gap-1.5 mt-0.5">
                                                <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full"></span>
                                                {list.names.length} នាក់
                                              </p>
                                            </button>
                                            
                                            <button 
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteList(list.id, list.name);
                                              }}
                                              className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all sm:opacity-0 group-hover:opacity-100"
                                              title="លុបចោល"
                                            >
                                              <Trash2 size={18} />
                                            </button>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                          
                          <input 
                            type="file" 
                            ref={fileInputRef} 
                            className="hidden" 
                            accept=".csv,.txt"
                            onChange={handleImportCSV} 
                          />
                          <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="text-[10px] font-black text-indigo-500 hover:text-indigo-700 flex items-center gap-1 bg-indigo-50 px-2 py-1 rounded"
                          >
                            <FileUp size={12} /> Import
                          </button>
                        </div>
                      </div>
                      <textarea 
                        value={newName}
                        onChange={(e) => {
                          const val = e.target.value;
                          setNewName(val);
                          const splitNames = val.split(/[,\n\t]/).map(n => n.trim()).filter(n => n.length > 0);
                          setNames(splitNames);
                        }}
                        placeholder="បញ្ចូលឈ្មោះសិស្សនៅទីនេះ..."
                        className="flex-1 w-full bg-slate-50 border border-slate-100 rounded-3xl p-4 text-slate-700 focus:ring-2 focus:ring-indigo-500 resize-none font-medium text-base custom-scrollbar outline-none shadow-inner"
                      />
                      
                      {/* Clean up spacing */}
                      <div className="mt-2"></div>

                      <button 
                        onClick={() => setShowClearConfirm(true)}
                        className="py-3 bg-slate-100 text-slate-500 font-bold rounded-2xl hover:bg-red-50 hover:text-red-600 transition-all flex items-center justify-center gap-2 border border-transparent text-sm mt-2"
                      >
                        <Trash2 size={16} />
                        សម្អាតទាំងអស់
                      </button>
                    </div>

                    {/* Results Area */}
                    <div className="flex-1 flex flex-col gap-3 min-w-0">
                      <div className="flex justify-between items-center px-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                          លទ្ធផលក្រុម (អូសទៅឆ្វេង/ស្តាំសម្រាប់មើលច្រើន)
                        </label>
                        {generatedGroups.length > 0 && !isShufflingGroups && (
                          <div className="flex gap-2">
                            <button 
                              onClick={handleExportCSV}
                              className="text-xs font-bold text-green-600 hover:text-green-800 flex items-center gap-1.5 px-3 py-1.5 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                            >
                              <FileDown size={14} /> Export Excel
                            </button>
                            <button 
                              onClick={copyGroupsToClipboard}
                              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
                            >
                              <Copy size={14} /> ចម្លង
                            </button>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 bg-slate-50 rounded-[2.5rem] p-4 overflow-x-auto overflow-y-hidden custom-scrollbar border border-slate-100">
                        {isShufflingGroups ? (
                          <div className="h-full flex gap-4">
                            {Array.from({ length: groupCount }).map((_, idx) => (
                              <div key={idx} className="flex-shrink-0 w-64 bg-white/80 backdrop-blur-sm border-2 border-dashed border-indigo-200 rounded-3xl p-6 flex flex-col items-center justify-center gap-4">
                                <span className="font-black text-indigo-300 text-[10px] uppercase tracking-[0.2em]">កំពុងជ្រើសរើស...</span>
                                <div className="text-lg font-black text-indigo-500 h-8 flex items-center justify-center">
                                  <motion.span
                                    key={shufflingNames[idx]}
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                  >
                                    {shufflingNames[idx] || '...'}
                                  </motion.span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : generatedGroups.length > 0 ? (
                          <div className="flex gap-4 h-full">
                            {generatedGroups.map((group) => (
                              <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                key={group.id} 
                                className="flex-shrink-0 w-72 bg-white border border-slate-100 rounded-3xl flex flex-col shadow-sm hover:shadow-md transition-all group overflow-hidden"
                              >
                                <div className="p-4 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center shrink-0">
                                  <span className="font-black text-indigo-600 text-sm uppercase tracking-wider">{group.name}</span>
                                  <div className="flex items-center gap-1">
                                    <button 
                                      onClick={() => handleEditGroupName(group.id)}
                                      className="p-1.5 text-slate-300 hover:text-indigo-500 transition-colors"
                                    >
                                      <Pencil size={14} />
                                    </button>
                                    <span className="text-[10px] font-black text-slate-400 bg-white px-2 py-0.5 rounded-full border border-slate-100">{group.members.length}</span>
                                  </div>
                                </div>
                                <div className="flex-1 p-4 overflow-y-auto custom-scrollbar flex flex-col gap-2">
                                  {group.members.map((member, i) => (
                                    <motion.div 
                                      initial={{ opacity: 0, x: -5 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ delay: i * 0.05 }}
                                      key={i} 
                                      className="flex justify-between items-center text-sm font-bold text-slate-700 bg-slate-50 border border-slate-100 px-3 py-2.5 rounded-xl group/member"
                                    >
                                      <div className="flex items-center gap-2 overflow-hidden flex-1 mr-2">
                                        {editingMember?.groupId === group.id && editingMember?.index === i ? (
                                          <input 
                                            autoFocus
                                            value={editingMember.value}
                                            onChange={(e) => setEditingMember({ ...editingMember, value: e.target.value })}
                                            onBlur={handleSaveMemberEdit}
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter') handleSaveMemberEdit();
                                              if (e.key === 'Escape') setEditingMember(null);
                                            }}
                                            className="w-full bg-white border border-indigo-300 rounded-lg px-2 py-0.5 text-sm outline-none ring-2 ring-indigo-100"
                                          />
                                        ) : (
                                          <span className="truncate">{member}</span>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover/member:opacity-100 transition-all">
                                        {!editingMember && (
                                          <>
                                            <button 
                                              onClick={() => handleEditMemberInGroup(group.id, i)}
                                              className="text-slate-300 hover:text-indigo-500 p-1"
                                              title="កែសម្រួល"
                                            >
                                              <Pencil size={12} />
                                            </button>
                                            <button 
                                              onClick={() => handleDeleteMemberFromGroup(group.id, i)}
                                              className="text-slate-300 hover:text-red-500 p-1"
                                              title="លុប"
                                            >
                                              <X size={14} />
                                            </button>
                                          </>
                                        )}
                                      </div>
                                    </motion.div>
                                  ))}
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        ) : (
                          <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                            <Users size={80} className="mb-6 opacity-10" />
                            <p className="text-xl font-bold text-slate-500 mb-2">ត្រៀមខ្លួនរួចរាល់ហើយ!</p>
                            <p className="text-slate-400 max-w-xs text-sm">បញ្ចូលឈ្មោះសិស្ស និងកំណត់ចំនួនក្រុម <br/> រួចចុចប៊ូតុង "ចាប់ផ្ដើមបែងចែក" ដើម្បីទទួលបានលទ្ធផល</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="wheel-tab"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              className="grid grid-cols-1 md:grid-cols-12 gap-6 h-full p-1"
            >
              {/* Left Column: Groups & Names (3 cols) */}
              <section className="md:col-span-3 flex flex-col gap-4 overflow-hidden h-full">
                {/* Groups Selection */}
                <div className="bg-white rounded-3xl border border-slate-200 p-5 flex flex-col flex-1 shadow-sm overflow-hidden h-full">
                  <h3 className="text-xs font-black text-indigo-500 uppercase tracking-[0.2em] mb-4 flex items-center justify-between">
                    <span>ក្រុមដែលបានបែងចែក</span>
                    <span className="bg-indigo-50 px-2 py-0.5 rounded text-[10px]">{generatedGroups.length} ក្រុម</span>
                  </h3>
                  <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 flex flex-col gap-2">
                    {generatedGroups.length > 0 && (
                      <button 
                        onClick={handleSelectAllGroups}
                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${selectedGroupId === 'all' ? 'bg-indigo-600 border-indigo-600 shadow-md shadow-indigo-100 text-white' : 'bg-indigo-50 border-indigo-100 text-indigo-600 hover:bg-indigo-100'}`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${selectedGroupId === 'all' ? 'bg-white/20' : 'bg-white border border-indigo-100'}`}>
                          <Users size={16} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-black italic">ជ្រើសរើសទាំងអស់</span>
                          <span className={`text-[10px] font-bold ${selectedGroupId === 'all' ? 'text-indigo-100' : 'text-indigo-400'}`}>{generatedGroups.reduce((acc, g) => acc + g.members.length, 0)} នាក់</span>
                        </div>
                      </button>
                    )}

                    {generatedGroups.map((group) => (
                      <button 
                        key={group.id}
                        onClick={() => handleSelectGroup(group.id)}
                        className={`flex flex-col items-start p-3 rounded-xl border transition-all text-left group ${selectedGroupId === group.id ? 'bg-indigo-600 border-indigo-600 shadow-md shadow-indigo-100' : 'bg-slate-50 border-slate-100 hover:bg-white hover:border-indigo-200'}`}
                      >
                        <span className={`text-sm font-black ${selectedGroupId === group.id ? 'text-white' : 'text-slate-800'}`}>{group.name}</span>
                        <span className={`text-[10px] font-bold ${selectedGroupId === group.id ? 'text-indigo-100' : 'text-slate-400'}`}>{group.members.length} នាក់</span>
                      </button>
                    ))}

                    {generatedGroups.length === 0 && (
                      <div className="flex-1 flex flex-col items-center justify-center text-slate-300 gap-4 py-10 text-center">
                        <Users size={24} className="opacity-20" />
                        <p className="font-bold text-xs text-slate-400">មិនទាន់មានក្រុម</p>
                      </div>
                    )}
                  </div>
                  
                  <button 
                    onClick={() => setActiveTab('groups')}
                    className="mt-4 py-4 bg-slate-50 text-indigo-600 font-bold rounded-2xl text-xs hover:bg-indigo-100 transition-all flex items-center justify-center gap-2 border border-slate-100"
                  >
                    <Plus size={14} />
                    បន្ថែមឈ្មោះ ឬ បង្កើតក្រុម
                  </button>
                </div>
              </section>

              {/* Center Column: The Wheel (6 cols) */}
              <section ref={wheelContainerRef} className={`md:col-span-6 bg-white border border-slate-200 p-4 shadow-xl flex items-center justify-center relative overflow-hidden h-full ${isFullscreen ? 'rounded-none' : 'rounded-3xl'}`}>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(99,102,241,0.05)_0%,_transparent_70%)] pointer-events-none"></div>
                
                <button 
                  onClick={toggleFullscreen} 
                  className="absolute top-4 right-4 z-20 p-2 text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors shadow-sm"
                  title="បិទ/បើក ពេញអេក្រង់"
                >
                  {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
                </button>

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
                    onSpinClick={names.length >= 2 ? () => {
                      if (!document.fullscreenElement) {
                        toggleFullscreen();
                      }
                      setIsSpinning(true);
                    } : undefined}
                  />
                </div>

                <AnimatePresence>
                  {showConfetti && <Confetti absolute={true} volume={settings.soundEnabled ? 0.2 : 0} />}
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
                        <button onClick={() => { 
                          setWinner(null); 
                          if (document.fullscreenElement) document.exitFullscreen();
                        }} className="absolute top-6 right-6 p-2 text-slate-300 hover:text-slate-600 transition-colors"><X size={24} /></button>
                        <div className="w-20 h-20 bg-amber-50 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-amber-100 relative">
                          <Trophy size={40} className="text-amber-500" />
                          <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0, 1, 0] }} transition={{ duration: 2, repeat: Infinity }} className="absolute inset-0 bg-amber-200 rounded-3xl -z-10" />
                        </div>
                        <h3 className="text-sm font-bold text-indigo-500 mb-2 uppercase tracking-[0.2em] flex items-center justify-center gap-2">🎉 អបអរសាទរ! 🎉</h3>
                        <motion.p initial={{ scale: 0.5 }} animate={{ scale: 1 }} className="text-4xl md:text-5xl font-display font-black text-slate-900 break-words mb-10 leading-tight">{winner}</motion.p>
                        <div className="grid grid-cols-2 gap-4">
                          <button onClick={() => { 
                            setWinner(null); 
                            if (document.fullscreenElement) document.exitFullscreen();
                          }} className="px-6 py-4 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-2xl font-bold transition-colors">បិទ</button>
                          <button onClick={() => { 
                            removeWinner(); 
                            if (document.fullscreenElement) document.exitFullscreen();
                          }} className="px-6 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold shadow-lg shadow-indigo-200 transition-all">លុបឈ្មោះចេញ</button>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </section>

              {/* Right Column: Winners History (3 cols) */}
              <section className="md:col-span-3 flex flex-col gap-6 h-full overflow-hidden">
                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col h-full overflow-hidden">
                  <h3 className="text-xs font-black text-indigo-500 uppercase tracking-[0.2em] mb-4 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                       <HistoryIcon size={14} className="text-amber-500" />
                       ប្រវត្តិអ្នកឈ្នះ
                    </span>
                    <span className="bg-amber-50 text-amber-600 px-2 py-0.5 rounded text-[10px] font-black">{history.length}</span>
                  </h3>
                  <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-2 pr-1">
                    <AnimatePresence initial={false}>
                      {history.map((name, i) => (
                        <motion.div 
                          key={`${name}-${i}`} 
                          initial={{ opacity: 0, x: 10 }} 
                          animate={{ opacity: 1, x: 0 }} 
                          className={`flex justify-between items-center p-3 rounded-xl border transition-all ${i === 0 ? 'bg-amber-50 border-amber-200 shadow-sm' : 'bg-slate-50 border-slate-100 opacity-80'}`}
                        >
                          <span className={`text-sm font-black truncate mr-2 ${i === 0 ? 'text-amber-900' : 'text-slate-700'}`}>{name}</span>
                          {i === 0 && <span className="text-[10px] uppercase font-black text-amber-500 flex-shrink-0">ចុងក្រោយ</span>}
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    {history.length === 0 && (
                      <div className="flex-1 flex flex-col items-center justify-center text-slate-300 gap-3 py-10 italic text-sm">
                        <HistoryIcon size={24} className="opacity-10" />
                        កំពុងរង់ចាំការវិល...
                      </div>
                    )}
                  </div>
                  {history.length > 0 && (
                    <button 
                      onClick={() => setShowClearHistoryConfirm(true)} 
                      className="mt-4 w-full py-3 bg-red-50 text-red-500 text-xs font-black rounded-xl hover:bg-red-100 transition-colors uppercase tracking-widest"
                    >
                      សម្អាតប្រវត្តិ
                    </button>
                  )}
                </div>
              </section>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer Info */}
      <footer className="flex flex-col md:flex-row justify-between items-center px-6 py-3 bg-slate-200/50 rounded-2xl gap-4">
        <div className="flex flex-wrap gap-6 justify-center">
          <span className="text-[10px] text-slate-500 uppercase">
            <strong>ការផ្ទុក:</strong> បានបើក ({names.length} ឈ្មោះ)
          </span>
          <span className="text-[10px] text-slate-500 uppercase">
            <strong>ភាពយុត្តិធម៌:</strong> CSPRNG Unbiased
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
                  ការកំណត់
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
                    <span className="text-sm font-bold text-slate-700 block">សម្លេង</span>
                    <span className="text-xs text-slate-500">ចាក់សម្លេងពេលវិល</span>
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
                    <span className="text-sm font-bold text-slate-700 block">ប្រភេទសម្លេង</span>
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
                    <span className="text-sm font-bold text-slate-700 block">ពណ៌</span>
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
                    <span className="text-sm font-bold text-slate-700 block">ប្រភេទអក្សរ</span>
                  </div>
                  <select 
                     value={settings.fontFamily}
                     onChange={(e) => updateSetting('fontFamily', e.target.value)}
                     className="bg-slate-50 text-sm text-slate-700 font-bold border border-slate-200 rounded-lg px-3 py-2 outline-none cursor-pointer focus:ring-2 focus:ring-indigo-500"
                  >
                     <option value="'Hanuman'">Hanuman (លំនាំដើម)</option>
                     <option value="'Kantumruy Pro'">Kantumruy Pro (Khmer)</option>
                     <option value="'Siemreap'">Siemreap (Khmer)</option>
                     <option value="'Battambang'">Battambang (Khmer)</option>
                     <option value="'Moul'">Moul (Khmer Decorative)</option>
                     <option value="Outfit">Outfit (Display)</option>
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
                    <span className="text-sm font-bold text-slate-700 block">ទំហំអក្សរ ({settings.fontSize}px)</span>
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
                    <span className="text-sm font-bold text-slate-700 block">កំជ្រួចអបអរសាទរ</span>
                    <span className="text-xs text-slate-500">អបអរសាទរអ្នកឈ្នះ</span>
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
                    <span className="text-sm font-bold text-slate-700 block">រយៈពេលវិល ({settings.spinDuration}s)</span>
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
                      <span className="text-sm font-bold text-slate-700 block">កម្រិតសម្លេង ({Math.round(settings.volume * 100)}%)</span>
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

      {/* Success Popup */}
      <AnimatePresence>
        {showSuccessPopup && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.8, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 30 }}
              className="bg-white rounded-[3rem] p-12 max-w-md w-full text-center shadow-2xl border border-slate-100"
            >
              <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-8 relative border-4 border-white shadow-lg">
                <Trophy size={48} className="text-green-500" />
                <motion.div 
                  animate={{ scale: [1, 1.4, 1], opacity: [0, 1, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="absolute inset-0 bg-green-200 rounded-full -z-10"
                />
              </div>
              <h2 className="text-3xl font-black text-slate-900 mb-4">បែងចែកក្រុមជោគជ័យ!</h2>
              <p className="text-slate-500 text-lg mb-10 leading-relaxed font-medium">សិស្សទាំងអស់ត្រូវបានបែងចែកចូលក្នុង <b>{groupCount}</b> ក្រុមដោយយុត្តិធម៌ និងចៃដន្យរួចរាល់ហើយ។</p>
              <button 
                onClick={() => setShowSuccessPopup(false)}
                className="w-full py-5 bg-indigo-600 text-white text-xl font-black rounded-3xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100"
              >
                មើលលទ្ធផល
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Clear All Confirmation Modal */}
      <AnimatePresence>
        {showClearConfirm && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-[2.5rem] p-8 md:p-10 max-w-sm w-full text-center shadow-2xl border border-slate-100"
            >
              <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-red-100 shadow-sm">
                <Trash2 size={32} className="text-red-500" />
              </div>
              <h2 className="text-xl font-black text-slate-900 mb-3">សម្អាតទិន្នន័យទាំងអស់?</h2>
              <p className="text-slate-500 text-sm mb-8 font-medium">តើអ្នកប្រាកដថាចង់សម្អាតទិន្នន័យទាំងអស់មែនទេ? ឈ្មោះ និង ក្រុមទាំងអស់នឹងត្រូវលុបចោល។</p>
              
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => {
                    setNewName('');
                    setNames([]);
                    setGeneratedGroups([]);
                    setNewListName('');
                    setShowClearConfirm(false);
                  }}
                  className="w-full py-4 bg-red-600 text-white font-black rounded-2xl hover:bg-red-700 transition-all shadow-lg shadow-red-100"
                >
                  បាទ/ចាស, សម្អាតទាំងអស់
                </button>
                <button 
                  onClick={() => setShowClearConfirm(false)}
                  className="w-full py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all"
                >
                  បោះបង់
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Clear History Confirmation Modal */}
      <AnimatePresence mode="wait">
        {showClearHistoryConfirm && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-xl"
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-[2.5rem] p-8 md:p-10 max-w-sm w-full text-center shadow-2xl border border-slate-100"
            >
              <div className="w-20 h-20 bg-amber-50 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-amber-100 shadow-sm">
                <HistoryIcon size={32} className="text-amber-500" />
              </div>
              <h2 className="text-xl font-black text-slate-900 mb-3 underline decoration-amber-200 decoration-4 underline-offset-4">សម្អាតប្រវត្តិមែនទេ?</h2>
              <p className="text-slate-500 text-sm mb-8 font-medium">តើអ្នកប្រាកដថាចង់សម្អាតប្រវត្តិអ្នកឈ្នះទាំងអស់មែនទេ? សកម្មភាពនេះមិនអាចត្រឡប់ក្រោយបានទេ។</p>
              
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => {
                    setHistory([]);
                    setWinner(null);
                    localStorage.removeItem('wheel-history');
                    setShowClearHistoryConfirm(false);
                  }}
                  className="w-full py-4 bg-amber-600 text-white font-black rounded-2xl hover:bg-amber-700 transition-all shadow-lg shadow-amber-100 active:scale-95"
                >
                  បាទ/ចាស, សម្អាតប្រវត្តិ
                </button>
                <button 
                  onClick={() => setShowClearHistoryConfirm(false)}
                  className="w-full py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all active:scale-95"
                >
                  បោះបង់
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

