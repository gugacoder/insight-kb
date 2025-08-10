#!/bin/bash

# Script to completely drop MongoDB and/or Redis databases
# Uses the same dependencies as LibreChat (mongoose and ioredis)

# Default to drop all databases
DROP_MONGO=true
DROP_REDIS=true

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --mongo)
            DROP_MONGO=true
            DROP_REDIS=false
            shift
            ;;
        --redis)
            DROP_REDIS=true
            DROP_MONGO=false
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  --mongo    Drop only MongoDB database"
            echo "  --redis    Drop only Redis database"
            echo "  --help     Show this help message"
            echo ""
            echo "Default: Drop both MongoDB and Redis databases"
            echo ""
            echo "This script will COMPLETELY DESTROY the specified databases."
            echo "All data will be permanently lost."
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Check if .env exists
if [ ! -f .env ]; then
    echo "Error: .env file not found"
    exit 1
fi

# Show what will be destroyed
echo ""
echo "🚨 DATABASE DESTRUCTION TOOL 🚨"
echo ""
echo "This tool will PERMANENTLY DESTROY the following databases:"
if [ "$DROP_MONGO" = true ] && [ "$DROP_REDIS" = true ]; then
    echo "• MongoDB database"
    echo "• Redis database (all data)"
elif [ "$DROP_MONGO" = true ]; then
    echo "• MongoDB database"
elif [ "$DROP_REDIS" = true ]; then
    echo "• Redis database (all data)"
fi
echo ""
echo "⚠️  THIS ACTION CANNOT BE UNDONE ⚠️"
echo ""
read -p "Are you absolutely sure you want to DESTROY these databases? [y/N]: " confirm

# Default to No
if [[ ! "$confirm" =~ ^[yY]$ ]]; then
    echo ""
    echo "✅ Operation cancelled. Databases remain intact."
    echo ""
    exit 0
fi

echo ""
echo "🔥 PROCEEDING WITH DATABASE DESTRUCTION..."
echo ""
sleep 2

# Get the script directory
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Create MongoDB drop script
if [ "$DROP_MONGO" = true ]; then
    cat > "$SCRIPT_DIR/api/drop-mongo.js" << 'EOF'
require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');

async function dropMongoDB() {
    const uri = process.env.MONGO_URI;
    if (!uri) {
        throw new Error('MONGO_URI not found in .env');
    }
    
    const dbName = uri.split('/').pop().split('?')[0];
    
    console.log('');
    console.log('╔════════════════════════════════════════════════════════════════════╗');
    console.log('║                    🔥💀 MONGODB DESTRUCTION 💀🔥                   ║');
    console.log('╠════════════════════════════════════════════════════════════════════╣');
    console.log('║                                                                    ║');
    console.log(`║  Database: ${dbName.padEnd(56)}║`);
    console.log('║                                                                    ║');
    console.log('╚════════════════════════════════════════════════════════════════════╝');
    console.log('');
    
    try {
        await mongoose.connect(uri);
        const db = mongoose.connection.db;
        const stats = await db.stats();
        
        console.log('📊 Stats before destruction:');
        console.log(`  - Collections: ${stats.collections}`);
        console.log(`  - Data size: ${(stats.dataSize / 1024 / 1024).toFixed(2)} MB`);
        console.log(`  - Storage size: ${(stats.storageSize / 1024 / 1024).toFixed(2)} MB`);
        console.log('');
        console.log('💣 DROPPING THE DATABASE COMPLETELY...');
        
        await mongoose.connection.dropDatabase();
        
        console.log('');
        console.log('💥 DATABASE DESTROYED SUCCESSFULLY!');
        console.log(`✓ The database "${dbName}" HAS BEEN COMPLETELY DROPPED`);
        console.log('✓ There is no trace of this database anymore');
        console.log('');
        
        await mongoose.disconnect();
        
        console.log('════════════════════════════════════════════════════════');
        console.log(`✅ MongoDB '${dbName}' HAS BEEN COMPLETELY DESTROYED!`);
        console.log('════════════════════════════════════════════════════════');
        console.log('');
        
        return true;
    } catch (error) {
        console.error('');
        console.error('❌ ERROR trying to destroy MongoDB database');
        console.error('Details:', error.message);
        console.error('');
        if (mongoose.connection.readyState === 1) {
            await mongoose.disconnect();
        }
        return false;
    }
}

dropMongoDB().then(success => {
    process.exit(success ? 0 : 1);
}).catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
EOF
fi

# Create Redis drop script
if [ "$DROP_REDIS" = true ]; then
    cat > "$SCRIPT_DIR/api/drop-redis.js" << 'EOF'
require('dotenv').config({ path: '../.env' });
const IoRedis = require('ioredis');

async function dropRedis() {
    const uri = process.env.REDIS_URI;
    if (!uri) {
        throw new Error('REDIS_URI not found in .env');
    }
    
    console.log('');
    console.log('╔════════════════════════════════════════════════════════════════════╗');
    console.log('║                     🔥💀 REDIS DESTRUCTION 💀🔥                    ║');
    console.log('╠════════════════════════════════════════════════════════════════════╣');
    console.log('║                                                                    ║');
    console.log('║  This will DESTROY all Redis data including:                      ║');
    console.log('║  • All cached user sessions                                        ║');
    console.log('║  • All rate limiting data                                          ║');
    console.log('║  • All authentication tokens                                       ║');
    console.log('║  • All cached configurations                                       ║');
    console.log('║                                                                    ║');
    console.log('╚════════════════════════════════════════════════════════════════════╝');
    console.log('');
    
    try {
        const redis = new IoRedis(uri);
        
        await new Promise((resolve, reject) => {
            redis.once('ready', resolve);
            redis.once('error', reject);
        });
        
        console.log('✓ Successfully connected to Redis');
        console.log('');
        
        const keyCount = await redis.dbsize();
        console.log(`Found ${keyCount} keys in database`);
        
        if (keyCount > 0) {
            console.log('Sample of keys to be deleted:');
            const keys = await redis.keys('*');
            const sampleKeys = keys.slice(0, 10);
            sampleKeys.forEach(key => {
                console.log(`  - ${key}`);
            });
            if (keys.length > 10) {
                console.log(`  ... and ${keys.length - 10} more keys`);
            }
        }
        
        console.log('');
        console.log('Flushing ALL data...');
        
        await redis.flushall();
        
        console.log('✓ All Redis databases successfully flushed');
        
        const remaining = await redis.dbsize();
        console.log('');
        console.log('Verification:');
        console.log(`  Keys before: ${keyCount}`);
        console.log(`  Keys after: ${remaining}`);
        
        await redis.quit();
        
        console.log('');
        console.log('════════════════════════════════════════════════════════');
        console.log('✅ Redis HAS BEEN COMPLETELY FLUSHED!');
        console.log('════════════════════════════════════════════════════════');
        console.log('');
        
        return true;
    } catch (error) {
        console.error('');
        console.error('❌ ERROR trying to flush Redis');
        console.error('Details:', error.message);
        console.error('');
        return false;
    }
}

dropRedis().then(success => {
    process.exit(success ? 0 : 1);
}).catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
EOF
fi

# Execute the scripts
MONGO_RESULT=0
REDIS_RESULT=0

if [ "$DROP_MONGO" = true ]; then
    cd "$SCRIPT_DIR/api" && node drop-mongo.js
    MONGO_RESULT=$?
fi

if [ "$DROP_REDIS" = true ]; then
    cd "$SCRIPT_DIR/api" && node drop-redis.js
    REDIS_RESULT=$?
fi

# Final status
echo ""
echo "════════════════════════════════════════════════════════"
echo "FINAL STATUS:"
if [ "$DROP_MONGO" = true ]; then
    if [ $MONGO_RESULT -eq 0 ]; then
        echo "✅ MongoDB: Successfully destroyed"
    else
        echo "❌ MongoDB: Failed to destroy"
    fi
fi
if [ "$DROP_REDIS" = true ]; then
    if [ $REDIS_RESULT -eq 0 ]; then
        echo "✅ Redis: Successfully destroyed"
    else
        echo "❌ Redis: Failed to destroy"
    fi
fi
echo "════════════════════════════════════════════════════════"
echo ""

# Clean up
rm -f "$SCRIPT_DIR/api/drop-mongo.js" "$SCRIPT_DIR/api/drop-redis.js"

# Exit with error if any operation failed
if [ $MONGO_RESULT -ne 0 ] || [ $REDIS_RESULT -ne 0 ]; then
    exit 1
fi

exit 0