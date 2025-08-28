import { Pinecone } from '@pinecone-database/pinecone';
import dotenv from 'dotenv';
dotenv.config();
const getEmbeddings = async (text) => {
    console.log(`(Mock) Generating embedding for: "${text.substring(0, 20)}..."`);
    const vector = Array.from({ length: 8 }, (_, i) => {
        return text.length > 0 ? (text.charCodeAt(i % text.length) / 128.0) * (i + 1) : 0;
    });
    return vector;
};
let pinecone;
export const initVectorDB = async () => {
    pinecone = new Pinecone({
        apiKey: process.env.PINECONE_API_KEY,
    });
    console.log("Vector DB Initialized");
};
export const addCodeToDB = async (code) => {
    const index = pinecone.index('traycer-context');
    const embedding = await getEmbeddings(code);
    const id = new Date().toISOString();
    await index.upsert([{
            id,
            values: embedding,
            metadata: { code }
        }]);
    console.log("Added code snippet to Vector DB.");
};
export const getContextFromDB = async (task) => {
    const index = pinecone.index('traycer-context');
    const taskEmbedding = await getEmbeddings(task);
    const queryResponse = await index.query({
        topK: 3,
        vector: taskEmbedding,
        includeMetadata: true,
    });
    if (queryResponse.matches.length === 0) {
        return "No relevant code context was found in the database.";
    }
    return queryResponse.matches
        .map(match => `--- Relevant Code Snippet ---\n${match.metadata?.code}`)
        .join('\n\n');
};
