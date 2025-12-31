import fs from 'fs'
import path from 'path'
import postgres from 'postgres'

async function main(){
  const sqlPath = path.join(process.cwd(), 'drizzle', '0000_wet_ultimates.sql')
  if(!fs.existsSync(sqlPath)){
    console.error('Migration SQL not found at', sqlPath)
    process.exit(1)
  }

  const sql = fs.readFileSync(sqlPath, 'utf8')
  const dbUrl = process.env.DATABASE_URL
  if(!dbUrl){
    console.error('DATABASE_URL is not set in the environment')
    process.exit(1)
  }

  console.log('Connecting to database...')
  const sqlClient = postgres(dbUrl, { max: 1, prepare: false })

  // Split statements by semicolon followed by newline, but keep those inside dollar-quoted strings intact.
  // For our generated file, simple split on ";\n" is sufficient.
  const stmts = sql.split(/;\s*\n/).map(s => s.trim()).filter(Boolean)

  console.log(`Found ${stmts.length} statements. Running sequentially...`)

  try{
    for(let i=0;i<stmts.length;i++){
      const stmt = stmts[i]
      process.stdout.write(`Running statement ${i+1}/${stmts.length}... `)
      try{
        await sqlClient.unsafe(stmt)
        console.log('ok')
      }catch(err){
        console.error('\nStatement failed:')
        console.error(stmt.slice(0,1000))
        console.error(err)
        throw err
      }
    }

    console.log('All statements applied successfully.')
  }catch(e){
    console.error('Migration failed:', e)
    process.exitCode = 2
  }finally{
    await sqlClient.end({ timeout: 5 })
  }
}

main().catch(err => { console.error(err); process.exit(1) })
