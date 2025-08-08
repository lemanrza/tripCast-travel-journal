const mongoose = require('mongoose');
const config = require('./src/config/config.js');

async function fixUsernameIndex() {
    try {
        console.log('🔄 Connecting to MongoDB...');
        await mongoose.connect(config.DB_URL.replace('<db_password>', config.DB_PASSWORD));
        console.log('✅ Connected to MongoDB');
        
        const collection = mongoose.connection.db.collection('users');
        
        // List existing indexes
        console.log('📋 Checking existing indexes...');
        const indexes = await collection.indexes();
        console.log('Current indexes:', indexes.map(i => i.name));
        
        // Check if username index exists
        const usernameIndex = indexes.find(i => i.name === 'username_1' || (i.key && i.key.username));
        
        if (usernameIndex) {
            console.log('🗑️ Dropping username_1 index...');
            await collection.dropIndex('username_1');
            console.log('✅ Successfully dropped username_1 index!');
        } else {
            console.log('ℹ️ No username index found to drop');
        }
        
        // Show remaining indexes
        const remainingIndexes = await collection.indexes();
        console.log('📋 Remaining indexes:', remainingIndexes.map(i => i.name));
        
        await mongoose.connection.close();
        console.log('🔌 Disconnected from MongoDB');
        console.log('🎉 Database fix completed successfully!');
        
    } catch (error) {
        console.error('❌ Error fixing database:', error.message);
        
        if (error.codeName === 'IndexNotFound') {
            console.log('ℹ️ Index was already removed or never existed');
        }
        
        await mongoose.connection.close();
        process.exit(1);
    }
}

console.log('🚀 Starting database index fix...');
fixUsernameIndex();
