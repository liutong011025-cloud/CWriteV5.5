# 生产数据库已存在时的首次设置（Baseline）

若 Vercel 构建报错 **P3005: The database schema is not empty**，说明生产库已有表（例如之前用 `db push` 建过），但还没有迁移记录。

## 一次性执行（仅需一次）

在**本地**用**生产库**的 `DATABASE_URL` 执行：

```bash
# 将 DATABASE_URL 设为 Vercel 环境变量里的生产库连接串后再执行
npx prisma migrate resolve --applied 0_init_baseline
```

执行成功后，`_prisma_migrations` 表里会记录 `0_init_baseline` 已应用。之后在 Vercel 上每次部署时，`prisma migrate deploy` 只会执行后续迁移（如 `20250222000000_add_user_profile_and_work_reviews`），不会再报 P3005。

## 获取生产 DATABASE_URL

Vercel 项目 → Settings → Environment Variables → 复制 `DATABASE_URL`。在本地可临时：

- Windows (PowerShell): `$env:DATABASE_URL="postgresql://..."`
- macOS/Linux: `export DATABASE_URL="postgresql://..."`

然后执行上面的 `prisma migrate resolve` 命令。
