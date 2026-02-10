import request from 'supertest';
import express from 'express';
import { queryRouter } from '../routes/v1/query';
import { prisma } from '@repo/db/client';

// Mock dependencies
jest.mock('@repo/db/client', () => ({
    prisma: {
        querySession: {
            create: jest.fn(),
            findUnique: jest.fn(),
            findMany: jest.fn(),
        },
        queryMessage: {
            create: jest.fn(),
        },
        recording: {
            findMany: jest.fn(),
        },
    },
}));

jest.mock('../middleware/auth', () => ({
    authMiddleware: (req: any, _res: any, next: any) => {
        req.userId = 'test-user-123';
        next();
    },
}));

jest.mock('../utils/ownership', () => ({
    verifyQueryOwnership: jest.fn().mockResolvedValue(true),
}));

jest.mock('@langchain/google-genai', () => ({
    ChatGoogleGenerativeAI: jest.fn().mockImplementation(() => ({
        invoke: jest.fn().mockResolvedValue({
            content: 'This is an AI response',
        }),
    })),
}));

jest.mock('../utils/vectorSearch', () => ({
    searchSimilarChunks: jest.fn().mockResolvedValue([]),
}));

jest.mock('../utils/parseTimeFilter', () => ({
    parseTimeFilter: jest.fn().mockResolvedValue({
        afterDaysAgo: null,
        beforeDaysAgo: null,
        limit: null,
    }),
    buildPrismaDateFilter: jest.fn().mockReturnValue({}),
}));

const app = express();
app.use(express.json());

// Mock auth middleware
app.use((req: any, _res, next) => {
    req.userId = 'test-user-123';
    next();
});

app.use('/query', queryRouter);

const VALID_QUERY_SESSION_ID = '550e8400-e29b-41d4-a716-446655440001';

describe('Query Routes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /query', () => {
        it('should process query and return querySessionId', async () => {
            const mockSession = {
                id: VALID_QUERY_SESSION_ID,
                userId: 'test-user-123',
                title: 'Hello',
                messages: [],
            };

            (prisma.querySession.create as jest.Mock).mockResolvedValue(mockSession);
            (prisma.recording.findMany as jest.Mock).mockResolvedValue([]);
            (prisma.queryMessage.create as jest.Mock).mockResolvedValue({ id: 'msg-1' });

            const response = await request(app)
                .post('/query')
                .send({
                    message: 'Hello what is this?'
                });

            expect(response.status).toBe(200);
            expect(response.body).toMatchObject({
                response: 'This is an AI response',
                querySessionId: VALID_QUERY_SESSION_ID
            });
        });

        it('should work with existing querySessionId', async () => {
            const mockSession = {
                id: VALID_QUERY_SESSION_ID,
                userId: 'test-user-123',
                title: 'Hello',
                messages: [],
            };

            (prisma.querySession.findUnique as jest.Mock).mockResolvedValue(mockSession);
            (prisma.recording.findMany as jest.Mock).mockResolvedValue([]);
            (prisma.queryMessage.create as jest.Mock).mockResolvedValue({ id: 'msg-1' });

            const response = await request(app)
                .post('/query')
                .send({
                    querySessionId: VALID_QUERY_SESSION_ID,
                    message: 'Tell me more'
                });

            expect(response.status).toBe(200);
            expect(response.body.querySessionId).toBe(VALID_QUERY_SESSION_ID);
        });
    });

    describe('GET /query/:querySessionId', () => {
        it('should return session history', async () => {
            const mockSession = {
                id: VALID_QUERY_SESSION_ID,
                userId: 'test-user-123',
                title: 'Hello',
                createdAt: new Date(),
                updatedAt: new Date(),
                messages: [
                    { id: '1', role: 'USER', content: 'Hi', createdAt: new Date() }
                ],
            };

            (prisma.querySession.findUnique as jest.Mock).mockResolvedValue(mockSession);

            const response = await request(app).get(`/query/${VALID_QUERY_SESSION_ID}`);

            expect(response.status).toBe(200);
            expect(response.body.id).toBe(VALID_QUERY_SESSION_ID);
        });
    });
});
