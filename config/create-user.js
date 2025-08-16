require('dotenv').config();
const path = require('path');
const mongoose = require(path.resolve(__dirname, '..', 'api', 'node_modules', 'mongoose'));
const { User } = require('@librechat/data-schemas').createModels(mongoose);
require('module-alias')({ base: path.resolve(__dirname, '..', 'api') });
const { registerUser } = require('~/server/services/AuthService');
const { askQuestion, silentExit } = require('./helpers');
const connect = require('./connect');

(async () => {
  await connect();

  console.purple('--------------------------');
  console.purple('Create a new user account!');
  console.purple('--------------------------');

  if (process.argv.length < 6) {
    console.orange('Usage: npm run create-user <email> <name> <username> <password> [--no-email]');
    console.orange('Note: if you do not pass in all arguments, you will be prompted for missing ones.');
    console.orange('');
    console.orange('Flags:');
    console.orange('  --no-email         Set emailVerified to false (user does not need to confirm email)');
    console.orange('  --email-verified=false   Alternative way to set emailVerified to false');
    console.orange('');
    console.orange('Examples:');
    console.orange('  npm run create-user user@example.com "John Doe" johndoe mypassword123');
    console.orange('  npm run create-user user@example.com "John Doe" johndoe mypassword123 --no-email');
    console.purple('--------------------------');
  }

  let email = '';
  let password = '';
  let name = '';
  let username = '';
  let emailVerified = true;

  // Parse command line arguments
  const args = process.argv.slice(2);
  const flags = args.filter(arg => arg.startsWith('--'));
  const positionalArgs = args.filter(arg => !arg.startsWith('--'));

  // Handle flags
  for (const flag of flags) {
    if (flag === '--no-email') {
      emailVerified = false;
    } else if (flag.startsWith('--email-verified=')) {
      emailVerified = flag.split('=')[1].toLowerCase() !== 'false';
    }
  }

  // Handle positional arguments
  if (positionalArgs.length >= 1) email = positionalArgs[0];
  if (positionalArgs.length >= 2) name = positionalArgs[1];
  if (positionalArgs.length >= 3) username = positionalArgs[2];
  if (positionalArgs.length >= 4) {
    console.orange('Note: password provided as argument (consider security implications)');
    password = positionalArgs[3];
  }

  if (!email) {
    email = await askQuestion('Email:');
  }
  if (!email.includes('@')) {
    console.red('Error: Invalid email address!');
    silentExit(1);
  }

  const defaultName = email.split('@')[0];
  if (!name) {
    name = await askQuestion('Name: (default is: ' + defaultName + ')');
    if (!name) {
      name = defaultName;
    }
  }
  if (!username) {
    username = await askQuestion('Username: (default is: ' + defaultName + ')');
    if (!username) {
      username = defaultName;
    }
  }
  if (!password) {
    password = await askQuestion('Password: (leave blank, to generate one)');
    if (!password) {
      password = Math.random().toString(36).slice(-18);
      console.orange('Your password is: ' + password);
    }
  }

  // Only prompt for emailVerified if it wasn't set via CLI flags
  if (!flags.some((flag) => flag === '--no-email' || flag.startsWith('--email-verified='))) {
    const emailVerifiedInput = await askQuestion(`Email verified? (Y/n, default is Y):

If \`y\`, the user's email will be considered verified.
      
If \`n\`, and email service is configured, the user will be sent a verification email.

If \`n\`, and email service is not configured, you must have the \`ALLOW_UNVERIFIED_EMAIL_LOGIN\` .env variable set to true,
or the user will need to attempt logging in to have a verification link sent to them.`);

    if (emailVerifiedInput.toLowerCase() === 'n') {
      emailVerified = false;
    }
  }

  const userExists = await User.findOne({ $or: [{ email }, { username }] });
  if (userExists) {
    console.red('Error: A user with that email or username already exists!');
    silentExit(1);
  }

  const user = { email, password, name, username, confirm_password: password };
  let result;
  try {
    result = await registerUser(user, { emailVerified });
  } catch (error) {
    console.red('Error: ' + error.message);
    silentExit(1);
  }

  if (result.status !== 200) {
    console.red('Error: ' + result.message);
    silentExit(1);
  }

  const userCreated = await User.findOne({ $or: [{ email }, { username }] });
  if (userCreated) {
    console.green('User created successfully!');
    console.green(`Email verified: ${userCreated.emailVerified}`);
    silentExit(0);
  }
})();

process.on('uncaughtException', (err) => {
  if (!err.message.includes('fetch failed')) {
    console.error('There was an uncaught error:');
    console.error(err);
  }

  if (err.message.includes('fetch failed')) {
    return;
  } else {
    process.exit(1);
  }
});
