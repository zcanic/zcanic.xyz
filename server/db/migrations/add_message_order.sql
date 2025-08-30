-- 为chat_messages表添加message_order字段，确保消息顺序正确
-- 执行时间：2024年部署时

-- 1. 添加message_order字段
ALTER TABLE chat_messages 
ADD COLUMN message_order INT DEFAULT 0 AFTER task_id;

-- 2. 为现有数据设置message_order（基于created_at时间顺序）
SET @row_number = 0;
UPDATE chat_messages 
SET message_order = (@row_number:=@row_number+1)
WHERE session_id IS NOT NULL
ORDER BY session_id, created_at ASC;

-- 3. 为每个会话重新设置正确的序号
DROP PROCEDURE IF EXISTS FixMessageOrder;

DELIMITER $$
CREATE PROCEDURE FixMessageOrder()
BEGIN
  DECLARE done INT DEFAULT FALSE;
  DECLARE session_id_var VARCHAR(36);
  DECLARE session_cursor CURSOR FOR 
    SELECT DISTINCT session_id FROM chat_messages WHERE session_id IS NOT NULL;
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

  OPEN session_cursor;
  read_loop: LOOP
    FETCH session_cursor INTO session_id_var;
    IF done THEN
      LEAVE read_loop;
    END IF;
    
    -- 为每个会话重新编号
    SET @order_num = 0;
    UPDATE chat_messages 
    SET message_order = (@order_num := @order_num + 1)
    WHERE session_id = session_id_var
    ORDER BY created_at ASC, CASE WHEN role = 'user' THEN 1 ELSE 2 END ASC;
    
  END LOOP;
  CLOSE session_cursor;
END$$
DELIMITER ;

-- 4. 执行修复过程
CALL FixMessageOrder();

-- 5. 清理临时过程
DROP PROCEDURE FixMessageOrder;

-- 6. 添加索引优化查询性能
CREATE INDEX idx_chat_messages_session_order ON chat_messages(session_id, message_order);

-- 7. 验证数据正确性
SELECT 
  session_id,
  message_order,
  role,
  SUBSTRING(content, 1, 50) as content_preview,
  created_at
FROM chat_messages 
WHERE session_id IN (
  SELECT session_id FROM chat_messages 
  GROUP BY session_id 
  HAVING COUNT(*) > 1 
  LIMIT 3
)
ORDER BY session_id, message_order;