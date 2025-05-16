import { useState } from 'react';
import { Shield, Layers, MessageSquare, Database, Settings, ChevronLeft, ChevronRight, LogOut } from 'lucide-react';
import UserAuth from './UserAuth';
import { DIDDocument } from '../services/cheqdService';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isLoggedIn: boolean;
  userDID?: string;
  userDIDDoc?: DIDDocument;
  onLogin: (did: string, didDoc: DIDDocument) => void;
  onLogout: () => void;
}

export default function Layout({
  children,
  activeTab,
  setActiveTab,
  isLoggedIn,
  userDID,
  onLogin,
  onLogout
}: LayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const navItems = [
    { id: 'overview', label: 'Overview', icon: <Layers size={20} /> },
    { id: 'agents', label: 'AI Agents', icon: <Shield size={20} /> },
    { id: 'chat', label: 'AI Chat', icon: <MessageSquare size={20} /> },
    { id: 'data', label: 'Trusted Data', icon: <Database size={20} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={20} /> }
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div 
        className={`bg-blue-600 text-white flex flex-col ${
          isSidebarCollapsed ? 'w-16' : 'w-64'
        } transition-all duration-300 ease-in-out relative`}
      >
        {/* Logo */}
        <div className="p-4 flex items-center justify-between border-b border-blue-500">
          {!isSidebarCollapsed && (
            <div className="flex items-center">
              <Shield size={24} className="mr-2" />
              <h1 className="text-xl font-bold">TrustChain</h1>
            </div>
          )}
          {isSidebarCollapsed && <Shield size={24} className="mx-auto" />}
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-1 rounded hover:bg-blue-500"
          >
            {isSidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-grow py-4">
          <ul>
            {navItems.map(item => (
              <li key={item.id} className="mb-1">
                <button
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center ${
                    isSidebarCollapsed ? 'justify-center px-3' : 'px-6'
                  } py-3 ${
                    activeTab === item.id 
                      ? 'bg-blue-700 font-medium' 
                      : 'hover:bg-blue-500'
                  }`}
                >
                  <span className="flex-shrink-0">{item.icon}</span>
                  {!isSidebarCollapsed && <span className="ml-3">{item.label}</span>}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* User Authentication */}
        <div className={`p-4 border-t border-blue-500 ${isSidebarCollapsed ? 'text-center' : ''}`}>
          {isSidebarCollapsed ? (
            isLoggedIn ? (
              <div className="flex flex-col items-center">
                <div className="bg-blue-500 p-2 rounded-full mb-2">
                  <Shield size={20} />
                </div>
                <button 
                  onClick={onLogout}
                  className="p-1 rounded hover:bg-blue-500"
                  title="Logout"
                >
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setActiveTab('settings')}
                className="p-2 bg-white text-blue-600 rounded-full"
                title="Login"
              >
                <Shield size={18} />
              </button>
            )
          ) : (
            <UserAuth 
              onLogin={onLogin}
              isLoggedIn={isLoggedIn}
              userDID={userDID}
              onLogout={onLogout}
            />
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 p-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold">
            {navItems.find(item => item.id === activeTab)?.label || 'TrustChain AI'}
          </h2>
          {isSidebarCollapsed && (
            <div className="flex-shrink-0">
              <UserAuth 
                onLogin={onLogin}
                isLoggedIn={isLoggedIn}
                userDID={userDID}
                onLogout={onLogout}
              />
            </div>
          )}
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
} 