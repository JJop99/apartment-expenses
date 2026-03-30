CREATE TABLE IF NOT EXISTS entries (
  id          SERIAL PRIMARY KEY,
  date        DATE NOT NULL,
  paid_by     VARCHAR(50) NOT NULL,
  category    VARCHAR(100) NOT NULL,
  description TEXT DEFAULT '',
  amount      NUMERIC(10,2) NOT NULL,
  jacopo_share NUMERIC(10,2) NOT NULL,
  amin_share   NUMERIC(10,2) NOT NULL,
  split        VARCHAR(20) DEFAULT '50/50',
  type         VARCHAR(20) DEFAULT 'expense',
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
