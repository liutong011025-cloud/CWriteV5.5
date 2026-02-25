# 新表同步到生产库（一次性）

构建已不再执行 `prisma migrate deploy`，Vercel 会正常通过。

若生产库还没有以下表，在本地用**生产库连接**执行一次迁移即可：

- `user_profiles`、`work_reviews`（用户资料、评论）
- `dramas`、`poetries`（戏剧与诗歌，供 Luminai Library 展示）

**推荐做法（保留迁移历史）：**

```bash
# 1. 将 DATABASE_URL 设为 Vercel Storage 里的生产库连接串
#    Windows PowerShell: $env:DATABASE_URL="postgresql://..."
# 2. 执行迁移（会创建缺失的表）：
npx prisma migrate deploy
```

**可选（仅同步 schema，不记录迁移）：**

```bash
npx prisma db push
```

执行后：

- 用户资料、评论功能即可正常使用（Profile 不再提示 "Please run: npx prisma migrate deploy"）。
- Prisma Studio 中会出现 **dramas**、**poetries** 表。
- Luminai Library 会显示 Drama 与 Poetry 分类及已保存的作品。
