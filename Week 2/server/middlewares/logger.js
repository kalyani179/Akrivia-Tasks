// It enables customizable logging with multiple formats and transports.
// used for logging HTTP requests and errors in a Node.js application, with logs saved to files and displayed in the console.

const { createLogger, format, transports } = require('winston');
const { combine, timestamp, json, prettyPrint } = format;

// Custom format for console logging with colors
const consoleLogFormat = combine(
    format.colorize(),
    format.printf(({ level, message, timestamp }) => {
        return `${timestamp} ${level}: ${message}`;
    })
);

// Create a Winston logger
const logger = createLogger({
    level: 'info',
    format: combine(
        timestamp(),
        json(), // JSON for file logs
        prettyPrint() // Pretty print for better readability in files
    ),
    transports: [
        new transports.File({ filename: 'app.log'}),
        new transports.Console({ format: consoleLogFormat }) // Apply colorize only to console
    ]
});

module.exports = logger;