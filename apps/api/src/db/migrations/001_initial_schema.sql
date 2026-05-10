-- Migration 001: Initial schema for drug-medicine-lookup
-- Requires PostgreSQL with pg_trgm extension

-- Enable trigram extension for fuzzy search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================================
-- Table: active_ingredients
-- ============================================================
CREATE TABLE IF NOT EXISTS active_ingredients (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name             TEXT NOT NULL,
    name_normalized  TEXT NOT NULL,  -- lowercase, no diacritics
    synonyms         TEXT[],
    created_at       TIMESTAMPTZ DEFAULT now()
);

-- GIN index for trigram-based fuzzy search on normalized name
CREATE INDEX IF NOT EXISTS idx_ai_name_trgm
    ON active_ingredients
    USING GIN (name_normalized gin_trgm_ops);

-- ============================================================
-- Table: medicines
-- ============================================================
CREATE TABLE IF NOT EXISTS medicines (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    commercial_name             TEXT NOT NULL,
    commercial_name_normalized  TEXT NOT NULL,  -- lowercase, no diacritics
    laboratory                  TEXT NOT NULL,
    pharmaceutical_form         TEXT NOT NULL,  -- comprimido, jarabe, inyectable, etc.
    requires_prescription       BOOLEAN NOT NULL DEFAULT true,
    presentations               JSONB,          -- [{dose, units, quantity}]
    created_at                  TIMESTAMPTZ DEFAULT now(),
    updated_at                  TIMESTAMPTZ DEFAULT now()
);

-- GIN index for trigram-based fuzzy search on normalized commercial name
CREATE INDEX IF NOT EXISTS idx_med_name_trgm
    ON medicines
    USING GIN (commercial_name_normalized gin_trgm_ops);

-- B-tree indexes for filter columns
CREATE INDEX IF NOT EXISTS idx_med_lab
    ON medicines (laboratory);

CREATE INDEX IF NOT EXISTS idx_med_form
    ON medicines (pharmaceutical_form);

-- ============================================================
-- Table: medicine_ingredients  (N:M relation)
-- ============================================================
CREATE TABLE IF NOT EXISTS medicine_ingredients (
    medicine_id          UUID REFERENCES medicines(id) ON DELETE CASCADE,
    active_ingredient_id UUID REFERENCES active_ingredients(id) ON DELETE CASCADE,
    PRIMARY KEY (medicine_id, active_ingredient_id)
);

-- ============================================================
-- Table: prospects
-- ============================================================
CREATE TABLE IF NOT EXISTS prospects (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    medicine_id       UUID UNIQUE REFERENCES medicines(id) ON DELETE CASCADE,
    indications       TEXT,
    dosage            TEXT,
    contraindications TEXT,
    warnings          TEXT,
    interactions_text TEXT,
    adverse_effects   TEXT,
    overdose          TEXT,
    storage           TEXT,
    updated_at        TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- Table: drug_interactions
-- ============================================================
CREATE TABLE IF NOT EXISTS drug_interactions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ingredient_a_id UUID REFERENCES active_ingredients(id),
    ingredient_b_id UUID REFERENCES active_ingredients(id),
    severity        TEXT NOT NULL CHECK (severity IN ('leve', 'moderada', 'grave')),
    description     TEXT NOT NULL,
    UNIQUE (ingredient_a_id, ingredient_b_id)
);

CREATE INDEX IF NOT EXISTS idx_interactions_a
    ON drug_interactions (ingredient_a_id);

CREATE INDEX IF NOT EXISTS idx_interactions_b
    ON drug_interactions (ingredient_b_id);

-- ============================================================
-- Trigger function: normalize text (lowercase + strip diacritics)
-- Uses unaccent-style approach via translate for common diacritics.
-- For full Unicode support, install the 'unaccent' extension.
-- ============================================================
CREATE OR REPLACE FUNCTION normalize_text_column()
RETURNS TRIGGER AS $$
BEGIN
    -- Normalize active_ingredients.name → name_normalized
    IF TG_TABLE_NAME = 'active_ingredients' THEN
        NEW.name_normalized := lower(
            translate(
                NEW.name,
                'ÁÀÄÂÃáàäâãÉÈËÊéèëêÍÌÏÎíìïîÓÒÖÔÕóòöôõÚÙÜÛúùüûÑñÇç',
                'AAAAAaaaaaeeeeeeeeiiiiiiiioooooooooouuuuuuuunncc'
            )
        );
    END IF;

    -- Normalize medicines.commercial_name → commercial_name_normalized
    IF TG_TABLE_NAME = 'medicines' THEN
        NEW.commercial_name_normalized := lower(
            translate(
                NEW.commercial_name,
                'ÁÀÄÂÃáàäâãÉÈËÊéèëêÍÌÏÎíìïîÓÒÖÔÕóòöôõÚÙÜÛúùüûÑñÇç',
                'AAAAAaaaaaeeeeeeeeiiiiiiiioooooooooouuuuuuuunncc'
            )
        );
        NEW.updated_at := now();
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on active_ingredients
DROP TRIGGER IF EXISTS trg_normalize_active_ingredients ON active_ingredients;
CREATE TRIGGER trg_normalize_active_ingredients
    BEFORE INSERT OR UPDATE ON active_ingredients
    FOR EACH ROW
    EXECUTE FUNCTION normalize_text_column();

-- Trigger on medicines
DROP TRIGGER IF EXISTS trg_normalize_medicines ON medicines;
CREATE TRIGGER trg_normalize_medicines
    BEFORE INSERT OR UPDATE ON medicines
    FOR EACH ROW
    EXECUTE FUNCTION normalize_text_column();
