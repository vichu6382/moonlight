export function AuthorizedSignatory({ seller, signatoryName }) {
  return (
    <div className="invoice-signatory">
      <div className="invoice-signatory-block">
        <p className="invoice-signatory-for">For {seller.name}</p>
        <div className="invoice-signatory-space"></div>
        <p className="invoice-signatory-label">Authorized Signatory</p>
        <p className="invoice-signatory-name">{signatoryName}</p>
      </div>
    </div>
  );
}