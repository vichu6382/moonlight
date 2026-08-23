import { Building2 } from 'lucide-react';
import { FormSection, Field, TextInput } from './fields';
import { SELLER } from '../../data/sellerData';
import { PACKAGE_CONFIG } from '../../data/packageConfig';
import { formatINR } from '../../utils/format';

export function SellerInfoForm({ form }) {
  const pkg = PACKAGE_CONFIG[form.packageType];
  return (
    <FormSection
      icon={<Building2 size={18} />}
      title="Resort / Seller Information"
      subtitle="Fixed Moon Light Resort details"
      defaultOpen={false}
    >
      <div className="field-grid">
        <Field label="Resort Name">
          <TextInput value={form.sellerName} readOnly title="Managed by administrator" />
        </Field>
        <Field label="Our GST Number">
          <TextInput value={form.ourGstin} readOnly title="Managed by administrator" />
        </Field>
        <Field label="GST State" hint={SELLER.stateCode}>
          <TextInput value={`${SELLER.stateCode} - ${SELLER.stateName}`} readOnly title="Managed by administrator" />
        </Field>
        <Field label="Default Package Rate" hint={pkg ? `Current: ${formatINR(pkg.pricePerMember)} / member` : undefined}>
          <TextInput
            value={pkg ? `${formatINR(pkg.pricePerMember)} per member` : ''}
            readOnly
            title="Configured in packageConfig.js"
          />
        </Field>
      </div>
    </FormSection>
  );
}
