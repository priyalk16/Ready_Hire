import React, { useState, useEffect } from 'react';
import { Card, Button, Loader } from '../ui';
import { useAuth } from '../AuthContext';
import { getPrepAssessmentHistory, getCareerDiscoveryHistory } from '../../services/firebase';
import type { Page } from '../../types';

interface HistoryProps {
    setPage: (page: Page) => void;
}

export const History: React.FC<HistoryProps> = ({ setPage }) => {
    const { user } = useAuth();
    const [prepHistory, setPrepHistory] = useState<any[]>([]);
    const [careerHistory, setCareerHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'career' | 'prep'>('career');

    useEffect(() => {
        const fetchHistory = async () => {
            if (!user) return;
            setLoading(true);
            try {
                const [prep, career] = await Promise.all([
                    getPrepAssessmentHistory(user.uid),
                    getCareerDiscoveryHistory(user.uid)
                ]);
                setPrepHistory(prep || []);
                setCareerHistory(career || []);
            } catch (err) {
                console.error("Failed to fetch history:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, [user]);

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center">
                <svg className="w-16 h-16 text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                </svg>
                <h2 className="text-2xl font-bold text-white mb-2">Sign In Required</h2>
                <p className="text-gray-400 mb-6 max-w-sm">Please sign in to view your personalized assessment history and progress reports.</p>
                <Button onClick={() => setPage('home')}>Return Home</Button>
            </div>
        );
    }

    if (loading) {
        return <Loader message="Retrieving your database records..." />;
    }

    const formatDate = (timestamp: any) => {
        if (!timestamp) return 'N/A';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="animate-fade-in">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-primary-400">My Student History</h2>
                    <p className="text-gray-400">Track your engineering journey and past assessments</p>
                </div>
                <div className="flex bg-surface p-1 rounded-lg border border-slate-700">
                    <button 
                        onClick={() => setActiveTab('career')}
                        className={`px-4 py-2 rounded-md transition-all text-sm font-medium ${activeTab === 'career' ? 'bg-primary-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    >
                        Career Discovery
                    </button>
                    <button 
                        onClick={() => setActiveTab('prep')}
                        className={`px-4 py-2 rounded-md transition-all text-sm font-medium ${activeTab === 'prep' ? 'bg-primary-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    >
                        Placement Prep
                    </button>
                </div>
            </header>

            {activeTab === 'career' ? (
                <div className="space-y-4">
                    {careerHistory.length === 0 ? (
                        <Card className="text-center py-12">
                            <p className="text-gray-500 italic">No career discovery reports found. Try the Personality Quiz!</p>
                            <Button onClick={() => setPage('quiz')} size="sm" variant="secondary" className="mt-4">Take Quiz</Button>
                        </Card>
                    ) : (
                        careerHistory.sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)).map((item, idx) => (
                            <div key={item.id} className="group relative">
                                <Card className="hover:border-primary-500/50 transition-all cursor-pointer" onClick={() => {
                                    localStorage.setItem('explorerReport', JSON.stringify(item.report));
                                    setPage('quiz-feedback');
                                }}>
                                    <div className="flex flex-col sm:flex-row justify-between gap-4">
                                        <div className="flex-grow">
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className="text-[10px] font-mono bg-primary-950 text-primary-400 px-2 py-0.5 rounded border border-primary-900">#DISCOVERY-{idx+1}</span>
                                                <span className="text-xs text-gray-500 font-mono">{formatDate(item.createdAt)}</span>
                                            </div>
                                            <h3 className="text-lg font-bold text-gray-100 mb-2">
                                                Primary Path: <span className="text-primary-300">{item.report.recommendedRoles[0]?.role}</span>
                                            </h3>
                                            <div className="flex flex-wrap gap-2">
                                                {item.report.keyStrengths.slice(0, 3).map((s: string, i: number) => (
                                                    <span key={i} className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded">{s}</span>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="flex items-center">
                                            <span className="text-gray-600 group-hover:text-primary-400 transition-colors">View Report →</span>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        ))
                    )}
                </div>
            ) : (
                <div className="space-y-4">
                    {prepHistory.length === 0 ? (
                        <Card className="text-center py-12">
                            <p className="text-gray-500 italic">No placement prep records found. Start with a Resume review!</p>
                            <Button onClick={() => setPage('prep-resume')} size="sm" className="mt-4">Begin Prep</Button>
                        </Card>
                    ) : (
                        prepHistory.sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)).map((item, idx) => {
                             // Calculate aggregate score for display
                             const res = item.results || {};
                             const scores = [res.resume?.score, res.hr?.score, res.voice?.score, res.essay?.score].filter(s => s !== undefined);
                             const avg = scores.length > 0 ? (scores.reduce((a,b) => a+b, 0) / (scores.length * 10)) * 100 : 0;

                             return (
                                <div key={item.id} className="group">
                                    <Card className="hover:border-secondary-500/50 transition-all cursor-pointer" onClick={() => {
                                        // Hydrate local storage to view old report
                                        localStorage.setItem('resumeAnalysis', JSON.stringify(res.resume || {}));
                                        localStorage.setItem('hrAnalysis', JSON.stringify(res.hr || {}));
                                        localStorage.setItem('voiceAnalysis', JSON.stringify(res.voice || {}));
                                        localStorage.setItem('essayAnalysis', JSON.stringify(res.essay || {}));
                                        localStorage.setItem('atsAnalysis', JSON.stringify(res.ats || {}));
                                        localStorage.setItem('assessmentConfig', JSON.stringify({
                                            role: item.role,
                                            domain: item.domain,
                                            level: item.level
                                        }));
                                        setPage('prep-dashboard');
                                    }}>
                                        <div className="flex flex-col sm:flex-row justify-between gap-6">
                                            <div className="flex-grow">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <span className="text-[10px] font-mono bg-secondary-950 text-secondary-400 px-2 py-0.5 rounded border border-secondary-900">#PREP-{idx+1}</span>
                                                    <span className="text-xs text-gray-500 font-mono">{formatDate(item.createdAt)}</span>
                                                    <span className="text-[10px] uppercase font-bold text-gray-500">{item.level}</span>
                                                </div>
                                                <h3 className="text-lg font-bold text-gray-100">
                                                    Target Role: <span className="text-secondary-300">{item.role}</span>
                                                </h3>
                                                <p className="text-xs text-gray-500 italic mb-3">Domain: {item.domain}</p>
                                                
                                                <div className="flex items-center gap-4">
                                                    <div className="flex -space-x-1">
                                                        {res.resume && <div className="w-2 h-2 rounded-full bg-green-500" title="Resume Complete"></div>}
                                                        {res.hr && <div className="w-2 h-2 rounded-full bg-blue-500 ml-1" title="HR Complete"></div>}
                                                        {res.voice && <div className="w-2 h-2 rounded-full bg-purple-500 ml-1" title="Voice Complete"></div>}
                                                        {res.essay && <div className="w-2 h-2 rounded-full bg-amber-500 ml-1" title="Essay Complete"></div>}
                                                    </div>
                                                    <span className="text-[10px] text-gray-600 uppercase tracking-tighter">Modules Completed</span>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center gap-6">
                                                <div className="text-right hidden sm:block">
                                                    <p className="text-2xl font-bold text-secondary-400">{avg.toFixed(0)}%</p>
                                                    <p className="text-[10px] text-gray-500 uppercase">Avg Score</p>
                                                </div>
                                                <span className="text-gray-600 group-hover:text-secondary-400 transition-colors">Open Files →</span>
                                            </div>
                                        </div>
                                    </Card>
                                </div>
                            );
                        })
                    )}
                </div>
            )}
            
            <div className="mt-12 pt-8 border-t border-slate-800 text-center">
                <Button onClick={() => setPage('home')} variant="secondary" size="sm">Back to Dashboard</Button>
            </div>
        </div>
    );
};
