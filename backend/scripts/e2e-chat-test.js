import 'dotenv/config';
import jwt from 'jsonwebtoken';
import fetch from 'node-fetch';
import crypto from 'crypto';

const BACKEND = process.env.BACKEND_URL || 'http://127.0.0.1:3000';
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error('JWT_SECRET not set in env');
  process.exit(1);
}

function makeObjectId() {
  return crypto.randomBytes(12).toString('hex');
}

async function main() {
  const userId = makeObjectId();
  const token = jwt.sign({ id: userId, fullname: 'E2E Tester' }, JWT_SECRET, {
    expiresIn: '3d',
  });

  console.log('Using user id:', userId);

  try {
    const createRes = await fetch(`${BACKEND}/api/chat/message/new`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `token=${token}`,
      },
      body: JSON.stringify({}),
    });

    const createJson = await createRes.json().catch(() => null);
    console.log('Create chat status:', createRes.status);
    console.log('Create chat body:', createJson);

    if (!createJson || !createJson.chat?._id) {
      console.error('Failed to create chat');
      process.exit(1);
    }

    const chatId = createJson.chat._id;

    const sseRes = await fetch(`${BACKEND}/api/chat/message/${chatId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `token=${token}`,
      },
      body: JSON.stringify({ message: 'Hello from automated E2E test' }),
    });

    console.log('SSE status:', sseRes.status);

    if (sseRes.ok) {
        console.log('SSE stream output:');
        sseRes.body.on('data', chunk => {
            process.stdout.write(chunk.toString());
        });
        sseRes.body.on('end', () => {
            console.log('\nSSE stream ended');
            process.exit(0);
        });
    } else {
        const errText = await sseRes.text();
        console.error('SSE Error:', errText);
        process.exit(1);
    }
  } catch (err) {
    console.error('E2E script error:', err);
    process.exit(1);
  }
}

main();
