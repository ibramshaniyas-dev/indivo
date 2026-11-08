-- 008: Search analytics — what customers search for and which products they open from search.
-- Visitors are identified only by a short one-way hash of IP + user agent (no personal data stored).

CREATE TABLE IF NOT EXISTS search_logs (
  id             BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  term           VARCHAR(200) NOT NULL,              -- as typed (first time it was seen in this visit)
  term_norm      VARCHAR(200) NOT NULL,              -- lower-cased, trimmed, single-spaced
  results_count  INT UNSIGNED NOT NULL DEFAULT 0,
  visitor_key    CHAR(16) NOT NULL,
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_search_logs_created (created_at),
  KEY idx_search_logs_term (term_norm, created_at),
  KEY idx_search_logs_visitor (visitor_key, term_norm, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS search_clicks (
  id             BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  search_log_id  BIGINT UNSIGNED NOT NULL,
  term_norm      VARCHAR(200) NOT NULL,
  product_id     INT UNSIGNED NOT NULL,
  position       SMALLINT UNSIGNED NULL,             -- 1-based rank in the result list
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_search_click (search_log_id, product_id),
  KEY idx_search_clicks_created (created_at),
  KEY idx_search_clicks_product (product_id, created_at),
  CONSTRAINT fk_search_clicks_log FOREIGN KEY (search_log_id) REFERENCES search_logs(id) ON DELETE CASCADE,
  CONSTRAINT fk_search_clicks_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
