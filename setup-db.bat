@echo off
echo Setting up database schema...
npx prisma db push
echo Generating Prisma client...
npx prisma generate
echo Database setup complete!
pause
