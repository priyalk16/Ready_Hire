
import React, { useState, useEffect, useCallback } from 'react';
import type { Page, CareerReport } from '../../types';
import { analyzeQuiz } from '../../services/geminiService';
import { generatePdf } from '../../utils/pdfGenerator';
import { Button, Loader, Card, DownloadIcon } from '../ui';
import { useAuth } from '../AuthContext';
import { saveCareerDiscovery, getLatestCareerDiscovery } from '../../services/firebase';

interface PersonalityQuizProps {
    setPage: (page: Page) => void;
    isFeedbackMode?: boolean;
}

const likertOptions = [
    'Strongly Agree',
    'Agree',
    'Neutral',
    'Disagree',
    'Strongly Disagree'
];

const quizQuestions = [
    // SECTION 1: THINKING LENS
    { id: 'q1', section: 'Thinking Lens', type: 'mcq', text: 'When you face a complex problem, your first instinct is to:', options: ['Break it into logical steps', 'Visualize how different parts of the system connect', 'Try multiple approaches until something works', 'Look for similar problems and reuse patterns'] },
    { id: 'q2', section: 'Thinking Lens', type: 'likert', text: 'I enjoy solving problems that have clear structure and logical rules.', options: likertOptions },
    { id: 'q3', section: 'Thinking Lens', type: 'mcq', text: 'If your solution fails, you usually:', options: ['Debug step by step', 'Rethink the entire approach', 'Experiment with quick variations', 'Ask others for feedback and ideas'] },
    { id: 'q4', section: 'Thinking Lens', type: 'likert', text: 'I am comfortable working on problems that take a long time to solve.', options: likertOptions },
    { id: 'q5', section: 'Thinking Lens', type: 'mcq', text: 'You feel most confident solving problems related to:', options: ['Logic and algorithms', 'Systems and architecture', 'Experimentation and testing', 'Optimization and improvement'] },

    // SECTION 2: INTEREST SIGNALS
    { id: 'q6', section: 'Interest Signals', type: 'mcq', text: 'Which activity sounds most exciting to you?', options: ['Building a software feature', 'Designing or understanding hardware', 'Analyzing data to find insights', 'Understanding how systems communicate'] },
    { id: 'q7', section: 'Interest Signals', type: 'likert', text: 'I often feel curious about how technology works behind the scenes.', options: likertOptions },
    { id: 'q8', section: 'Interest Signals', type: 'mcq', text: 'In your free time, you would prefer to:', options: ['Learn a new programming language', 'Tinker with electronics or devices', 'Read about AI, data, or trends', 'Improve an existing system or setup'] },
    { id: 'q9', section: 'Interest Signals', type: 'likert', text: 'Fixing something that is broken gives me a sense of satisfaction.', options: likertOptions },
    { id: 'q10', section: 'Interest Signals', type: 'mcq', text: 'You enjoy understanding:', options: ['Software logic', 'Hardware–software interaction', 'Data patterns and insights', 'Large-scale systems'] },

    // SECTION 3: WORK PERSONALITY
    { id: 'q11', section: 'Work Personality', type: 'mcq', text: 'You work best when you are:', options: ['Working independently', 'Working in a small team', 'Constantly collaborating and discussing'] },
    { id: 'q12', section: 'Work Personality', type: 'likert', text: 'I remain calm and focused when working under deadlines.', options: likertOptions },
    { id: 'q13', section: 'Work Personality', type: 'mcq', text: 'You are more comfortable with roles that require:', options: ['Deep technical focus', 'A mix of technical and communication skills', 'Mostly communication and coordination'] },
    { id: 'q14', section: 'Work Personality', type: 'likert', text: 'I like taking full ownership of a task from start to finish.', options: likertOptions },
    { id: 'q15', section: 'Work Personality', type: 'mcq', text: 'You prefer work that is:', options: ['Structured and predictable', 'Flexible and dynamic'] },

    // SECTION 4: TECH INCLINATION
    { id: 'q16', section: 'Tech Inclination', type: 'mcq', text: 'You feel most confident working with:', options: ['Programming and logic', 'Mathematics and calculations', 'Hardware and electronics', 'Analysis and documentation'] },
    { id: 'q17', section: 'Tech Inclination', type: 'mcq', text: 'You prefer projects that are:', options: ['Software-focused', 'Hardware-focused', 'A combination of both'] },
    { id: 'q18', section: 'Tech Inclination', type: 'likert', text: 'I enjoy debugging technical issues.', options: likertOptions },
    { id: 'q19', section: 'Tech Inclination', type: 'likert', text: 'I am comfortable learning new tools without step-by-step guidance.', options: likertOptions },
    { id: 'q20', section: 'Tech Inclination', type: 'mcq', text: 'You enjoy understanding how:', options: ['Code behaves', 'Systems behave', 'Data behaves'] },

    // SECTION 5: CAREER VALUES
    { id: 'q21', section: 'Career Values', type: 'mcq', text: 'What matters most to you in a career?', options: ['Learning and growth', 'Stability', 'Impact', 'Recognition'] },
    { id: 'q22', section: 'Career Values', type: 'likert', text: 'I am open to continuously upskilling throughout my career.', options: likertOptions },
    { id: 'q23', section: 'Career Values', type: 'mcq', text: 'You see yourself more as:', options: ['A deep specialist', 'A flexible generalist'] },
    { id: 'q24', section: 'Career Values', type: 'likert', text: 'I am comfortable adapting my career path as technology evolves.', options: likertOptions },
    { id: 'q25', section: 'Career Values', type: 'mcq', text: 'You prefer a career that is:', options: ['Well-defined and structured', 'Fast-changing and exploratory'] },
];

const defaultReport: CareerReport = {
    recommendedRoles: [
        { role: "Full-Stack Developer", reason: "You enjoy both logical problem solving and visual creation.", priority: 1 },
        { role: "Technical Product Manager", reason: "You have a balance of technical understanding and communication inclination.", priority: 2 }
    ],
    keyStrengths: ["Logical Thinking", "Adaptability", "User Focus"],
    areasToImprove: ["Deeper knowledge in system architecture", "Public speaking for technical presentations"],
    skillsToStartWith: [
        { role: "Full-Stack Developer", skills: ["JavaScript", "HTML/CSS", "React", "Node.js"] }
    ],
    roadmap: [
        { step: "Master Web Fundamentals", description: "Deep dive into DOM manipulation and CSS layout engines." },
        { step: "Build a Portfolio", description: "Create 3 robust projects using a modern stack." }
    ],
    projects: [
        { name: "Real-time Chat App", description: "Use WebSockets for instant messaging functionality.", technologies: ["React", "Socket.io", "Express"] }
    ],
    resources: [
        { name: "MDN Web Docs", url: "https://developer.mozilla.org", category: "Documentation" },
        { name: "JavaScript.info", url: "https://javascript.info", category: "Course" }
    ]
};

export const PersonalityQuiz: React.FC<PersonalityQuizProps> = ({ setPage, isFeedbackMode }) => {
    const { user, signIn } = useAuth();
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [report, setReport] = useState<CareerReport | null>(null);
    const [timeLeft, setTimeLeft] = useState(600); // 10 minutes for 25 questions

    const handleRetake = () => {
        localStorage.removeItem('explorerReport');
        setReport(null);
        setAnswers({});
        setTimeLeft(600);
        setPage('quiz');
    };

    // Load existing report from database or localStorage
    useEffect(() => {
        const loadReport = async () => {
            if (user) {
                try {
                    const dbReport = await getLatestCareerDiscovery(user.uid);
                    if (dbReport && dbReport.report) {
                        setReport(dbReport.report);
                        return;
                    }
                } catch (e) {
                    console.error("Error loading from database", e);
                }
            }

            const storedReport = localStorage.getItem('explorerReport');
            if (storedReport) {
                try {
                    const parsed = JSON.parse(storedReport);
                    if (parsed.recommendedRoles && Array.isArray(parsed.recommendedRoles)) {
                        setReport(parsed);
                    } else {
                        localStorage.removeItem('explorerReport');
                    }
                } catch (e) {
                    console.error("Error parsing stored report", e);
                    localStorage.removeItem('explorerReport');
                }
            }
        };

        loadReport();
    }, [user]);

    const handleSubmit = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await analyzeQuiz(answers);
            setReport(result);
            localStorage.setItem('explorerReport', JSON.stringify(result));
            
            if (user) {
                await saveCareerDiscovery(user.uid, answers, result);
            }

            setPage('quiz-feedback');
        } catch (err) {
            console.error("AI analysis failed:", err);
            setError("The AI analysis failed. Displaying a default report as a fallback.");
            setReport(defaultReport);
            localStorage.setItem('explorerReport', JSON.stringify(defaultReport));
            setPage('quiz-feedback');
        } finally {
            setIsLoading(false);
        }
    }, [answers, setPage, user]);
    
    useEffect(() => {
        if (report || isLoading || isFeedbackMode) return; 

        if (timeLeft <= 0) {
            handleSubmit();
            return;
        }

        const timerId = setInterval(() => {
            setTimeLeft(prevTime => prevTime - 1);
        }, 1000);

        return () => clearInterval(timerId);
    }, [timeLeft, report, isLoading, handleSubmit, isFeedbackMode]);

    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
    };

    const handleAnswerChange = (questionId: string, answer: string) => {
        setAnswers(prev => ({ ...prev, [questionId]: answer }));
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleSubmit();
    };

    if (isLoading) {
        return <Loader message="Analyzing your traits using our Career Counsellor engine..." />;
    }

    if (isFeedbackMode || report) {
        if (!report) {
            return (
                <div className="text-center p-12">
                    <h2 className="text-2xl font-bold text-gray-200 mb-4">No report found</h2>
                    <p className="text-gray-400 mb-6">Please complete the personality quiz first to see your feedback.</p>
                    <Button onClick={() => setPage('quiz')}>Go to Quiz</Button>
                </div>
            );
        }

        return (
            <div className="animate-fade-in" id="report-container">
                {error && <div className="bg-yellow-900/50 border border-yellow-700 text-yellow-200 p-3 rounded-md mb-4 text-center">{error}</div>}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <div>
                        <h2 className="text-3xl font-bold text-primary-400">Career Discovery Report</h2>
                        <p className="text-gray-400">Personalized for your technical personality</p>
                    </div>
                    <Button onClick={() => generatePdf('report-container', 'career-report')} className="no-print">
                        <DownloadIcon className="mr-2 h-4 w-4" /> Download PDF
                    </Button>
                </div>

                <div className="space-y-8">
                    <section>
                        <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                            <span className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center mr-3 text-sm">01</span>
                            Suitable Career Paths
                        </h3>
                        <div className="grid md:grid-cols-2 gap-6">
                            {report.recommendedRoles.map((roleInfo, i) => (
                                <Card key={i} borderColor={i === 0 ? "primary" : "surface"}>
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="text-xl font-bold text-primary-300">{roleInfo.role}</h4>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${i === 0 ? 'bg-primary-900/50 text-primary-400 border border-primary-800' : 'bg-surface/50 text-gray-400 border border-slate-700'}`}>
                                            PRIORITY #{roleInfo.priority}
                                        </span>
                                    </div>
                                    <p className="text-gray-300 text-sm italic">"{roleInfo.reason}"</p>
                                    
                                    <div className="mt-4">
                                        <h5 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Skills to Start With</h5>
                                        <div className="flex flex-wrap gap-2">
                                            {report.skillsToStartWith.find(s => s.role === roleInfo.role)?.skills.map((skill, si) => (
                                                <span key={si} className="text-[10px] bg-surface/80 text-gray-300 px-2 py-1 rounded border border-slate-700">
                                                    {skill}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </section>

                    <div className="grid md:grid-cols-2 gap-8">
                        <section>
                            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                                <span className="w-8 h-8 rounded-full bg-secondary-600 flex items-center justify-center mr-3 text-sm">02</span>
                                Key Strengths
                            </h3>
                            <Card borderColor="secondary">
                                <ul className="space-y-3">
                                    {report.keyStrengths.map((strength, i) => (
                                        <li key={i} className="flex items-start text-gray-300">
                                            <span className="text-secondary-500 mr-2">✓</span>
                                            <span className="text-sm">{strength}</span>
                                        </li>
                                    ))}
                                </ul>
                            </Card>
                        </section>

                        <section>
                            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                                <span className="w-8 h-8 rounded-full bg-accent-600 flex items-center justify-center mr-3 text-sm">03</span>
                                Areas to Improve
                            </h3>
                            <Card borderColor="accent">
                                <ul className="space-y-3">
                                    {report.areasToImprove.map((area, i) => (
                                        <li key={i} className="flex items-start text-gray-300">
                                            <span className="text-accent-500 mr-2">!</span>
                                            <span className="text-sm">{area}</span>
                                        </li>
                                    ))}
                                </ul>
                            </Card>
                        </section>
                    </div>

                    <section>
                        <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                            <span className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center mr-3 text-sm">04</span>
                            Your Roadmap & Learning Path
                        </h3>
                        <Card>
                            <div className="space-y-6">
                                {report.roadmap.map((item, i) => (
                                    <div key={i} className="flex gap-4">
                                        <div className="flex flex-col items-center">
                                            <div className="w-6 h-6 rounded-full bg-indigo-900 border border-indigo-500 text-[10px] flex items-center justify-center text-indigo-300 shrink-0">{i+1}</div>
                                            {i < report.roadmap.length - 1 && <div className="w-px h-full bg-slate-700 my-1"></div>}
                                        </div>
                                        <div className="pb-4">
                                            <h5 className="font-bold text-white text-sm">{item.step}</h5>
                                            <p className="text-xs text-gray-400">{item.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            <div className="mt-8 pt-6 border-t border-slate-700">
                                <h4 className="text-sm font-bold text-primary-400 mb-4 uppercase tracking-widest">Selected Resources</h4>
                                <div className="grid sm:grid-cols-2 gap-4">
                                    {report.resources.map((res, i) => (
                                        <a key={i} href={res.url} target="_blank" rel="noopener noreferrer" 
                                           className="bg-surface/50 border border-slate-700 p-3 rounded-lg hover:border-primary-500 transition-colors flex justify-between items-center group">
                                            <div>
                                                <span className="text-[10px] text-gray-500 uppercase block">{res.category}</span>
                                                <span className="text-sm text-gray-200 group-hover:text-primary-300">{res.name}</span>
                                            </div>
                                            <span className="text-gray-600 group-hover:text-primary-500">↗</span>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        </Card>
                    </section>

                    <section>
                        <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                            <span className="w-8 h-8 rounded-full bg-amber-600 flex items-center justify-center mr-3 text-sm">05</span>
                            Beginner Project Ideas
                        </h3>
                        <div className="grid md:grid-cols-2 gap-6">
                             {report.projects.map((proj, i) => (
                                <Card key={i} className="flex flex-col">
                                    <h5 className="font-bold text-amber-500 mb-2">{proj.name}</h5>
                                    <p className="text-gray-400 text-xs mb-4 flex-grow italic">"{proj.description}"</p>
                                    <div className="flex flex-wrap gap-2">
                                        {proj.technologies.map((tech, ti) => (
                                            <span key={ti} className="bg-amber-900/20 text-amber-300 text-[9px] px-1.5 py-0.5 rounded border border-amber-800/30">
                                                {tech}
                                            </span>
                                        ))}
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </section>
                </div>

                <div className="mt-12 text-center no-print flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Button onClick={() => setPage('prep-resume')} size="lg" className="w-full sm:w-auto">
                        Continue to Assessments <DownloadIcon className="ml-2 h-4 w-4 rotate-180" />
                    </Button>
                    <Button onClick={handleRetake} variant="secondary" size="lg" className="w-full sm:w-auto">
                        Retake Discovery Quiz
                    </Button>
                </div>
                <button onClick={() => setPage('home')} className="block mx-auto mt-6 text-gray-500 hover:text-white text-sm transition-colors">
                    Return to Dashboard
                </button>
            </div>
        );
    }
    
    return (
        <div className="animate-fade-in relative">
             <div className="absolute -top-12 right-0 bg-surface/80 backdrop-blur-sm text-white px-4 py-2 rounded-xl shadow-lg font-mono text-sm border border-slate-700/50 flex items-center gap-2">
                <span className="text-primary-400 animate-pulse">●</span>
                Time Remaining: {formatTime(timeLeft)}
            </div>
            
            <div className="text-center mb-10 mt-4">
                <h2 className="text-3xl font-bold text-white mb-2">Engineering Career Discovery</h2>
                <p className="text-gray-400 max-w-xl mx-auto mb-4">This personality assessment helps engineering students discover suitable technical paths based on their natural thinking style and interests.</p>
                <div className="flex items-center justify-center gap-3">
                    <div className="h-2 w-48 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                        <div 
                            className="h-full bg-primary-500 transition-all duration-300" 
                            style={{ width: `${(Object.keys(answers).length / quizQuestions.length) * 100}%` }}
                        ></div>
                    </div>
                    <span className="text-primary-400 font-mono text-sm">{Object.keys(answers).length}/{quizQuestions.length} answered</span>
                </div>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-12 max-w-3xl mx-auto pb-12">
                {/* Visual Section Grouping */}
                {['Thinking Lens', 'Interest Signals', 'Work Personality', 'Tech Inclination', 'Career Values'].map(sectionName => {
                    const sectionQuestions = quizQuestions.filter(q => q.section === sectionName);
                    return (
                        <div key={sectionName} className="space-y-6">
                            <div className="flex items-center gap-4 mb-4">
                                <h3 className="text-lg font-bold text-primary-400 uppercase tracking-[0.2em]">{sectionName}</h3>
                                <div className="h-px bg-slate-700 flex-grow"></div>
                            </div>
                            {sectionQuestions.map((q) => (
                                <Card key={q.id} className="border-l-4 border-l-primary-900/50">
                                    <label className="block text-lg font-medium text-gray-100 mb-6">
                                        {q.text}
                                        {q.type === 'likert' && <span className="block text-xs text-gray-500 mt-1 font-normal">(Rate from Strongly Agree to Strongly Disagree)</span>}
                                    </label>
                                    
                                    <div className={q.type === 'likert' ? 'flex flex-col gap-2' : 'grid sm:grid-cols-2 gap-3'}>
                                        {q.options.map((opt, i) => (
                                            <label key={i} className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all duration-200 ${answers[q.id] === opt ? 'bg-primary-900/60 border-primary-500 shadow-[0_0_15px_rgba(59,130,246,0.1)]' : 'bg-surface border-slate-700 hover:bg-slate-800'}`}>
                                                <input
                                                    type="radio"
                                                    name={q.id}
                                                    value={opt}
                                                    checked={answers[q.id] === opt}
                                                    onChange={() => handleAnswerChange(q.id, opt)}
                                                    className="w-4 h-4 text-primary-600 bg-background border-slate-600 focus:ring-primary-600"
                                                />
                                                <span className={`ml-3 text-sm ${answers[q.id] === opt ? 'text-primary-100 font-medium' : 'text-gray-400'}`}>{opt}</span>
                                            </label>
                                        ))}
                                    </div>
                                </Card>
                            ))}
                        </div>
                    );
                })}

                <div className="pt-8 flex flex-col sm:flex-row justify-between items-center gap-6 border-t border-slate-700/50">
                   <button type="button" onClick={() => setPage('home')} className="text-gray-500 hover:text-white transition-colors flex items-center gap-2">
                       ← Back to Home
                   </button>
                   <Button type="submit" size="lg" className="w-full sm:w-auto px-12" disabled={Object.keys(answers).length !== quizQuestions.length}>
                        Generate Discovery Report
                    </Button>
                </div>
            </form>
        </div>
    );
};
