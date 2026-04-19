
import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './components/AuthContext';
import { Home } from './components/pages/Home';
import { PersonalityQuiz } from './components/pages/PersonalityQuiz';
import { ResumeAssessment } from './components/pages/ResumeAssessment';
import { HRQuestions } from './components/pages/HRQuestions';
import { VoiceAssessment } from './components/pages/VoiceAssessment';
import { EssayWriting } from './components/pages/EssayWriting';
import { Dashboard } from './components/pages/Dashboard';
import { History } from './components/pages/History';
import { Navbar } from './components/ui';
import { FullScreenEnforcer } from './components/FullScreenEnforcer';
import type { Page, UserPath } from './types';

const AppContent: React.FC = () => {
    const [page, setPage] = useState<Page>('home');
    const [activePath, setActivePath] = useState<UserPath>('none');
    const { user, loading, signIn, logout } = useAuth();

    // Synchronize path based on page if needed (e.g., on direct navigation or refresh)
    useEffect(() => {
        if (page === 'home') {
            setActivePath('none');
        } else if (page === 'quiz' || page === 'quiz-feedback') {
            setActivePath('explorer');
        } else if (page.startsWith('prep-')) {
            setActivePath('prep');
        }
    }, [page]);

    const handleForceExit = () => {
        alert("You have exited full-screen mode. For test integrity, your assessment session has been terminated. You will need to restart the entire process.");
        localStorage.removeItem('resumeAnalysis');
        localStorage.removeItem('hrAnalysis');
        localStorage.removeItem('voiceAnalysis');
        localStorage.removeItem('essayAnalysis');
        localStorage.removeItem('assessmentConfig');
        localStorage.removeItem('personalizedQuestions');
        setPage('home');
    };

    const renderPage = () => {
        switch (page) {
            case 'home':
                return <Home setPage={setPage} setActivePath={setActivePath} />;
            case 'quiz':
            case 'quiz-feedback':
                return <PersonalityQuiz setPage={setPage} isFeedbackMode={page === 'quiz-feedback'} />;
            case 'prep-resume':
                return <ResumeAssessment setPage={setPage} />;
            case 'prep-hr':
                return <HRQuestions setPage={setPage} />;
            case 'prep-voice':
                return <VoiceAssessment setPage={setPage} />;
            case 'prep-essay':
                return <EssayWriting setPage={setPage} />;
            case 'prep-dashboard':
                return <Dashboard setPage={setPage} />;
            case 'history':
                return <History setPage={setPage} />;
            default:
                return <Home setPage={setPage} setActivePath={setActivePath} />;
        }
    };
    
    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-background text-primary-400">
                <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="animate-pulse">Loading Application...</p>
            </div>
        );
    }

    const isAssessmentPage = ['quiz', 'prep-hr', 'prep-voice', 'prep-essay'].includes(page);
    const pageContent = renderPage();

    return (
        <main className="min-h-screen text-gray-200 font-sans flex flex-col items-center p-4 sm:p-6 md:p-8">
            <div className="w-full max-w-6xl">
                <header className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                    <div className="text-center sm:text-left">
                        <h1 
                            className="text-4xl font-bold text-primary-400 tracking-tight cursor-pointer" 
                            onClick={() => { setPage('home'); setActivePath('none'); }}
                        >
                            Ready for Hire
                        </h1>
                        <p className="text-gray-400 mt-1 text-sm">Your AI-Powered Career Platform</p>
                    </div>

                    <div className="flex items-center gap-4">
                        {user ? (
                            <div className="flex items-center gap-3 bg-surface/50 p-2 pl-3 rounded-full border border-slate-700/50">
                                <div className="text-right hidden sm:block">
                                    <p className="text-xs font-bold text-gray-200 leading-tight">{user.displayName}</p>
                                    <p className="text-[10px] text-gray-500 leading-tight">{user.email}</p>
                                </div>
                                <img src={user.photoURL || ''} alt="" className="w-8 h-8 rounded-full border border-primary-500/50" referrerPolicy="no-referrer" />
                                <button 
                                    onClick={() => setPage('history')}
                                    className="text-xs text-primary-400 hover:text-primary-300 px-3 py-1 font-bold whitespace-nowrap"
                                >
                                    My History
                                </button>
                                <button 
                                    onClick={logout}
                                    className="text-xs text-gray-400 hover:text-white px-3 py-1 border-l border-slate-700"
                                >
                                    Logout
                                </button>
                            </div>
                        ) : (
                            <button 
                                onClick={signIn}
                                className="bg-primary-600 hover:bg-primary-500 text-white px-6 py-2 rounded-full font-bold text-sm transition-all shadow-lg hover:shadow-primary-500/20"
                            >
                                Sign In with Google
                            </button>
                        )}
                    </div>
                </header>
                
                {activePath !== 'none' && <Navbar page={page} setPage={setPage} activePath={activePath} />}

                <div className="bg-surface/30 backdrop-blur-sm rounded-xl shadow-2xl p-6 sm:p-8 border border-slate-700/50 mt-6">
                    {isAssessmentPage ? (
                        <FullScreenEnforcer onForceExit={handleForceExit}>{pageContent}</FullScreenEnforcer>
                    ) : (
                        pageContent
                    )}
                </div>
                 <footer className="text-center mt-8 text-gray-500 text-sm">
                    <p>Version 3.0 | &copy; 2025 AI Career Prep Inc. All rights reserved.</p>
                </footer>
            </div>
        </main>
    );
};

const App: React.FC = () => {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
};

export default App;
