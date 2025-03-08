# 1. Stop all node processes
taskkill /F /IM node.exe

# 2. Clear npm cache
npm cache clean --force

# 3. Delete node_modules
rm -r node_modules

# 4. Delete package-lock.json
rm package-lock.json

# 5. Reinstall everything
npm install

# 6. Generate Prisma client
npm run db:generate

# 7. Run the full deploy
# npm run db:full-deploy