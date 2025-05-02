const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
    });
    console.log('Connecté à la base de données MongoDB');
  } catch (error) {
    console.error('Erreur lors de la connexion à la base de données MongoDB :', error);
    process.exit(1);
  }
};

module.exports = { connectDB };