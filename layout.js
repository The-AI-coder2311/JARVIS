import React from 'react';

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-gray-950">
      <style>{`
        :root {
          --background: 222.2 84% 4.9%;
          --foreground: 210 40% 98%;
          --primary: 189 94% 43%;
          --primary-foreground: 222.2 47.4% 11.2%;
        }
        
        * {
          scrollbar-width: thin;
          scrollbar-color: rgba(0, 212, 255, 0.3) transparent;
        }
        
        *::-webkit-scrollbar {
          width: 6px;
        }
        
        *::-webkit-scrollbar-track {
          background: transparent;
        }
        
        *::-webkit-scrollbar-thumb {
          background-color: rgba(0, 212, 255, 0.3);
          border-radius: 3px;
        }

        @keyframes glow {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
      `}</style>
      {children}
    </div>
  );
}
