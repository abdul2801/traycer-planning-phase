import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();
const MODEL_NAME = "gemini-pro";
export const generatePlanFromLLM = async (task, context) => {
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    const prompt = `
    You are an expert software architect. Your job is to break down a high-level user request into a dependency graph plan, formatted as a clean JSON object.
    
    The JSON must contain two keys: "nodes" and "edges".
    - Each object in the "nodes" array must have a unique "id" (string), a "data" object with a "label" (string), and a "position" object with "x" and "y" coordinates (number).
    - Each object in the "edges" array must have a unique "id" (string), a "source" (the id of the parent node), and a "target" (the id of the child node).
    - The root node should have an id of '1'. All other nodes and edges should follow sequentially (e.g., '2', '3', 'e1-2', 'e1-3').

    USER TASK: "${task}"

    RELEVANT CODE CONTEXT FROM OUR DATABASE:
    ${context}

    Produce ONLY the JSON object representing this plan. Do not include markdown formatting like \`\`\`json or any other text.
  `;
    try {
        const result = await model.generateContent(prompt);
        const response = result.response;
        const jsonString = response.text();
        return JSON.parse(jsonString);
    }
    catch (e) {
        console.error("ERROR generating or parsing LLM response:", e);
        // Provide a fallback error plan
        return {
            nodes: [{ id: '1', data: { label: 'Error: Could not generate plan from LLM.' }, position: { x: 250, y: 5 } }],
            edges: []
        };
    }
};
