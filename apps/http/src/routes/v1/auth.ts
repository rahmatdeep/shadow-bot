import { Router } from "express";
import { prisma } from "@repo/db/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { SignupSchema, LoginSchema, GoogleAuthSchema } from "@repo/types";

const authRouter: Router = Router();

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Sign up with email/password
authRouter.post("/signup", async (req, res) => {
    const parsed = SignupSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: "Invalid input", details: parsed.error.flatten().fieldErrors });
        return;
    }

    const { email, password, name } = parsed.data;

    try {
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            res.status(409).json({ error: "User already exists" });
            return;
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
            },
        });

        // Generate JWT
        const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
            expiresIn: "7d",
        });

        res.status(201).json({
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
            },
            token,
        });
    } catch (error) {
        console.error("Signup error:", error);
        res.status(500).json({ error: "Failed to create user" });
    }
});

// Login with email/password
authRouter.post("/login", async (req, res) => {
    const parsed = LoginSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: "Invalid input", details: parsed.error.flatten().fieldErrors });
        return;
    }

    const { email, password } = parsed.data;

    try {
        // Find user
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            res.status(401).json({ error: "Invalid credentials" });
            return;
        }

        // Check if user signed up with OAuth
        if (user.provider && !user.password) {
            res.status(401).json({ error: `Please sign in with ${user.provider}` });
            return;
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
            res.status(401).json({ error: "Invalid credentials" });
            return;
        }

        // Generate JWT
        const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
            expiresIn: "7d",
        });

        res.json({
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
            },
            token,
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ error: "Failed to login" });
    }
});

// Google OAuth authentication
authRouter.post("/google-auth", async (req, res) => {
    const parsed = GoogleAuthSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: "Invalid input", details: parsed.error.flatten().fieldErrors });
        return;
    }

    const { email, name, providerId } = parsed.data;

    try {
        // Find or create user
        let user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            // Create new user for Google sign-in
            user = await prisma.user.create({
                data: {
                    email,
                    name,
                    password: "", // No password for OAuth users
                    provider: "google",
                    providerAccountId: providerId,
                },
            });
        } else if (!user.provider) {
            // Link Google account to existing user
            user = await prisma.user.update({
                where: { email },
                data: {
                    provider: "google",
                    providerAccountId: providerId,
                },
            });
        }

        // Generate JWT
        const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
            expiresIn: "7d",
        });

        res.json({
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
            },
            token,
        });
    } catch (error) {
        console.error("Google auth error:", error);
        res.status(500).json({ error: "Failed to authenticate with Google" });
    }
});

export { authRouter };
