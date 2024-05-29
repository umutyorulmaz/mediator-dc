const { execSync } = require('child_process');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '.env') });

const { POSTGRES_ACCOUNT, POSTGRES_PASSWORD } = process.env;

// Function to execute shell commands
const exec = (command) => {
  try {
    return execSync(command, { stdio: 'inherit' });
  } catch (error) {
    console.error(`Error executing command: ${command}`);
    console.error(error);
    process.exit(1);
  }
};

// Check if there is a running PostgreSQL container
let runningContainer;
try {
  runningContainer = execSync('docker ps --filter "name=postgres" --filter "status=running" --format "{{.ID}}"').toString().trim();
} catch (error) {
  console.error('Error checking running PostgreSQL containers:', error);
}

if (runningContainer) {
  console.log('PostgreSQL container is already running.');
} else {
  console.log('No running PostgreSQL container found. Creating a new one.');

  // Remove any existing PostgreSQL container
  let existingContainer;
  try {
    existingContainer = execSync('docker ps -a --filter "name=postgres" --format "{{.ID}}"').toString().trim();
    if (existingContainer) {
      console.log('Removing existing PostgreSQL container.');
      exec(`docker rm -f ${existingContainer}`);
    }
  } catch (error) {
    console.error('Error checking/removing existing PostgreSQL containers:', error);
  }

  // Run a new PostgreSQL container with version 15
  exec(`docker run -d --name postgres -e POSTGRES_USER=${POSTGRES_ACCOUNT} -e POSTGRES_PASSWORD=${POSTGRES_PASSWORD} -e POSTGRES_HOST_AUTH_METHOD=trust -p 5432:5432 postgres:15`);
}
