import { config } from 'dotenv';
import { startBot } from './bot/client';

// Load environment variables
config();

// Start the Discord bot
startBot();