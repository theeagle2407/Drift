import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../app.js', import.meta.url), 'utf8');
const parserSource = source.slice(0, source.indexOf('function parseDate'));

function evaluate(expression) {
  return vm.runInNewContext(`${parserSource}\n${expression}`, {});
}

test('quoted commas stay inside one CSV cell', () => {
  const rows = evaluate(`csv('Date,Description,Amount\\n2026-01-01,"SHOP, LAGOS",-1200')`);
  assert.deepEqual(Array.from(rows[1]), ['2026-01-01', 'SHOP, LAGOS', '-1200']);
});

test('Markdown statement tables lose their separator row', () => {
  const rows = evaluate(`rowsFrom('| Date | Description | Amount | Status |\\n| :--- | :--- | ---: | :--- |\\n| 2026-01-01 | SHOP | -1200 | Completed |')`);
  assert.equal(rows.length, 2);
  assert.deepEqual(Array.from(rows[0]), ['Date', 'Description', 'Amount', 'Status']);
});

test('tab-separated bank exports are accepted', () => {
  const rows = evaluate(`rowsFrom('Date\\tDescription\\tAmount\\n2026-01-01\\tSHOP\\t-1200')`);
  assert.equal(rows.length, 2);
  assert.deepEqual(Array.from(rows[1]), ['2026-01-01', 'SHOP', '-1200']);
});

test('standard statement headers are detected and duplicate headers match', () => {
  assert.equal(evaluate(`headerLike(['Date','Description','Amount','Status'])`), true);
  assert.equal(evaluate(`sameRow([' Date ','DESCRIPTION','Amount'],['date','description','amount'])`), true);
});

test('unsettled transactions are excluded from analysis', () => {
  for (const status of ['Pending', 'FAILED', 'Declined', 'Reversed', 'Cancelled']) {
    assert.equal(evaluate(`isUnsettled('${status}')`), true);
  }
  assert.equal(evaluate(`isUnsettled('Completed')`), false);
});
