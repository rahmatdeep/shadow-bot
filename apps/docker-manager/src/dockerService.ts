import Docker from "dockerode";
import type { JoinMeetingPayload } from "@repo/types";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

export class DockerService {
    private docker: Docker;
    private readonly IMAGE_NAME = "rahmatdeep/gmeet-recorder:latest";
    private readonly RECORDINGS_HOST_PATH = path.resolve(__dirname, "..", "..", "..", "recordings");
    private readonly MAX_CONCURRENT_CONTAINERS = parseInt(process.env.MAX_CONCURRENT_CONTAINERS || "2", 10);

    constructor() {
        this.docker = new Docker();
        this.ensureRecordingsDirectoryExists();
    }

    /**
     * Ensures the recordings directory exists on the host.
     */
    private ensureRecordingsDirectoryExists() {
        if (!fs.existsSync(this.RECORDINGS_HOST_PATH)) {
            console.log(`Creating recordings directory at: ${this.RECORDINGS_HOST_PATH}`);
            fs.mkdirSync(this.RECORDINGS_HOST_PATH, { recursive: true });
        }
    }

    /**
     * Starts a new recorder container for the given meeting.
     */
    async startRecorder(payload: JoinMeetingPayload, fileName: string) {
        console.log(`Starting recorder for link: ${payload.link} (User: ${payload.userId})`);

        let containerName = "unknown";

        try {
            // Check global limit across all shadow-bot recorder containers
            const allRecorderContainers = await this.docker.listContainers({
                filters: JSON.stringify({
                    label: ["shadow-bot.user-id"],
                }),
            });

            if (allRecorderContainers.length >= this.MAX_CONCURRENT_CONTAINERS) {
                const errorMsg = `Global limit of ${this.MAX_CONCURRENT_CONTAINERS} containers reached.`;
                console.warn(errorMsg);
                throw new Error(errorMsg);
            }

            // Check for existing containers for this specific user
            const existingContainers = await this.docker.listContainers({
                filters: JSON.stringify({
                    label: [`shadow-bot.user-id=${payload.userId}`],
                }),
            });

            if (existingContainers.length > 0 && existingContainers[0]) {
                const errorMsg = `User ${payload.userId} already has an active recorder (${existingContainers[0].Id}).`;
                console.warn(errorMsg);
                throw new Error(errorMsg);
            }

            const duration = payload.maxDurationMins?.toString() || "15";
            containerName = `recorder-${payload.userId}-${Date.now()}`;

            // Pull the image if it doesn't exist locally
            await this.ensureImagePulled();

            const botName = `${payload.userName}'s shadow bot`;
            const cmd = ["bun", "meet.ts", payload.link, botName, duration];
            if (fileName) {
                cmd.push("--filename", fileName);
            }

            const container = await this.docker.createContainer({
                Image: this.IMAGE_NAME,
                name: containerName,
                Cmd: cmd,
                Labels: {
                    "shadow-bot.user-id": payload.userId,
                },
                HostConfig: {
                    IpcMode: "host",
                    Memory: 2 * 1024 * 1024 * 1024, // 2GB
                    Binds: [`${this.RECORDINGS_HOST_PATH}:/app/recordings`],
                    AutoRemove: true,
                },
                Env: [`MAX_DURATION_MINUTES=${duration}`],
            });

            await container.start();
            console.log(`Container ${containerName} started successfully.`);
            return container;
        } catch (error) {
            console.error(`Failed to start container ${containerName}:`, error);
            throw error;
        }
    }

    private async ensureImagePulled() {
        const images = await this.docker.listImages({
            filters: JSON.stringify({ reference: [this.IMAGE_NAME] }),
        });

        if (images.length === 0) {
            console.log(`Image ${this.IMAGE_NAME} not found locally. Pulling...`);
            return new Promise((resolve, reject) => {
                this.docker.pull(this.IMAGE_NAME, (err: Error | null, stream: NodeJS.ReadableStream) => {
                    if (err) return reject(err);
                    this.docker.modem.followProgress(stream, (err: Error | null) => {
                        if (err) return reject(err);
                        console.log(`Successfully pulled ${this.IMAGE_NAME}`);
                        resolve(true);
                    });
                });
            });
        }
    }
}
