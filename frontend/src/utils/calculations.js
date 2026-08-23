const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

const sumItems = (items = []) =>
  round2(
    (items || []).reduce((sum, item) => {
      const qty = Number(item.qty) || 0;
      const rate = Number(item.rate) || 0;
      return sum + qty * rate;
    }, 0)
  );

export function calculateInvoice(form, packageConfig) {
  const headCount = Math.max(0, Number(form.membersCount ?? form.headCount) || 0);
  const childCount = Math.max(0, Number(form.childCount) || 0);
  const rate = Math.max(0, Number(form.packagePrice) || 0);
  const childRate = round2(rate / 2);
  const packageTotal = round2(headCount * rate + childCount * childRate);

  const extraFoodTotal = sumItems(form.extraFood);
  const iceCreamTotal = form.iceCreamEnabled ? sumItems(form.iceCreamItems) : 0;
  const coolDrinksTotal = form.coolDrinksEnabled ? sumItems(form.coolDrinkItems) : 0;

  const grossSubtotal = round2(packageTotal + extraFoodTotal + iceCreamTotal + coolDrinksTotal);

  const discountValue = Math.max(0, Number(form.discountValue) || 0);
  let discountAmount = 0;
  if (form.discountMode === 'percent') {
    discountAmount = round2((grossSubtotal * discountValue) / 100);
  } else {
    discountAmount = round2(discountValue);
  }
  discountAmount = Math.min(discountAmount, grossSubtotal);

  const taxableAmount = round2(Math.max(0, grossSubtotal - discountAmount));

  const gstPercent = Math.max(0, Number(form.gstPercent) || 0);
  const gstAmount = round2((taxableAmount * gstPercent) / 100);
  const cgst = round2(gstAmount / 2);
  const sgst = round2(gstAmount - cgst);

  const grandTotal = round2(taxableAmount + gstAmount);

  const received = Math.max(0, Number(form.receivedAmount) || 0);
  const balance = round2(Math.max(0, grandTotal - received));

  return {
    packageRate: rate,
    childRate,
    packageTotal,
    extraFoodTotal,
    iceCreamTotal,
    coolDrinksTotal,
    grossSubtotal,
    discountAmount,
    taxableAmount,
    gstPercent,
    gstAmount,
    cgst,
    sgst,
    grandTotal,
    received,
    balance
  };
}

export function lineAmount(item) {
  return round2((Number(item.qty) || 0) * (Number(item.rate) || 0));
}