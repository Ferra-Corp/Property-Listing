CREATE TABLE currencies (
  code           CHAR(3)      PRIMARY KEY,        -- 'KES','USD','GBP','EUR','AED'
  symbol         VARCHAR(8)   NOT NULL,
  name           VARCHAR(60)  NOT NULL,
  decimal_places SMALLINT     NOT NULL DEFAULT 2,
  is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
  sort_order     INTEGER      NOT NULL DEFAULT 0
);
