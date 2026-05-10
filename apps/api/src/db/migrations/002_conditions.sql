-- Migration 002: Conditions (dolencias) linked to active ingredients

-- ============================================================
-- Table: conditions
-- ============================================================
CREATE TABLE IF NOT EXISTS conditions (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name             TEXT NOT NULL UNIQUE,
    name_normalized  TEXT NOT NULL,
    category         TEXT NOT NULL DEFAULT 'otro'
                     CHECK (category IN (
                       'dolor','infeccion','cardiovascular','digestivo',
                       'respiratorio','neurologico','endocrino',
                       'musculoesqueletico','dermatologico','otro'
                     )),
    created_at       TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_conditions_name_trgm
    ON conditions USING GIN (name_normalized gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_conditions_category
    ON conditions (category);

-- ============================================================
-- Table: ingredient_conditions  (N:M)
-- ============================================================
CREATE TABLE IF NOT EXISTS ingredient_conditions (
    active_ingredient_id UUID REFERENCES active_ingredients(id) ON DELETE CASCADE,
    condition_id         UUID REFERENCES conditions(id) ON DELETE CASCADE,
    PRIMARY KEY (active_ingredient_id, condition_id)
);

CREATE INDEX IF NOT EXISTS idx_ic_ingredient
    ON ingredient_conditions (active_ingredient_id);

CREATE INDEX IF NOT EXISTS idx_ic_condition
    ON ingredient_conditions (condition_id);
