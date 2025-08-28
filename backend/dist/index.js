import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { generatePlanFromLLM } from './services/llm.service.js';
import { getContextFromDB, addCodeToDB, initVectorDB } from './services/vector.service.js';
dotenv.config();
const app = express();
app.use(cors({
    origin: ["*"],
}));
app.use(express.json());
app.post('/api/context', async (req, res) => {
    const { code } = req.body;
    if (!code)
        return res.status(400).send({ error: 'Code snippet is required.' });
    try {
        await addCodeToDB(code);
        res.status(200).send({ message: 'Context added successfully.' });
    }
    catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Failed to add context to DB.' });
    }
});
app.post('/api/plan', async (req, res) => {
    const { task } = req.body;
    if (!task)
        return res.status(400).send({ error: 'Task is required.' });
    try {
        console.log("Fetching context from Vector DB...");
        const context = await getContextFromDB(task);
        console.log("Generating new plan with Gemini...");
        const plan = await generatePlanFromLLM(task, context);
        res.json(plan);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});
const PORT = process.env.PORT || 3001;
app.listen(PORT, async () => {
    await initVectorDB();
    console.log(`Backend server is running on http://localhost:${PORT}`);
});
