import { useState, useRef } from 'react';
import { Upload, FileText, Check, X } from 'lucide-react';
import { parseCsv, CsvRow } from '../../utils/csvParser';
import { Account, formatAmount } from '../../types';
import { Modal } from '../common/Modal';

interface Props {
  open: boolean;
  onClose: () => void;
  accounts: Account[];
  onImport: (rows: CsvRow[], accountId: number) => void;
}

export function CSVImport({ open, onClose, accounts, onImport }: Props) {
  const [rows, setRows] = useState<CsvRow[]>([]);
  const [accountId, setAccountId] = useState(accounts[0]?.id || 1);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = ev.target?.result as string;
        const parsed = parseCsv(text);
        if (parsed.length === 0) {
          setError('Aucune transaction trouvée. Vérifiez le format CSV.');
        } else {
          setRows(parsed);
          setError('');
        }
      } catch {
        setError('Erreur de lecture du fichier.');
      }
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleImport = () => {
    onImport(rows, accountId);
    setRows([]);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Importer un CSV" size="lg">
      <div className="space-y-4">
        <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-600">
          <p className="font-medium mb-1">Format attendu :</p>
          <code className="block text-gray-500">date;compte;libelle;debit;credit</code>
          <code className="block text-gray-500">15/05/2026;LCL;Salaire;0;2160.05</code>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Compte de destination</label>
          <select
            value={accountId}
            onChange={e => setAccountId(Number(e.target.value))}
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
          >
            {accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({a.bank})</option>)}
          </select>
        </div>

        <button
          onClick={() => fileRef.current?.click()}
          className="w-full border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center gap-2 hover:border-foyer-400 hover:bg-foyer-50 transition-colors"
        >
          <Upload size={24} className="text-gray-400" />
          <span className="text-sm text-gray-500">Cliquer pour sélectionner un fichier CSV</span>
        </button>
        <input ref={fileRef} type="file" accept=".csv,.txt" onChange={handleFile} className="hidden" />

        {error && (
          <div className="flex items-center gap-2 bg-red-50 text-red-600 rounded-xl p-3 text-sm">
            <X size={14} /> {error}
          </div>
        )}

        {rows.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 bg-green-50 text-green-700 rounded-xl p-3 text-sm">
              <FileText size={14} />
              <span>{rows.length} transactions détectées</span>
            </div>
            <div className="max-h-48 overflow-y-auto space-y-1">
              {rows.slice(0, 10).map((r, i) => (
                <div key={i} className="flex items-center justify-between text-xs bg-gray-50 rounded-lg px-3 py-2">
                  <span className="text-gray-500">{r.date}</span>
                  <span className="text-gray-700 flex-1 mx-2 truncate">{r.label}</span>
                  <span className={`font-semibold ${r.amount >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {formatAmount(r.amount)}
                  </span>
                </div>
              ))}
              {rows.length > 10 && (
                <p className="text-xs text-gray-400 text-center">+ {rows.length - 10} autres...</p>
              )}
            </div>
            <button
              onClick={handleImport}
              className="w-full py-3 bg-foyer-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2"
            >
              <Check size={16} />
              Importer {rows.length} transactions
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}
