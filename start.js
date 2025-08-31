#!/usr/bin/env node

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 PackTrack Pro Startup Script');
console.log('================================\n');

// Check if database exists
const dbPath = path.join(__dirname, 'packtrack.db');
const dbExists = fs.existsSync(dbPath);

if (!dbExists) {
    console.log('📊 Database not found. Initializing...');
    exec('npm run init', (error, stdout, stderr) => {
        if (error) {
            console.error('❌ Database initialization failed:', error);
            process.exit(1);
        }
        console.log(stdout);
        startServer();
    });
} else {
    console.log('✅ Database found');
    startServer();
}

function startServer() {
    console.log('🌟 Starting PackTrack Pro server...\n');
    
    const server = spawn('npm', ['start'], {
        stdio: 'inherit',
        shell: true
    });

    server.on('close', (code) => {
        console.log(`\n👋 Server stopped with code ${code}`);
    });

    // Handle graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n🛑 Shutting down gracefully...');
        server.kill('SIGTERM');
        setTimeout(() => {
            process.exit(0);
        }, 1000);
    });

    // Show helpful information
    setTimeout(() => {
        console.log('\n📋 Quick Start Guide:');
        console.log('👤 Demo Account: demo@packtrack.com / demo123');
        console.log('🌐 Open: http://localhost:3000');
        console.log('🧪 Test: npm run test (in another terminal)');
        console.log('⏹️  Stop: Ctrl+C');
    }, 2000);
}