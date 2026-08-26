import { useState, useEffect, useMemo, useRef } from 'react';
import {
  Building2, FileText, Palette, Download, Upload, Trash2, Save, Key
} from 'lucide-react';
import * as api from '../../services/apiService';
import { getThemeList } from '../../themes/invoiceThemes';
import { ConfirmModal } from '../../components/common/Modal';
import { PasswordInput } from '../../components/common/PasswordInput';
import { AnimatedPage } from '../../components/common/AnimatedPage';
import toast from 'react-hot-toast';

export function SettingsPage() {
  const [settings, setSettings] = useState(null);
  const [activeTab, setActiveTab] = useState('business');
  const [clearOpen, setClearOpen] = useState(false);
  const [clearPassword, setClearPassword] = useState('');
  const [importOpen, setImportOpen] = useState(false);
  const [importData, setImportData] = useState(null);
  const [importPassword, setImportPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef(null);

  const themes = useMemo(() => getThemeList(), []);

  useEffect(() => {
    let cancelled = false;
    async function fetchSettings() {
      try {
        const data = await api.getSettings();
        if (!cancelled) setSettings(data);
      } catch {
        if (!cancelled) setSettings({});
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchSettings();
    return () => { cancelled = true; };
  }, []);

  const handleSave = async (section) => {
    try {
      await api.updateSettings(section, settings[section]);
      toast.success('Settings saved');
    } catch (err) {
      toast.error(err.message || 'Failed to save settings');
    }
  };

  const handleThemeSelect = async (themeId) => {
    setSettings((s) => ({ ...s, invoice: { ...s.invoice, theme: themeId } }));
    try {
      await api.updateSettings('invoice', { ...settings.invoice, theme: themeId });
      toast.success('Invoice theme updated');
    } catch (err) {
      toast.error(err.message || 'Failed to update theme');
    }
  };

  const handleExportBackup = async () => {
    try {
      const data = await api.exportBackup();
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Moon-Light-Resort-Backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success('Backup exported successfully');
    } catch (err) {
      toast.error(err.message || 'Failed to export backup');
    }
  };

  const handleImportFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (!data.invoices || !Array.isArray(data.invoices)) {
          toast.error('Invalid backup file format');
          return;
        }
        setImportData(data);
        setImportOpen(true);
      } catch {
        toast.error('Failed to parse backup file');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleConfirmImport = async () => {
    if (!importPassword) {
      toast.error('Password is required');
      return;
    }
    try {
      const result = await api.importBackup(importData, importPassword, true);
      setImportOpen(false);
      setImportData(null);
      setImportPassword('');
      toast.success(`Restored ${result.count} invoices`);
    } catch (err) {
      toast.error(err.message || 'Import failed');
    }
  };

  const handleClearData = async () => {
    if (!clearPassword) {
      toast.error('Password is required');
      return;
    }
    try {
      await api.clearAllData(clearPassword);
      setClearOpen(false);
      setClearPassword('');
      toast.success('All billing data cleared');
    } catch (err) {
      toast.error(err.message || 'Failed to clear data');
    }
  };

  const handleResetSettings = async () => {
    try {
      const data = await api.resetSettings();
      setSettings(data);
      toast.success('Settings reset to defaults');
    } catch (err) {
      toast.error(err.message || 'Failed to reset settings');
    }
  };

  const tabs = [
    { key: 'business', label: 'Business Info', icon: Building2 },
    { key: 'invoice', label: 'Invoice Settings', icon: FileText },
    { key: 'theme', label: 'Invoice Theme', icon: Palette },
    { key: 'export', label: 'Export', icon: Download },
    { key: 'data', label: 'Data & Backup', icon: Upload }
  ];

  if (loading || !settings) {
    return (
      <div className="page-container">
        <div className="page-header">
          <div>
            <h1 className="page-title">Settings</h1>
            <p className="page-subtitle">Loading settings...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AnimatedPage className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Configure your billing system</p>
        </div>
      </div>

      <div className="settings-layout">
        <div className="settings-tabs">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              className={`settings-tab ${activeTab === key ? 'settings-tab-active' : ''}`}
              onClick={() => setActiveTab(key)}
            >
              <Icon size={16} /> {label}
            </button>
          ))}
        </div>

        <div className="settings-content">
          {activeTab === 'business' && (
            <div className="card">
              <div className="card-header"><h3>Business Information</h3></div>
              <div className="card-body">
                <div className="settings-form">
                  <div className="field">
                    <label className="field-label">Business Name</label>
                    <input className="input" value={settings.business?.name || ''} onChange={(e) => setSettings((s) => ({ ...s, business: { ...s.business, name: e.target.value } }))} />
                  </div>
                  <div className="field-grid">
                    <div className="field">
                      <label className="field-label">Address Line 1</label>
                      <input className="input" value={settings.business?.addressLine1 || ''} onChange={(e) => setSettings((s) => ({ ...s, business: { ...s.business, addressLine1: e.target.value } }))} />
                    </div>
                    <div className="field">
                      <label className="field-label">Address Line 2</label>
                      <input className="input" value={settings.business?.addressLine2 || ''} onChange={(e) => setSettings((s) => ({ ...s, business: { ...s.business, addressLine2: e.target.value } }))} />
                    </div>
                  </div>
                  <div className="field-grid">
                    <div className="field">
                      <label className="field-label">GSTIN</label>
                      <input className="input" value={settings.business?.gstin || ''} onChange={(e) => setSettings((s) => ({ ...s, business: { ...s.business, gstin: e.target.value } }))} />
                    </div>
                    <div className="field">
                      <label className="field-label">State Code</label>
                      <input className="input" value={settings.business?.stateCode || ''} onChange={(e) => setSettings((s) => ({ ...s, business: { ...s.business, stateCode: e.target.value } }))} />
                    </div>
                  </div>
                  <div className="field-grid">
                    <div className="field">
                      <label className="field-label">State Name</label>
                      <input className="input" value={settings.business?.stateName || ''} onChange={(e) => setSettings((s) => ({ ...s, business: { ...s.business, stateName: e.target.value } }))} />
                    </div>
                    <div className="field">
                      <label className="field-label">Place of Supply</label>
                      <input className="input" value={settings.business?.placeOfSupply || ''} onChange={(e) => setSettings((s) => ({ ...s, business: { ...s.business, placeOfSupply: e.target.value } }))} />
                    </div>
                  </div>
                  <button className="btn btn-primary" onClick={() => handleSave('business')}>
                    <Save size={14} /> Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'invoice' && (
            <div className="card">
              <div className="card-header"><h3>Invoice Settings</h3></div>
              <div className="card-body">
                <div className="settings-form">
                  <div className="field-grid">
                    <div className="field">
                      <label className="field-label">Invoice Prefix</label>
                      <input className="input" value={settings.invoice?.prefix || ''} onChange={(e) => setSettings((s) => ({ ...s, invoice: { ...s.invoice, prefix: e.target.value } }))} />
                    </div>
                    <div className="field">
                      <label className="field-label">Default GST %</label>
                      <input className="input" type="number" value={settings.invoice?.defaultGst || 0} onChange={(e) => setSettings((s) => ({ ...s, invoice: { ...s.invoice, defaultGst: Number(e.target.value) } }))} />
                    </div>
                  </div>
                  <div className="field-grid">
                    <div className="field">
                      <label className="field-label">Default Package</label>
                      <select className="input" value={settings.invoice?.defaultPackage || 'withFood'} onChange={(e) => setSettings((s) => ({ ...s, invoice: { ...s.invoice, defaultPackage: e.target.value } }))}>
                        <option value="withFood">With Food</option>
                        <option value="withoutFood">Without Food</option>
                      </select>
                    </div>
                    <div className="field">
                      <label className="field-label">Default Signatory</label>
                      <input className="input" value={settings.invoice?.defaultSignatory || ''} onChange={(e) => setSettings((s) => ({ ...s, invoice: { ...s.invoice, defaultSignatory: e.target.value } }))} />
                    </div>
                  </div>
                  <button className="btn btn-primary" onClick={() => handleSave('invoice')}>
                    <Save size={14} /> Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'theme' && (
            <div className="card">
              <div className="card-header"><h3>Invoice Theme</h3></div>
              <div className="card-body">
                <p className="settings-note">Select a theme for new invoices. Existing invoices retain their original theme.</p>
                <div className="theme-grid">
                  {themes.map((t) => (
                    <button
                      key={t.id}
                      className={`theme-card ${settings.invoice?.theme === t.id ? 'theme-card-active' : ''}`}
                      onClick={() => handleThemeSelect(t.id)}
                    >
                      <div className="theme-preview" style={{ background: t.headerBackground }}>
                        <div className="theme-preview-bar" style={{ background: t.accentColor, height: '4px' }} />
                        <div className="theme-preview-content">
                          <div style={{ background: t.tableHeaderBg, height: '8px', borderRadius: '2px', width: '60%' }} />
                          <div style={{ background: 'rgba(255,255,255,0.3)', height: '4px', borderRadius: '2px', width: '80%' }} />
                          <div style={{ background: 'rgba(255,255,255,0.2)', height: '4px', borderRadius: '2px', width: '50%' }} />
                        </div>
                        <div className="theme-preview-total" style={{ background: t.grandTotalBg }} />
                      </div>
                      <div className="theme-card-info">
                        <span className="theme-card-name">{t.name}</span>
                        <span className="theme-card-desc">{t.description}</span>
                      </div>
                      {settings.invoice?.theme === t.id && <span className="theme-card-check">✓</span>}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'export' && (
            <div className="card">
              <div className="card-header"><h3>Export Settings</h3></div>
              <div className="card-body">
                <div className="settings-form">
                  <div className="field-grid">
                    <div className="field">
                      <label className="field-label">PDF Quality</label>
                      <select className="input" value={settings.export?.pdfQuality || 'high'} onChange={(e) => setSettings((s) => ({ ...s, export: { ...s.export, pdfQuality: e.target.value } }))}>
                        <option value="high">High (3x)</option>
                        <option value="medium">Medium (2x)</option>
                      </select>
                    </div>
                    <div className="field">
                      <label className="field-label">Paper Size</label>
                      <select className="input" value={settings.export?.paperSize || 'a4'} onChange={(e) => setSettings((s) => ({ ...s, export: { ...s.export, paperSize: e.target.value } }))}>
                        <option value="a4">A4</option>
                      </select>
                    </div>
                  </div>
                  <button className="btn btn-primary" onClick={() => handleSave('export')}>
                    <Save size={14} /> Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'data' && (
            <div className="card">
              <div className="card-header"><h3>Data & Backup</h3></div>
              <div className="card-body">
                <div className="settings-sections">
                  <div className="settings-section">
                    <h4>Export Backup</h4>
                    <p>Download all invoice data as a JSON file.</p>
                    <button className="btn btn-primary" onClick={handleExportBackup}>
                      <Download size={14} /> Export Backup
                    </button>
                  </div>
                  <div className="settings-section">
                    <h4>Import Backup</h4>
                    <p>Restore invoice data from a previously exported backup file. Requires your password to confirm.</p>
                    <input ref={fileInputRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleImportFileSelect} />
                    <button className="btn btn-outline" onClick={() => fileInputRef.current?.click()}>
                      <Upload size={14} /> Import Backup
                    </button>
                  </div>
                  <div className="settings-section settings-section-danger">
                    <h4>Clear All Billing Data</h4>
                    <p>This will permanently remove all saved invoices, activity history, and settings. Your owner account will NOT be deleted. This action requires your password and cannot be undone.</p>
                    <button className="btn btn-danger" onClick={() => setClearOpen(true)}>
                      <Trash2 size={14} /> Clear All Data
                    </button>
                  </div>
                  <div className="settings-section">
                    <h4>Reset Settings</h4>
                    <p>Reset all settings to their default values.</p>
                    <button className="btn btn-outline" onClick={handleResetSettings}>
                      Reset Settings
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={clearOpen}
        onClose={() => { setClearOpen(false); setClearPassword(''); }}
        onConfirm={handleClearData}
        title="Clear All Data?"
        message={
          <div>
            <p>This will permanently remove all saved invoices, activity history, and settings. Your owner account will NOT be deleted.</p>
            <div className="field" style={{ marginTop: '16px' }}>
              <label className="field-label"><Key size={12} /> Enter your password to confirm</label>
              <PasswordInput
                className="input"
                placeholder="Enter password"
                value={clearPassword}
                onChange={(e) => setClearPassword(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleClearData(); }}
              />
            </div>
          </div>
        }
        confirmText="Clear All Data"
        danger
      />

      <ConfirmModal
        isOpen={importOpen}
        onClose={() => { setImportOpen(false); setImportData(null); setImportPassword(''); }}
        onConfirm={handleConfirmImport}
        title="Import Backup?"
        message={
          <div>
            <p>This will replace all existing invoices with the imported data. This action cannot be undone.</p>
            <p><strong>{importData?.invoices?.length || 0}</strong> invoices will be imported.</p>
            <div className="field" style={{ marginTop: '16px' }}>
              <label className="field-label"><Key size={12} /> Enter your password to confirm</label>
              <PasswordInput
                className="input"
                placeholder="Enter password"
                value={importPassword}
                onChange={(e) => setImportPassword(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleConfirmImport(); }}
              />
            </div>
          </div>
        }
        confirmText="Import Data"
        danger
      />
    </AnimatedPage>
  );
}
