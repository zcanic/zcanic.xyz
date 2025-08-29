/**
 * 语音聊天功能数据库迁移
 */
module.exports = async (pool) => {
  try {
    console.log('Adding voice chat fields to database tables...');
    
    // 向chat_sessions表添加chat_mode字段
    await pool.query(`
      ALTER TABLE chat_sessions 
      ADD COLUMN IF NOT EXISTS chat_mode VARCHAR(50) DEFAULT 'normal'
    `);
    
    // 向chat_messages表添加voice相关字段
    await pool.query(`
      ALTER TABLE chat_messages 
      ADD COLUMN IF NOT EXISTS voice_url VARCHAR(255) DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS translated_text TEXT DEFAULT NULL
    `);
    
    console.log('Voice chat database migration completed successfully.');
  } catch (error) {
    console.error('Error during voice chat migration:', error);
    throw error;
  }
}; 