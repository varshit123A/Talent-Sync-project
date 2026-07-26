import express, { Request, Response } from 'express';
import cors from 'cors';
import jobRoutes from './routes/jobRoutes';

const app = express();
const PORT = process.env.PORT || 5002;

app.use(cors());
app.use(express.json());

app.use('/', jobRoutes);

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'job-service' });
});

app.listen(PORT, () => {
  console.log('[job-service] Running on port 5002');
});