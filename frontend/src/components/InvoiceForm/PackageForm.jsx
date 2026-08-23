import { Package, UtensilsCrossed } from 'lucide-react';
import { FormSection, Field, NumberInput } from './fields';
import { PACKAGE_CONFIG } from '../../data/packageConfig';
import { formatINR } from '../../utils/format';

const PACKAGE_ICONS = {
  withFood: UtensilsCrossed,
  withoutFood: Package
};

export function PackageForm({ form, setField, setPackageType, errors }) {
  return (
    <FormSection
      icon={<Package size={18} />}
      title="Package"
      subtitle="Select meal plan"
      badge={PACKAGE_CONFIG[form.packageType]?.label}
    >
      <div className="package-cards">
        {Object.values(PACKAGE_CONFIG).map((pkg) => {
          const active = form.packageType === pkg.key;
          const Icon = PACKAGE_ICONS[pkg.key] || Package;
          return (
            <button
              type="button"
              key={pkg.key}
              className={`package-card${active ? ' active' : ''}`}
              onClick={() => setPackageType(pkg.key)}
            >
              <span className="package-card-icon">
                <Icon size={18} />
              </span>
              <span className="package-card-label">{pkg.label}</span>
              <span className="package-card-price">{formatINR(pkg.pricePerMember)} / member</span>
              {active && <span className="package-card-check">Selected</span>}
            </button>
          );
        })}
      </div>
      {errors.packageType && <div className="field-error-text">{errors.packageType}</div>}
      <div className="field-grid" style={{ paddingTop: 15 }}>
        <Field label="Package Price / Member" required hint="Editable per invoice; defaults from packageConfig.js">
          <NumberInput
            min="1"
            step="1"
            value={form.packagePrice}
            onChange={(val) => setField('packagePrice', val)}
          />
        </Field>
      </div>
    </FormSection>
  );
}