
import React from 'react';
import type { Page, UserPath } from '../../types';
import { Card, Button, ArrowRightIcon } from '../ui';
import { useAuth } from '../AuthContext';

interface HomeProps {
    setPage: (page: Page) => void;
    setActivePath: (path: UserPath) => void;
}

export const Home: React.FC<HomeProps> = ({ setPage, setActivePath }) => {
    const { user, signIn } = useAuth();
    
    const handleExplorerClick = () => {
        setActivePath('explorer');
        setPage('quiz');
    };

    const handlePrepClick = () => {
        setActivePath('prep');
        setPage('prep-resume');
    };

    return (
        <div className="animate-fade-in">
            {!user && (
                <div className="bg-primary-900/40 border border-primary-500/30 p-4 rounded-xl mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-center sm:text-left">
                        <h4 className="text-primary-300 font-bold">Unsaved Progress</h4>
                        <p className="text-gray-400 text-sm">Sign in to save your career reports and assessments to your profile.</p>
                    </div>
                    <Button onClick={signIn} size="sm" className="whitespace-nowrap">
                        Sign In Now
                    </Button>
                </div>
            )}
            
            <h2 className="text-3xl font-bold text-center mb-6 text-white">Choose Your Path</h2>
            <div className="grid md:grid-cols-2 gap-6">
                <Card className="flex flex-col" borderColor="accent">
                    <h3 className="text-2xl font-semibold text-accent-400 mb-3">Path 1: Career Explorer</h3>
                    <p className="text-gray-300 mb-4 flex-grow">
                        Not sure where to start? Take a comprehensive 25-question assessment to discover a tech role that fits your personality and motivations.
                    </p>
                    <Button onClick={handleExplorerClick} className="mt-auto w-full" variant='secondary'>
                        Start Personality Quiz
                        <ArrowRightIcon className="ml-2 h-4 w-4" />
                    </Button>
                </Card>
                <Card className="flex flex-col" borderColor="primary">
                    <h3 className="text-2xl font-semibold text-primary-400 mb-3">Path 2: Placement Prep</h3>
                    <p className="text-gray-300 mb-4 flex-grow">
                        Preparing for job interviews? Go through a comprehensive assessment series covering your resume, behavioral questions, voice clarity, and writing skills.
                    </p>
                    <Button onClick={handlePrepClick} className="mt-auto w-full">
                        Begin Placement Prep
                        <ArrowRightIcon className="ml-2 h-4 w-4" />
                    </Button>
                </Card>
            </div>
        </div>
    );
};
