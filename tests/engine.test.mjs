import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const app = await readFile(new URL('../app.js', import.meta.url), 'utf8');
const statement = await readFile(new URL('./fixtures/demo-statement.csv', import.meta.url), 'utf8');
const engine = app.slice(0, app.indexOf('function render(){'));

function runDemo() {
  const code = `${engine}\n
    const rows=rowsFrom(${JSON.stringify(statement)});
    state.headers=rows[0];
    state.raw=rows.slice(1);
    state.currency=detectCurrency()||state.currency;
    const di=findColumn(['date','transaction date','posted date'],0);
    const mi=findColumn(['description','merchant','narration','details','transaction details'],1);
    const ai=findColumn(['debit','withdrawal','money out'],findColumn(['amount','value'],2));
    const si=findColumn(['status','transaction status'],-1);
    const parsed=state.raw.map((r,i)=>({id:i,date:parseDate(r[di]),merchant:norm(r[mi]),original:r[mi],amount:Math.abs(parseMoney(r[ai])),signed:parseMoney(r[ai]),status:String(r[si]||'').toLowerCase()})).filter(t=>!isNaN(t.date)&&Number.isFinite(t.amount)&&t.amount>0&&!isUnsettled(t.status));
    state.transactions=parsed;
    analyze();
    JSON.stringify({currency:state.currency,transactions:state.transactions.length,findings:state.findings.map(f=>({type:f.type,merchant:f.merchant,impact:f.impact})),totals:state.totals});
  `;
  return JSON.parse(vm.runInNewContext(code, {}));
}

test('demo statement produces the complete judge-facing result', () => {
  const result=runDemo();
  assert.equal(result.currency,'₦');
  assert.equal(result.transactions,24);
  assert.deepEqual(result.totals,{old:14750,new:49750});
  assert.equal(result.findings.length,7);
  assert.ok(result.findings.some(f=>f.type==='increased'&&f.merchant==='CANVA'&&f.impact===7500));
  assert.ok(result.findings.some(f=>f.type==='increased'&&f.merchant==='NETFLIX'&&f.impact===1000));
  assert.ok(result.findings.some(f=>f.type==='repeated'&&f.merchant==='UBER TRIP'));
  assert.ok(result.findings.some(f=>f.type==='started'&&f.merchant==='NOTION LABS'));
  assert.ok(result.findings.some(f=>f.type==='started'&&f.merchant==='FITNESS CENTRAL'));
  assert.equal(result.findings.some(f=>f.merchant.includes('APPLE')),false);
});
