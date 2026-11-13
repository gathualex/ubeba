import assert from 'node:assert/strict'
import test from 'node:test'

import { isCatalogPermissionError } from '../src/lib/catalog'

test('catalog permission errors are detected for admin function denials', () => {
  assert.equal(
    isCatalogPermissionError({ message: 'permission denied for function is_ubeba_admin' }),
    true,
  )

  assert.equal(
    isCatalogPermissionError({ message: 'relation \"products\" does not exist' }),
    false,
  )
})
