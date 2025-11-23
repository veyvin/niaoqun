import { GoogleGenAI, Type } from "@google/genai";
import { SimulationParams, AIAnalysisResult } from "../types";

const createAIClient = () => {
    if (!process.env.API_KEY) {
        console.warn("API_KEY is missing in environment variables.");
        return null;
    }
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const analyzeSwarmBehavior = async (params: SimulationParams): Promise<AIAnalysisResult | null> => {
    const ai = createAIClient();
    if (!ai) return null;

    const groupDescriptions = params.groups.map(g => `${g.name}: ${g.count}只`).join(', ');

    const prompt = `
    请分析以下鸟群模拟参数，并预测视觉上的群体行为。
    参数设置:
    - 边界模式: ${params.boundaryType === 'wrap' ? '有界循环 (Wrapping)' : '无限空间 (Infinite)'}
    - 分离力度 (Separation): ${params.separation} (避免碰撞)
    - 对齐力度 (Alignment): ${params.alignment} (跟随同伴方向)
    - 凝聚力度 (Cohesion): ${params.cohesion} (靠近同伴中心)
    - 最大速度: ${params.maxSpeed}
    - 感知范围: ${params.perceptionRadius}
    - 鸟群构成: ${groupDescriptions}
    
    注意：不同族群的鸟会相互避让（分离），但只会跟随自己族群的鸟（对齐和凝聚）。

    请提供简短、科学但通俗易懂的中文分析。
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                systemInstruction: "你是一位精通群体智能（Swarm Intelligence）的复杂系统科学家。请用中文提供简明扼要的涌现行为分析。",
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING, description: "一个简短的科学标题（2-5个字），例如'有序迁徙'，'混沌盘旋'。" },
                        description: { type: Type.STRING, description: "2句话解释，基于当前参数，特别是多族群互动情况下的行为特征。" },
                        behaviorTag: { type: Type.STRING, description: "一个行为标签：有序、混沌、流体、或静态。" }
                    },
                    required: ["title", "description", "behaviorTag"]
                }
            }
        });

        const text = response.text;
        if (!text) return null;
        return JSON.parse(text) as AIAnalysisResult;

    } catch (error) {
        console.error("Gemini analysis failed:", error);
        return null;
    }
};