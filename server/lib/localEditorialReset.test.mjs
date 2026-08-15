import assert from 'node:assert/strict'
import test from 'node:test'
import { getLocalDatabaseTarget } from './localEditorialReset.js'

test('accepts only the local resummo PostgreSQL database', () => {
  const target = getLocalDatabaseTarget('postgresql://postgres:postgres@127.0.0.1:5433/resummo')
  assert.equal(target.host, '127.0.0.1')
  assert.equal(target.port, '5433')
  assert.equal(target.database, 'resummo')
})

test('rejects remote databases for destructive editorial operations', () => {
  assert.throws(
    () => getLocalDatabaseTarget('postgresql://postgres:secret@aws-1-us-east-2.pooler.supabase.com:6543/resummo'),
    /solo está permitida contra PostgreSQL local/,
  )
})

test('rejects a different local database name', () => {
  assert.throws(
    () => getLocalDatabaseTarget('postgresql://postgres:postgres@127.0.0.1:5433/postgres'),
    /debe llamarse resummo/,
  )
})
