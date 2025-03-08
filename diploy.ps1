# 1. Stop all node processes
taskkill /F /IM node.exe

# 2. Clear npm cache
npm cache clean --force

# 3. Delete node_modules
Remove-Item -Path node_modules -Recurse -Force -ErrorAction SilentlyContinue

# 4. Delete package-lock.json
Remove-Item package-lock.json -Force -ErrorAction SilentlyContinue

# 5. Delete .next directory
Remove-Item -Path .next -Recurse -Force -ErrorAction SilentlyContinue

# 6. Reinstall everything
npm install

# 7. Generate Prisma client
npm run db:generate

# 8. Start the development server
npm run dev
