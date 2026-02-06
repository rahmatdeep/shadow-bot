import request from 'supertest';
import express from 'express';
import { meetingRouter } from '../routes/v1/meeting';
import { prisma } from '@repo/db/client';
import { authMiddleware } from '../middleware/auth';
import jwt from 'jsonwebtoken';

// Mock dependencies
jest.mock('@repo/db/client', () => ({
    prisma: {
        recording: {
            findMany: jest.fn(),
            findUnique: jest.fn(),
            create: jest.fn(),
        },
        transcript: {
            findUnique: jest.fn(),
        },
    },
}));
jest.mock('redis', () => ({
    createClient: jest.fn(() => ({
        connect: jest.fn(),
        rPush: jest.fn(),
    })),
}));

const app = express();
app.use(express.json());

// Mock auth middleware to inject userId
app.use((req: any, _res, next) => {
    req.userId = 'test-user-123';
    next();
});

app.use('/meeting', meetingRouter);

describe('Meeting Routes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /meeting/', () => {
        it('should list user recordings', async () => {
            const mockRecordings = [
                {
                    id: 'rec-1',
                    link: 'https://meet.google.com/abc',
                    status: 'COMPLETED',
                    fileName: 'recording.mp4',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    transcript: { status: 'COMPLETED', summary: { title: 'Test', goal: 'Test Goal', keyPoints: [], actionItems: [] } },
                },
            ];

            (prisma.recording.findMany as jest.Mock).mockResolvedValue(mockRecordings);

            const response = await request(app).get('/meeting/');

            expect(response.status).toBe(200);
            expect(response.body).toHaveLength(1);
            expect(response.body[0]).toMatchObject({
                id: 'rec-1',
                link: 'https://meet.google.com/abc',
                status: 'COMPLETED',
                hasTranscript: true,
            });
        });

        it('should return empty array when no recordings', async () => {
            (prisma.recording.findMany as jest.Mock).mockResolvedValue([]);

            const response = await request(app).get('/meeting/');

            expect(response.status).toBe(200);
            expect(response.body).toEqual([]);
        });
    });

    describe('GET /meeting/:id', () => {
        it('should return recording details for owner', async () => {
            const mockRecording = {
                id: 'rec-1',
                userId: 'test-user-123',
                link: 'https://meet.google.com/abc',
                status: 'COMPLETED',
                fileName: 'recording.mp4',
                errorMetadata: null,
                createdAt: new Date(),
                updatedAt: new Date(),
                transcript: {
                    status: 'COMPLETED',
                    transcript: 'Full transcript',
                    transcriptWithTimeStamps: 'Timestamped transcript',
                    summary: { title: 'Test', goal: 'Test Goal', keyPoints: [], actionItems: [] },
                },
                chatSessions: [],
            };

            (prisma.recording.findUnique as jest.Mock)
                .mockResolvedValueOnce({ userId: 'test-user-123' }) // ownership check
                .mockResolvedValueOnce(mockRecording); // actual fetch

            const response = await request(app).get('/meeting/rec-1');

            expect(response.status).toBe(200);
            expect(response.body).toMatchObject({
                id: 'rec-1',
                link: 'https://meet.google.com/abc',
                status: 'COMPLETED',
            });
            expect(response.body.transcript).toBeDefined();
        });

        it('should deny access to non-owner', async () => {
            (prisma.recording.findUnique as jest.Mock).mockResolvedValue({
                userId: 'different-user',
            });

            const response = await request(app).get('/meeting/rec-1');

            expect(response.status).toBe(403);
            expect(response.body.error).toBe('Access denied');
        });

        it('should return 404 for non-existent recording', async () => {
            (prisma.recording.findUnique as jest.Mock)
                .mockResolvedValueOnce({ userId: 'test-user-123' })
                .mockResolvedValueOnce(null);

            const response = await request(app).get('/meeting/rec-1');

            expect(response.status).toBe(404);
            expect(response.body.error).toBe('Meeting not found');
        });
    });

    describe('GET /meeting/:id/status', () => {
        it('should return recording status for owner', async () => {
            const mockRecording = {
                id: 'rec-1',
                status: 'JOINED',
                transcript: { status: 'PENDING' },
            };

            (prisma.recording.findUnique as jest.Mock)
                .mockResolvedValueOnce({ userId: 'test-user-123' })
                .mockResolvedValueOnce(mockRecording);

            const response = await request(app).get('/meeting/rec-1/status');

            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                id: 'rec-1',
                recordingStatus: 'JOINED',
                transcriptStatus: 'PENDING',
            });
        });

        it('should deny access to non-owner', async () => {
            (prisma.recording.findUnique as jest.Mock).mockResolvedValue({
                userId: 'different-user',
            });

            const response = await request(app).get('/meeting/rec-1/status');

            expect(response.status).toBe(403);
            expect(response.body.error).toBe('Access denied');
        });
    });

    describe('GET /meeting/:id/transcript', () => {
        it('should return transcript for owner', async () => {
            const mockTranscript = {
                recordingId: 'rec-1',
                status: 'COMPLETED',
                transcript: 'Full transcript',
                transcriptWithTimeStamps: 'Timestamped transcript',
                summary: { title: 'Test', goal: 'Test Goal', keyPoints: ['Point 1'], actionItems: ['Item 1'] },
                updatedAt: new Date(),
            };

            (prisma.recording.findUnique as jest.Mock).mockResolvedValue({ userId: 'test-user-123' });
            (prisma.transcript.findUnique as jest.Mock).mockResolvedValue(mockTranscript);

            const response = await request(app).get('/meeting/rec-1/transcript');

            expect(response.status).toBe(200);
            expect(response.body).toMatchObject({
                recordingId: 'rec-1',
                status: 'COMPLETED',
                transcript: 'Full transcript',
                summary: { title: 'Test', goal: 'Test Goal' },
            });
        });

        it('should deny access to non-owner', async () => {
            (prisma.recording.findUnique as jest.Mock).mockResolvedValue({
                userId: 'different-user',
            });

            const response = await request(app).get('/meeting/rec-1/transcript');

            expect(response.status).toBe(403);
            expect(response.body.error).toBe('Access denied');
        });

        it('should return 404 when transcript not found', async () => {
            (prisma.recording.findUnique as jest.Mock).mockResolvedValue({ userId: 'test-user-123' });
            (prisma.transcript.findUnique as jest.Mock).mockResolvedValue(null);

            const response = await request(app).get('/meeting/rec-1/transcript');

            expect(response.status).toBe(404);
            expect(response.body.error).toBe('Transcript not found');
        });
    });

    describe('POST /meeting/join', () => {
        it('should create recording and queue join request', async () => {
            const mockRecording = {
                id: 'rec-123',
                userId: 'test-user-123',
                link: 'https://meet.google.com/abc-def-ghi',
            };

            (prisma.recording.create as jest.Mock).mockResolvedValue(mockRecording);

            const response = await request(app)
                .post('/meeting/join')
                .send({
                    link: 'https://meet.google.com/abc-def-ghi',
                });

            expect(response.status).toBe(200);
            expect(response.body).toEqual({
                status: 'queued',
                recordingId: 'rec-123',
            });
            expect(prisma.recording.create).toHaveBeenCalledWith({
                data: {
                    userId: 'test-user-123',
                    link: 'https://meet.google.com/abc-def-ghi',
                },
            });
        });

        it('should reject invalid URL', async () => {
            const response = await request(app)
                .post('/meeting/join')
                .send({
                    link: 'not-a-url',
                });

            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Invalid input');
        });

        it('should reject missing link', async () => {
            const response = await request(app)
                .post('/meeting/join')
                .send({});

            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Invalid input');
        });
    });
});
