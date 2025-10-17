GET /api/cache/stats
返回缓存使用情况、命中率、内存占用等

🗑️ 缓存清理

POST /api/cache/clear
Content-Type: application/json

{
"type": "all" // 清理所有缓存
"type": "tokens" // 清理代币相关缓存
"type": "expired" // 只清理过期缓存
}

4. 缓存优势

✅ 性能提升:
首次加载后，响应时间从几秒降到几毫秒✅
用户体验: 一个用户的请求让所有用户受益✅
节省资源: 减少区块链 RPC 调用✅ 自动过期:
定时清理过期数据✅ 内存管理:
5分钟自动清理过期项

5. 使用示例

// 第一次调用 - 需要从区块链获取
const response1 = await
fetch('/api/tokens/list?page=1&limit=10');
// 耗时: ~2-5秒

// 30秒内的后续调用 - 从缓存获取
const response2 = await
fetch('/api/tokens/list?page=1&limit=10');
// 耗时: ~10-50毫秒
