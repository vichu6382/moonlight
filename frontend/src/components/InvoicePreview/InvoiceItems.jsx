import { formatINR2, formatNumber } from '../../utils/format';

function ItemTable({ title, head, rows, totalRow }) {
  return (
    <table className="invoice-table">
      <thead>
        <tr>
          <th colSpan={head.descriptionspan}>{title}</th>
        </tr>
        <tr>
          <th>{head.desc}</th>
          <th className="col-center">{head.qty}</th>
          <th className="col-right">{head.rate}</th>
          <th className="col-right">Amount</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i}>
            <td>{row.desc}</td>
            <td className="col-center">{row.qty}</td>
            <td className="col-right">{row.rate}</td>
            <td className="col-right strong">{row.amount}</td>
          </tr>
        ))}
        {totalRow && (
          <tr className="row-total">
            <td colSpan={3} className="col-right strong">
              {totalRow.label}
            </td>
            <td className="col-right strong">{totalRow.value}</td>
          </tr>
        )}
      </tbody>
    </table>
  );
}

export function InvoiceItems({ invoiceData }) {
  const t = invoiceData.totals;

  const money = (n) => formatINR2(n);
  const tableProps = { descriptionspan: 1, desc: 'Description' };

  return (
    <div className="invoice-items">
      <ItemTable
        title="BOOKING / PACKAGE DETAILS"
        head={{ ...tableProps, qty: 'Members', rate: 'Rate / Member' }}
        rows={[
          {
            desc: `${invoiceData.packageLabel} Package (Adults)`,
            qty: formatNumber(invoiceData.members),
            rate: money(t.packageRate),
            amount: money(invoiceData.members * t.packageRate)
          },
          ...(invoiceData.children > 0
            ? [
                {
                  desc: 'Children (50% rate)',
                  qty: formatNumber(invoiceData.children),
                  rate: money(t.childRate),
                  amount: money(invoiceData.children * t.childRate)
                }
              ]
            : []),
          ...(invoiceData.free > 0
            ? [
                {
                  desc: 'Complimentary (Free)',
                  qty: formatNumber(invoiceData.free),
                  rate: '—',
                  amount: '—'
                }
              ]
            : [])
        ]}
        totalRow={{ label: 'Package Total', value: money(t.packageTotal) }}
      />

      {invoiceData.extraFood.length > 0 && (
        <ItemTable
          title="EXTRA FOOD"
          head={{ ...tableProps, desc: 'Food Item', qty: 'Qty', rate: 'Rate' }}
          rows={invoiceData.extraFood.map((item) => ({
            desc: item.name,
            qty: formatNumber(item.qty),
            rate: money(item.rate),
            amount: money(Number(item.qty) * Number(item.rate))
          }))}
          totalRow={{ label: 'Extra Food Total', value: money(t.extraFoodTotal) }}
        />
      )}

      {invoiceData.iceCreamItems.length > 0 && (
        <ItemTable
          title="ICE CREAM"
          head={{ ...tableProps, desc: 'Ice Cream Type', qty: 'Qty', rate: 'Rate' }}
          rows={invoiceData.iceCreamItems.map((item) => ({
            desc: item.name,
            qty: formatNumber(item.qty),
            rate: money(item.rate),
            amount: money(Number(item.qty) * Number(item.rate))
          }))}
          totalRow={{ label: 'Ice Cream Total', value: money(t.iceCreamTotal) }}
        />
      )}

      {invoiceData.coolDrinkItems.length > 0 && (
        <ItemTable
          title="COOL DRINKS"
          head={{ ...tableProps, desc: 'Cool Drink Type', qty: 'Qty', rate: 'Rate' }}
          rows={invoiceData.coolDrinkItems.map((item) => ({
            desc: item.name,
            qty: formatNumber(item.qty),
            rate: money(item.rate),
            amount: money(Number(item.qty) * Number(item.rate))
          }))}
          totalRow={{ label: 'Cool Drinks Total', value: money(t.coolDrinksTotal) }}
        />
      )}
    </div>
  );
}