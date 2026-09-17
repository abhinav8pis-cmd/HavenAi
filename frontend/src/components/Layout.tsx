import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Home, MessageCircle, Mic, Book, Activity, HeartHandshake, Settings, LogOut, AlertCircle, ClipboardList, Dumbbell } from 'lucide-react';
import clsx from 'clsx';

export function Layout() {
  const navigate = useNavigate();

  const navItems = [
    { name: 'Home',          path: '/',            icon: Home },
    { name: 'Voice Sanctuary', path: '/voice',     icon: Mic, highlight: true },
    { name: 'Chat Companion',  path: '/chat',      icon: MessageCircle },
    { name: 'Journal',         path: '/journal',   icon: Book },
    { name: 'Mood',            path: '/mood',      icon: Activity },
    { name: 'Assessments',     path: '/assessments', icon: ClipboardList },
    { name: 'Exercises',       path: '/exercises', icon: Dumbbell },
    { name: 'Support',         path: '/support',   icon: HeartHandshake },
    { name: 'Settings',        path: '/settings',  icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-[#f9f6f0] text-[#2b213a] font-sans overflow-hidden">
      {/* Desktop Sanctuary Sidebar */}
      <aside className="hidden md:flex w-64 bg-[#4a3b69] text-white flex-col rounded-r-3xl shadow-xl z-20 transition-all shrink-0">
        <div className="p-8 pb-6 flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#a8d5ba] to-[#fbc4ab] shadow-[0_0_18px_rgba(168,213,186,0.65)] animate-pulse shrink-0" />
          <div>
            <h1 className="text-xl font-bold tracking-wide leading-none">HAVEN AI</h1>
            <p className="text-[11px] text-white/60 tracking-wider uppercase mt-1">Digital Sanctuary</p>
          </div>
        </div>

        <nav className="flex-1 px-4 mt-2 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3.5 px-4 py-3 rounded-2xl transition-all duration-200 text-sm font-medium',
                  isActive 
                    ? 'bg-white/20 text-white shadow-sm' 
                    : item.highlight
                      ? 'text-[#a8d5ba] hover:bg-white/10 hover:text-white'
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                )
              }
            >
              <item.icon className={clsx('w-5 h-5 shrink-0', item.highlight && 'animate-pulse')} />
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>

        {/* Urgent Crisis Button in Sidebar */}
        <div className="p-4 pt-2 border-t border-white/10">
          <button
            onClick={() => navigate('/support')}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-400/30 rounded-xl text-xs font-medium transition-colors"
          >
            <AlertCircle className="w-4 h-4 text-red-300" />
            <span>Crisis & Immediate Help</span>
          </button>
        </div>

        <div className="p-4 pt-1 mb-2">
          <button 
            onClick={() => navigate('/onboarding')}
            className="flex items-center gap-3 px-4 py-2.5 w-full rounded-xl text-white/60 hover:bg-white/5 hover:text-white transition-colors text-xs"
          >
            <LogOut className="w-4 h-4" />
            <span>Restart Onboarding</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Floating Help Banner for quick access on all viewports */}
        <div className="absolute top-4 right-4 md:top-6 md:right-8 z-30 flex items-center gap-3">
          <button 
            onClick={() => navigate('/support')}
            className="px-4 py-1.5 md:px-5 md:py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-full font-medium shadow-sm transition-all border border-red-200 text-xs md:text-sm flex items-center gap-1.5"
            aria-label="I need immediate help"
          >
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping inline-block" />
            Need immediate help?
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-10 pb-20 md:pb-10">
          <div className="max-w-5xl mx-auto h-full">
            <Outlet />
          </div>
        </div>

        {/* Mobile Bottom Navigation Bar */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 flex justify-around items-center py-2.5 px-2 z-40 shadow-lg">
          <NavLink
            to="/"
            className={({ isActive }) =>
              clsx('flex flex-col items-center gap-1 px-2 py-1 text-xs', isActive ? 'text-[#4a3b69] font-bold' : 'text-gray-500')
            }
          >
            <Home className="w-5 h-5" />
            <span>Home</span>
          </NavLink>

          <NavLink
            to="/voice"
            className={({ isActive }) =>
              clsx('flex flex-col items-center gap-1 px-2 py-1 text-xs', isActive ? 'text-[#4a3b69] font-bold' : 'text-[#a8d5ba]')
            }
          >
            <div className="w-7 h-7 rounded-full bg-[#4a3b69] text-white flex items-center justify-center -mt-3 shadow-md">
              <Mic className="w-4 h-4" />
            </div>
            <span>Voice</span>
          </NavLink>

          <NavLink
            to="/chat"
            className={({ isActive }) =>
              clsx('flex flex-col items-center gap-1 px-2 py-1 text-xs', isActive ? 'text-[#4a3b69] font-bold' : 'text-gray-500')
            }
          >
            <MessageCircle className="w-5 h-5" />
            <span>Chat</span>
          </NavLink>

          <NavLink
            to="/journal"
            className={({ isActive }) =>
              clsx('flex flex-col items-center gap-1 px-2 py-1 text-xs', isActive ? 'text-[#4a3b69] font-bold' : 'text-gray-500')
            }
          >
            <Book className="w-5 h-5" />
            <span>Journal</span>
          </NavLink>

          <NavLink
            to="/mood"
            className={({ isActive }) =>
              clsx('flex flex-col items-center gap-1 px-2 py-1 text-xs', isActive ? 'text-[#4a3b69] font-bold' : 'text-gray-500')
            }
          >
            <Activity className="w-5 h-5" />
            <span>Mood</span>
          </NavLink>

          <NavLink
            to="/settings"
            className={({ isActive }) =>
              clsx('flex flex-col items-center gap-1 px-2 py-1 text-xs', isActive ? 'text-[#4a3b69] font-bold' : 'text-gray-500')
            }
          >
            <Settings className="w-5 h-5" />
            <span>Settings</span>
          </NavLink>
        </nav>
      </main>
    </div>
  );
}
