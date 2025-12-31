@echo off
echo Setting up database schema with Drizzle...
npx drizzle-kit push
echo Seeding database...
npm run db:seed
echo Database setup complete!
pause
