import express from 'express';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.routes.js';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import config from './config/config.js';
import chatRoutes from './routes/chat.routes.js';

const app = express();

const googleCallbackURL = config.GOOGLE_REDIRECT_URI?.startsWith('http')
  ? config.GOOGLE_REDIRECT_URI
  : `${config.CLIENT_URL}${config.GOOGLE_REDIRECT_URI}`;


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(cookieParser());


app.use(passport.initialize());

passport.use(new GoogleStrategy({
    clientID: config.GOOGLE_CLIENT_ID,
    clientSecret: config.GOOGLE_CLIENT_SECRET,
  callbackURL: googleCallbackURL
  },
  function(accessToken, refreshToken, profile, cb) {
    // Here you would typically find or create a user in your database
    // For this example, we'll just return the profile
    return cb(null, profile);
  }
));



app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);

export default app;