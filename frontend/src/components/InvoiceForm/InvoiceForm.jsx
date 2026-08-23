import { SellerInfoForm } from './SellerInfoForm';
import { CustomerForm } from './CustomerForm';
import { InvoiceDetailsForm } from './InvoiceDetailsForm';
import { PackageForm } from './PackageForm';
import { DiscountGstForm } from './DiscountGstForm';
import { ExtraFoodForm } from './ExtraFoodForm';
import { IceCreamForm } from './IceCreamForm';
import { CoolDrinksForm } from './CoolDrinksForm';
import { PaymentForm } from './PaymentForm';
import { SignatureForm } from './SignatureForm';

export function InvoiceForm({ form, setField, setPackageType, totals, errors }) {
  return (
    <div className="form-stack">
      <SellerInfoForm form={form} />
      <CustomerForm form={form} setField={setField} errors={errors} />
      <InvoiceDetailsForm form={form} setField={setField} errors={errors} />
      <PackageForm form={form} setField={setField} setPackageType={setPackageType} errors={errors} />
      <DiscountGstForm form={form} setField={setField} totals={totals} errors={errors} />
      <ExtraFoodForm form={form} setField={setField} errors={errors} />
      <IceCreamForm form={form} setField={setField} errors={errors} />
      <CoolDrinksForm form={form} setField={setField} errors={errors} />
      <PaymentForm form={form} setField={setField} totals={totals} errors={errors} />
      <SignatureForm form={form} setField={setField} />
    </div>
  );
}
