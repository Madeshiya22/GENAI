import app from './src/app.js';
import connectDB from './src/config/database.js';
import config from './src/config/config.js';

const startServer = async () => {
await connectDB();

const port = config.port || 3000;
app.listen(port, () => {
	console.log(`Server is running on port ${port}`);
});
};

startServer().catch((err) => {
console.error('Failed to start server:', err);
process.exit(1);
});

