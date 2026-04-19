import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import type { CareerReport, FinalReport, ATSScoreData } from '../types';

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
const model = "gemini-1.5-flash";

const careerReportSchema = {
    type: Type.OBJECT,
    properties: {
        recommendedRoles: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    role: { type: Type.STRING },
                    reason: { type: Type.STRING },
                    priority: { type: Type.INTEGER }
                },
                required: ['role', 'reason', 'priority']
            },
            description: "Top 2–3 suitable career paths (ranked)."
        },
        keyStrengths: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A list of the user's key strengths." },
        areasToImprove: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Non-judgmental areas for improvement." },
        skillsToStartWith: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    role: { type: Type.STRING },
                    skills: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ['role', 'skills']
            },
            description: "Essential skills to start with for each career path."
        },
        roadmap: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    step: { type: Type.STRING },
                    description: { type: Type.STRING }
                },
                required: ['step', 'description']
            },
            description: "A professional roadmap with clear, actionable steps."
        },
        projects: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING },
                    description: { type: Type.STRING },
                    technologies: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ['name', 'description', 'technologies']
            },
            description: "Beginner project ideas including relevant technologies."
        },
        resources: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING },
                    url: { type: Type.STRING },
                    category: { type: Type.STRING, description: "Category like 'YouTube', 'Course', 'Tool', etc." }
                },
                required: ['name', 'url', 'category']
            },
            description: "Links to learning resources (YouTube, courses, tools)."
        },
    },
    required: ['recommendedRoles', 'keyStrengths', 'areasToImprove', 'skillsToStartWith', 'roadmap', 'projects', 'resources']
};

export const analyzeQuiz = async (answers: Record<string, string>): Promise<CareerReport> => {
    const prompt = `You are an AI-powered career counsellor for engineering students. 
Your role is to conduct a personality-based career discovery assessment and generate a personalized career recommendation report.

BRANCHES: Computer Engineering, Information Technology, EXTC, ECS, Electrical Engineering.
TONE: Human, supportive, realistic, professional, non-judgmental.

Based on these personality quiz answers: ${JSON.stringify(answers, null, 2)}

TASK:
1. Analyze patterns across all sections (Thinking Lens, Interest Signals, Work Personality, Tech Inclination, Career Values).
2. Identify dominant thinking style, interests, and values.
3. Map results to career clusters (Software Dev, Data/AI/ML, Core Electronics, Systems/Cloud, Hybrid/Robotics/IoT).
4. Generate a Career Discovery Report in JSON.

REQUIREMENTS:
- Top 2-3 Suitable Career Paths (ranked).
- Why these fit the student (simple, human explanation).
- Key strengths.
- Areas to improve (actionable/constructive).
- Skills to start with for each career.
- Learning resources (platforms, tools).
- Beginner project ideas.

Return ONLY valid JSON.`;
    
    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: careerReportSchema,
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
        },
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText);
};

export const generateAllPersonalizedQuestions = async (resumeText: string, role: string, level: string, domain: string): Promise<{ technicalQuestions: any[], hrQuestions: any[], voice_prompts: string[], essay_prompts: string[] }> => {
    const prompt = `You are an expert technical interviewer for software engineering roles. Analyze the provided resume and generate personalized assessment content.

RESUME TEXT:
${resumeText}

TARGET ROLE: ${role}
SKILL LEVEL: ${level}
DOMAIN: ${domain}

OUTPUT FOUR SECTIONS IN JSON FORMAT:

1. TECHNICAL MCQs (10 questions):
- Extract specific projects, technologies, and experiences from the resume
- Create MCQs that directly reference resume details (e.g. "In your 'E-commerce project using React+Node.js', why did you choose Redux over Context API?")
- 4 options per question (A,B,C,D)
- Include correct answerIndex (0-3) and brief explanation

2. HR SITUATIONAL QUESTIONS (10 questions):
- Base scenarios on resume experiences (leadership, teamwork, challenges, etc.)
- Create realistic workplace situations relevant to the role
- 4 behavioral response options per question (A,B,C,D)
- Mark best professional response with bestAnswerIndex (0-3)
- Include feedbackKeywords (2-3 keywords like "professionalism", "leadership", "communication")

3. VOICE ASSESSMENT PROMPTS (2 prompts):
- Open-ended questions for verbal assessment based on resume projects.

4. ESSAY WRITING PROMPTS (2 prompts):
- Open-ended topics for written assessment based on domain and role.

Return ONLY valid JSON matching this schema:

{
  "technicalQuestions": [
    {
      "question": "string",
      "options": ["A) option1", "B) option2", "C) option3", "D) option4"],
      "answerIndex": 1,
      "explanation": "string"
    }
  ],
  "hrQuestions": [
    {
      "question": "string",
      "options": ["A) response1", "B) response2", "C) response3", "D) response4"],
      "bestAnswerIndex": 2,
      "feedbackKeywords": ["string"]
    }
  ],
  "voice_prompts": ["string"],
  "essay_prompts": ["string"]
}

Ensure questions are specific to the resume content and role-appropriate.`;

    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    technicalQuestions: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                question: { type: Type.STRING },
                                options: { type: Type.ARRAY, items: { type: Type.STRING }, minItems: 4, maxItems: 4 },
                                answerIndex: { type: Type.INTEGER },
                                explanation: { type: Type.STRING }
                            },
                             required: ['question', 'options', 'answerIndex', 'explanation']
                        },
                        minItems: 10,
                        maxItems: 10,
                    },
                    hrQuestions: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                question: { type: Type.STRING },
                                options: { type: Type.ARRAY, items: { type: Type.STRING }, minItems: 4, maxItems: 4 },
                                bestAnswerIndex: { type: Type.INTEGER },
                                feedbackKeywords: { type: Type.ARRAY, items: { type: Type.STRING } }
                            },
                            required: ['question', 'options', 'bestAnswerIndex', 'feedbackKeywords']
                        },
                        minItems: 10,
                        maxItems: 10
                    },
                    voice_prompts: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                        minItems: 2,
                        maxItems: 2
                    },
                    essay_prompts: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                        minItems: 2,
                        maxItems: 2
                    }
                },
                required: ['technicalQuestions', 'hrQuestions', 'voice_prompts', 'essay_prompts']
            },
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
        },
    });
    
    const jsonText = response.text.trim();
    return JSON.parse(jsonText);
};


export const analyzeHRAnswers = async (questions: { question: string, options: string[], bestAnswerIndex: number, feedbackKeywords: string[] }[], userAnswers: number[], role: string): Promise<{ feedback: string[]; score: number }> => {
    const prompt = `A candidate applying for a "${role}" role answered a set of situational questions. Evaluate their choices based on professional conduct, problem-solving skills, and team collaboration. 
    
    For each question, the AI previously identified a "bestAnswerIndex" and "feedbackKeywords" to guide the evaluation.
    
    Provide a final score out of 10 and concise, actionable feedback as a list of 2-3 short bullet points. Do not just state if an answer is right or wrong; explain the reasoning behind the evaluation, referencing the feedback keywords where appropriate.
    
    Here are the questions, the expert's recommended best answer index, the feedback keywords, and the user's chosen answers:
    ${questions.map((q, i) => `
    Question ${i + 1}: ${q.question}
    Best Answer Index: ${q.bestAnswerIndex}
    Feedback Keywords: ${q.feedbackKeywords.join(', ')}
    User's Choice Index: ${userAnswers[i]}
    User's Choice Text: "${q.options[userAnswers[i]]}"
    `).join('')}
    
    Based on this, generate the feedback as a list of strings and the score.`;
    
    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    feedback: { 
                        type: Type.ARRAY, 
                        items: { type: Type.STRING },
                        description: "A list of constructive, short feedback points on the user's choices." 
                    },
                    score: { type: Type.INTEGER, description: "A score from 1 to 10 based on the quality of judgment." }
                },
                required: ['feedback', 'score']
            },
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
        },
    });
    
    const jsonText = response.text.trim();
    return JSON.parse(jsonText);
};


export const transcribeAndAnalyzeAudio = async (audioData: { prompt: string, audio: {mimeType: string, data: string} }[]): Promise<{ analyses: { prompt: string; transcription: string; feedback: string; score: number }[] }> => {
    
    const audioParts = audioData.map(d => ({
        inlineData: {
            mimeType: d.audio.mimeType,
            data: d.audio.data
        }
    }));
    
    const prompt = `I will provide two audio clips of a user answering two different interview prompts. For each audio clip, provide a separate analysis. Each analysis must include:
    1. An accurate transcription of the user's spoken content.
    2. Concise feedback on verbal fluency, grammar, clarity, and relevance to the prompt.
    3. A score out of 10.
    
    The prompts were:
    Prompt 1: "${audioData[0].prompt}"
    Prompt 2: "${audioData[1].prompt}"
    `;

    const response = await ai.models.generateContent({
        model,
        contents: {
            parts: [
                { text: prompt },
                ...audioParts,
            ]
        },
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    analyses: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                prompt: { type: Type.STRING, description: "The original prompt for this audio clip." },
                                transcription: { type: Type.STRING, description: "The transcribed text from the audio." },
                                feedback: { type: Type.STRING, description: "Feedback on fluency, grammar, and clarity for this answer." },
                                score: { type: Type.INTEGER, description: "A score from 1 to 10 for this answer." }
                            },
                            required: ['prompt', 'transcription', 'feedback', 'score']
                        }
                    }
                },
                required: ['analyses']
            },
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
        },
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText);
};

export const analyzeEssay = async (essays: { prompt: string, text: string }[]): Promise<{ analyses: { prompt: string; feedback: string; score: number }[] }> => {
    const prompt = `Analyze these two user-written essays. For each essay, provide separate, concise feedback on clarity, structure, and articulation, and a separate score out of 10.
    
    Essay Prompt 1: "${essays[0].prompt}"
    Essay 1: "${essays[0].text}"

    Essay Prompt 2: "${essays[1].prompt}"
    Essay 2: "${essays[1].text}"
    `;

    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    analyses: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                prompt: { type: Type.STRING, description: "The original prompt for this essay." },
                                feedback: { type: Type.STRING, description: "Feedback on clarity and structure for this essay." },
                                score: { type: Type.INTEGER, description: "A score from 1 to 10 for this essay." }
                            },
                            required: ['prompt', 'feedback', 'score']
                        }
                    }
                },
                required: ['analyses']
            },
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
        },
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText);
};

export const getATSScore = async (resumeText: string, domain: string, role: string, level: string): Promise<ATSScoreData> => {
    const prompt = `You are an advanced ATS (Applicant Tracking System) Analyst. Evaluate the provided resume against a target role, domain, and experience level.
    
    RESUME TEXT:
    ${resumeText}
    
    DOMAIN: ${domain}
    TARGET ROLE: ${role}
    EXPERIENCE LEVEL: ${level}
    
    TASK:
    1. Parse the resume for Skills, Projects, Experience, Education, and Certifications.
    2. Generate an internal benchmark for a "${level}" level "${role}" in the "${domain}" domain.
    3. Normalize skills (e.g., "ReactJS" to "React").
    4. Calculate a weighted score based on the following model:
       - Beginner: Skills (50%), Projects (30%), Experience (10%), Education (10%)
       - Intermediate: Skills (40%), Projects (20%), Experience (30%), Education (10%)
       - Expert: Skills (30%), Projects (10%), Experience (50%), Education (10%)
       Note: Certifications are a bonus up to 5% that can offset deficiencies.
    5. Apply penalties for missing core skills or irrelevant experience.
    6. Provide a final score (0-100), a detailed breakdown, key insights, missing skills, and improvement suggestions.
    
    RESPONSE FORMAT:
    Return ONLY valid JSON matching this schema:
    {
      "score": number, (0-100)
      "breakdown": {
        "skills": number, (percentage contribution)
        "projects": number,
        "experience": number,
        "education": number,
        "certifications": number
      },
      "insights": ["string"],
      "missingSkills": ["string"],
      "suggestions": ["string"]
    }`;

    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    score: { type: Type.NUMBER },
                    breakdown: {
                        type: Type.OBJECT,
                        properties: {
                            skills: { type: Type.NUMBER },
                            projects: { type: Type.NUMBER },
                            experience: { type: Type.NUMBER },
                            education: { type: Type.NUMBER },
                            certifications: { type: Type.NUMBER }
                        },
                        required: ['skills', 'projects', 'experience', 'education', 'certifications']
                    },
                    insights: { type: Type.ARRAY, items: { type: Type.STRING } },
                    missingSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
                    suggestions: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ['score', 'breakdown', 'insights', 'missingSkills', 'suggestions']
            },
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
        },
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText);
};


export const generateFinalReport = async (results: any, role: string): Promise<FinalReport> => {
    const prompt = `Perform a meta-analysis on a user's performance across four assessments (Resume, HR, Voice, Essay) for a target role of "${role}". 
    
    Here is their performance data:
    - Resume Assessment Score: ${results.resume.score}/10
    - HR Questions Score: ${results.hr.score}/10
    - Voice Assessment Score: ${results.voice.score}/10
    - Essay Writing Score: ${results.essay.score}/10
    - HR Feedback: "${results.hr.feedback}"
    - Voice Feedback: "${results.voice.feedback}"
    - Essay Feedback: "${results.essay.feedback}"

    Based on all this data, generate a final report. The report MUST be concise, crisp, and highly readable. Use bullet points and short phrases instead of long paragraphs.
    1. A holistic summary (2-3 sentences max).
    2. A consolidated list of 3-4 key strengths.
    3. A list of 2-3 main areas for improvement.
    4. A 3-step career roadmap with brief, actionable descriptions.
    5. Two specific, actionable suggestions for their resume.
    6. Two project ideas suitable for their skill level, including a list of 2-4 relevant technologies for each.
    7. Two relevant certifications for their target role.
    8. Two relevant online learning resources.`;

    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    summary: { type: Type.STRING },
                    consolidatedStrengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                    areasForImprovement: { type: Type.ARRAY, items: { type: Type.STRING } },
                    careerRoadmap: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: { step: { type: Type.STRING }, description: { type: Type.STRING } },
                            required: ['step', 'description']
                        }
                    },
                    resumeImprovements: {
                         type: Type.ARRAY,
                         items: {
                            type: Type.OBJECT,
                            properties: { area: { type: Type.STRING }, suggestion: { type: Type.STRING } },
                            required: ['area', 'suggestion']
                         },
                         description: "Actionable feedback on the resume."
                    },
                    sampleProjects: {
                         type: Type.ARRAY,
                         items: {
                            type: Type.OBJECT,
                            properties: { 
                                name: { type: Type.STRING }, 
                                description: { type: Type.STRING },
                                technologies: { type: Type.ARRAY, items: { type: Type.STRING } }
                             },
                            required: ['name', 'description', 'technologies']
                         },
                         description: "Relevant project ideas."
                    },
                    suggestedCertifications: {
                        type: Type.ARRAY,
                        items: {
                           type: Type.OBJECT,
                           properties: { name: { type: Type.STRING }, url: { type: Type.STRING } },
                           required: ['name', 'url']
                        },
                        description: "Relevant certification suggestions."
                    },
                    resources: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: { name: { type: Type.STRING }, url: { type: Type.STRING } },
                            required: ['name', 'url']
                        },
                        description: "Links to suggested learning resources."
                    },
                },
                required: ['summary', 'consolidatedStrengths', 'areasForImprovement', 'careerRoadmap', 'resumeImprovements', 'sampleProjects', 'suggestedCertifications', 'resources']
            },
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
        },
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText);
};
