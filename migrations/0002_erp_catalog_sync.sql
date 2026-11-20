-- Estado da sincronização do catálogo com o OptiFlow ERP (uma linha).
CREATE TABLE IF NOT EXISTS erp_sync (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  tenant_id TEXT,
  branch_id TEXT,
  cursor TEXT NOT NULL DEFAULT '0',
  last_result TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT OR IGNORE INTO erp_sync (id, cursor) VALUES (1, '0');

-- Trava otimista: um INSERT com changes() = 0 falha e desfaz o lote inteiro (D1 batch é transacional).
CREATE TABLE IF NOT EXISTS erp_sync_guard (ok INTEGER NOT NULL CHECK (ok = 1));
