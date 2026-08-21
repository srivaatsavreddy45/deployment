const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const User = require('../models/User');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const seedAdmin = async ({
  mongoUri = process.env.MONGO_URI,
  name = process.env.SEED_ADMIN_NAME,
  email = process.env.SEED_ADMIN_EMAIL,
  password = process.env.SEED_ADMIN_PASSWORD,
  UserModel = User,
  mongooseClient = mongoose,
} = {}) => {
  const missingVariables = [
    ['MONGO_URI', mongoUri],
    ['SEED_ADMIN_NAME', name],
    ['SEED_ADMIN_EMAIL', email],
    ['SEED_ADMIN_PASSWORD', password],
  ]
    .filter(([, value]) => !value)
    .map(([variable]) => variable);

  if (missingVariables.length) {
    throw new Error(
      `Missing Admin seed configuration: ${missingVariables.join(', ')}`
    );
  }

  if (password.length < 8 || password.length > 72) {
    throw new Error('SEED_ADMIN_PASSWORD must be between 8 and 72 characters');
  }

  const normalizedEmail = email.trim().toLowerCase();
  await mongooseClient.connect(mongoUri);

  try {
    const existingUser = await UserModel.findOne({ email: normalizedEmail });

    if (existingUser) {
      if (existingUser.role !== 'admin') {
        throw new Error(
          'A non-Admin account already uses SEED_ADMIN_EMAIL; refusing to promote it automatically'
        );
      }

      return {
        created: false,
        userId: existingUser._id.toString(),
        email: existingUser.email,
      };
    }

    const admin = await UserModel.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: 'admin',
      verificationStatus: 'verified',
      status: 'active',
    });

    return {
      created: true,
      userId: admin._id.toString(),
      email: admin.email,
    };
  } finally {
    await mongooseClient.disconnect();
  }
};

if (require.main === module) {
  seedAdmin()
    .then((result) => {
      const action = result.created ? 'created' : 'already exists';
      console.log(`Admin ${action}: ${result.email} (${result.userId})`);
    })
    .catch((error) => {
      console.error(`Admin seed failed: ${error.message}`);
      process.exitCode = 1;
    });
}

module.exports = { seedAdmin };
