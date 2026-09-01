#!/usr/bin/env node

// Wait 2 seconds then send SIGINT to shutdown the server
setTimeout(() => {
    process.kill(process.pid, 'SIGINT');
}, 2000);

// Keep the script running
setInterval(() => {}, 1000);
